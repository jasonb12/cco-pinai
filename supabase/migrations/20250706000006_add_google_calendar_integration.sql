-- Migration: Add Google Calendar Integration Tables
-- Date: 2025-01-06
-- Description: Create tables for Google Calendar OAuth, events, sync state, and tasks

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create user_calendar_tokens table for OAuth token storage
CREATE TABLE IF NOT EXISTS user_calendar_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL DEFAULT 'google',
    access_token_encrypted TEXT NOT NULL,
    refresh_token_encrypted TEXT,
    token_type VARCHAR(20) DEFAULT 'Bearer',
    expires_at TIMESTAMPTZ,
    scope TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure one token per provider per user
    UNIQUE(user_id, provider)
);

-- Create calendar_events table for local event storage
CREATE TABLE IF NOT EXISTS calendar_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    google_event_id VARCHAR(255),
    limitless_id VARCHAR(255),
    title VARCHAR(500) NOT NULL,
    description TEXT,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    all_day BOOLEAN DEFAULT FALSE,
    timezone VARCHAR(100) DEFAULT 'UTC',
    location TEXT,
    attendees JSONB DEFAULT '[]',
    source VARCHAR(20) NOT NULL CHECK (source IN ('ccopinai', 'google', 'limitless')),
    sync_status VARCHAR(20) DEFAULT 'pending' CHECK (sync_status IN ('pending', 'synced', 'conflict', 'error', 'deleted')),
    sync_error TEXT,
    google_calendar_id VARCHAR(255),
    etag VARCHAR(255),
    sequence INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'confirmed' CHECK (status IN ('tentative', 'confirmed', 'cancelled')),
    visibility VARCHAR(20) DEFAULT 'default' CHECK (visibility IN ('default', 'public', 'private', 'confidential')),
    color_id VARCHAR(10),
    recurring_event_id VARCHAR(255),
    recurrence TEXT[],
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure unique Google event IDs per user
    UNIQUE(user_id, google_event_id)
);

-- Create calendar_sync_state table for tracking synchronization
CREATE TABLE IF NOT EXISTS calendar_sync_state (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL DEFAULT 'google',
    calendar_id VARCHAR(255) NOT NULL,
    last_sync_at TIMESTAMPTZ,
    next_sync_token VARCHAR(500),
    sync_anchor VARCHAR(500),
    full_sync_completed BOOLEAN DEFAULT FALSE,
    incremental_sync_enabled BOOLEAN DEFAULT TRUE,
    sync_interval_minutes INTEGER DEFAULT 15,
    last_error TEXT,
    error_count INTEGER DEFAULT 0,
    last_successful_sync_at TIMESTAMPTZ,
    events_imported INTEGER DEFAULT 0,
    events_exported INTEGER DEFAULT 0,
    conflicts_detected INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure unique sync state per user-provider-calendar
    UNIQUE(user_id, provider, calendar_id)
);

-- Create calendar_tasks table for task integration
CREATE TABLE IF NOT EXISTS calendar_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    calendar_event_id UUID REFERENCES calendar_events(id) ON DELETE SET NULL,
    google_task_id VARCHAR(255),
    limitless_id VARCHAR(255),
    title VARCHAR(500) NOT NULL,
    description TEXT,
    due_date TIMESTAMPTZ,
    completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMPTZ,
    priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    source VARCHAR(20) NOT NULL CHECK (source IN ('ccopinai', 'google', 'limitless')),
    sync_status VARCHAR(20) DEFAULT 'pending' CHECK (sync_status IN ('pending', 'synced', 'conflict', 'error')),
    sync_error TEXT,
    etag VARCHAR(255),
    parent_task_id UUID REFERENCES calendar_tasks(id) ON DELETE SET NULL,
    position INTEGER,
    notes TEXT,
    links JSONB DEFAULT '[]',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create calendar_conflicts table for tracking sync conflicts
CREATE TABLE IF NOT EXISTS calendar_conflicts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    calendar_event_id UUID REFERENCES calendar_events(id) ON DELETE CASCADE,
    conflict_type VARCHAR(50) NOT NULL CHECK (conflict_type IN ('time_overlap', 'data_mismatch', 'duplicate_event', 'permission_denied')),
    local_data JSONB,
    remote_data JSONB,
    resolution VARCHAR(50) CHECK (resolution IN ('use_local', 'use_remote', 'merge', 'manual', 'ignore')),
    resolved BOOLEAN DEFAULT FALSE,
    resolved_at TIMESTAMPTZ,
    resolved_by VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_calendar_tokens_user_id ON user_calendar_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_user_calendar_tokens_provider ON user_calendar_tokens(provider);

CREATE INDEX IF NOT EXISTS idx_calendar_events_user_id ON calendar_events(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_google_id ON calendar_events(google_event_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_limitless_id ON calendar_events(limitless_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_source ON calendar_events(source);
CREATE INDEX IF NOT EXISTS idx_calendar_events_sync_status ON calendar_events(sync_status);
CREATE INDEX IF NOT EXISTS idx_calendar_events_start_time ON calendar_events(start_time);
CREATE INDEX IF NOT EXISTS idx_calendar_events_user_time ON calendar_events(user_id, start_time);

CREATE INDEX IF NOT EXISTS idx_calendar_sync_state_user_id ON calendar_sync_state(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_sync_state_provider ON calendar_sync_state(provider);
CREATE INDEX IF NOT EXISTS idx_calendar_sync_state_last_sync ON calendar_sync_state(last_sync_at);

CREATE INDEX IF NOT EXISTS idx_calendar_tasks_user_id ON calendar_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_tasks_event_id ON calendar_tasks(calendar_event_id);
CREATE INDEX IF NOT EXISTS idx_calendar_tasks_google_id ON calendar_tasks(google_task_id);
CREATE INDEX IF NOT EXISTS idx_calendar_tasks_source ON calendar_tasks(source);
CREATE INDEX IF NOT EXISTS idx_calendar_tasks_due_date ON calendar_tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_calendar_tasks_completed ON calendar_tasks(completed);

CREATE INDEX IF NOT EXISTS idx_calendar_conflicts_user_id ON calendar_conflicts(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_conflicts_event_id ON calendar_conflicts(calendar_event_id);
CREATE INDEX IF NOT EXISTS idx_calendar_conflicts_resolved ON calendar_conflicts(resolved);

-- Enable RLS on all tables
ALTER TABLE user_calendar_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_sync_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_conflicts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_calendar_tokens
CREATE POLICY "Users can view their own calendar tokens" ON user_calendar_tokens
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own calendar tokens" ON user_calendar_tokens
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own calendar tokens" ON user_calendar_tokens
    FOR UPDATE USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own calendar tokens" ON user_calendar_tokens
    FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for calendar_events
CREATE POLICY "Users can view their own calendar events" ON calendar_events
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own calendar events" ON calendar_events
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own calendar events" ON calendar_events
    FOR UPDATE USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own calendar events" ON calendar_events
    FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for calendar_sync_state
CREATE POLICY "Users can view their own sync state" ON calendar_sync_state
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sync state" ON calendar_sync_state
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sync state" ON calendar_sync_state
    FOR UPDATE USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sync state" ON calendar_sync_state
    FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for calendar_tasks
CREATE POLICY "Users can view their own calendar tasks" ON calendar_tasks
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own calendar tasks" ON calendar_tasks
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own calendar tasks" ON calendar_tasks
    FOR UPDATE USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own calendar tasks" ON calendar_tasks
    FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for calendar_conflicts
CREATE POLICY "Users can view their own calendar conflicts" ON calendar_conflicts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own calendar conflicts" ON calendar_conflicts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own calendar conflicts" ON calendar_conflicts
    FOR UPDATE USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own calendar conflicts" ON calendar_conflicts
    FOR DELETE USING (auth.uid() = user_id);

-- Create triggers for automatic updated_at timestamps
CREATE OR REPLACE FUNCTION update_calendar_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_user_calendar_tokens_updated_at
    BEFORE UPDATE ON user_calendar_tokens
    FOR EACH ROW
    EXECUTE FUNCTION update_calendar_updated_at();

CREATE TRIGGER trigger_update_calendar_events_updated_at
    BEFORE UPDATE ON calendar_events
    FOR EACH ROW
    EXECUTE FUNCTION update_calendar_updated_at();

CREATE TRIGGER trigger_update_calendar_sync_state_updated_at
    BEFORE UPDATE ON calendar_sync_state
    FOR EACH ROW
    EXECUTE FUNCTION update_calendar_updated_at();

CREATE TRIGGER trigger_update_calendar_tasks_updated_at
    BEFORE UPDATE ON calendar_tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_calendar_updated_at();

CREATE TRIGGER trigger_update_calendar_conflicts_updated_at
    BEFORE UPDATE ON calendar_conflicts
    FOR EACH ROW
    EXECUTE FUNCTION update_calendar_updated_at();

-- Add comments for documentation
COMMENT ON TABLE user_calendar_tokens IS 'Stores encrypted OAuth tokens for calendar providers (Google, Outlook, etc.)';
COMMENT ON TABLE calendar_events IS 'Local storage for calendar events with mapping to external providers';
COMMENT ON TABLE calendar_sync_state IS 'Tracks synchronization state and settings for each calendar';
COMMENT ON TABLE calendar_tasks IS 'Task management integration with calendar events';
COMMENT ON TABLE calendar_conflicts IS 'Tracks and manages synchronization conflicts';

COMMENT ON COLUMN user_calendar_tokens.access_token_encrypted IS 'AES-256 encrypted access token';
COMMENT ON COLUMN user_calendar_tokens.refresh_token_encrypted IS 'AES-256 encrypted refresh token';
COMMENT ON COLUMN calendar_events.google_event_id IS 'Google Calendar event ID for bidirectional sync';
COMMENT ON COLUMN calendar_events.limitless_id IS 'Limitless.ai event/meeting ID for overlay';
COMMENT ON COLUMN calendar_events.source IS 'Source of the event: ccopinai (app-created), google, or limitless';
COMMENT ON COLUMN calendar_events.sync_status IS 'Synchronization status with external providers';
COMMENT ON COLUMN calendar_sync_state.next_sync_token IS 'Google Calendar sync token for incremental sync';
COMMENT ON COLUMN calendar_sync_state.sync_anchor IS 'Timestamp anchor for sync operations';

-- Grant necessary permissions
GRANT ALL ON user_calendar_tokens TO authenticated;
GRANT ALL ON calendar_events TO authenticated;
GRANT ALL ON calendar_sync_state TO authenticated;
GRANT ALL ON calendar_tasks TO authenticated;
GRANT ALL ON calendar_conflicts TO authenticated;

GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated; 