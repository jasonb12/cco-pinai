-- MCP Tables Migration - Add tables for actions, schedules, and processing logs
-- Generated: 2025-07-06

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
-- Note: pgcron extension needs to be enabled manually in Supabase dashboard
-- CREATE EXTENSION IF NOT EXISTS "pgcron";

-- Actions table - stores extracted actions pending approval/execution
CREATE TABLE IF NOT EXISTS actions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transcript_id UUID REFERENCES transcripts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  tool_type TEXT NOT NULL CHECK (tool_type IN ('calendar', 'email', 'task', 'contact', 'reminder', 'custom')),
  tool_name TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}',
  confidence DECIMAL(3,2) DEFAULT 0.0 CHECK (confidence >= 0.0 AND confidence <= 1.0),
  reasoning TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied', 'executed', 'failed')),
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  executed_at TIMESTAMPTZ,
  execution_result JSONB,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Schedules table - stores recurring/scheduled actions
CREATE TABLE IF NOT EXISTS schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  action_id UUID REFERENCES actions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  cron_expression TEXT NOT NULL,
  timezone TEXT DEFAULT 'UTC',
  next_run TIMESTAMPTZ,
  last_run TIMESTAMPTZ,
  enabled BOOLEAN DEFAULT TRUE,
  run_count INTEGER DEFAULT 0,
  max_runs INTEGER, -- NULL means unlimited
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Processing logs table - audit trail for MCP pipeline
CREATE TABLE IF NOT EXISTS processing_logs (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  job_id UUID NOT NULL,
  transcript_id UUID REFERENCES transcripts(id) ON DELETE SET NULL,
  action_id UUID REFERENCES actions(id) ON DELETE SET NULL,
  stage TEXT NOT NULL CHECK (stage IN ('ingested', 'vectorized', 'parsed', 'proposed', 'approved', 'executed', 'indexed', 'failed')),
  status TEXT NOT NULL,
  payload JSONB DEFAULT '{}',
  error_message TEXT,
  duration_ms INTEGER, -- Processing time in milliseconds
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- MCP tools configuration table
CREATE TABLE IF NOT EXISTS mcp_tools (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  version TEXT NOT NULL DEFAULT '1.0',
  tool_type TEXT NOT NULL,
  enabled BOOLEAN DEFAULT TRUE,
  oauth_provider TEXT,
  oauth_config JSONB DEFAULT '{}',
  default_params JSONB DEFAULT '{}',
  trigger_rules JSONB DEFAULT '[]',
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sync state table - track sync progress per user/service
CREATE TABLE IF NOT EXISTS sync_state (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  service_name TEXT NOT NULL,
  last_sync_date DATE,
  last_cursor TEXT,
  total_synced INTEGER DEFAULT 0,
  last_sync_at TIMESTAMPTZ,
  sync_errors INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, service_name)
);

-- Sync errors table - track sync failures (add missing columns to existing table)
DO $$ 
BEGIN 
  -- Add resolved column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sync_errors' AND column_name = 'resolved') THEN
    ALTER TABLE sync_errors ADD COLUMN resolved BOOLEAN DEFAULT FALSE;
  END IF;
  
  -- Add retry_count column if it doesn't exist  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sync_errors' AND column_name = 'retry_count') THEN
    ALTER TABLE sync_errors ADD COLUMN retry_count INTEGER DEFAULT 0;
  END IF;
  
  -- Add transcript_id column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sync_errors' AND column_name = 'transcript_id') THEN
    ALTER TABLE sync_errors ADD COLUMN transcript_id UUID REFERENCES transcripts(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Locations table - for geofence-based triggers
CREATE TABLE IF NOT EXISTS locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT, -- Optional location name
  lat DOUBLE PRECISION NOT NULL,
  lon DOUBLE PRECISION NOT NULL,
  geohash TEXT, -- Geohash for efficient spatial queries
  accuracy_meters INTEGER,
  transcript_id UUID REFERENCES transcripts(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_actions_user_id ON actions(user_id);
CREATE INDEX IF NOT EXISTS idx_actions_status ON actions(status);
CREATE INDEX IF NOT EXISTS idx_actions_transcript_id ON actions(transcript_id);
CREATE INDEX IF NOT EXISTS idx_actions_created_at ON actions(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_schedules_user_id ON schedules(user_id);
CREATE INDEX IF NOT EXISTS idx_schedules_next_run ON schedules(next_run) WHERE enabled = TRUE;
CREATE INDEX IF NOT EXISTS idx_schedules_enabled ON schedules(enabled);

CREATE INDEX IF NOT EXISTS idx_processing_logs_job_id ON processing_logs(job_id);
CREATE INDEX IF NOT EXISTS idx_processing_logs_transcript_id ON processing_logs(transcript_id);
CREATE INDEX IF NOT EXISTS idx_processing_logs_stage ON processing_logs(stage);
CREATE INDEX IF NOT EXISTS idx_processing_logs_created_at ON processing_logs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_mcp_tools_enabled ON mcp_tools(enabled);
CREATE INDEX IF NOT EXISTS idx_mcp_tools_tool_type ON mcp_tools(tool_type);

CREATE INDEX IF NOT EXISTS idx_sync_state_user_service ON sync_state(user_id, service_name);
CREATE INDEX IF NOT EXISTS idx_sync_errors_user_id ON sync_errors(user_id);
CREATE INDEX IF NOT EXISTS idx_sync_errors_resolved ON sync_errors(resolved) WHERE resolved = FALSE;

CREATE INDEX IF NOT EXISTS idx_locations_user_id ON locations(user_id);
CREATE INDEX IF NOT EXISTS idx_locations_geohash ON locations(geohash);

-- Row Level Security (RLS) policies
ALTER TABLE actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE processing_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE mcp_tools ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_errors ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for actions
CREATE POLICY "Users can view their own actions" ON actions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own actions" ON actions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own actions" ON actions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all actions" ON actions
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- RLS Policies for schedules
CREATE POLICY "Users can view their own schedules" ON schedules
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own schedules" ON schedules
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all schedules" ON schedules
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- RLS Policies for processing_logs
CREATE POLICY "Users can view logs for their transcripts" ON processing_logs
  FOR SELECT USING (
    transcript_id IN (
      SELECT id FROM transcripts WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Service role can manage all logs" ON processing_logs
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- RLS Policies for mcp_tools (read-only for users)
CREATE POLICY "All authenticated users can view tools" ON mcp_tools
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Service role can manage tools" ON mcp_tools
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- RLS Policies for sync_state
CREATE POLICY "Users can view their own sync state" ON sync_state
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own sync state" ON sync_state
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all sync state" ON sync_state
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- RLS Policies for sync_errors
CREATE POLICY "Users can view their own sync errors" ON sync_errors
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all sync errors" ON sync_errors
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- RLS Policies for locations
CREATE POLICY "Users can view their own locations" ON locations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own locations" ON locations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role can manage all locations" ON locations
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Functions for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for automatic timestamp updates
CREATE TRIGGER update_actions_updated_at BEFORE UPDATE ON actions
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_schedules_updated_at BEFORE UPDATE ON schedules
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_mcp_tools_updated_at BEFORE UPDATE ON mcp_tools
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_sync_state_updated_at BEFORE UPDATE ON sync_state
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Function to calculate next run time for cron schedules
CREATE OR REPLACE FUNCTION calculate_next_cron_run(
  cron_expr TEXT,
  timezone_name TEXT DEFAULT 'UTC'
) RETURNS TIMESTAMPTZ AS $$
DECLARE
  next_run TIMESTAMPTZ;
BEGIN
  -- This is a simplified version - in production you'd use a proper cron parser
  -- For now, we'll handle basic cases
  CASE 
    WHEN cron_expr = '0 * * * *' THEN -- Every hour
      next_run := date_trunc('hour', NOW() AT TIME ZONE timezone_name) + INTERVAL '1 hour';
    WHEN cron_expr = '0 0 * * *' THEN -- Daily at midnight
      next_run := date_trunc('day', NOW() AT TIME ZONE timezone_name) + INTERVAL '1 day';
    WHEN cron_expr = '0 0 * * 0' THEN -- Weekly on Sunday
      next_run := date_trunc('week', NOW() AT TIME ZONE timezone_name) + INTERVAL '1 week';
    WHEN cron_expr = '0 0 1 * *' THEN -- Monthly on 1st
      next_run := date_trunc('month', NOW() AT TIME ZONE timezone_name) + INTERVAL '1 month';
    ELSE
      -- Default to 1 hour from now for unknown expressions
      next_run := NOW() + INTERVAL '1 hour';
  END CASE;
  
  RETURN next_run AT TIME ZONE timezone_name;
END;
$$ LANGUAGE plpgsql;

-- Function to update schedule next_run times
CREATE OR REPLACE FUNCTION update_schedule_next_run()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.cron_expression IS DISTINCT FROM OLD.cron_expression 
     OR NEW.timezone IS DISTINCT FROM OLD.timezone 
     OR NEW.enabled IS DISTINCT FROM OLD.enabled THEN
    
    IF NEW.enabled THEN
      NEW.next_run := calculate_next_cron_run(NEW.cron_expression, NEW.timezone);
    ELSE
      NEW.next_run := NULL;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update next_run times
CREATE TRIGGER update_schedule_next_run_trigger 
  BEFORE INSERT OR UPDATE ON schedules
  FOR EACH ROW EXECUTE FUNCTION update_schedule_next_run();

-- Insert default MCP tools
INSERT INTO mcp_tools (name, version, tool_type, description, enabled) VALUES
('extract_actions', '1.0', 'custom', 'AI-powered action extraction from transcripts', true),
('create_calendar_event', '1.0', 'calendar', 'Create calendar events', true),
('schedule_reminder', '1.0', 'reminder', 'Schedule reminders', true),
('send_email', '1.0', 'email', 'Send emails', true),
('schedule_email', '1.0', 'email', 'Schedule emails for later sending', true),
('create_email_draft', '1.0', 'email', 'Create email drafts', true),
('create_task', '1.0', 'task', 'Create tasks', true),
('create_recurring_task', '1.0', 'task', 'Create recurring tasks', true),
('create_checklist', '1.0', 'task', 'Create checklists', true)
ON CONFLICT (name) DO NOTHING;

-- Comments for documentation
COMMENT ON TABLE actions IS 'Stores extracted actions from transcripts pending approval/execution';
COMMENT ON TABLE schedules IS 'Stores recurring and scheduled actions with cron expressions';
COMMENT ON TABLE processing_logs IS 'Audit trail for MCP processing pipeline stages';
COMMENT ON TABLE mcp_tools IS 'Configuration and metadata for MCP tools';
COMMENT ON TABLE sync_state IS 'Tracks synchronization state per user and service';
COMMENT ON TABLE sync_errors IS 'Logs synchronization errors for debugging';
COMMENT ON TABLE locations IS 'Stores location data for geofence-based triggers';

COMMENT ON COLUMN actions.confidence IS 'AI confidence level for extracted action (0.0-1.0)';
COMMENT ON COLUMN schedules.cron_expression IS 'Cron expression for scheduling (e.g., "0 9 * * 1" for weekly Monday 9am)';
COMMENT ON COLUMN processing_logs.stage IS 'Processing pipeline stage (ingested, parsed, proposed, etc.)';
COMMENT ON COLUMN locations.geohash IS 'Geohash for efficient spatial queries and geofencing';