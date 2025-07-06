#!/usr/bin/env python3
"""
Script to automatically configure Google OAuth in Supabase
"""
import os
import requests
from dotenv import load_dotenv

# Load environment variables
load_dotenv('/Users/jason/src/cco-pinai/backend/.env')

SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_KEY')
GOOGLE_CLIENT_ID = os.getenv('GOOGLE_CLIENT_ID')
GOOGLE_CLIENT_SECRET = os.getenv('GOOGLE_CLIENT_SECRET')

def configure_google_oauth():
    """Configure Google OAuth provider in Supabase"""
    
    print("🔧 Configuring Google OAuth in Supabase...")
    print(f"📋 Client ID: {GOOGLE_CLIENT_ID}")
    print(f"📋 Project URL: {SUPABASE_URL}")
    
    # Supabase Management API endpoint (this may not work with anon key)
    management_url = f"{SUPABASE_URL.replace('.supabase.co', '')}.supabase.co"
    
    # Configuration payload
    config_data = {
        "EXTERNAL_GOOGLE_ENABLED": True,
        "EXTERNAL_GOOGLE_CLIENT_ID": GOOGLE_CLIENT_ID,
        "EXTERNAL_GOOGLE_SECRET": GOOGLE_CLIENT_SECRET,
        "EXTERNAL_GOOGLE_REDIRECT_URI": f"{SUPABASE_URL}/auth/v1/callback"
    }
    
    print("\n📝 Configuration to apply:")
    for key, value in config_data.items():
        if 'SECRET' in key:
            print(f"   {key}: {'*' * len(str(value))}")
        else:
            print(f"   {key}: {value}")
    
    print(f"\n⚠️  Note: Automatic configuration may require service role key.")
    print(f"📋 Manual setup required:")
    print(f"1. Go to: {SUPABASE_URL.replace('https://', 'https://supabase.com/dashboard/project/')}")
    print(f"2. Navigate to: Authentication → Providers → Google")
    print(f"3. Enable Google provider")
    print(f"4. Enter Client ID: {GOOGLE_CLIENT_ID}")
    print(f"5. Enter Client Secret: {GOOGLE_CLIENT_SECRET}")
    print(f"6. Save configuration")
    
    # Try to make the API call (likely to fail with anon key)
    try:
        headers = {
            'Authorization': f'Bearer {SUPABASE_KEY}',
            'Content-Type': 'application/json',
            'apikey': SUPABASE_KEY
        }
        
        # This endpoint likely doesn't exist or requires different auth
        response = requests.post(
            f"{SUPABASE_URL}/auth/v1/settings",
            headers=headers,
            json=config_data
        )
        
        if response.status_code == 200:
            print("✅ Google OAuth configured successfully!")
            return True
        else:
            print(f"❌ API call failed: {response.status_code} - {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error configuring OAuth: {e}")
        return False

if __name__ == "__main__":
    if not all([SUPABASE_URL, SUPABASE_KEY, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET]):
        print("❌ Missing required environment variables")
        print("Please ensure .env file contains:")
        print("- SUPABASE_URL")
        print("- SUPABASE_KEY") 
        print("- GOOGLE_CLIENT_ID")
        print("- GOOGLE_CLIENT_SECRET")
        exit(1)
    
    configure_google_oauth()