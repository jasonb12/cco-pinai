#!/usr/bin/env python3
"""
Script to run the database migration programmatically
"""
import asyncio
from dotenv import load_dotenv
load_dotenv()

import os

async def run_migration():
    """Run the database migration using direct PostgreSQL connection"""
    
    # Build connection string from Supabase credentials
    supabase_url = os.getenv("SUPABASE_URL")
    service_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY") 
    
    # Extract project ref from URL
    project_ref = supabase_url.replace("https://", "").replace(".supabase.co", "")
    
    # Direct PostgreSQL connection string
    conn_string = f"postgresql://postgres:[PASSWORD]@db.{project_ref}.supabase.co:5432/postgres"
    
    print("🔧 Running Database Migration")
    print("=" * 50)
    print("Unfortunately, we need to run this migration manually in the Supabase SQL Editor")
    print("because direct PostgreSQL connections require the database password.")
    print()
    print("📋 Please follow these steps:")
    print("1. Go to: https://supabase.com/dashboard/project/mhrfjtbnpxzmrppljztw/sql/new")
    print("2. Copy and paste this SQL:")
    print()
    
    migration_sql = """
-- Add Limitless.ai support to transcripts table
ALTER TABLE transcripts 
ADD COLUMN IF NOT EXISTS limitless_id TEXT,
ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'upload' CHECK (source IN ('upload', 'limitless')),
ADD COLUMN IF NOT EXISTS raw_content JSONB,
ADD COLUMN IF NOT EXISTS processed_at TIMESTAMP WITH TIME ZONE;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_transcripts_limitless_id ON transcripts(limitless_id);
CREATE INDEX IF NOT EXISTS idx_transcripts_source ON transcripts(source);

-- Add unique constraint
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

-- Enable RLS on sync_state
ALTER TABLE sync_state ENABLE ROW LEVEL SECURITY;

-- Create policies for sync_state
CREATE POLICY "Users can manage own sync state" ON sync_state
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Create unique index
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
ALTER TABLE sync_errors ENABLE ROW LEVEL SECURITY;

-- Create policy for sync_errors
CREATE POLICY "Users can manage own sync errors" ON sync_errors
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_sync_errors_user_service ON sync_errors(user_id, service_name);

SELECT 'Migration completed successfully!' as status;
"""
    
    print(migration_sql)
    print()
    print("3. Click 'Run' to execute the migration")
    print("4. You should see 'Migration completed successfully!' at the bottom")
    print()
    print("🎯 After running the migration, we can test the sync functionality!")

if __name__ == "__main__":
    asyncio.run(run_migration())