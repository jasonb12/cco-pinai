"""
Limitless.ai API Integration Service
"""
import os
import logging
from typing import List, Dict, Optional
from datetime import datetime, date
import httpx
from pydantic import BaseModel

logger = logging.getLogger(__name__)

class LifelogEntry(BaseModel):
    """Represents a single lifelog entry from Limitless"""
    id: str
    title: str
    content: str
    markdown: str
    created_at: datetime
    updated_at: datetime
    audio_url: Optional[str] = None
    transcript_text: Optional[str] = None

class LimitlessAPIError(Exception):
    """Custom exception for Limitless API errors"""
    pass

class LimitlessService:
    """Service for interacting with Limitless.ai API"""
    
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.getenv("LIMITLESS_API_KEY")
        if not self.api_key:
            raise ValueError("LIMITLESS_API_KEY is required")
        
        self.base_url = "https://api.limitless.ai/v1"
        self.headers = {
            "X-API-Key": self.api_key,
            "Content-Type": "application/json"
        }
        self.client = httpx.AsyncClient(timeout=120.0)  # 120 second timeout
    
    async def get_lifelog_by_id(self, lifelog_id: str) -> LifelogEntry:
        """Get a specific lifelog entry by ID"""
        try:
            response = await self.client.get(
                f"{self.base_url}/lifelogs/{lifelog_id}",
                headers=self.headers
            )
            response.raise_for_status()
            
            data = response.json()
            return self._parse_lifelog(data.get("data", {}))
            
        except httpx.HTTPStatusError as e:
            logger.error(f"HTTP error getting lifelog {lifelog_id}: {e}")
            raise LimitlessAPIError(f"Failed to get lifelog: {e.response.status_code}")
        except Exception as e:
            logger.error(f"Error getting lifelog {lifelog_id}: {e}")
            raise LimitlessAPIError(f"Failed to get lifelog: {str(e)}")
    
    async def list_lifelogs_by_date(
        self, 
        target_date: date, 
        timezone: str = "UTC",
        cursor: Optional[str] = None,
        limit: Optional[int] = None
    ) -> Dict:
        """List all lifelogs for a specific date with cursor support"""
        try:
            params = {
                "date": target_date.isoformat(),
                "timezone": timezone
            }
            
            if cursor:
                params["cursor"] = cursor
            if limit:
                params["limit"] = limit
            
            response = await self.client.get(
                f"{self.base_url}/lifelogs",
                headers=self.headers,
                params=params
            )
            response.raise_for_status()
            
            data = response.json()
            lifelogs = data.get("data", {}).get("lifelogs", [])
            meta = data.get("meta", {}).get("lifelogs", {})
            
            return {
                "lifelogs": [self._parse_lifelog(log) for log in lifelogs],
                "next_cursor": meta.get("nextCursor"),
                "count": meta.get("count", len(lifelogs)),
                "has_more": bool(meta.get("nextCursor"))
            }
            
        except httpx.HTTPStatusError as e:
            logger.error(f"HTTP error listing lifelogs: {e}")
            raise LimitlessAPIError(f"Failed to list lifelogs: {e.response.status_code}")
        except Exception as e:
            logger.error(f"Error listing lifelogs: {e}")
            raise LimitlessAPIError(f"Failed to list lifelogs: {str(e)}")
    
    async def list_lifelogs_by_range(
        self,
        start_time: datetime,
        end_time: datetime,
        timezone: str = "UTC"
    ) -> List[LifelogEntry]:
        """List lifelogs within a time range"""
        try:
            params = {
                "start_time": start_time.isoformat(),
                "end_time": end_time.isoformat(),
                "timezone": timezone
            }
            
            response = await self.client.get(
                f"{self.base_url}/lifelogs",
                headers=self.headers,
                params=params
            )
            response.raise_for_status()
            
            data = response.json()
            lifelogs = data.get("data", {}).get("lifelogs", [])
            
            return [self._parse_lifelog(log) for log in lifelogs]
            
        except httpx.HTTPStatusError as e:
            logger.error(f"HTTP error listing lifelogs by range: {e}")
            raise LimitlessAPIError(f"Failed to list lifelogs: {e.response.status_code}")
        except Exception as e:
            logger.error(f"Error listing lifelogs by range: {e}")
            raise LimitlessAPIError(f"Failed to list lifelogs: {str(e)}")
    
    async def list_recent_lifelogs(self, limit: int = 10) -> List[LifelogEntry]:
        """List the most recent lifelogs"""
        try:
            # For recent logs, we'll use a time range from now back
            end_time = datetime.utcnow()
            start_time = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
            
            logs = await self.list_lifelogs_by_range(start_time, end_time)
            return logs[:limit]
            
        except Exception as e:
            logger.error(f"Error listing recent lifelogs: {e}")
            raise LimitlessAPIError(f"Failed to list recent lifelogs: {str(e)}")
    
    def _parse_lifelog(self, data: Dict) -> LifelogEntry:
        """Parse raw lifelog data into LifelogEntry model"""
        # Extract transcript text from markdown or content
        transcript_text = data.get("markdown", "") or data.get("content", "")
        
        # Look for audio URL in the data structure
        audio_url = None
        if "audio_url" in data:
            audio_url = data["audio_url"]
        elif "media" in data and isinstance(data["media"], dict):
            audio_url = data["media"].get("audio_url")
        
        return LifelogEntry(
            id=data.get("id", ""),
            title=data.get("title", "Untitled"),
            content=data.get("content", ""),
            markdown=data.get("markdown", ""),
            created_at=datetime.fromisoformat(
                data.get("created_at", datetime.utcnow().isoformat())
            ),
            updated_at=datetime.fromisoformat(
                data.get("updated_at", datetime.utcnow().isoformat())
            ),
            audio_url=audio_url,
            transcript_text=transcript_text
        )
    
    async def close(self):
        """Close the HTTP client"""
        await self.client.aclose()

# Singleton instance
_limitless_service: Optional[LimitlessService] = None

def get_limitless_service() -> LimitlessService:
    """Get or create the Limitless service singleton"""
    global _limitless_service
    if _limitless_service is None:
        _limitless_service = LimitlessService()
    return _limitless_service