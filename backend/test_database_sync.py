#!/usr/bin/env python3
"""
Test script for the complete Limitless + Database integration
"""
import asyncio
import json
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

# Test user ID (in a real app, this would come from authentication)
TEST_USER_ID = "test-user-" + str(int(datetime.now().timestamp()))

async def test_database_integration():
    """Test the complete database integration"""
    print("🧪 Testing Complete Database Integration")
    print("=" * 60)
    print(f"Using test user ID: {TEST_USER_ID}")
    
    database_service = get_database_service()
    
    try:
        # Test 1: Get initial transcript stats
        print(f"\n📊 Initial transcript stats...")
        initial_stats = await database_service.get_transcript_stats(TEST_USER_ID)
        print(f"✅ Initial stats: {json.dumps(initial_stats, indent=2)}")
        
        # Test 2: Get sync state (should be none initially)
        print(f"\n🔍 Check initial sync state...")
        sync_state = await database_service.get_sync_state(TEST_USER_ID, "limitless")
        print(f"✅ Initial sync state: {sync_state or 'None'}")
        
        # Test 3: Perform a sync
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
        print(f"   - Progress updates: {len(progress_updates)}")
        
        # Test 4: Check updated transcript stats
        print(f"\n📊 Updated transcript stats...")
        updated_stats = await database_service.get_transcript_stats(TEST_USER_ID)
        print(f"✅ Updated stats: {json.dumps(updated_stats, indent=2)}")
        
        # Test 5: Get synced transcripts
        print(f"\n📄 Fetching synced transcripts...")
        transcripts = await database_service.get_transcripts_for_user(
            TEST_USER_ID, 
            source="limitless",
            limit=5
        )
        print(f"✅ Found {len(transcripts)} Limitless transcripts")
        
        if transcripts:
            for i, transcript in enumerate(transcripts[:3]):
                print(f"   {i+1}. ID: {transcript['id']}")
                print(f"      Limitless ID: {transcript['limitless_id']}")
                print(f"      Created: {transcript['created_at']}")
                print(f"      Text preview: {transcript['transcript_text'][:100]}...")
                print()
        
        # Test 6: Check updated sync state
        print(f"\n🔍 Check updated sync state...")
        updated_sync_state = await database_service.get_sync_state(TEST_USER_ID, "limitless")
        print(f"✅ Updated sync state: {json.dumps(updated_sync_state, indent=2)}")
        
        # Test 7: Test incremental sync
        print(f"\n🔄 Testing incremental sync...")
        incremental_result = await sync_service.incremental_sync()
        print(f"✅ Incremental sync completed!")
        print(f"   - Total synced: {incremental_result.total_synced}")
        print(f"   - Synced from: {incremental_result.last_sync_date}")
        
        # Test 8: Final stats
        print(f"\n📊 Final transcript stats...")
        final_stats = await database_service.get_transcript_stats(TEST_USER_ID)
        print(f"✅ Final stats: {json.dumps(final_stats, indent=2)}")
        
        await sync_service.close()
        
        print(f"\n🎉 Database integration test completed successfully!")
        print(f"\n📋 Summary:")
        print(f"   - Initial transcripts: {initial_stats['total_transcripts']}")
        print(f"   - Final transcripts: {final_stats['total_transcripts']}")
        print(f"   - Limitless transcripts: {final_stats['limitless_transcripts']}")
        print(f"   - Total synced: {final_stats['total_synced']}")
        
    except Exception as e:
        print(f"❌ Test failed: {e}")
        import traceback
        traceback.print_exc()

async def test_api_endpoints():
    """Test the FastAPI endpoints"""
    print(f"\n🌐 Testing API Endpoints")
    print("=" * 40)
    
    import httpx
    
    async with httpx.AsyncClient() as client:
        try:
            # Test sync range endpoint
            print(f"📡 Testing sync range endpoint...")
            sync_response = await client.post(
                "http://localhost:8000/limitless/sync/range",
                json={
                    "user_id": TEST_USER_ID,
                    "start_date": date.today().isoformat(),
                    "end_date": date.today().isoformat()
                },
                timeout=60.0
            )
            
            if sync_response.status_code == 200:
                sync_data = sync_response.json()
                print(f"✅ Sync endpoint successful: {sync_data['total_synced']} synced")
            else:
                print(f"❌ Sync endpoint failed: {sync_response.status_code} - {sync_response.text}")
            
            # Test transcript stats endpoint
            print(f"\n📊 Testing transcript stats endpoint...")
            stats_response = await client.get(
                f"http://localhost:8000/transcripts/{TEST_USER_ID}/stats"
            )
            
            if stats_response.status_code == 200:
                stats_data = stats_response.json()
                print(f"✅ Stats endpoint successful: {json.dumps(stats_data, indent=2)}")
            else:
                print(f"❌ Stats endpoint failed: {stats_response.status_code} - {stats_response.text}")
            
            # Test transcripts endpoint
            print(f"\n📄 Testing transcripts endpoint...")
            transcripts_response = await client.get(
                f"http://localhost:8000/transcripts/{TEST_USER_ID}?source=limitless&limit=3"
            )
            
            if transcripts_response.status_code == 200:
                transcripts_data = transcripts_response.json()
                print(f"✅ Transcripts endpoint successful: {len(transcripts_data['transcripts'])} transcripts")
            else:
                print(f"❌ Transcripts endpoint failed: {transcripts_response.status_code} - {transcripts_response.text}")
            
        except Exception as e:
            print(f"❌ API test failed: {e}")

if __name__ == "__main__":
    async def run_all_tests():
        await test_database_integration()
        await test_api_endpoints()
    
    asyncio.run(run_all_tests())