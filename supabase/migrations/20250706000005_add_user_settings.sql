-- Migration: Add user_settings table for storing user preferences and API keys
-- Date: 2025-01-06
-- Description: Create user_settings table to store user preferences, API keys, and integration settings

-- Create user_settings table
CREATE TABLE IF NOT EXISTS user_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    setting_key VARCHAR(255) NOT NULL,
    setting_value TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure unique setting per user
    UNIQUE(user_id, setting_key)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_user_settings_key ON user_settings(setting_key);
CREATE INDEX IF NOT EXISTS idx_user_settings_user_key ON user_settings(user_id, setting_key);

-- Enable RLS
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can only access their own settings
CREATE POLICY "Users can view their own settings" ON user_settings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own settings" ON user_settings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings" ON user_settings
    FOR UPDATE USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own settings" ON user_settings
    FOR DELETE USING (auth.uid() = user_id);

-- Create trigger to automatically update updated_at
CREATE OR REPLACE FUNCTION update_user_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_user_settings_updated_at
    BEFORE UPDATE ON user_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_user_settings_updated_at();

-- Insert some example settings structure (commented out for production)
-- These are just examples of what settings might look like
/*
-- Example settings that might be stored:
-- limitless_api_key: Encrypted API key for Limitless.ai
-- limitless_sync_enabled: Boolean for auto-sync
-- limitless_timezone: User's preferred timezone
-- notification_email: Boolean for email notifications
-- notification_push: Boolean for push notifications
-- theme_preference: light/dark/auto
-- analytics_enabled: Boolean for usage analytics
-- auto_sync: Boolean for automatic syncing
*/

-- Add comments
COMMENT ON TABLE user_settings IS 'Store user preferences, API keys, and integration settings';
COMMENT ON COLUMN user_settings.setting_key IS 'Setting identifier (e.g., limitless_api_key, theme_preference)';
COMMENT ON COLUMN user_settings.setting_value IS 'Setting value (stored as text, can be JSON for complex values)';
COMMENT ON COLUMN user_settings.user_id IS 'Reference to the user who owns this setting';

-- Grant permissions
GRANT ALL ON user_settings TO authenticated;
GRANT USAGE ON SEQUENCE user_settings_id_seq TO authenticated; 