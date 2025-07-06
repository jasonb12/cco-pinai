#!/usr/bin/env python3
"""
Script to help fix authentication redirect URL configuration
"""

def print_fix_instructions():
    print("🔧 Fixing Authentication Redirect URLs")
    print("=" * 50)
    
    print("\n📋 Issue Found:")
    print("   Supabase is redirecting to localhost:3000 but your app runs on localhost:8081")
    
    print(f"\n🌐 Manual Fix Required in Supabase Dashboard:")
    print(f"1. Go to: https://supabase.com/dashboard/project/mhrfjtbnpxzmrppljztw")
    print(f"2. Navigate to: Authentication → URL Configuration")
    print(f"3. Update 'Site URL' to: http://localhost:8081")
    print(f"4. Update 'Redirect URLs' to include:")
    print(f"   - http://localhost:8081")
    print(f"   - http://127.0.0.1:8081") 
    print(f"   - audio-transcript-mcp://auth")
    print(f"5. Save the configuration")
    
    print(f"\n🔧 Google Provider Settings:")
    print(f"1. Still in Supabase: Authentication → Providers → Google")
    print(f"2. Make sure these redirect URLs are listed:")
    print(f"   - https://mhrfjtbnpxzmrppljztw.supabase.co/auth/v1/callback")
    print(f"   - http://localhost:8081/auth")
    print(f"3. Save if changed")
    
    print(f"\n🌐 Google Cloud Console Settings:")
    print(f"1. Go to: https://console.cloud.google.com/apis/credentials")
    print(f"2. Edit your OAuth 2.0 Client ID: 90911834117-...")
    print(f"3. Under 'Authorized redirect URIs', add:")
    print(f"   - https://mhrfjtbnpxzmrppljztw.supabase.co/auth/v1/callback")
    print(f"4. Under 'Authorized JavaScript origins', add:")
    print(f"   - https://mhrfjtbnpxzmrppljztw.supabase.co")
    print(f"   - http://localhost:8081")
    print(f"5. Save")
    
    print(f"\n✅ After Making These Changes:")
    print(f"1. Wait 2-3 minutes for changes to propagate")
    print(f"2. Refresh your app at: http://localhost:8081") 
    print(f"3. Try 'Sign in with Google' again")
    
    print(f"\n🔍 The key issue was:")
    print(f"   ❌ Supabase was redirecting to: localhost:3000")
    print(f"   ✅ Your app actually runs on: localhost:8081")

if __name__ == "__main__":
    print_fix_instructions()