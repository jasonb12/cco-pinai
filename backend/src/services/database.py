"""
Supabase Database Service for Transcript Management
"""
import os
import logging
from typing import List, Dict, Optional, Any
from datetime import datetime, date
import json
from supabase import create_client, Client
from postgrest.exceptions import APIError

from .limitless import LifelogEntry

logger = logging.getLogger(__name__)

class DatabaseService:
    """Service for interacting with Supabase database"""
    
    def __init__(self):
        self.supabase_url = os.getenv("SUPABASE_URL")
        self.supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
        
        if not self.supabase_url or not self.supabase_key:
            raise ValueError("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required")
        
        self.client: Client = create_client(self.supabase_url, self.supabase_key)
    
    async def save_lifelog_as_transcript(
        self, 
        lifelog: LifelogEntry, 
        user_id: str
    ) -> Dict[str, Any]:
        """
        Save a Limitless lifelog as a transcript record
        
        Args:
            lifelog: The lifelog entry to save
            user_id: The user ID to associate with this transcript
            
        Returns:
            Dict containing the saved transcript data
        """
        try:
            # Check if this lifelog already exists
            existing = self.client.table("transcripts").select("*").eq(
                "limitless_id", lifelog.id
            ).eq("user_id", user_id).execute()
            
            if existing.data:
                # Update existing record
                return await self._update_existing_transcript(
                    existing.data[0], lifelog, user_id
                )
            else:
                # Create new record
                return await self._create_new_transcript(lifelog, user_id)
                
        except Exception as e:
            logger.error(f"Error saving lifelog {lifelog.id}: {e}")
            raise
    
    async def _create_new_transcript(
        self, 
        lifelog: LifelogEntry, 
        user_id: str
    ) -> Dict[str, Any]:
        """Create a new transcript record from lifelog"""
        
        transcript_data = {
            "user_id": user_id,
            "title": lifelog.title or f"Limitless Recording {lifelog.id[:8]}",  # Ensure title is not null
            "limitless_id": lifelog.id,
            "source": "limitless",
            "audio_url": lifelog.audio_url,
            "transcript_text": lifelog.transcript_text,
            "status": "completed",  # Limitless data is already transcribed
            "raw_content": {
                "title": lifelog.title,
                "content": lifelog.content,
                "markdown": lifelog.markdown,
                "created_at": lifelog.created_at.isoformat(),
                "updated_at": lifelog.updated_at.isoformat()
            },
            "processed_at": datetime.utcnow().isoformat(),
            "created_at": lifelog.created_at.isoformat(),
            "updated_at": lifelog.updated_at.isoformat()
        }
        
        result = self.client.table("transcripts").insert(transcript_data).execute()
        
        if result.data:
            logger.info(f"Created new transcript for lifelog {lifelog.id}")
            return result.data[0]
        else:
            raise Exception(f"Failed to create transcript: {result}")
    
    async def _update_existing_transcript(
        self, 
        existing_transcript: Dict, 
        lifelog: LifelogEntry, 
        user_id: str
    ) -> Dict[str, Any]:
        """Update an existing transcript with new lifelog data"""
        
        update_data = {
            "transcript_text": lifelog.transcript_text,
            "raw_content": {
                "title": lifelog.title,
                "content": lifelog.content,
                "markdown": lifelog.markdown,
                "created_at": lifelog.created_at.isoformat(),
                "updated_at": lifelog.updated_at.isoformat()
            },
            "processed_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }
        
        # Only update audio_url if it's provided
        if lifelog.audio_url:
            update_data["audio_url"] = lifelog.audio_url
        
        result = self.client.table("transcripts").update(update_data).eq(
            "id", existing_transcript["id"]
        ).execute()
        
        if result.data:
            logger.info(f"Updated existing transcript for lifelog {lifelog.id}")
            return result.data[0]
        else:
            raise Exception(f"Failed to update transcript: {result}")
    
    async def save_sync_state(
        self, 
        user_id: str,
        service_name: str,
        last_sync_date: date,
        last_cursor: Optional[str] = None,
        total_synced: int = 0
    ) -> Dict[str, Any]:
        """
        Save or update sync state for a user and service
        """
        try:
            sync_data = {
                "user_id": user_id,
                "service_name": service_name,
                "last_sync_date": last_sync_date.isoformat(),
                "last_cursor": last_cursor,
                "total_synced": total_synced,
                "last_sync_at": datetime.utcnow().isoformat(),
                "updated_at": datetime.utcnow().isoformat()
            }
            
            # Use upsert to handle insert or update
            result = self.client.table("sync_state").upsert(
                sync_data,
                on_conflict="user_id,service_name"
            ).execute()
            
            if result.data:
                logger.info(f"Saved sync state for {service_name}: {last_sync_date}")
                return result.data[0]
            else:
                raise Exception(f"Failed to save sync state: {result}")
                
        except Exception as e:
            logger.error(f"Error saving sync state: {e}")
            raise
    
    async def get_sync_state(
        self, 
        user_id: str, 
        service_name: str
    ) -> Optional[Dict[str, Any]]:
        """
        Get the last sync state for a user and service
        """
        try:
            result = self.client.table("sync_state").select("*").eq(
                "user_id", user_id
            ).eq("service_name", service_name).execute()
            
            if result.data:
                return result.data[0]
            return None
            
        except Exception as e:
            logger.error(f"Error getting sync state: {e}")
            return None
    
    async def log_sync_error(
        self,
        user_id: str,
        service_name: str,
        error_message: str,
        error_details: Optional[Dict] = None
    ):
        """
        Log a sync error to the database
        """
        try:
            error_data = {
                "user_id": user_id,
                "service_name": service_name,
                "error_message": error_message,
                "error_details": error_details or {},
                "occurred_at": datetime.utcnow().isoformat()
            }
            
            self.client.table("sync_errors").insert(error_data).execute()
            logger.info(f"Logged sync error for {service_name}: {error_message}")
            
        except Exception as e:
            logger.error(f"Error logging sync error: {e}")
    
    async def get_transcripts_for_user(
        self, 
        user_id: str,
        source: Optional[str] = None,
        limit: int = 50,
        offset: int = 0
    ) -> List[Dict[str, Any]]:
        """
        Get transcripts for a user, optionally filtered by source
        """
        try:
            query = self.client.table("transcripts").select("*").eq(
                "user_id", user_id
            ).order("created_at", desc=True)
            
            if source:
                query = query.eq("source", source)
            
            query = query.range(offset, offset + limit - 1)
            
            result = query.execute()
            return result.data or []
            
        except Exception as e:
            logger.error(f"Error getting transcripts: {e}")
            return []
    
    async def get_transcript_stats(self, user_id: str) -> Dict[str, Any]:
        """
        Get transcript statistics for a user
        """
        try:
            # Get total counts by source
            upload_count = self.client.table("transcripts").select(
                "id", count="exact"
            ).eq("user_id", user_id).eq("source", "upload").execute()
            
            limitless_count = self.client.table("transcripts").select(
                "id", count="exact"
            ).eq("user_id", user_id).eq("source", "limitless").execute()
            
            # Get recent sync info
            sync_state = await self.get_sync_state(user_id, "limitless")
            
            return {
                "total_transcripts": (upload_count.count or 0) + (limitless_count.count or 0),
                "upload_transcripts": upload_count.count or 0,
                "limitless_transcripts": limitless_count.count or 0,
                "last_sync": sync_state.get("last_sync_at") if sync_state else None,
                "last_sync_date": sync_state.get("last_sync_date") if sync_state else None,
                "total_synced": sync_state.get("total_synced", 0) if sync_state else 0
            }
            
        except Exception as e:
            logger.error(f"Error getting transcript stats: {e}")
            return {
                "total_transcripts": 0,
                "upload_transcripts": 0,
                "limitless_transcripts": 0,
                "last_sync": None,
                "last_sync_date": None,
                "total_synced": 0
            }

# Singleton instance
_database_service: Optional[DatabaseService] = None

def get_database_service() -> DatabaseService:
    """Get or create the database service singleton"""
    global _database_service
    if _database_service is None:
        _database_service = DatabaseService()
    return _database_service