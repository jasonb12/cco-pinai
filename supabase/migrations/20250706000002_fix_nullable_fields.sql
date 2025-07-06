-- Fix nullable fields for Limitless integration
-- Make audio_url nullable since Limitless lifelogs may not have audio files

-- Make audio_url nullable
ALTER TABLE transcripts ALTER COLUMN audio_url DROP NOT NULL;

-- Also make title nullable as a fallback (we'll handle this in the application)
ALTER TABLE transcripts ALTER COLUMN title DROP NOT NULL;