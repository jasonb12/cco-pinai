-- Initial schema migration for Audio Transcript MCP app
-- This file is compatible with Supabase CLI migrations

-- Create transcripts table
CREATE TABLE IF NOT EXISTS public.transcripts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    audio_url TEXT NOT NULL,
    transcript_text TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create mcp_servers table
CREATE TABLE IF NOT EXISTS public.mcp_servers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    url TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('installed', 'available', 'error')),
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER set_updated_at_transcripts
    BEFORE UPDATE ON public.transcripts
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_mcp_servers
    BEFORE UPDATE ON public.mcp_servers
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Enable RLS
ALTER TABLE public.transcripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mcp_servers ENABLE ROW LEVEL SECURITY;

-- RLS Policies for transcripts
CREATE POLICY "Users can view their own transcripts" ON public.transcripts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own transcripts" ON public.transcripts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own transcripts" ON public.transcripts
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own transcripts" ON public.transcripts
    FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for mcp_servers (read-only for all authenticated users)
CREATE POLICY "All authenticated users can view MCP servers" ON public.mcp_servers
    FOR SELECT USING (auth.role() = 'authenticated');

-- Only service role can modify MCP servers
CREATE POLICY "Only service role can modify MCP servers" ON public.mcp_servers
    FOR ALL USING (auth.role() = 'service_role');

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_transcripts_user_id ON public.transcripts(user_id);
CREATE INDEX IF NOT EXISTS idx_transcripts_status ON public.transcripts(status);
CREATE INDEX IF NOT EXISTS idx_transcripts_created_at ON public.transcripts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_mcp_servers_status ON public.mcp_servers(status);

-- Insert some sample MCP servers
INSERT INTO public.mcp_servers (name, url, description) VALUES 
    ('filesystem', 'npm:@modelcontextprotocol/server-filesystem', 'File system operations MCP server'),
    ('sqlite', 'npm:@modelcontextprotocol/server-sqlite', 'SQLite database MCP server'),
    ('brave-search', 'npm:@modelcontextprotocol/server-brave-search', 'Brave search API MCP server'),
    ('puppeteer', 'npm:@modelcontextprotocol/server-puppeteer', 'Web scraping with Puppeteer')
ON CONFLICT (name) DO NOTHING;