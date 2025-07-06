#!/usr/bin/env python3
"""
Test script using a proper UUID for user_id
"""
import asyncio
import json
import uuid
from datetime import date, datetime, timedelta
from dotenv import load_dotenv
import logging

# Load environment variables
load_dotenv()

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

from src.services.sync import get_sync_service
from src.services.database import get_database_service

# Use a proper UUID for testing
TEST_USER_ID = str(uuid.uuid4())

async def test_database_integration():
    """Test the complete database integration with proper UUID"""
    print("🧪 Testing Complete Database Integration with Proper UUID")
    print("=" * 70)
    print(f"Using test user ID: {TEST_USER_ID}")
    
    database_service = get_database_service()
    
    try:
        # Test 1: Get initial transcript stats
        print(f"\n📊 Initial transcript stats...")
        initial_stats = await database_service.get_transcript_stats(TEST_USER_ID)
        print(f"✅ Initial stats: {json.dumps(initial_stats, indent=2)}")
        
        # Test 2: Perform a sync with proper UUID
        print(f"\n🔄 Starting sync for today...")
        sync_service = get_sync_service(TEST_USER_ID)
        
        progress_updates = []
        
        async def progress_callback(update):
            progress_updates.append(update)
            print(f"   📈 Progress: {update}")
        
        today = date.today()
        sync_result = await sync_service.sync_from_date(
            start_date=today,
            end_date=today,
            progress_callback=progress_callback
        )
        
        print(f"\n✅ Sync completed!")
        print(f"   - Total synced: {sync_result.total_synced}")
        print(f"   - Last sync date: {sync_result.last_sync_date}")
        print(f"   - Errors: {len(sync_result.errors)}")
        if sync_result.errors:
            print(f"   - Error details: {sync_result.errors}")
        
        # Test 3: Check updated transcript stats
        print(f"\n📊 Updated transcript stats...")
        updated_stats = await database_service.get_transcript_stats(TEST_USER_ID)
        print(f"✅ Updated stats: {json.dumps(updated_stats, indent=2)}")
        
        # Test 4: Get synced transcripts
        if updated_stats['limitless_transcripts'] > 0:
            print(f"\n📄 Fetching synced transcripts...")
            transcripts = await database_service.get_transcripts_for_user(
                TEST_USER_ID, 
                source="limitless",
                limit=3
            )
            print(f"✅ Found {len(transcripts)} Limitless transcripts")
            
            for i, transcript in enumerate(transcripts):
                print(f"   {i+1}. ID: {transcript['id']}")
                print(f"      Limitless ID: {transcript['limitless_id']}")
                print(f"      Source: {transcript['source']}")
                print(f"      Status: {transcript['status']}")
                print(f"      Created: {transcript['created_at']}")
                if transcript['transcript_text']:
                    print(f"      Text: {transcript['transcript_text'][:100]}...")
                print()
        
        # Test 5: Check sync state
        print(f"\n🔍 Check sync state...")
        sync_state = await database_service.get_sync_state(TEST_USER_ID, "limitless")
        if sync_state:
            print(f"✅ Sync state found: {json.dumps(sync_state, indent=2)}")
        else:
            print("⚠️  No sync state found")
        
        await sync_service.close()
        
        print(f"\n🎉 Database integration test completed!")
        print(f"\n📋 Summary:")
        print(f"   - Initial transcripts: {initial_stats['total_transcripts']}")
        print(f"   - Final transcripts: {updated_stats['total_transcripts']}")
        print(f"   - Limitless transcripts: {updated_stats['limitless_transcripts']}")
        print(f"   - Total synced: {updated_stats['total_synced']}")
        print(f"   - Test user ID: {TEST_USER_ID}")
        
        # Show what happened
        if updated_stats['limitless_transcripts'] > 0:
            print(f"\n🎯 SUCCESS: Limitless lifelogs were successfully synced to database!")
        else:
            print(f"\n⚠️  No transcripts synced - check errors above")
        
    except Exception as e:
        print(f"❌ Test failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_database_integration())