# Supabase Authentication Setup

## 1. Enable OAuth Providers

### Apple Sign-In
1. Go to **Authentication** → **Providers** → **Apple**
2. Enable Apple provider
3. Configure:
   - **Services ID**: Your Apple Services ID
   - **Team ID**: Your Apple Developer Team ID  
   - **Key ID**: Your Apple Key ID
   - **Private Key**: Your Apple private key (.p8 file content)

### Google Sign-In
1. Go to **Authentication** → **Providers** → **Google**
2. Enable Google provider
3. Configure:
   - **Client ID**: Your Google OAuth client ID
   - **Client Secret**: Your Google OAuth client secret

## 2. Configure Redirect URLs

Add these redirect URLs in your OAuth provider settings:

### For Development:
- `audio-transcript-mcp://auth` (mobile app)
- `http://localhost:8081/auth` (web development - Metro bundler)
- `exp://localhost:8081/--/auth` (Expo development)
- `https://mhrfjtbnpxzmrppljztw.supabase.co/auth/v1/callback` (Supabase callback)

### For Production:
- `your-app-scheme://auth` (mobile app)
- `https://your-domain.com/auth` (web app)
- `https://mhrfjtbnpxzmrppljztw.supabase.co/auth/v1/callback` (Supabase callback)

## 3. App Configuration

Update your app's redirect URL scheme in:

**app.json**:
```json
{
  "expo": {
    "scheme": "audio-transcript-mcp"
  }
}
```

## 4. Test Authentication

1. Start your app
2. Try signing in with Apple/Google
3. Check the **Authentication** → **Users** tab in Supabase to see new users

## 5. Custom Email Templates (Optional)

Go to **Authentication** → **Email Templates** to customize:
- Confirm signup
- Magic link
- Change email address
- Reset password