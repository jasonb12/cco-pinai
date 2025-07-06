-- Complete Supabase Setup Script
-- Run this in your Supabase SQL Editor at:
-- https://supabase.com/dashboard/project/mhrfjtbnpxzmrppljztw/sql/new

-- 1. Create tables from migrations
-- Drop existing tables if they exist (be careful in production!)
DROP TABLE IF EXISTS mcp_servers CASCADE;
DROP TABLE IF EXISTS transcripts CASCADE;

-- Create transcripts table
CREATE TABLE IF NOT EXISTS transcripts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    audio_url TEXT NOT NULL,
    transcript_text TEXT,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create mcp_servers table
CREATE TABLE IF NOT EXISTS mcp_servers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    config JSONB NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS
ALTER TABLE transcripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE mcp_servers ENABLE ROW LEVEL SECURITY;

-- Create policies for transcripts
CREATE POLICY "Users can view own transcripts" ON transcripts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transcripts" ON transcripts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own transcripts" ON transcripts
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own transcripts" ON transcripts
    FOR DELETE USING (auth.uid() = user_id);

-- Create policies for mcp_servers
CREATE POLICY "Users can view own mcp_servers" ON mcp_servers
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own mcp_servers" ON mcp_servers
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own mcp_servers" ON mcp_servers
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own mcp_servers" ON mcp_servers
    FOR DELETE USING (auth.uid() = user_id);

-- 2. Storage setup
-- Delete existing bucket if it exists
DELETE FROM storage.buckets WHERE id = 'audio-files';

-- Create storage bucket for audio files
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'audio-files',
    'audio-files',
    true,
    52428800, -- 50MB limit
    ARRAY['audio/mpeg', 'audio/mp4', 'audio/wav', 'audio/m4a', 'audio/x-m4a']
);

-- Drop existing storage policies if they exist
DROP POLICY IF EXISTS "Authenticated users can upload audio files" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own audio files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own audio files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own audio files" ON storage.objects;

-- Storage policies for audio files
CREATE POLICY "Authenticated users can upload audio files" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'audio-files' 
        AND auth.role() = 'authenticated'
    );

CREATE POLICY "Users can view their own audio files" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'audio-files' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can update their own audio files" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'audio-files' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can delete their own audio files" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'audio-files' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- 3. Verify setup
SELECT 'Tables created:' as status;
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('transcripts', 'mcp_servers');

SELECT 'Storage bucket created:' as status;
SELECT id, name FROM storage.buckets WHERE id = 'audio-files';

SELECT 'Setup complete!' as status;