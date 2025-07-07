"""
MCP Server - FastAPI endpoints for MCP functionality
"""
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime
from uuid import uuid4

from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from pydantic import BaseModel

from .processor import get_mcp_processor
from .registry import registry
from .schemas import (
    ActionApproval, ScheduleRequest, ToolConfig, 
    ProcessingStage, ActionStatus
)

logger = logging.getLogger(__name__)

# Create router
mcp_router = APIRouter(prefix="/mcp", tags=["mcp"])


# Request/Response Models
class ProcessTranscriptRequest(BaseModel):
    transcript_id: str
    transcript_text: str
    user_id: str


class ProcessTranscriptResponse(BaseModel):
    job_id: str
    transcript_id: str
    actions_extracted: int
    actions_saved: int
    status: str
    processing_time: str


class ExecuteActionRequest(BaseModel):
    action_id: str
    user_id: str


class ToolListResponse(BaseModel):
    tools: List[Dict[str, Any]]


class ActionListResponse(BaseModel):
    actions: List[Dict[str, Any]]
    total: int


class ProcessingLogResponse(BaseModel):
    logs: List[Dict[str, Any]]
    total: int


# Dependency to get processor
def get_processor():
    return get_mcp_processor()


# Core Processing Endpoints
@mcp_router.post("/process", response_model=ProcessTranscriptResponse)
async def process_transcript(
    request: ProcessTranscriptRequest,
    background_tasks: BackgroundTasks,
    processor=Depends(get_processor)
):
    """
    Process a transcript through the MCP pipeline
    
    This endpoint:
    1. Extracts actions from transcript text using AI
    2. Saves actions to approval queue
    3. Returns processing results
    """
    try:
        # Process transcript
        result = await processor.process_transcript(
            transcript_id=request.transcript_id,
            transcript_text=request.transcript_text,
            user_id=request.user_id
        )
        
        return ProcessTranscriptResponse(**result)
        
    except Exception as e:
        logger.error(f"Error processing transcript: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@mcp_router.get("/actions/{user_id}", response_model=ActionListResponse)
async def get_pending_actions(
    user_id: str,
    status: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
    processor=Depends(get_processor)
):
    """
    Get pending actions for a user (approval queue)
    
    Args:
        user_id: User ID to get actions for
        status: Optional filter by status (pending, approved, denied)
        limit: Maximum number of actions to return
        offset: Number of actions to skip
    """
    try:
        actions = await processor.get_pending_actions(user_id)
        
        # Apply filters
        if status:
            actions = [a for a in actions if a.get("status") == status]
        
        # Apply pagination
        total = len(actions)
        paginated_actions = actions[offset:offset + limit]
        
        return ActionListResponse(
            actions=paginated_actions,
            total=total
        )
        
    except Exception as e:
        logger.error(f"Error getting pending actions: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@mcp_router.post("/actions/{action_id}/approve")
async def approve_action(
    action_id: str,
    approval: ActionApproval,
    processor=Depends(get_processor)
):
    """
    Approve an action for execution
    
    Args:
        action_id: ID of the action to approve
        approval: Approval details
    """
    try:
        if not approval.approved:
            return await processor.deny_action(
                action_id=action_id,
                user_id=approval.user_feedback or "",
                reason=approval.user_feedback or ""
            )
        
        # Approve the action
        result = await processor.approve_action(
            action_id=action_id,
            user_id=approval.user_feedback or ""
        )
        
        return result
        
    except Exception as e:
        logger.error(f"Error approving action: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@mcp_router.post("/actions/{action_id}/execute")
async def execute_action(
    action_id: str,
    request: ExecuteActionRequest,
    processor=Depends(get_processor)
):
    """
    Execute an approved action
    
    Args:
        action_id: ID of the action to execute
        request: Execution request details
    """
    try:
        # TODO: Get action from database and validate it's approved
        # For now, simulate execution
        
        # Create mock action for demonstration
        from .schemas import ExtractedAction, ToolType
        mock_action = ExtractedAction(
            id=action_id,
            transcript_id="mock_transcript",
            tool_type=ToolType.TASK,
            tool_name="create_task",
            payload={
                "title": "Mock Task",
                "description": "This is a mock task for testing",
                "priority": "medium"
            },
            confidence=0.8,
            reasoning="Mock action for testing",
            status=ActionStatus.APPROVED,
            created_at=datetime.utcnow(),
            user_id=request.user_id
        )
        
        result = await processor.execute_approved_action(mock_action)
        
        return result
        
    except Exception as e:
        logger.error(f"Error executing action: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# Tool Management Endpoints
@mcp_router.get("/tools", response_model=ToolListResponse)
async def list_tools():
    """
    List all available MCP tools
    """
    try:
        tools = []
        for name, tool_meta in registry.list_tools().items():
            tool_config = registry.get_tool_config(name)
            
            tools.append({
                "name": name,
                "version": tool_meta.version,
                "type": tool_meta.tool_type.value,
                "description": tool_meta.description,
                "enabled": tool_config.enabled,
                "oauth_required": tool_meta.oauth_required,
                "default_params": tool_meta.default_params
            })
        
        return ToolListResponse(tools=tools)
        
    except Exception as e:
        logger.error(f"Error listing tools: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@mcp_router.post("/tools/{tool_name}/config")
async def update_tool_config(
    tool_name: str,
    config: ToolConfig
):
    """
    Update configuration for a specific tool
    
    Args:
        tool_name: Name of the tool to configure
        config: New configuration settings
    """
    try:
        registry.update_tool_config(tool_name, config)
        
        return {
            "tool_name": tool_name,
            "updated": True,
            "config": config.dict()
        }
        
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Error updating tool config: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@mcp_router.get("/tools/{tool_name}/config")
async def get_tool_config(tool_name: str):
    """
    Get configuration for a specific tool
    
    Args:
        tool_name: Name of the tool to get config for
    """
    try:
        config = registry.get_tool_config(tool_name)
        
        return {
            "tool_name": tool_name,
            "config": config.dict()
        }
        
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Error getting tool config: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# Monitoring Endpoints
@mcp_router.get("/logs", response_model=ProcessingLogResponse)
async def get_processing_logs(
    job_id: Optional[str] = None,
    limit: int = 100,
    offset: int = 0,
    processor=Depends(get_processor)
):
    """
    Get processing logs for monitoring
    
    Args:
        job_id: Optional filter by job ID
        limit: Maximum number of logs to return
        offset: Number of logs to skip
    """
    try:
        logs = await processor.get_processing_logs(job_id)
        
        # Convert to dict format
        log_dicts = []
        for log in logs:
            log_dicts.append({
                "id": log.id,
                "job_id": log.job_id,
                "transcript_id": log.transcript_id,
                "stage": log.stage.value,
                "status": log.status,
                "payload": log.payload,
                "created_at": log.created_at.isoformat(),
                "error_message": log.error_message
            })
        
        # Apply pagination
        total = len(log_dicts)
        paginated_logs = log_dicts[offset:offset + limit]
        
        return ProcessingLogResponse(
            logs=paginated_logs,
            total=total
        )
        
    except Exception as e:
        logger.error(f"Error getting processing logs: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@mcp_router.get("/status")
async def get_mcp_status():
    """
    Get overall MCP system status
    """
    try:
        enabled_tools = registry.get_enabled_tools()
        
        return {
            "status": "operational",
            "tools_registered": len(registry.list_tools()),
            "tools_enabled": len(enabled_tools),
            "uptime": "N/A",  # TODO: Track actual uptime
            "last_check": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error getting MCP status: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# Health Check
@mcp_router.get("/health")
async def health_check():
    """
    Health check endpoint
    """
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "service": "mcp-server"
    }