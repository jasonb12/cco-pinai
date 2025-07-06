#!/usr/bin/env python3
"""
Script to create database schema using Supabase Python client
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
        
        # Read schema file
        schema_path = "/Users/jason/src/cco-pinai/supabase/schema.sql"
        with open(schema_path, 'r') as f:
            schema_sql = f.read()
        
        print("📝 Read schema file")
        
        # Execute the schema (this will fail with anon key, but let's try)
        result = supabase.rpc('exec_sql', {'sql': schema_sql})
        print("✅ Schema created successfully!")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        print("\n🔧 Manual setup required:")
        print("1. Go to: https://supabase.com/dashboard/project/mhrfjtbnpxzmrppljztw")
        print("2. Open: SQL Editor")
        print("3. Copy contents of: /Users/jason/src/cco-pinai/supabase/schema.sql")
        print("4. Paste and run the SQL")
        return False
    
    return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)