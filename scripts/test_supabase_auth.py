#!/usr/bin/env python3
"""
Script to test Supabase authentication configuration
"""
import requests
import json

SUPABASE_URL = "https://mhrfjtbnpxzmrppljztw.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ocmZqdGJucHh6bXJwcGxqenR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3ODU1OTEsImV4cCI6MjA2NzM2MTU5MX0.UHaw8X3ddEc2eJ5I6MbS_jWpRNGQaKym60_VwRXhvVw"

def test_auth_settings():
    """Test what auth providers are currently enabled"""
    
    headers = {
        'apikey': SUPABASE_KEY,
        'Authorization': f'Bearer {SUPABASE_KEY}',
        'Content-Type': 'application/json'
    }
    
    # Try to get auth settings
    try:
        response = requests.get(
            f"{SUPABASE_URL}/auth/v1/settings",
            headers=headers
        )
        
        print("🔍 Current Auth Settings:")
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            settings = response.json()
            print("📋 Auth Configuration:")
            print(json.dumps(settings, indent=2))
            
            # Check for external providers
            external_providers = [key for key in settings.keys() if key.startswith('external_')]
            if external_providers:
                print(f"\n🔧 External Providers Found: {external_providers}")
            else:
                print("\n❌ No external providers found")
                
        else:
            print(f"❌ Failed to get settings: {response.text}")
            
    except Exception as e:
        print(f"❌ Error: {e}")

def test_google_oauth():
    """Test Google OAuth provider specifically"""
    
    headers = {
        'apikey': SUPABASE_KEY,
        'Content-Type': 'application/json'
    }
    
    # Try to initiate Google OAuth
    try:
        response = requests.post(
            f"{SUPABASE_URL}/auth/v1/authorize",
            headers=headers,
            json={
                "provider": "google",
                "options": {
                    "redirectTo": "http://localhost:8081/auth"
                }
            }
        )
        
        print(f"\n🔍 Google OAuth Test:")
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code != 400:
            print("✅ Google provider seems to be working!")
        else:
            print("❌ Google provider not enabled or misconfigured")
            
    except Exception as e:
        print(f"❌ Error testing Google OAuth: {e}")

if __name__ == "__main__":
    print("🧪 Testing Supabase Authentication Configuration...")
    print(f"🌐 Project URL: {SUPABASE_URL}")
    print("-" * 50)
    
    test_auth_settings()
    test_google_oauth()
    
    print("\n" + "=" * 50)
    print("📋 Manual Verification Steps:")
    print("1. Go to: https://supabase.com/dashboard/project/mhrfjtbnpxzmrppljztw")
    print("2. Check: Authentication → Providers → Google")
    print("3. Ensure: Google provider toggle is ON")
    print("4. Verify: Client ID and Secret are entered correctly")
    print("5. Save: Click save if any changes were made")