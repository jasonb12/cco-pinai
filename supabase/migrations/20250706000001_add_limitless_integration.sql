-- Migration: Add Limitless.ai integration support
-- Description: Adds support for syncing Limitless.ai lifelogs as transcripts

-- Add Limitless.ai support to transcripts table
ALTER TABLE transcripts 
ADD COLUMN IF NOT EXISTS limitless_id TEXT,
ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'upload' CHECK (source IN ('upload', 'limitless')),
ADD COLUMN IF NOT EXISTS raw_content JSONB,
ADD COLUMN IF NOT EXISTS processed_at TIMESTAMP WITH TIME ZONE;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_transcripts_limitless_id ON transcripts(limitless_id);
CREATE INDEX IF NOT EXISTS idx_transcripts_source ON transcripts(source);

-- Add unique constraint for limitless_id to prevent duplicates
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'transcripts_limitless_id_unique'
    ) THEN
        ALTER TABLE transcripts 
        ADD CONSTRAINT transcripts_limitless_id_unique 
        UNIQUE (limitless_id);
    END IF;
END $$;

-- Create sync_state table to track sync progress
CREATE TABLE IF NOT EXISTS sync_state (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    service_name TEXT NOT NULL,
    last_sync_date DATE NOT NULL,
    last_cursor TEXT,
    total_synced INTEGER DEFAULT 0,
    last_sync_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS on sync_state
ALTER TABLE sync_state ENABLE ROW LEVEL SECURITY;

-- Create policies for sync_state (idempotent)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'sync_state' 
        AND policyname = 'Users can view own sync state'
    ) THEN
        CREATE POLICY "Users can view own sync state" ON sync_state
            FOR SELECT USING (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'sync_state' 
        AND policyname = 'Users can insert own sync state'
    ) THEN
        CREATE POLICY "Users can insert own sync state" ON sync_state
            FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'sync_state' 
        AND policyname = 'Users can update own sync state'
    ) THEN
        CREATE POLICY "Users can update own sync state" ON sync_state
            FOR UPDATE USING (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'sync_state' 
        AND policyname = 'Users can delete own sync state'
    ) THEN
        CREATE POLICY "Users can delete own sync state" ON sync_state
            FOR DELETE USING (auth.uid() = user_id);
    END IF;
END $$;

-- Create unique index for user_id + service_name combination
CREATE UNIQUE INDEX IF NOT EXISTS idx_sync_state_user_service 
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

-- Create policies for sync_errors (idempotent)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'sync_errors' 
        AND policyname = 'Users can view own sync errors'
    ) THEN
        CREATE POLICY "Users can view own sync errors" ON sync_errors
            FOR SELECT USING (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'sync_errors' 
        AND policyname = 'Users can insert own sync errors'
    ) THEN
        CREATE POLICY "Users can insert own sync errors" ON sync_errors
            FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

-- Create indexes for sync_errors
CREATE INDEX IF NOT EXISTS idx_sync_errors_user_service ON sync_errors(user_id, service_name);
CREATE INDEX IF NOT EXISTS idx_sync_errors_occurred_at ON sync_errors(occurred_at);