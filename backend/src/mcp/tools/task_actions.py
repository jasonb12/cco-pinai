"""
Task Actions Tool - Handle task management actions
"""
import logging
from typing import Dict, Any, List
from datetime import datetime, timedelta
from dateutil.parser import parse as parse_date

from ..schemas import ExtractedAction, ToolType
from ..registry import tool

logger = logging.getLogger(__name__)


class TaskActionRequest:
    """Request model for task actions"""
    def __init__(self, action: ExtractedAction):
        self.action = action
        self.payload = action.payload


class TaskActionResult:
    """Result model for task actions"""
    def __init__(self, success: bool, message: str, data: Dict[str, Any] = None):
        self.success = success
        self.message = message
        self.data = data or {}


@tool(
    name="create_task",
    version="1.0",
    tool_type=ToolType.TASK,
    oauth_required=True,
    description="Create tasks from extracted actions"
)
def create_task(request: TaskActionRequest) -> TaskActionResult:
    """
    Create a task based on extracted action
    
    Args:
        request: TaskActionRequest containing action details
        
    Returns:
        TaskActionResult with success status and details
    """
    try:
        payload = request.payload
        
        # Extract required fields
        title = payload.get("title", "New Task")
        description = payload.get("description", "")
        priority = payload.get("priority", "medium")
        
        # Parse due date
        due_date = None
        if "due_date" in payload:
            due_date = parse_date(payload["due_date"])
        elif "deadline" in payload:
            due_date = parse_date(payload["deadline"])
        
        # Extract additional fields
        assignee = payload.get("assignee", payload.get("recipient", ""))
        project = payload.get("project", "")
        tags = payload.get("tags", [])
        
        # Create task data structure
        task_data = {
            "title": title,
            "description": description,
            "priority": priority,
            "due_date": due_date.isoformat() if due_date else None,
            "assignee": assignee,
            "project": project,
            "tags": tags,
            "status": "pending",
            "created_at": datetime.utcnow().isoformat()
        }
        
        # TODO: This is where you would integrate with actual task management service
        # For now, we'll simulate the creation
        logger.info(f"Would create task: {task_data}")
        
        return TaskActionResult(
            success=True,
            message=f"Task '{title}' would be created" + (f" with due date {due_date.strftime('%Y-%m-%d')}" if due_date else ""),
            data=task_data
        )
        
    except Exception as e:
        logger.error(f"Error creating task: {e}")
        return TaskActionResult(
            success=False,
            message=f"Failed to create task: {str(e)}"
        )


@tool(
    name="create_recurring_task",
    version="1.0",
    tool_type=ToolType.TASK,
    oauth_required=True,
    description="Create recurring tasks"
)
def create_recurring_task(request: TaskActionRequest) -> TaskActionResult:
    """
    Create a recurring task based on extracted action
    
    Args:
        request: TaskActionRequest containing action details
        
    Returns:
        TaskActionResult with success status and details
    """
    try:
        payload = request.payload
        
        title = payload.get("title", "Recurring Task")
        description = payload.get("description", "")
        priority = payload.get("priority", "medium")
        
        # Parse recurrence pattern
        recurrence = payload.get("recurrence", "weekly")
        start_date = None
        if "start_date" in payload:
            start_date = parse_date(payload["start_date"])
        else:
            start_date = datetime.utcnow() + timedelta(days=1)
        
        # Create recurring task data
        recurring_task_data = {
            "title": title,
            "description": description,
            "priority": priority,
            "recurrence": recurrence,
            "start_date": start_date.isoformat(),
            "assignee": payload.get("assignee", ""),
            "project": payload.get("project", ""),
            "status": "pending",
            "created_at": datetime.utcnow().isoformat()
        }
        
        # TODO: This is where you would integrate with actual task management service
        logger.info(f"Would create recurring task: {recurring_task_data}")
        
        return TaskActionResult(
            success=True,
            message=f"Recurring task '{title}' would be created ({recurrence})",
            data=recurring_task_data
        )
        
    except Exception as e:
        logger.error(f"Error creating recurring task: {e}")
        return TaskActionResult(
            success=False,
            message=f"Failed to create recurring task: {str(e)}"
        )


@tool(
    name="create_checklist",
    version="1.0",
    tool_type=ToolType.TASK,
    description="Create checklists from extracted actions"
)
def create_checklist(request: TaskActionRequest) -> TaskActionResult:
    """
    Create a checklist based on extracted action
    
    Args:
        request: TaskActionRequest containing action details
        
    Returns:
        TaskActionResult with success status and details
    """
    try:
        payload = request.payload
        
        title = payload.get("title", "New Checklist")
        description = payload.get("description", "")
        items = payload.get("items", [])
        
        # If no items specified, try to extract from description
        if not items and description:
            # Simple extraction: look for numbered or bulleted items
            lines = description.split('\n')
            for line in lines:
                line = line.strip()
                if line and (line.startswith('-') or line.startswith('*') or line[0].isdigit()):
                    # Clean up the line
                    cleaned_item = line.lstrip('- *0123456789. ')
                    if cleaned_item:
                        items.append(cleaned_item)
        
        # Create checklist data
        checklist_data = {
            "title": title,
            "description": description,
            "items": [{"text": item, "completed": False} for item in items],
            "priority": payload.get("priority", "medium"),
            "assignee": payload.get("assignee", ""),
            "project": payload.get("project", ""),
            "created_at": datetime.utcnow().isoformat()
        }
        
        # TODO: This is where you would integrate with actual task management service
        logger.info(f"Would create checklist: {checklist_data}")
        
        return TaskActionResult(
            success=True,
            message=f"Checklist '{title}' would be created with {len(items)} items",
            data=checklist_data
        )
        
    except Exception as e:
        logger.error(f"Error creating checklist: {e}")
        return TaskActionResult(
            success=False,
            message=f"Failed to create checklist: {str(e)}"
        )


def execute_task_action(action: ExtractedAction) -> TaskActionResult:
    """
    Execute a task-related action
    
    Args:
        action: ExtractedAction to execute
        
    Returns:
        TaskActionResult with execution status
    """
    request = TaskActionRequest(action)
    
    # Determine which tool to use based on action details
    if "recurring" in action.tool_name.lower():
        return create_recurring_task(request)
    elif "checklist" in action.tool_name.lower():
        return create_checklist(request)
    else:
        return create_task(request)