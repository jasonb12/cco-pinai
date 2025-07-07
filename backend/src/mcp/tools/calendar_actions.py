"""
Calendar Actions Tool - Handle calendar-related actions
"""
import logging
from typing import Dict, Any
from datetime import datetime, timedelta
from dateutil.parser import parse as parse_date

from ..schemas import ExtractedAction, ToolType
from ..registry import tool

logger = logging.getLogger(__name__)


class CalendarActionRequest:
    """Request model for calendar actions"""
    def __init__(self, action: ExtractedAction):
        self.action = action
        self.payload = action.payload


class CalendarActionResult:
    """Result model for calendar actions"""
    def __init__(self, success: bool, message: str, data: Dict[str, Any] = None):
        self.success = success
        self.message = message
        self.data = data or {}


@tool(
    name="create_calendar_event",
    version="1.0",
    tool_type=ToolType.CALENDAR,
    oauth_required=True,
    description="Create calendar events from extracted actions"
)
def create_calendar_event(request: CalendarActionRequest) -> CalendarActionResult:
    """
    Create a calendar event based on extracted action
    
    Args:
        request: CalendarActionRequest containing action details
        
    Returns:
        CalendarActionResult with success status and details
    """
    try:
        payload = request.payload
        
        # Extract required fields
        title = payload.get("title", "New Event")
        description = payload.get("description", "")
        
        # Parse dates
        start_time = None
        end_time = None
        
        if "start_time" in payload:
            start_time = parse_date(payload["start_time"])
        elif "due_date" in payload:
            start_time = parse_date(payload["due_date"])
        else:
            # Default to 1 hour from now
            start_time = datetime.utcnow() + timedelta(hours=1)
        
        if "end_time" in payload:
            end_time = parse_date(payload["end_time"])
        elif "duration" in payload:
            duration_minutes = int(payload["duration"])
            end_time = start_time + timedelta(minutes=duration_minutes)
        else:
            # Default to 1 hour duration
            end_time = start_time + timedelta(hours=1)
        
        # Extract attendees
        attendees = payload.get("attendees", [])
        if "recipient" in payload:
            attendees.append(payload["recipient"])
        
        # Create event data structure
        event_data = {
            "title": title,
            "description": description,
            "start_time": start_time.isoformat(),
            "end_time": end_time.isoformat(),
            "attendees": attendees,
            "location": payload.get("location", ""),
            "priority": payload.get("priority", "medium")
        }
        
        # TODO: This is where you would integrate with actual calendar service
        # For now, we'll simulate the creation
        logger.info(f"Would create calendar event: {event_data}")
        
        return CalendarActionResult(
            success=True,
            message=f"Calendar event '{title}' would be created for {start_time.strftime('%Y-%m-%d %H:%M')}",
            data=event_data
        )
        
    except Exception as e:
        logger.error(f"Error creating calendar event: {e}")
        return CalendarActionResult(
            success=False,
            message=f"Failed to create calendar event: {str(e)}"
        )


@tool(
    name="schedule_reminder",
    version="1.0",
    tool_type=ToolType.REMINDER,
    description="Schedule reminders based on extracted actions"
)
def schedule_reminder(request: CalendarActionRequest) -> CalendarActionResult:
    """
    Schedule a reminder based on extracted action
    
    Args:
        request: CalendarActionRequest containing action details
        
    Returns:
        CalendarActionResult with success status and details
    """
    try:
        payload = request.payload
        
        title = payload.get("title", "Reminder")
        description = payload.get("description", "")
        
        # Parse reminder time
        reminder_time = None
        if "due_date" in payload:
            reminder_time = parse_date(payload["due_date"])
        elif "reminder_time" in payload:
            reminder_time = parse_date(payload["reminder_time"])
        else:
            # Default to tomorrow
            reminder_time = datetime.utcnow() + timedelta(days=1)
        
        # Create reminder data
        reminder_data = {
            "title": title,
            "description": description,
            "reminder_time": reminder_time.isoformat(),
            "priority": payload.get("priority", "medium"),
            "type": "reminder"
        }
        
        # TODO: This is where you would integrate with actual reminder service
        logger.info(f"Would schedule reminder: {reminder_data}")
        
        return CalendarActionResult(
            success=True,
            message=f"Reminder '{title}' would be scheduled for {reminder_time.strftime('%Y-%m-%d %H:%M')}",
            data=reminder_data
        )
        
    except Exception as e:
        logger.error(f"Error scheduling reminder: {e}")
        return CalendarActionResult(
            success=False,
            message=f"Failed to schedule reminder: {str(e)}"
        )


def execute_calendar_action(action: ExtractedAction) -> CalendarActionResult:
    """
    Execute a calendar-related action
    
    Args:
        action: ExtractedAction to execute
        
    Returns:
        CalendarActionResult with execution status
    """
    request = CalendarActionRequest(action)
    
    # Determine which tool to use based on action details
    if "reminder" in action.tool_name.lower():
        return schedule_reminder(request)
    else:
        return create_calendar_event(request)