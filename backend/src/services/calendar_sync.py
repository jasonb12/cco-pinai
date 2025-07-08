"""
Calendar Synchronization Service
Handles bidirectional sync between Google Calendar, Limitless.ai, and local database
"""
import asyncio
import logging
from typing import List, Dict, Optional, Any, Tuple
from datetime import datetime, timedelta
import json

from .google_calendar import get_google_calendar_service, GoogleCalendarError, CalendarEvent
from .database import get_database_manager
from .limitless import get_limitless_service, LimitlessEvent

logger = logging.getLogger(__name__)

class CalendarSyncError(Exception):
    """Custom exception for calendar sync errors"""
    pass

class CalendarSyncService:
    """Service for synchronizing calendar events between multiple providers"""
    
    def __init__(self):
        self.google_service = get_google_calendar_service()
        self.db = get_database_manager()
        self.limitless_service = get_limitless_service()
        
    async def connect_google_calendar(self, user_id: str, auth_code: str) -> Dict[str, Any]:
        """Connect user's Google Calendar using OAuth authorization code"""
        try:
            # Exchange code for tokens
            tokens = await self.google_service.exchange_code_for_tokens(auth_code)
            
            # Encrypt and store tokens
            encrypted_access_token = self.google_service.encrypt_token(tokens['access_token'])
            encrypted_refresh_token = None
            if tokens.get('refresh_token'):
                encrypted_refresh_token = self.google_service.encrypt_token(tokens['refresh_token'])
            
            # Store tokens in database
            await self.db.execute("""
                INSERT INTO user_calendar_tokens 
                (user_id, provider, access_token_encrypted, refresh_token_encrypted, 
                 token_type, expires_at, scope)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                ON CONFLICT (user_id, provider) 
                DO UPDATE SET 
                    access_token_encrypted = EXCLUDED.access_token_encrypted,
                    refresh_token_encrypted = EXCLUDED.refresh_token_encrypted,
                    token_type = EXCLUDED.token_type,
                    expires_at = EXCLUDED.expires_at,
                    scope = EXCLUDED.scope,
                    updated_at = NOW()
            """, user_id, 'google', encrypted_access_token, encrypted_refresh_token,
                tokens['token_type'], tokens['expires_at'], tokens['scope'])
            
            # Get user's calendar list
            calendars = await self.google_service.get_calendar_list(tokens['access_token'])
            primary_calendar = next((cal for cal in calendars if cal.get('primary')), calendars[0] if calendars else None)
            
            if primary_calendar:
                # Initialize sync state for primary calendar
                await self._initialize_sync_state(user_id, primary_calendar['id'])
                
                # Start initial sync
                await self.sync_user_calendar(user_id)
            
            return {
                'success': True,
                'message': 'Google Calendar connected successfully',
                'calendars': calendars
            }
            
        except Exception as e:
            logger.error(f"Failed to connect Google Calendar for user {user_id}: {e}")
            raise CalendarSyncError(f"Failed to connect Google Calendar: {str(e)}")
    
    async def disconnect_google_calendar(self, user_id: str) -> Dict[str, Any]:
        """Disconnect user's Google Calendar"""
        try:
            # Get tokens for revocation
            token_data = await self.db.fetch_one("""
                SELECT access_token_encrypted FROM user_calendar_tokens 
                WHERE user_id = $1 AND provider = 'google'
            """, user_id)
            
            if token_data:
                # Decrypt and revoke access token
                access_token = self.google_service.decrypt_token(token_data['access_token_encrypted'])
                await self.google_service.revoke_token(access_token)
            
            # Remove tokens and sync state
            await self.db.execute("""
                DELETE FROM user_calendar_tokens WHERE user_id = $1 AND provider = 'google'
            """, user_id)
            
            await self.db.execute("""
                DELETE FROM calendar_sync_state WHERE user_id = $1 AND provider = 'google'
            """, user_id)
            
            # Mark Google events as deleted (don't actually delete to preserve history)
            await self.db.execute("""
                UPDATE calendar_events 
                SET sync_status = 'deleted', updated_at = NOW()
                WHERE user_id = $1 AND source = 'google'
            """, user_id)
            
            return {
                'success': True,
                'message': 'Google Calendar disconnected successfully'
            }
            
        except Exception as e:
            logger.error(f"Failed to disconnect Google Calendar for user {user_id}: {e}")
            raise CalendarSyncError(f"Failed to disconnect Google Calendar: {str(e)}")
    
    async def sync_user_calendar(self, user_id: str, force_full_sync: bool = False) -> Dict[str, Any]:
        """Synchronize user's calendar events from all connected providers"""
        try:
            sync_results = {
                'google': {'imported': 0, 'exported': 0, 'errors': []},
                'limitless': {'imported': 0, 'exported': 0, 'errors': []},
                'conflicts': []
            }
            
            # Sync Google Calendar
            google_result = await self._sync_google_calendar(user_id, force_full_sync)
            sync_results['google'] = google_result
            
            # Sync Limitless.ai events
            limitless_result = await self._sync_limitless_events(user_id)
            sync_results['limitless'] = limitless_result
            
            # Detect and resolve conflicts
            conflicts = await self._detect_conflicts(user_id)
            sync_results['conflicts'] = conflicts
            
            # Update sync statistics
            await self._update_sync_statistics(user_id, sync_results)
            
            return {
                'success': True,
                'message': 'Calendar sync completed',
                'results': sync_results
            }
            
        except Exception as e:
            logger.error(f"Failed to sync calendar for user {user_id}: {e}")
            raise CalendarSyncError(f"Calendar sync failed: {str(e)}")
    
    async def create_event(self, user_id: str, event_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new calendar event and sync to connected providers"""
        try:
            # Create event in local database
            event_id = await self.db.fetch_val("""
                INSERT INTO calendar_events 
                (user_id, title, description, start_time, end_time, all_day, 
                 location, attendees, source, sync_status, timezone, metadata)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
                RETURNING id
            """, user_id, event_data['title'], event_data.get('description', ''),
                event_data['start_time'], event_data['end_time'], 
                event_data.get('all_day', False), event_data.get('location', ''),
                json.dumps(event_data.get('attendees', [])), 'ccopinai', 'pending',
                event_data.get('timezone', 'UTC'), json.dumps(event_data.get('metadata', {})))
            
            # Sync to Google Calendar
            google_sync_result = await self._export_to_google_calendar(user_id, event_id, event_data)
            
            # Update event with sync results
            update_data = {
                'sync_status': 'synced' if google_sync_result['success'] else 'error',
                'google_event_id': google_sync_result.get('google_event_id'),
                'sync_error': google_sync_result.get('error')
            }
            
            await self.db.execute("""
                UPDATE calendar_events 
                SET sync_status = $2, google_event_id = $3, sync_error = $4, updated_at = NOW()
                WHERE id = $1
            """, event_id, update_data['sync_status'], 
                update_data['google_event_id'], update_data['sync_error'])
            
            return {
                'success': True,
                'event_id': event_id,
                'google_sync': google_sync_result
            }
            
        except Exception as e:
            logger.error(f"Failed to create event for user {user_id}: {e}")
            raise CalendarSyncError(f"Failed to create event: {str(e)}")
    
    async def update_event(self, user_id: str, event_id: str, event_data: Dict[str, Any]) -> Dict[str, Any]:
        """Update an existing calendar event and sync changes"""
        try:
            # Get current event data
            current_event = await self.db.fetch_one("""
                SELECT * FROM calendar_events WHERE id = $1 AND user_id = $2
            """, event_id, user_id)
            
            if not current_event:
                raise CalendarSyncError("Event not found")
            
            # Update event in database
            await self.db.execute("""
                UPDATE calendar_events 
                SET title = $3, description = $4, start_time = $5, end_time = $6,
                    all_day = $7, location = $8, attendees = $9, sync_status = $10,
                    timezone = $11, metadata = $12, updated_at = NOW()
                WHERE id = $1 AND user_id = $2
            """, event_id, user_id, event_data['title'], event_data.get('description', ''),
                event_data['start_time'], event_data['end_time'], 
                event_data.get('all_day', False), event_data.get('location', ''),
                json.dumps(event_data.get('attendees', [])), 'pending',
                event_data.get('timezone', 'UTC'), json.dumps(event_data.get('metadata', {})))
            
            # Sync updates to Google Calendar if it's a synced event
            google_sync_result = {'success': True}
            if current_event['google_event_id']:
                google_sync_result = await self._update_google_calendar_event(
                    user_id, current_event['google_event_id'], event_data)
            
            # Update sync status
            sync_status = 'synced' if google_sync_result['success'] else 'error'
            await self.db.execute("""
                UPDATE calendar_events 
                SET sync_status = $3, sync_error = $4, updated_at = NOW()
                WHERE id = $1 AND user_id = $2
            """, event_id, user_id, sync_status, google_sync_result.get('error'))
            
            return {
                'success': True,
                'event_id': event_id,
                'google_sync': google_sync_result
            }
            
        except Exception as e:
            logger.error(f"Failed to update event {event_id} for user {user_id}: {e}")
            raise CalendarSyncError(f"Failed to update event: {str(e)}")
    
    async def delete_event(self, user_id: str, event_id: str) -> Dict[str, Any]:
        """Delete a calendar event and remove from connected providers"""
        try:
            # Get event data
            event = await self.db.fetch_one("""
                SELECT * FROM calendar_events WHERE id = $1 AND user_id = $2
            """, event_id, user_id)
            
            if not event:
                raise CalendarSyncError("Event not found")
            
            # Delete from Google Calendar if it's a synced CCOPINAI event
            google_sync_result = {'success': True}
            if event['google_event_id'] and event['source'] == 'ccopinai':
                google_sync_result = await self._delete_google_calendar_event(
                    user_id, event['google_event_id'])
            
            # Mark event as deleted (soft delete to preserve history)
            await self.db.execute("""
                UPDATE calendar_events 
                SET sync_status = 'deleted', updated_at = NOW()
                WHERE id = $1 AND user_id = $2
            """, event_id, user_id)
            
            return {
                'success': True,
                'event_id': event_id,
                'google_sync': google_sync_result
            }
            
        except Exception as e:
            logger.error(f"Failed to delete event {event_id} for user {user_id}: {e}")
            raise CalendarSyncError(f"Failed to delete event: {str(e)}")
    
    async def get_user_events(
        self, 
        user_id: str, 
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        sources: Optional[List[str]] = None
    ) -> List[Dict[str, Any]]:
        """Get user's calendar events with optional filtering"""
        try:
            query = """
                SELECT * FROM calendar_events 
                WHERE user_id = $1 AND sync_status != 'deleted'
            """
            params = [user_id]
            param_idx = 2
            
            if start_date:
                query += f" AND start_time >= ${param_idx}"
                params.append(start_date)
                param_idx += 1
            
            if end_date:
                query += f" AND end_time <= ${param_idx}"
                params.append(end_date)
                param_idx += 1
            
            if sources:
                query += f" AND source = ANY(${param_idx})"
                params.append(sources)
                param_idx += 1
            
            query += " ORDER BY start_time ASC"
            
            events = await self.db.fetch_all(query, *params)
            
            # Convert to dictionaries and parse JSON fields
            result = []
            for event in events:
                event_dict = dict(event)
                event_dict['attendees'] = json.loads(event_dict.get('attendees', '[]'))
                event_dict['metadata'] = json.loads(event_dict.get('metadata', '{}'))
                result.append(event_dict)
            
            return result
            
        except Exception as e:
            logger.error(f"Failed to get events for user {user_id}: {e}")
            raise CalendarSyncError(f"Failed to get events: {str(e)}")
    
    # Private helper methods
    
    async def _initialize_sync_state(self, user_id: str, calendar_id: str) -> None:
        """Initialize sync state for a calendar"""
        await self.db.execute("""
            INSERT INTO calendar_sync_state 
            (user_id, provider, calendar_id, full_sync_completed, incremental_sync_enabled)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (user_id, provider, calendar_id) 
            DO UPDATE SET updated_at = NOW()
        """, user_id, 'google', calendar_id, False, True)
    
    async def _sync_google_calendar(self, user_id: str, force_full_sync: bool = False) -> Dict[str, Any]:
        """Sync Google Calendar events for a user"""
        result = {'imported': 0, 'exported': 0, 'errors': []}
        
        try:
            # Get access token
            access_token = await self._get_valid_access_token(user_id)
            if not access_token:
                result['errors'].append("No valid Google Calendar token")
                return result
            
            # Get sync state
            sync_state = await self.db.fetch_one("""
                SELECT * FROM calendar_sync_state 
                WHERE user_id = $1 AND provider = 'google'
                ORDER BY created_at DESC LIMIT 1
            """, user_id)
            
            if not sync_state:
                result['errors'].append("No sync state found")
                return result
            
            # Determine sync parameters
            sync_token = None if force_full_sync else sync_state.get('next_sync_token')
            time_min = datetime.utcnow() - timedelta(days=30) if not sync_token else None
            time_max = datetime.utcnow() + timedelta(days=90) if not sync_token else None
            
            # Get events from Google Calendar
            events_data = await self.google_service.get_events(
                access_token, sync_state['calendar_id'], time_min, time_max, sync_token)
            
            # Import events to local database
            for event in events_data['events']:
                await self._import_google_event(user_id, event)
                result['imported'] += 1
            
            # Update sync state
            await self.db.execute("""
                UPDATE calendar_sync_state 
                SET last_sync_at = NOW(), next_sync_token = $3, 
                    full_sync_completed = TRUE, last_successful_sync_at = NOW(),
                    events_imported = events_imported + $4
                WHERE user_id = $1 AND provider = $2
            """, user_id, 'google', events_data.get('next_sync_token'), result['imported'])
            
        except Exception as e:
            logger.error(f"Google Calendar sync failed for user {user_id}: {e}")
            result['errors'].append(str(e))
        
        return result
    
    async def _sync_limitless_events(self, user_id: str) -> Dict[str, Any]:
        """Sync Limitless.ai events for a user"""
        result = {'imported': 0, 'exported': 0, 'errors': []}
        
        try:
            # Get Limitless.ai data
            limitless_data = await self.limitless_service.get_recent_logs(user_id)
            
            if not limitless_data.get('success'):
                result['errors'].append("Failed to get Limitless.ai data")
                return result
            
            # Process meetings/calls from Limitless data
            for item in limitless_data.get('data', []):
                if item.get('type') in ['meeting', 'call', 'video_call']:
                    await self._import_limitless_event(user_id, item)
                    result['imported'] += 1
            
        except Exception as e:
            logger.error(f"Limitless.ai sync failed for user {user_id}: {e}")
            result['errors'].append(str(e))
        
        return result
    
    async def _import_google_event(self, user_id: str, event: CalendarEvent) -> None:
        """Import a Google Calendar event to local database"""
        event_dict = event.to_dict()
        event_dict['user_id'] = user_id
        
        await self.db.execute("""
            INSERT INTO calendar_events 
            (user_id, google_event_id, title, description, start_time, end_time, 
             all_day, location, attendees, source, sync_status, etag, sequence,
             status, visibility, color_id, recurring_event_id, recurrence, timezone)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
            ON CONFLICT (user_id, google_event_id) 
            DO UPDATE SET 
                title = EXCLUDED.title,
                description = EXCLUDED.description,
                start_time = EXCLUDED.start_time,
                end_time = EXCLUDED.end_time,
                all_day = EXCLUDED.all_day,
                location = EXCLUDED.location,
                attendees = EXCLUDED.attendees,
                sync_status = EXCLUDED.sync_status,
                etag = EXCLUDED.etag,
                sequence = EXCLUDED.sequence,
                status = EXCLUDED.status,
                updated_at = NOW()
        """, user_id, event_dict['google_event_id'], event_dict['title'], 
            event_dict['description'], event_dict['start_time'], event_dict['end_time'],
            event_dict['all_day'], event_dict['location'], json.dumps(event_dict['attendees']),
            event_dict['source'], event_dict['sync_status'], event_dict['etag'],
            event_dict['sequence'], event_dict['status'], event_dict['visibility'],
            event_dict['color_id'], event_dict['recurring_event_id'], 
            event_dict['recurrence'], 'UTC')
    
    async def _import_limitless_event(self, user_id: str, limitless_item: Dict[str, Any]) -> None:
        """Import a Limitless.ai event to local database"""
        # Extract event information from Limitless data
        title = f"Meeting: {limitless_item.get('title', 'Untitled')}"
        description = limitless_item.get('summary', '')
        start_time = limitless_item.get('start_time')
        duration = limitless_item.get('duration', 3600)  # Default 1 hour
        
        if start_time:
            start_datetime = datetime.fromisoformat(start_time)
            end_datetime = start_datetime + timedelta(seconds=duration)
            
            await self.db.execute("""
                INSERT INTO calendar_events 
                (user_id, limitless_id, title, description, start_time, end_time, 
                 source, sync_status, metadata)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                ON CONFLICT (user_id, limitless_id) 
                DO UPDATE SET 
                    title = EXCLUDED.title,
                    description = EXCLUDED.description,
                    start_time = EXCLUDED.start_time,
                    end_time = EXCLUDED.end_time,
                    updated_at = NOW()
            """, user_id, limitless_item.get('id'), title, description,
                start_datetime, end_datetime, 'limitless', 'synced',
                json.dumps(limitless_item))
    
    async def _export_to_google_calendar(self, user_id: str, event_id: str, event_data: Dict[str, Any]) -> Dict[str, Any]:
        """Export a CCOPINAI event to Google Calendar"""
        try:
            access_token = await self._get_valid_access_token(user_id)
            if not access_token:
                return {'success': False, 'error': 'No valid access token'}
            
            # Get sync state for calendar ID
            sync_state = await self.db.fetch_one("""
                SELECT calendar_id FROM calendar_sync_state 
                WHERE user_id = $1 AND provider = 'google'
                ORDER BY created_at DESC LIMIT 1
            """, user_id)
            
            if not sync_state:
                return {'success': False, 'error': 'No calendar configured'}
            
            # Create event in Google Calendar
            google_event = await self.google_service.create_event(
                access_token, event_data, sync_state['calendar_id'])
            
            return {
                'success': True,
                'google_event_id': google_event.id
            }
            
        except Exception as e:
            logger.error(f"Failed to export event to Google Calendar: {e}")
            return {'success': False, 'error': str(e)}
    
    async def _update_google_calendar_event(self, user_id: str, google_event_id: str, event_data: Dict[str, Any]) -> Dict[str, Any]:
        """Update an event in Google Calendar"""
        try:
            access_token = await self._get_valid_access_token(user_id)
            if not access_token:
                return {'success': False, 'error': 'No valid access token'}
            
            sync_state = await self.db.fetch_one("""
                SELECT calendar_id FROM calendar_sync_state 
                WHERE user_id = $1 AND provider = 'google'
                ORDER BY created_at DESC LIMIT 1
            """, user_id)
            
            if not sync_state:
                return {'success': False, 'error': 'No calendar configured'}
            
            # Update event in Google Calendar
            updated_event = await self.google_service.update_event(
                access_token, google_event_id, event_data, sync_state['calendar_id'])
            
            return {'success': True}
            
        except Exception as e:
            logger.error(f"Failed to update Google Calendar event: {e}")
            return {'success': False, 'error': str(e)}
    
    async def _delete_google_calendar_event(self, user_id: str, google_event_id: str) -> Dict[str, Any]:
        """Delete an event from Google Calendar"""
        try:
            access_token = await self._get_valid_access_token(user_id)
            if not access_token:
                return {'success': False, 'error': 'No valid access token'}
            
            sync_state = await self.db.fetch_one("""
                SELECT calendar_id FROM calendar_sync_state 
                WHERE user_id = $1 AND provider = 'google'
                ORDER BY created_at DESC LIMIT 1
            """, user_id)
            
            if not sync_state:
                return {'success': False, 'error': 'No calendar configured'}
            
            # Delete event from Google Calendar
            success = await self.google_service.delete_event(
                access_token, google_event_id, sync_state['calendar_id'])
            
            return {'success': success}
            
        except Exception as e:
            logger.error(f"Failed to delete Google Calendar event: {e}")
            return {'success': False, 'error': str(e)}
    
    async def _get_valid_access_token(self, user_id: str) -> Optional[str]:
        """Get a valid access token, refreshing if necessary"""
        try:
            token_data = await self.db.fetch_one("""
                SELECT * FROM user_calendar_tokens 
                WHERE user_id = $1 AND provider = 'google'
            """, user_id)
            
            if not token_data:
                return None
            
            # Decrypt tokens
            access_token = self.google_service.decrypt_token(token_data['access_token_encrypted'])
            
            # Check if token needs refresh
            if token_data['expires_at'] and datetime.utcnow() >= token_data['expires_at'] - timedelta(minutes=5):
                if token_data['refresh_token_encrypted']:
                    refresh_token = self.google_service.decrypt_token(token_data['refresh_token_encrypted'])
                    
                    # Refresh token
                    new_tokens = await self.google_service.refresh_access_token(refresh_token)
                    
                    # Update stored tokens
                    encrypted_access_token = self.google_service.encrypt_token(new_tokens['access_token'])
                    await self.db.execute("""
                        UPDATE user_calendar_tokens 
                        SET access_token_encrypted = $2, expires_at = $3, updated_at = NOW()
                        WHERE user_id = $1 AND provider = 'google'
                    """, user_id, encrypted_access_token, new_tokens['expires_at'])
                    
                    return new_tokens['access_token']
                else:
                    # No refresh token, user needs to re-authenticate
                    return None
            
            return access_token
            
        except Exception as e:
            logger.error(f"Failed to get valid access token for user {user_id}: {e}")
            return None
    
    async def _detect_conflicts(self, user_id: str) -> List[Dict[str, Any]]:
        """Detect synchronization conflicts"""
        conflicts = []
        
        try:
            # Find overlapping events from different sources
            overlapping_events = await self.db.fetch_all("""
                SELECT e1.id as event1_id, e2.id as event2_id, 
                       e1.title as title1, e2.title as title2,
                       e1.source as source1, e2.source as source2,
                       e1.start_time, e1.end_time
                FROM calendar_events e1
                JOIN calendar_events e2 ON e1.user_id = e2.user_id
                WHERE e1.user_id = $1 
                  AND e1.id != e2.id
                  AND e1.sync_status != 'deleted'
                  AND e2.sync_status != 'deleted'
                  AND e1.start_time < e2.end_time 
                  AND e1.end_time > e2.start_time
                  AND e1.source != e2.source
            """, user_id)
            
            for overlap in overlapping_events:
                conflict = {
                    'type': 'time_overlap',
                    'events': [overlap['event1_id'], overlap['event2_id']],
                    'description': f"Time overlap between {overlap['source1']} and {overlap['source2']} events"
                }
                conflicts.append(conflict)
        
        except Exception as e:
            logger.error(f"Failed to detect conflicts for user {user_id}: {e}")
        
        return conflicts
    
    async def _update_sync_statistics(self, user_id: str, sync_results: Dict[str, Any]) -> None:
        """Update synchronization statistics"""
        try:
            google_stats = sync_results.get('google', {})
            
            await self.db.execute("""
                UPDATE calendar_sync_state 
                SET events_imported = events_imported + $2,
                    events_exported = events_exported + $3,
                    conflicts_detected = conflicts_detected + $4,
                    updated_at = NOW()
                WHERE user_id = $1 AND provider = 'google'
            """, user_id, google_stats.get('imported', 0), 
                google_stats.get('exported', 0), len(sync_results.get('conflicts', [])))
                
        except Exception as e:
            logger.error(f"Failed to update sync statistics for user {user_id}: {e}")

# Singleton instance
_calendar_sync_service: Optional[CalendarSyncService] = None

def get_calendar_sync_service() -> CalendarSyncService:
    """Get or create the calendar sync service singleton"""
    global _calendar_sync_service
    if _calendar_sync_service is None:
        _calendar_sync_service = CalendarSyncService()
    return _calendar_sync_service 