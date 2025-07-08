"""
Google Calendar API Integration Service
Handles OAuth authentication, API communication, and bidirectional synchronization
"""
import os
import json
import logging
from typing import List, Dict, Optional, Any, Tuple
from datetime import datetime, timedelta
from urllib.parse import urlencode, quote_plus
import asyncio
import aiohttp
from cryptography.fernet import Fernet
import base64

logger = logging.getLogger(__name__)

class GoogleCalendarError(Exception):
    """Custom exception for Google Calendar API errors"""
    pass

class CalendarEvent:
    """Represents a calendar event"""
    def __init__(self, data: Dict[str, Any]):
        self.id = data.get('id')
        self.google_event_id = data.get('google_event_id')
        self.title = data.get('summary', data.get('title', ''))
        self.description = data.get('description', '')
        self.start_time = self._parse_datetime(data.get('start'))
        self.end_time = self._parse_datetime(data.get('end'))
        self.all_day = self._is_all_day(data.get('start'))
        self.location = data.get('location', '')
        self.attendees = self._parse_attendees(data.get('attendees', []))
        self.status = data.get('status', 'confirmed')
        self.etag = data.get('etag', '')
        self.sequence = data.get('sequence', 0)
        self.color_id = data.get('colorId')
        self.recurring_event_id = data.get('recurringEventId')
        self.recurrence = data.get('recurrence', [])
        self.visibility = data.get('visibility', 'default')
        self.created = self._parse_datetime_simple(data.get('created'))
        self.updated = self._parse_datetime_simple(data.get('updated'))
        
    def _parse_datetime(self, dt_data: Optional[Dict]) -> Optional[datetime]:
        """Parse Google Calendar datetime format"""
        if not dt_data:
            return None
        
        if 'dateTime' in dt_data:
            # Full datetime with timezone
            dt_str = dt_data['dateTime']
            # Remove timezone suffix for parsing (Google uses RFC3339)
            if dt_str.endswith('Z'):
                dt_str = dt_str[:-1] + '+00:00'
            return datetime.fromisoformat(dt_str.replace('Z', '+00:00'))
        elif 'date' in dt_data:
            # All-day event (date only)
            return datetime.fromisoformat(dt_data['date'] + 'T00:00:00')
        
        return None
    
    def _parse_datetime_simple(self, dt_str: Optional[str]) -> Optional[datetime]:
        """Parse simple datetime string"""
        if not dt_str:
            return None
        try:
            return datetime.fromisoformat(dt_str.replace('Z', '+00:00'))
        except:
            return None
    
    def _is_all_day(self, start_data: Optional[Dict]) -> bool:
        """Check if event is all-day"""
        if not start_data:
            return False
        return 'date' in start_data and 'dateTime' not in start_data
    
    def _parse_attendees(self, attendees_data: List[Dict]) -> List[str]:
        """Parse attendees list"""
        return [attendee.get('email', '') for attendee in attendees_data if attendee.get('email')]
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for database storage"""
        return {
            'google_event_id': self.id,
            'title': self.title,
            'description': self.description,
            'start_time': self.start_time.isoformat() if self.start_time else None,
            'end_time': self.end_time.isoformat() if self.end_time else None,
            'all_day': self.all_day,
            'location': self.location,
            'attendees': self.attendees,
            'status': self.status,
            'etag': self.etag,
            'sequence': self.sequence,
            'color_id': self.color_id,
            'recurring_event_id': self.recurring_event_id,
            'recurrence': self.recurrence,
            'visibility': self.visibility,
            'source': 'google',
            'sync_status': 'synced'
        }

class GoogleCalendarService:
    """Service for Google Calendar API integration"""
    
    def __init__(self):
        self.client_id = os.getenv('GOOGLE_CLIENT_ID')
        self.client_secret = os.getenv('GOOGLE_CLIENT_SECRET')
        self.redirect_uri = os.getenv('GOOGLE_REDIRECT_URI', 'http://localhost:8000/calendar/auth/callback')
        self.scopes = [
            'https://www.googleapis.com/auth/calendar',
            'https://www.googleapis.com/auth/calendar.events'
        ]
        
        # Initialize encryption for token storage
        encryption_key = os.getenv('CALENDAR_ENCRYPTION_KEY')
        if not encryption_key:
            # Generate a key for development (use proper key management in production)
            encryption_key = Fernet.generate_key().decode()
            logger.warning("No encryption key found, using generated key for development")
        
        self.cipher = Fernet(encryption_key.encode() if isinstance(encryption_key, str) else encryption_key)
        
        if not self.client_id or not self.client_secret:
            raise GoogleCalendarError("Google OAuth credentials not configured")
    
    def get_auth_url(self, state: Optional[str] = None) -> str:
        """Generate OAuth authorization URL"""
        params = {
            'client_id': self.client_id,
            'redirect_uri': self.redirect_uri,
            'scope': ' '.join(self.scopes),
            'response_type': 'code',
            'access_type': 'offline',
            'prompt': 'consent',  # Force consent to get refresh token
        }
        
        if state:
            params['state'] = state
        
        return f"https://accounts.google.com/o/oauth2/v2/auth?{urlencode(params)}"
    
    async def exchange_code_for_tokens(self, code: str) -> Dict[str, Any]:
        """Exchange authorization code for access and refresh tokens"""
        data = {
            'client_id': self.client_id,
            'client_secret': self.client_secret,
            'code': code,
            'grant_type': 'authorization_code',
            'redirect_uri': self.redirect_uri,
        }
        
        async with aiohttp.ClientSession() as session:
            async with session.post(
                'https://oauth2.googleapis.com/token',
                data=data
            ) as response:
                if response.status != 200:
                    error_data = await response.json()
                    raise GoogleCalendarError(f"Token exchange failed: {error_data}")
                
                token_data = await response.json()
                
                # Calculate expiration time
                expires_in = token_data.get('expires_in', 3600)
                expires_at = datetime.utcnow() + timedelta(seconds=expires_in)
                
                return {
                    'access_token': token_data['access_token'],
                    'refresh_token': token_data.get('refresh_token'),
                    'token_type': token_data.get('token_type', 'Bearer'),
                    'expires_at': expires_at,
                    'scope': token_data.get('scope', ' '.join(self.scopes))
                }
    
    async def refresh_access_token(self, refresh_token: str) -> Dict[str, Any]:
        """Refresh access token using refresh token"""
        data = {
            'client_id': self.client_id,
            'client_secret': self.client_secret,
            'refresh_token': refresh_token,
            'grant_type': 'refresh_token',
        }
        
        async with aiohttp.ClientSession() as session:
            async with session.post(
                'https://oauth2.googleapis.com/token',
                data=data
            ) as response:
                if response.status != 200:
                    error_data = await response.json()
                    raise GoogleCalendarError(f"Token refresh failed: {error_data}")
                
                token_data = await response.json()
                
                # Calculate expiration time
                expires_in = token_data.get('expires_in', 3600)
                expires_at = datetime.utcnow() + timedelta(seconds=expires_in)
                
                return {
                    'access_token': token_data['access_token'],
                    'token_type': token_data.get('token_type', 'Bearer'),
                    'expires_at': expires_at,
                    'scope': token_data.get('scope')
                }
    
    def encrypt_token(self, token: str) -> str:
        """Encrypt token for secure storage"""
        return self.cipher.encrypt(token.encode()).decode()
    
    def decrypt_token(self, encrypted_token: str) -> str:
        """Decrypt token from storage"""
        return self.cipher.decrypt(encrypted_token.encode()).decode()
    
    async def get_calendar_list(self, access_token: str) -> List[Dict[str, Any]]:
        """Get list of user's calendars"""
        headers = {
            'Authorization': f'Bearer {access_token}',
            'Content-Type': 'application/json',
        }
        
        async with aiohttp.ClientSession() as session:
            async with session.get(
                'https://www.googleapis.com/calendar/v3/users/me/calendarList',
                headers=headers
            ) as response:
                if response.status != 200:
                    error_data = await response.json()
                    raise GoogleCalendarError(f"Failed to get calendar list: {error_data}")
                
                data = await response.json()
                return data.get('items', [])
    
    async def get_events(
        self, 
        access_token: str, 
        calendar_id: str = 'primary',
        time_min: Optional[datetime] = None,
        time_max: Optional[datetime] = None,
        sync_token: Optional[str] = None,
        max_results: int = 250
    ) -> Dict[str, Any]:
        """Get calendar events with optional incremental sync"""
        headers = {
            'Authorization': f'Bearer {access_token}',
            'Content-Type': 'application/json',
        }
        
        params = {
            'maxResults': max_results,
            'singleEvents': 'true',
            'orderBy': 'startTime',
        }
        
        if sync_token:
            # Incremental sync
            params['syncToken'] = sync_token
        else:
            # Full sync with time range
            if time_min:
                params['timeMin'] = time_min.isoformat() + 'Z'
            if time_max:
                params['timeMax'] = time_max.isoformat() + 'Z'
        
        async with aiohttp.ClientSession() as session:
            async with session.get(
                f'https://www.googleapis.com/calendar/v3/calendars/{quote_plus(calendar_id)}/events',
                headers=headers,
                params=params
            ) as response:
                if response.status != 200:
                    error_data = await response.json()
                    raise GoogleCalendarError(f"Failed to get events: {error_data}")
                
                data = await response.json()
                
                # Parse events
                events = []
                for event_data in data.get('items', []):
                    try:
                        event = CalendarEvent(event_data)
                        events.append(event)
                    except Exception as e:
                        logger.warning(f"Failed to parse event {event_data.get('id')}: {e}")
                
                return {
                    'events': events,
                    'next_sync_token': data.get('nextSyncToken'),
                    'next_page_token': data.get('nextPageToken')
                }
    
    async def create_event(
        self, 
        access_token: str, 
        event_data: Dict[str, Any],
        calendar_id: str = 'primary'
    ) -> CalendarEvent:
        """Create a new calendar event"""
        headers = {
            'Authorization': f'Bearer {access_token}',
            'Content-Type': 'application/json',
        }
        
        # Convert our event format to Google Calendar format
        google_event = self._convert_to_google_format(event_data)
        
        async with aiohttp.ClientSession() as session:
            async with session.post(
                f'https://www.googleapis.com/calendar/v3/calendars/{quote_plus(calendar_id)}/events',
                headers=headers,
                json=google_event
            ) as response:
                if response.status not in [200, 201]:
                    error_data = await response.json()
                    raise GoogleCalendarError(f"Failed to create event: {error_data}")
                
                response_data = await response.json()
                return CalendarEvent(response_data)
    
    async def update_event(
        self, 
        access_token: str, 
        event_id: str,
        event_data: Dict[str, Any],
        calendar_id: str = 'primary'
    ) -> CalendarEvent:
        """Update an existing calendar event"""
        headers = {
            'Authorization': f'Bearer {access_token}',
            'Content-Type': 'application/json',
        }
        
        # Convert our event format to Google Calendar format
        google_event = self._convert_to_google_format(event_data)
        
        async with aiohttp.ClientSession() as session:
            async with session.put(
                f'https://www.googleapis.com/calendar/v3/calendars/{quote_plus(calendar_id)}/events/{event_id}',
                headers=headers,
                json=google_event
            ) as response:
                if response.status != 200:
                    error_data = await response.json()
                    raise GoogleCalendarError(f"Failed to update event: {error_data}")
                
                response_data = await response.json()
                return CalendarEvent(response_data)
    
    async def delete_event(
        self, 
        access_token: str, 
        event_id: str,
        calendar_id: str = 'primary'
    ) -> bool:
        """Delete a calendar event"""
        headers = {
            'Authorization': f'Bearer {access_token}',
            'Content-Type': 'application/json',
        }
        
        async with aiohttp.ClientSession() as session:
            async with session.delete(
                f'https://www.googleapis.com/calendar/v3/calendars/{quote_plus(calendar_id)}/events/{event_id}',
                headers=headers
            ) as response:
                if response.status == 204:
                    return True
                elif response.status == 410:
                    # Event already deleted
                    return True
                else:
                    error_data = await response.json()
                    raise GoogleCalendarError(f"Failed to delete event: {error_data}")
    
    def _convert_to_google_format(self, event_data: Dict[str, Any]) -> Dict[str, Any]:
        """Convert our event format to Google Calendar API format"""
        google_event = {
            'summary': event_data.get('title', ''),
            'description': self._add_ccopinai_marker(event_data.get('description', '')),
            'location': event_data.get('location', ''),
            'status': event_data.get('status', 'confirmed'),
            'visibility': event_data.get('visibility', 'default'),
        }
        
        # Handle start and end times
        start_time = event_data.get('start_time')
        end_time = event_data.get('end_time')
        all_day = event_data.get('all_day', False)
        
        if start_time:
            if all_day:
                google_event['start'] = {'date': start_time[:10]}  # YYYY-MM-DD
                google_event['end'] = {'date': end_time[:10] if end_time else start_time[:10]}
            else:
                google_event['start'] = {'dateTime': start_time, 'timeZone': event_data.get('timezone', 'UTC')}
                google_event['end'] = {'dateTime': end_time, 'timeZone': event_data.get('timezone', 'UTC')}
        
        # Handle attendees
        attendees = event_data.get('attendees', [])
        if attendees:
            google_event['attendees'] = [{'email': email} for email in attendees if email]
        
        # Handle recurrence
        recurrence = event_data.get('recurrence', [])
        if recurrence:
            google_event['recurrence'] = recurrence
        
        # Handle color
        color_id = event_data.get('color_id')
        if color_id:
            google_event['colorId'] = color_id
        
        return google_event
    
    def _add_ccopinai_marker(self, description: str) -> str:
        """Add CCOPINAI marker to event description for identification"""
        marker = "\n\n[Created by CCOPINAI]"
        if marker not in description:
            return description + marker
        return description
    
    def is_ccopinai_event(self, event_description: str) -> bool:
        """Check if event was created by CCOPINAI"""
        return "[Created by CCOPINAI]" in (event_description or "")
    
    async def revoke_token(self, access_token: str) -> bool:
        """Revoke access token"""
        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    f'https://oauth2.googleapis.com/revoke?token={access_token}'
                ) as response:
                    return response.status == 200
        except Exception as e:
            logger.error(f"Failed to revoke token: {e}")
            return False

# Singleton instance
_google_calendar_service: Optional[GoogleCalendarService] = None

def get_google_calendar_service() -> GoogleCalendarService:
    """Get or create the Google Calendar service singleton"""
    global _google_calendar_service
    if _google_calendar_service is None:
        _google_calendar_service = GoogleCalendarService()
    return _google_calendar_service 