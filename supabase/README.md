# Supabase Setup Guide

## Step-by-Step Setup

### 1. Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Sign in and create a new project
3. Wait for the project to be ready (~2 minutes)

### 2. Run Database Schema
1. Go to **SQL Editor** in your Supabase dashboard
2. Copy and paste the contents of `schema.sql`
3. Click **Run** to execute

### 3. Create Storage Bucket
1. Go to **Storage** in your Supabase dashboard
2. Copy and paste the contents of `storage.sql` in SQL Editor
3. Click **Run** to execute

### 4. Configure Authentication
1. Follow the instructions in `auth-setup.md`
2. Enable Apple and Google OAuth providers
3. Configure redirect URLs

### 5. Get Your Credentials
1. Go to **Settings** → **API**
2. Copy your:
   - **Project URL** (starts with `https://`)
   - **Anon public key** (starts with `eyJ`)

### 6. Update Environment Files
Update your environment files with the credentials:

**frontend/.env**:
```
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
EXPO_PUBLIC_API_URL=http://localhost:8000
```

**backend/.env**:
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
MCP_SERVER_URL=localhost:8000
```

## Verification

### Check Tables
Go to **Table Editor** and verify these tables exist:
- `transcripts`
- `mcp_servers`

### Check Storage
Go to **Storage** and verify the `audio-files` bucket exists.

### Check Authentication
Go to **Authentication** → **Providers** and verify Apple/Google are enabled.

### Test Connection
Run your app and try:
1. Signing in with Apple/Google
2. Uploading an audio file
3. Creating a transcript

## Troubleshooting

### Common Issues:

**RLS Errors**: Make sure Row Level Security policies are correctly set up

**Storage Upload Fails**: Check bucket permissions and file size limits

**Auth Redirect Issues**: Verify redirect URLs match your app configuration

**Database Connection**: Ensure your environment variables are correct

### Debug Tips:

1. Check the **Logs** section in Supabase for detailed error messages
2. Use the **SQL Editor** to test queries manually
3. Check browser network tab for failed requests
4. Verify your environment variables are loaded correctly