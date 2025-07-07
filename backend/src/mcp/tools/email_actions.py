"""
Email Actions Tool - Handle email-related actions
"""
import logging
from typing import Dict, Any, List
from datetime import datetime

from ..schemas import ExtractedAction, ToolType
from ..registry import tool

logger = logging.getLogger(__name__)


class EmailActionRequest:
    """Request model for email actions"""
    def __init__(self, action: ExtractedAction):
        self.action = action
        self.payload = action.payload


class EmailActionResult:
    """Result model for email actions"""
    def __init__(self, success: bool, message: str, data: Dict[str, Any] = None):
        self.success = success
        self.message = message
        self.data = data or {}


@tool(
    name="send_email",
    version="1.0",
    tool_type=ToolType.EMAIL,
    oauth_required=True,
    description="Send emails based on extracted actions"
)
def send_email(request: EmailActionRequest) -> EmailActionResult:
    """
    Send an email based on extracted action
    
    Args:
        request: EmailActionRequest containing action details
        
    Returns:
        EmailActionResult with success status and details
    """
    try:
        payload = request.payload
        
        # Extract required fields
        recipient = payload.get("recipient", "")
        subject = payload.get("title", payload.get("subject", "Follow-up"))
        body = payload.get("description", payload.get("body", ""))
        
        if not recipient:
            return EmailActionResult(
                success=False,
                message="No recipient specified for email"
            )
        
        # Extract additional fields
        cc = payload.get("cc", [])
        bcc = payload.get("bcc", [])
        attachments = payload.get("attachments", [])
        priority = payload.get("priority", "medium")
        
        # Create email data structure
        email_data = {
            "to": recipient if isinstance(recipient, list) else [recipient],
            "subject": subject,
            "body": body,
            "cc": cc,
            "bcc": bcc,
            "attachments": attachments,
            "priority": priority,
            "created_at": datetime.utcnow().isoformat()
        }
        
        # TODO: This is where you would integrate with actual email service
        # For now, we'll simulate the sending
        logger.info(f"Would send email: {email_data}")
        
        return EmailActionResult(
            success=True,
            message=f"Email '{subject}' would be sent to {recipient}",
            data=email_data
        )
        
    except Exception as e:
        logger.error(f"Error sending email: {e}")
        return EmailActionResult(
            success=False,
            message=f"Failed to send email: {str(e)}"
        )


@tool(
    name="schedule_email",
    version="1.0", 
    tool_type=ToolType.EMAIL,
    oauth_required=True,
    description="Schedule emails to be sent later"
)
def schedule_email(request: EmailActionRequest) -> EmailActionResult:
    """
    Schedule an email to be sent later
    
    Args:
        request: EmailActionRequest containing action details
        
    Returns:
        EmailActionResult with success status and details
    """
    try:
        payload = request.payload
        
        # Extract required fields
        recipient = payload.get("recipient", "")
        subject = payload.get("title", payload.get("subject", "Scheduled Follow-up"))
        body = payload.get("description", payload.get("body", ""))
        send_time = payload.get("send_time", payload.get("due_date"))
        
        if not recipient:
            return EmailActionResult(
                success=False,
                message="No recipient specified for scheduled email"
            )
        
        if not send_time:
            return EmailActionResult(
                success=False,
                message="No send time specified for scheduled email"
            )
        
        # Create scheduled email data
        scheduled_email_data = {
            "to": recipient if isinstance(recipient, list) else [recipient],
            "subject": subject,
            "body": body,
            "send_time": send_time,
            "priority": payload.get("priority", "medium"),
            "created_at": datetime.utcnow().isoformat()
        }
        
        # TODO: This is where you would integrate with actual email scheduling service
        logger.info(f"Would schedule email: {scheduled_email_data}")
        
        return EmailActionResult(
            success=True,
            message=f"Email '{subject}' would be scheduled for {send_time}",
            data=scheduled_email_data
        )
        
    except Exception as e:
        logger.error(f"Error scheduling email: {e}")
        return EmailActionResult(
            success=False,
            message=f"Failed to schedule email: {str(e)}"
        )


@tool(
    name="create_email_draft",
    version="1.0",
    tool_type=ToolType.EMAIL,
    oauth_required=True,
    description="Create email drafts for later review"
)
def create_email_draft(request: EmailActionRequest) -> EmailActionResult:
    """
    Create an email draft for later review
    
    Args:
        request: EmailActionRequest containing action details
        
    Returns:
        EmailActionResult with success status and details
    """
    try:
        payload = request.payload
        
        subject = payload.get("title", payload.get("subject", "Draft"))
        body = payload.get("description", payload.get("body", ""))
        recipient = payload.get("recipient", "")
        
        # Create draft data
        draft_data = {
            "to": recipient if isinstance(recipient, list) else [recipient],
            "subject": subject,
            "body": body,
            "status": "draft",
            "created_at": datetime.utcnow().isoformat()
        }
        
        # TODO: This is where you would integrate with actual email service
        logger.info(f"Would create email draft: {draft_data}")
        
        return EmailActionResult(
            success=True,
            message=f"Email draft '{subject}' would be created",
            data=draft_data
        )
        
    except Exception as e:
        logger.error(f"Error creating email draft: {e}")
        return EmailActionResult(
            success=False,
            message=f"Failed to create email draft: {str(e)}"
        )


def execute_email_action(action: ExtractedAction) -> EmailActionResult:
    """
    Execute an email-related action
    
    Args:
        action: ExtractedAction to execute
        
    Returns:
        EmailActionResult with execution status
    """
    request = EmailActionRequest(action)
    
    # Determine which tool to use based on action details
    if "schedule" in action.tool_name.lower():
        return schedule_email(request)
    elif "draft" in action.tool_name.lower():
        return create_email_draft(request)
    else:
        return send_email(request)