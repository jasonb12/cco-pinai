-- Create storage bucket for audio files
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'audio-files',
    'audio-files',
    true,
    52428800, -- 50MB limit
    ARRAY['audio/mpeg', 'audio/mp4', 'audio/wav', 'audio/m4a', 'audio/x-m4a']
);

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