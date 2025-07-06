-- Add Limitless.ai support to transcripts table
-- Add new columns for Limitless integration

ALTER TABLE transcripts 
ADD COLUMN limitless_id TEXT,
ADD COLUMN source TEXT DEFAULT 'upload' CHECK (source IN ('upload', 'limitless')),
ADD COLUMN raw_content JSONB,
ADD COLUMN processed_at TIMESTAMP WITH TIME ZONE;

-- Create index for limitless_id for fast lookups
CREATE INDEX idx_transcripts_limitless_id ON transcripts(limitless_id);

-- Create index for source type
CREATE INDEX idx_transcripts_source ON transcripts(source);

-- Add constraint to ensure limitless_id is unique when not null
ALTER TABLE transcripts 
ADD CONSTRAINT transcripts_limitless_id_unique 
UNIQUE (limitless_id);

-- Create sync_state table to track sync progress
CREATE TABLE IF NOT EXISTS sync_state (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    service_name TEXT NOT NULL, -- 'limitless', etc.
    last_sync_date DATE NOT NULL,
    last_cursor TEXT,
    total_synced INTEGER DEFAULT 0,
    last_sync_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS on sync_state
ALTER TABLE sync_state ENABLE ROW LEVEL SECURITY;

-- Create policies for sync_state
CREATE POLICY "Users can view own sync state" ON sync_state
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sync state" ON sync_state
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sync state" ON sync_state
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own sync state" ON sync_state
    FOR DELETE USING (auth.uid() = user_id);

-- Create unique index for user_id + service_name combination
CREATE UNIQUE INDEX idx_sync_state_user_service 
ON sync_state(user_id, service_name);

-- Create sync_errors table to track sync errors
CREATE TABLE IF NOT EXISTS sync_errors (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    service_name TEXT NOT NULL,
    error_message TEXT NOT NULL,
    error_details JSONB,
    occurred_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS on sync_errors
ALTER TABLE sync_errors ENABLE ROW LEVEL SECURITY;

-- Create policy for sync_errors
CREATE POLICY "Users can view own sync errors" ON sync_errors
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sync errors" ON sync_errors
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create index for error lookups
CREATE INDEX idx_sync_errors_user_service ON sync_errors(user_id, service_name);
CREATE INDEX idx_sync_errors_occurred_at ON sync_errors(occurred_at);