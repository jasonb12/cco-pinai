"""
Limitless to Supabase Sync Service with Cursor Pagination
"""
import os
import logging
from typing import List, Dict, Optional, AsyncIterator
from datetime import datetime, date, timedelta
import asyncio
from dataclasses import dataclass
import json

from .limitless import get_limitless_service, LifelogEntry, LimitlessAPIError
from .database import get_database_service

logger = logging.getLogger(__name__)

@dataclass
class SyncState:
    """Represents the current sync state"""
    last_sync_date: date
    last_cursor: Optional[str] = None
    total_synced: int = 0
    errors: List[str] = None
    
    def __post_init__(self):
        if self.errors is None:
            self.errors = []

class LimitlessSyncService:
    """Service for synchronizing Limitless data with cursor pagination"""
    
    def __init__(self, user_id: str):
        self.user_id = user_id
        self.limitless_service = get_limitless_service()
        self.database_service = get_database_service()
        self.batch_size = 50  # Number of records to fetch per API call
        
    async def sync_from_date(
        self, 
        start_date: date, 
        end_date: Optional[date] = None,
        timezone: str = "UTC",
        progress_callback: Optional[callable] = None
    ) -> SyncState:
        """
        Sync lifelogs from a specific date using cursor pagination
        
        Args:
            start_date: Date to start syncing from
            end_date: Date to stop syncing at (defaults to today)
            timezone: Timezone for date queries
            progress_callback: Optional callback function for progress updates
        """
        if end_date is None:
            end_date = date.today()
            
        if start_date > end_date:
            raise ValueError("start_date cannot be after end_date")
        
        sync_state = SyncState(
            last_sync_date=start_date,
            total_synced=0
        )
        
        logger.info(f"Starting sync from {start_date} to {end_date}")
        
        # Iterate through each date
        current_date = start_date
        while current_date <= end_date:
            try:
                # Sync all lifelogs for this date using cursor pagination
                date_synced = await self._sync_date_with_cursor(
                    current_date, 
                    timezone, 
                    progress_callback
                )
                
                sync_state.total_synced += date_synced
                sync_state.last_sync_date = current_date
                
                # Save sync state to database after each day
                await self.database_service.save_sync_state(
                    user_id=self.user_id,
                    service_name="limitless",
                    last_sync_date=current_date,
                    last_cursor=sync_state.last_cursor,
                    total_synced=sync_state.total_synced
                )
                
                if progress_callback:
                    await progress_callback({
                        "type": "date_completed",
                        "date": current_date.isoformat(),
                        "synced_count": date_synced,
                        "total_synced": sync_state.total_synced
                    })
                
                logger.info(f"Synced {date_synced} lifelogs for {current_date}")
                
            except Exception as e:
                error_msg = f"Error syncing {current_date}: {str(e)}"
                logger.error(error_msg)
                sync_state.errors.append(error_msg)
                
                # Log error to database
                await self.database_service.log_sync_error(
                    user_id=self.user_id,
                    service_name="limitless",
                    error_message=error_msg,
                    error_details={"date": current_date.isoformat()}
                )
                
                if progress_callback:
                    await progress_callback({
                        "type": "error",
                        "date": current_date.isoformat(),
                        "error": error_msg
                    })
            
            # Move to next date
            current_date += timedelta(days=1)
            
            # Add small delay to avoid rate limiting
            await asyncio.sleep(0.1)
        
        logger.info(f"Sync completed. Total synced: {sync_state.total_synced}")
        return sync_state
    
    async def _sync_date_with_cursor(
        self, 
        target_date: date, 
        timezone: str,
        progress_callback: Optional[callable] = None
    ) -> int:
        """Sync all lifelogs for a specific date using cursor pagination"""
        total_synced = 0
        cursor = None
        has_more = True
        
        while has_more:
            try:
                # Fetch batch of lifelogs with cursor
                result = await self.limitless_service.list_lifelogs_by_date(
                    target_date=target_date,
                    timezone=timezone,
                    cursor=cursor,
                    limit=self.batch_size
                )
                
                lifelogs = result["lifelogs"]
                cursor = result["next_cursor"]
                has_more = result["has_more"]
                
                if lifelogs:
                    # Process this batch of lifelogs
                    batch_synced = await self._process_lifelog_batch(lifelogs)
                    total_synced += batch_synced
                    
                    if progress_callback:
                        await progress_callback({
                            "type": "batch_processed",
                            "date": target_date.isoformat(),
                            "batch_size": len(lifelogs),
                            "batch_synced": batch_synced,
                            "cursor": cursor,
                            "has_more": has_more
                        })
                
                logger.debug(f"Processed batch for {target_date}: {len(lifelogs)} items, cursor: {cursor}")
                
            except LimitlessAPIError as e:
                logger.error(f"API error during cursor sync for {target_date}: {e}")
                raise
            except Exception as e:
                logger.error(f"Unexpected error during cursor sync for {target_date}: {e}")
                raise
        
        return total_synced
    
    async def _process_lifelog_batch(self, lifelogs: List[LifelogEntry]) -> int:
        """
        Process a batch of lifelogs and save them to Supabase
        
        Returns the number of successfully processed lifelogs
        """
        processed_count = 0
        
        for lifelog in lifelogs:
            try:
                # Here you would save to Supabase database
                # For now, we'll simulate the processing
                await self._save_lifelog_to_database(lifelog)
                processed_count += 1
                
            except Exception as e:
                logger.error(f"Error processing lifelog {lifelog.id}: {e}")
        
        return processed_count
    
    async def _save_lifelog_to_database(self, lifelog: LifelogEntry):
        """
        Save a lifelog entry to the Supabase database as a transcript
        """
        try:
            result = await self.database_service.save_lifelog_as_transcript(
                lifelog=lifelog,
                user_id=self.user_id
            )
            logger.debug(f"Saved lifelog {lifelog.id} to database as transcript {result.get('id')}")
            return result
        except Exception as e:
            logger.error(f"Failed to save lifelog {lifelog.id}: {e}")
            raise
    
    async def incremental_sync(
        self, 
        last_sync_state: Optional[SyncState] = None,
        timezone: str = "UTC",
        progress_callback: Optional[callable] = None
    ) -> SyncState:
        """
        Perform incremental sync from the last sync point
        
        Args:
            last_sync_state: Previous sync state (if any)
            timezone: Timezone for queries
            progress_callback: Optional callback for progress updates
        """
        if last_sync_state is None:
            # Try to get sync state from database
            db_sync_state = await self.database_service.get_sync_state(
                self.user_id, "limitless"
            )
            if db_sync_state:
                start_date = date.fromisoformat(db_sync_state["last_sync_date"])
            else:
                # Default to syncing from yesterday if no previous state
                start_date = date.today() - timedelta(days=1)
        else:
            # Resume from the last synced date
            start_date = last_sync_state.last_sync_date
        
        return await self.sync_from_date(
            start_date=start_date,
            timezone=timezone,
            progress_callback=progress_callback
        )
    
    async def get_sync_stats(self, target_date: date, timezone: str = "UTC") -> Dict:
        """Get statistics about available data for a specific date"""
        try:
            result = await self.limitless_service.list_lifelogs_by_date(
                target_date=target_date,
                timezone=timezone,
                limit=1  # Just get the first item to check if data exists
            )
            
            return {
                "date": target_date.isoformat(),
                "has_data": len(result["lifelogs"]) > 0,
                "estimated_count": result["count"],
                "has_more_pages": result["has_more"]
            }
            
        except Exception as e:
            logger.error(f"Error getting sync stats for {target_date}: {e}")
            return {
                "date": target_date.isoformat(),
                "has_data": False,
                "error": str(e)
            }
    
    async def close(self):
        """Close the service and cleanup resources"""
        await self.limitless_service.close()

# Singleton instance
_sync_service: Optional[LimitlessSyncService] = None

def get_sync_service(user_id: str) -> LimitlessSyncService:
    """Get or create the sync service for a specific user"""
    # Note: In a real application, you might want to cache these per user
    # For now, we'll create a new instance each time
    return LimitlessSyncService(user_id)