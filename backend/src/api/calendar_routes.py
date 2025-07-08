"""
Calendar API Routes
Provides endpoints for Google Calendar integration, OAuth flow, and event management
"""
from fastapi import APIRouter, HTTPException, Query, Depends
from fastapi.responses import RedirectResponse
from pydantic import BaseModel
from typing import List, Dict, Optional, Any
from datetime import datetime
import logging

from ..services.calendar_sync import get_calendar_sync_service, CalendarSyncError
from ..services.auth import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/calendar", tags=["calendar"])

# Pydantic models
class CalendarEventCreate(BaseModel):
    title: str
    description: Optional[str] = ""
    start_time: datetime
    end_time: datetime
    all_day: bool = False
    location: Optional[str] = ""
    attendees: List[str] = []
    timezone: str = "UTC"
    recurrence: List[str] = []
    color_id: Optional[str] = None
    visibility: str = "default"
    metadata: Dict[str, Any] = {}

class CalendarEventUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    all_day: Optional[bool] = None
    location: Optional[str] = None
    attendees: Optional[List[str]] = None
    timezone: Optional[str] = None
    recurrence: Optional[List[str]] = None
    color_id: Optional[str] = None
    visibility: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None

class CalendarSyncRequest(BaseModel):
    force_full_sync: bool = False

class CalendarConnectResponse(BaseModel):
    success: bool
    message: str
    calendars: Optional[List[Dict[str, Any]]] = None

class CalendarSyncResponse(BaseModel):
    success: bool
    message: str
    results: Dict[str, Any]

class CalendarEventResponse(BaseModel):
    success: bool
    event_id: Optional[str] = None
    google_sync: Optional[Dict[str, Any]] = None

# OAuth Flow Endpoints

@router.get("/auth/google")
async def initiate_google_oauth(
    user: dict = Depends(get_current_user),
    state: Optional[str] = Query(None, description="Optional state parameter")
):
    """
    Initiate Google Calendar OAuth flow
    Redirects user to Google consent screen
    """
    try:
        calendar_service = get_calendar_sync_service()
        auth_url = calendar_service.google_service.get_auth_url(state=state)
        
        return RedirectResponse(url=auth_url, status_code=302)
        
    except Exception as e:
        logger.error(f"Failed to initiate Google OAuth: {e}")
        raise HTTPException(status_code=500, detail="Failed to initiate OAuth flow")

@router.get("/auth/callback")
async def google_oauth_callback(
    code: str = Query(..., description="Authorization code from Google"),
    state: Optional[str] = Query(None, description="State parameter"),
    error: Optional[str] = Query(None, description="Error from Google OAuth"),
    user: dict = Depends(get_current_user)
):
    """
    Handle Google OAuth callback
    Exchanges authorization code for tokens and connects calendar
    """
    if error:
        logger.error(f"Google OAuth error: {error}")
        raise HTTPException(status_code=400, detail=f"OAuth error: {error}")
    
    try:
        calendar_service = get_calendar_sync_service()
        result = await calendar_service.connect_google_calendar(user['id'], code)
        
        # Redirect to frontend with success message
        frontend_url = "http://localhost:8081/calendar?connected=true"
        return RedirectResponse(url=frontend_url, status_code=302)
        
    except CalendarSyncError as e:
        logger.error(f"Calendar connection failed: {e}")
        # Redirect to frontend with error
        frontend_url = f"http://localhost:8081/calendar?error={str(e)}"
        return RedirectResponse(url=frontend_url, status_code=302)
    except Exception as e:
        logger.error(f"Unexpected error in OAuth callback: {e}")
        frontend_url = "http://localhost:8081/calendar?error=connection_failed"
        return RedirectResponse(url=frontend_url, status_code=302)

# Calendar Connection Management

@router.post("/connect/google", response_model=CalendarConnectResponse)
async def connect_google_calendar(
    auth_code: str,
    user: dict = Depends(get_current_user)
):
    """
    Connect Google Calendar with authorization code
    Alternative to OAuth flow for direct API usage
    """
    try:
        calendar_service = get_calendar_sync_service()
        result = await calendar_service.connect_google_calendar(user['id'], auth_code)
        
        return CalendarConnectResponse(**result)
        
    except CalendarSyncError as e:
        logger.error(f"Calendar connection failed: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Unexpected error connecting calendar: {e}")
        raise HTTPException(status_code=500, detail="Failed to connect calendar")

@router.delete("/disconnect/google")
async def disconnect_google_calendar(
    user: dict = Depends(get_current_user)
):
    """
    Disconnect Google Calendar and revoke tokens
    """
    try:
        calendar_service = get_calendar_sync_service()
        result = await calendar_service.disconnect_google_calendar(user['id'])
        
        return result
        
    except CalendarSyncError as e:
        logger.error(f"Calendar disconnection failed: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Unexpected error disconnecting calendar: {e}")
        raise HTTPException(status_code=500, detail="Failed to disconnect calendar")

@router.get("/connection/status")
async def get_connection_status(
    user: dict = Depends(get_current_user)
):
    """
    Get current calendar connection status
    """
    try:
        calendar_service = get_calendar_sync_service()
        
        # Check if user has Google Calendar tokens
        token_data = await calendar_service.db.fetch_one("""
            SELECT provider, created_at, expires_at FROM user_calendar_tokens 
            WHERE user_id = $1 AND provider = 'google'
        """, user['id'])
        
        # Get sync statistics
        sync_stats = await calendar_service.db.fetch_one("""
            SELECT events_imported, events_exported, last_successful_sync_at,
                   conflicts_detected, full_sync_completed
            FROM calendar_sync_state 
            WHERE user_id = $1 AND provider = 'google'
            ORDER BY created_at DESC LIMIT 1
        """, user['id'])
        
        connected = token_data is not None
        
        return {
            'connected': connected,
            'provider': token_data['provider'] if connected else None,
            'connected_at': token_data['created_at'] if connected else None,
            'token_expires_at': token_data['expires_at'] if connected else None,
            'sync_stats': dict(sync_stats) if sync_stats else None
        }
        
    except Exception as e:
        logger.error(f"Failed to get connection status: {e}")
        raise HTTPException(status_code=500, detail="Failed to get connection status")

# Synchronization Endpoints

@router.post("/sync", response_model=CalendarSyncResponse)
async def sync_calendar(
    sync_request: CalendarSyncRequest = CalendarSyncRequest(),
    user: dict = Depends(get_current_user)
):
    """
    Manually trigger calendar synchronization
    """
    try:
        calendar_service = get_calendar_sync_service()
        result = await calendar_service.sync_user_calendar(
            user['id'], 
            force_full_sync=sync_request.force_full_sync
        )
        
        return CalendarSyncResponse(**result)
        
    except CalendarSyncError as e:
        logger.error(f"Calendar sync failed: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Unexpected error during sync: {e}")
        raise HTTPException(status_code=500, detail="Sync failed")

@router.get("/sync/status")
async def get_sync_status(
    user: dict = Depends(get_current_user)
):
    """
    Get current synchronization status and statistics
    """
    try:
        calendar_service = get_calendar_sync_service()
        
        sync_status = await calendar_service.db.fetch_all("""
            SELECT provider, calendar_id, last_sync_at, next_sync_token,
                   full_sync_completed, incremental_sync_enabled, sync_interval_minutes,
                   last_error, error_count, last_successful_sync_at,
                   events_imported, events_exported, conflicts_detected
            FROM calendar_sync_state 
            WHERE user_id = $1
            ORDER BY provider, created_at DESC
        """, user['id'])
        
        return {
            'sync_states': [dict(state) for state in sync_status]
        }
        
    except Exception as e:
        logger.error(f"Failed to get sync status: {e}")
        raise HTTPException(status_code=500, detail="Failed to get sync status")

# Event Management Endpoints

@router.get("/events")
async def get_events(
    start_date: Optional[datetime] = Query(None, description="Start date filter"),
    end_date: Optional[datetime] = Query(None, description="End date filter"),
    sources: Optional[List[str]] = Query(None, description="Event sources to include"),
    user: dict = Depends(get_current_user)
):
    """
    Get user's calendar events with optional filtering
    """
    try:
        calendar_service = get_calendar_sync_service()
        events = await calendar_service.get_user_events(
            user['id'], start_date, end_date, sources
        )
        
        return {
            'events': events,
            'count': len(events)
        }
        
    except CalendarSyncError as e:
        logger.error(f"Failed to get events: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Unexpected error getting events: {e}")
        raise HTTPException(status_code=500, detail="Failed to get events")

@router.post("/events", response_model=CalendarEventResponse)
async def create_event(
    event_data: CalendarEventCreate,
    user: dict = Depends(get_current_user)
):
    """
    Create a new calendar event and sync to connected providers
    """
    try:
        calendar_service = get_calendar_sync_service()
        result = await calendar_service.create_event(
            user['id'], 
            event_data.dict()
        )
        
        return CalendarEventResponse(**result)
        
    except CalendarSyncError as e:
        logger.error(f"Failed to create event: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Unexpected error creating event: {e}")
        raise HTTPException(status_code=500, detail="Failed to create event")

@router.get("/events/{event_id}")
async def get_event(
    event_id: str,
    user: dict = Depends(get_current_user)
):
    """
    Get a specific calendar event
    """
    try:
        calendar_service = get_calendar_sync_service()
        
        event = await calendar_service.db.fetch_one("""
            SELECT * FROM calendar_events 
            WHERE id = $1 AND user_id = $2 AND sync_status != 'deleted'
        """, event_id, user['id'])
        
        if not event:
            raise HTTPException(status_code=404, detail="Event not found")
        
        # Parse JSON fields
        event_dict = dict(event)
        import json
        event_dict['attendees'] = json.loads(event_dict.get('attendees', '[]'))
        event_dict['metadata'] = json.loads(event_dict.get('metadata', '{}'))
        
        return event_dict
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get event {event_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to get event")

@router.put("/events/{event_id}", response_model=CalendarEventResponse)
async def update_event(
    event_id: str,
    event_data: CalendarEventUpdate,
    user: dict = Depends(get_current_user)
):
    """
    Update an existing calendar event and sync changes
    """
    try:
        calendar_service = get_calendar_sync_service()
        
        # Filter out None values
        update_data = {k: v for k, v in event_data.dict().items() if v is not None}
        
        result = await calendar_service.update_event(
            user['id'], 
            event_id,
            update_data
        )
        
        return CalendarEventResponse(**result)
        
    except CalendarSyncError as e:
        logger.error(f"Failed to update event: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Unexpected error updating event: {e}")
        raise HTTPException(status_code=500, detail="Failed to update event")

@router.delete("/events/{event_id}")
async def delete_event(
    event_id: str,
    user: dict = Depends(get_current_user)
):
    """
    Delete a calendar event and remove from connected providers
    """
    try:
        calendar_service = get_calendar_sync_service()
        result = await calendar_service.delete_event(user['id'], event_id)
        
        return result
        
    except CalendarSyncError as e:
        logger.error(f"Failed to delete event: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Unexpected error deleting event: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete event")

# Task Management Endpoints

@router.get("/tasks")
async def get_tasks(
    completed: Optional[bool] = Query(None, description="Filter by completion status"),
    due_date_start: Optional[datetime] = Query(None, description="Due date start filter"),
    due_date_end: Optional[datetime] = Query(None, description="Due date end filter"),
    user: dict = Depends(get_current_user)
):
    """
    Get user's calendar tasks with optional filtering
    """
    try:
        calendar_service = get_calendar_sync_service()
        
        query = """
            SELECT * FROM calendar_tasks 
            WHERE user_id = $1
        """
        params = [user['id']]
        param_idx = 2
        
        if completed is not None:
            query += f" AND completed = ${param_idx}"
            params.append(completed)
            param_idx += 1
        
        if due_date_start:
            query += f" AND due_date >= ${param_idx}"
            params.append(due_date_start)
            param_idx += 1
        
        if due_date_end:
            query += f" AND due_date <= ${param_idx}"
            params.append(due_date_end)
            param_idx += 1
        
        query += " ORDER BY due_date ASC, created_at DESC"
        
        tasks = await calendar_service.db.fetch_all(query, *params)
        
        return {
            'tasks': [dict(task) for task in tasks],
            'count': len(tasks)
        }
        
    except Exception as e:
        logger.error(f"Failed to get tasks: {e}")
        raise HTTPException(status_code=500, detail="Failed to get tasks")

@router.post("/tasks")
async def create_task(
    title: str,
    description: Optional[str] = "",
    due_date: Optional[datetime] = None,
    priority: str = "normal",
    calendar_event_id: Optional[str] = None,
    user: dict = Depends(get_current_user)
):
    """
    Create a new calendar task
    """
    try:
        calendar_service = get_calendar_sync_service()
        
        task_id = await calendar_service.db.fetch_val("""
            INSERT INTO calendar_tasks 
            (user_id, title, description, due_date, priority, calendar_event_id, source)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING id
        """, user['id'], title, description, due_date, priority, 
            calendar_event_id, 'ccopinai')
        
        return {
            'success': True,
            'task_id': task_id
        }
        
    except Exception as e:
        logger.error(f"Failed to create task: {e}")
        raise HTTPException(status_code=500, detail="Failed to create task")

@router.put("/tasks/{task_id}")
async def update_task(
    task_id: str,
    title: Optional[str] = None,
    description: Optional[str] = None,
    due_date: Optional[datetime] = None,
    completed: Optional[bool] = None,
    priority: Optional[str] = None,
    user: dict = Depends(get_current_user)
):
    """
    Update an existing calendar task
    """
    try:
        calendar_service = get_calendar_sync_service()
        
        # Build dynamic update query
        updates = []
        params = [task_id, user['id']]
        param_idx = 3
        
        if title is not None:
            updates.append(f"title = ${param_idx}")
            params.append(title)
            param_idx += 1
        
        if description is not None:
            updates.append(f"description = ${param_idx}")
            params.append(description)
            param_idx += 1
        
        if due_date is not None:
            updates.append(f"due_date = ${param_idx}")
            params.append(due_date)
            param_idx += 1
        
        if completed is not None:
            updates.append(f"completed = ${param_idx}")
            params.append(completed)
            param_idx += 1
            
            if completed:
                updates.append(f"completed_at = NOW()")
        
        if priority is not None:
            updates.append(f"priority = ${param_idx}")
            params.append(priority)
            param_idx += 1
        
        if not updates:
            raise HTTPException(status_code=400, detail="No updates provided")
        
        updates.append("updated_at = NOW()")
        
        query = f"""
            UPDATE calendar_tasks 
            SET {', '.join(updates)}
            WHERE id = $1 AND user_id = $2
        """
        
        await calendar_service.db.execute(query, *params)
        
        return {
            'success': True,
            'task_id': task_id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to update task: {e}")
        raise HTTPException(status_code=500, detail="Failed to update task")

@router.delete("/tasks/{task_id}")
async def delete_task(
    task_id: str,
    user: dict = Depends(get_current_user)
):
    """
    Delete a calendar task
    """
    try:
        calendar_service = get_calendar_sync_service()
        
        await calendar_service.db.execute("""
            DELETE FROM calendar_tasks 
            WHERE id = $1 AND user_id = $2
        """, task_id, user['id'])
        
        return {
            'success': True,
            'task_id': task_id
        }
        
    except Exception as e:
        logger.error(f"Failed to delete task: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete task")

# Conflict Resolution Endpoints

@router.get("/conflicts")
async def get_conflicts(
    resolved: Optional[bool] = Query(None, description="Filter by resolution status"),
    user: dict = Depends(get_current_user)
):
    """
    Get calendar synchronization conflicts
    """
    try:
        calendar_service = get_calendar_sync_service()
        
        query = """
            SELECT * FROM calendar_conflicts 
            WHERE user_id = $1
        """
        params = [user['id']]
        
        if resolved is not None:
            query += " AND resolved = $2"
            params.append(resolved)
        
        query += " ORDER BY created_at DESC"
        
        conflicts = await calendar_service.db.fetch_all(query, *params)
        
        return {
            'conflicts': [dict(conflict) for conflict in conflicts],
            'count': len(conflicts)
        }
        
    except Exception as e:
        logger.error(f"Failed to get conflicts: {e}")
        raise HTTPException(status_code=500, detail="Failed to get conflicts")

@router.post("/conflicts/{conflict_id}/resolve")
async def resolve_conflict(
    conflict_id: str,
    resolution: str,
    notes: Optional[str] = "",
    user: dict = Depends(get_current_user)
):
    """
    Resolve a calendar synchronization conflict
    """
    try:
        calendar_service = get_calendar_sync_service()
        
        await calendar_service.db.execute("""
            UPDATE calendar_conflicts 
            SET resolution = $3, resolved = TRUE, resolved_at = NOW(),
                resolved_by = $4, notes = $5, updated_at = NOW()
            WHERE id = $1 AND user_id = $2
        """, conflict_id, user['id'], resolution, 'user', notes)
        
        return {
            'success': True,
            'conflict_id': conflict_id,
            'resolution': resolution
        }
        
    except Exception as e:
        logger.error(f"Failed to resolve conflict: {e}")
        raise HTTPException(status_code=500, detail="Failed to resolve conflict") 