#!/usr/bin/env python3
"""
Script to test if users are actually being authenticated
"""
from supabase import create_client
import json

SUPABASE_URL = "https://mhrfjtbnpxzmrppljztw.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ocmZqdGJucHh6bXJwcGxqenR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3ODU1OTEsImV4cCI6MjA2NzM2MTU5MX0.UHaw8X3ddEc2eJ5I6MbS_jWpRNGQaKym60_VwRXhvVw"

def check_users():
    """Check if any users have been created via OAuth"""
    try:
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
        
        # This might not work with anon key, but let's try
        print("🔍 Checking for authenticated users...")
        
        # Check auth session
        session = supabase.auth.get_session()
        print(f"📱 Current session: {session}")
        
        print("\n💡 Debug Tips:")
        print("1. Open browser dev tools (F12)")
        print("2. Go to Application/Storage tab")
        print("3. Check Local Storage for 'sb-mhrfjtbnpxzmrppljztw-auth-token'")
        print("4. Check if there's an auth token stored")
        
        print("\n🧪 Manual Test:")
        print("1. After clicking 'Sign in with Google'")
        print("2. Open browser console")
        print("3. Type: localStorage.getItem('sb-mhrfjtbnpxzmrppljztw-auth-token')")
        print("4. If you see a token, auth is working but app state isn't updating")
        
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    check_users()