-- Complete Database Migration for Limitless Integration
-- Run this in your Supabase SQL Editor

-- Add Limitless.ai support to transcripts table
ALTER TABLE transcripts 
ADD COLUMN IF NOT EXISTS limitless_id TEXT,
ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'upload' CHECK (source IN ('upload', 'limitless')),
ADD COLUMN IF NOT EXISTS raw_content JSONB,
ADD COLUMN IF NOT EXISTS processed_at TIMESTAMP WITH TIME ZONE;

-- Create indexes (only if they don't exist)
CREATE INDEX IF NOT EXISTS idx_transcripts_limitless_id ON transcripts(limitless_id);
CREATE INDEX IF NOT EXISTS idx_transcripts_source ON transcripts(source);

-- Add constraint to ensure limitless_id is unique when not null
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

-- Create sync_state table
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

-- Enable RLS on sync_state (only if not already enabled)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE c.relname = 'sync_state' AND n.nspname = 'public' AND c.relrowsecurity = true
    ) THEN
        ALTER TABLE sync_state ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- Create policies for sync_state (drop if exists, then recreate)
DROP POLICY IF EXISTS "Users can view own sync state" ON sync_state;
DROP POLICY IF EXISTS "Users can insert own sync state" ON sync_state;
DROP POLICY IF EXISTS "Users can update own sync state" ON sync_state;
DROP POLICY IF EXISTS "Users can delete own sync state" ON sync_state;

CREATE POLICY "Users can view own sync state" ON sync_state
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sync state" ON sync_state
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sync state" ON sync_state
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own sync state" ON sync_state
    FOR DELETE USING (auth.uid() = user_id);

-- Create unique index for user_id + service_name combination
CREATE UNIQUE INDEX IF NOT EXISTS idx_sync_state_user_service 
ON sync_state(user_id, service_name);

-- Create sync_errors table
CREATE TABLE IF NOT EXISTS sync_errors (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    service_name TEXT NOT NULL,
    error_message TEXT NOT NULL,
    error_details JSONB,
    occurred_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS on sync_errors
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE c.relname = 'sync_errors' AND n.nspname = 'public' AND c.relrowsecurity = true
    ) THEN
        ALTER TABLE sync_errors ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- Create policies for sync_errors (drop if exists, then recreate)
DROP POLICY IF EXISTS "Users can view own sync errors" ON sync_errors;
DROP POLICY IF EXISTS "Users can insert own sync errors" ON sync_errors;

CREATE POLICY "Users can view own sync errors" ON sync_errors
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sync errors" ON sync_errors
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create indexes for error lookups
CREATE INDEX IF NOT EXISTS idx_sync_errors_user_service ON sync_errors(user_id, service_name);
CREATE INDEX IF NOT EXISTS idx_sync_errors_occurred_at ON sync_errors(occurred_at);

-- Verify setup
SELECT 'Migration completed successfully!' as status;

-- Show table structures
SELECT 'transcripts table columns:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'transcripts' AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT 'sync_state table created:' as info;
SELECT COUNT(*) as exists FROM information_schema.tables 
WHERE table_name = 'sync_state' AND table_schema = 'public';

SELECT 'sync_errors table created:' as info;
SELECT COUNT(*) as exists FROM information_schema.tables 
WHERE table_name = 'sync_errors' AND table_schema = 'public';