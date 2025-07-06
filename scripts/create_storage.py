#!/usr/bin/env python3
"""
Script to create storage bucket using Supabase Python client
"""
import os
import sys
from supabase import create_client, Client

# Load environment variables
SUPABASE_URL = "https://mhrfjtbnpxzmrppljztw.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ocmZqdGJucHh6bXJwcGxqenR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3ODU1OTEsImV4cCI6MjA2NzM2MTU5MX0.UHaw8X3ddEc2eJ5I6MbS_jWpRNGQaKym60_VwRXhvVw"

def main():
    try:
        # Create Supabase client
        supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
        print("✅ Connected to Supabase")
        
        # Try to create storage bucket
        bucket_result = supabase.storage.create_bucket("audio-files", {"public": True})
        print("✅ Storage bucket created successfully!")
        
    except Exception as e:
        print(f"❌ Storage error: {e}")
        print("⚠️  Bucket may already exist or require manual setup")
    
    return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)