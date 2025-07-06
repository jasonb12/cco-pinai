#!/usr/bin/env python3
"""
Test script for the Limitless sync functionality
"""
import asyncio
import json
from datetime import date, timedelta
from dotenv import load_dotenv
import logging

# Load environment variables
load_dotenv()

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

from src.services.sync import get_sync_service

async def test_sync_service():
    """Test the sync service functionality"""
    print("🧪 Testing Limitless Sync Service")
    print("=" * 50)
    
    sync_service = get_sync_service()
    
    try:
        # Test 1: Get sync stats for today
        today = date.today()
        print(f"\n📊 Testing sync stats for {today}...")
        
        stats = await sync_service.get_sync_stats(today)
        print(f"✅ Stats: {json.dumps(stats, indent=2)}")
        
        # Test 2: Sync today's data with progress tracking
        print(f"\n🔄 Testing sync for {today} with cursor pagination...")
        
        progress_updates = []
        
        async def progress_callback(update):
            progress_updates.append(update)
            print(f"   Progress: {update}")
        
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
        
        # Test 3: Test incremental sync
        print(f"\n🔄 Testing incremental sync...")
        
        incremental_result = await sync_service.incremental_sync()
        print(f"✅ Incremental sync completed!")
        print(f"   - Total synced: {incremental_result.total_synced}")
        print(f"   - Synced from: {incremental_result.last_sync_date}")
        
        # Test 4: Test date range (last 3 days)
        start_date = today - timedelta(days=2)
        print(f"\n🔄 Testing date range sync from {start_date} to {today}...")
        
        range_result = await sync_service.sync_from_date(
            start_date=start_date,
            end_date=today
        )
        
        print(f"✅ Date range sync completed!")
        print(f"   - Total synced: {range_result.total_synced}")
        print(f"   - Errors: {len(range_result.errors)}")
        
        # Test 5: Test error handling (invalid date)
        print(f"\n❌ Testing error handling...")
        try:
            invalid_result = await sync_service.sync_from_date(
                start_date=today + timedelta(days=1),  # Future date
                end_date=today
            )
            print("⚠️  Expected error didn't occur")
        except ValueError as e:
            print(f"✅ Correctly caught error: {e}")
        
    except Exception as e:
        print(f"❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
    
    finally:
        await sync_service.close()
    
    print("\n🎉 Sync service tests completed!")

if __name__ == "__main__":
    asyncio.run(test_sync_service())