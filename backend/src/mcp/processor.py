"""
MCP Processing Engine - Orchestrates the automatic AI processing pipeline
"""
import logging
import asyncio
from typing import List, Dict, Any, Optional
from datetime import datetime
from uuid import uuid4

from ..services.database import get_database_service
from .tools.action_extractor import extract_actions, convert_to_extracted_actions
from .tools.calendar_actions import execute_calendar_action
from .tools.email_actions import execute_email_action
from .tools.task_actions import execute_task_action
from .schemas import (
    TextInput, ExtractedAction, ActionStatus, ProcessingStage, 
    ProcessingLog, ToolType
)

logger = logging.getLogger(__name__)


class MCPProcessor:
    """
    Main processing engine for MCP automation pipeline
    """
    
    def __init__(self):
        self.db_service = get_database_service()
        self.processing_logs: List[ProcessingLog] = []
    
    async def process_transcript(
        self, 
        transcript_id: str, 
        transcript_text: str, 
        user_id: str
    ) -> Dict[str, Any]:
        """
        Process a transcript through the complete MCP pipeline
        
        Args:
            transcript_id: ID of the transcript to process
            transcript_text: Text content of the transcript
            user_id: ID of the user who owns the transcript
            
        Returns:
            Dict containing processing results and statistics
        """
        job_id = str(uuid4())
        
        try:
            # Log processing start
            await self._log_stage(
                job_id, transcript_id, ProcessingStage.INGESTED, 
                "started", {"user_id": user_id}
            )
            
            # Stage 1: Extract actions using AI
            extracted_actions = await self._extract_actions_stage(
                job_id, transcript_id, transcript_text, user_id
            )
            
            # Stage 2: Save actions to approval queue
            saved_actions = await self._save_actions_stage(
                job_id, transcript_id, extracted_actions, user_id
            )
            
            # Stage 3: Mark transcript as processed
            await self._finalize_processing_stage(
                job_id, transcript_id, saved_actions
            )
            
            return {
                "job_id": job_id,
                "transcript_id": transcript_id,
                "actions_extracted": len(extracted_actions),
                "actions_saved": len(saved_actions),
                "status": "completed",
                "processing_time": datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            await self._log_stage(
                job_id, transcript_id, ProcessingStage.FAILED,
                "failed", {"error": str(e)}
            )
            logger.error(f"Processing failed for transcript {transcript_id}: {e}")
            raise
    
    async def _extract_actions_stage(
        self, 
        job_id: str, 
        transcript_id: str, 
        transcript_text: str, 
        user_id: str
    ) -> List[ExtractedAction]:
        """Extract actions from transcript text"""
        try:
            await self._log_stage(
                job_id, transcript_id, ProcessingStage.PARSED,
                "started", {"text_length": len(transcript_text)}
            )
            
            # Use AI to extract actions
            text_input = TextInput(text=transcript_text)
            action_output = extract_actions(text_input)
            
            # Convert to ExtractedAction objects
            extracted_actions = convert_to_extracted_actions(
                action_output, transcript_id, user_id
            )
            
            await self._log_stage(
                job_id, transcript_id, ProcessingStage.PARSED,
                "completed", {
                    "actions_found": len(extracted_actions),
                    "confidence": action_output.confidence,
                    "reasoning": action_output.reasoning
                }
            )
            
            return extracted_actions
            
        except Exception as e:
            await self._log_stage(
                job_id, transcript_id, ProcessingStage.PARSED,
                "failed", {"error": str(e)}
            )
            raise
    
    async def _save_actions_stage(
        self, 
        job_id: str, 
        transcript_id: str, 
        extracted_actions: List[ExtractedAction], 
        user_id: str
    ) -> List[Dict[str, Any]]:
        """Save extracted actions to the approval queue"""
        try:
            await self._log_stage(
                job_id, transcript_id, ProcessingStage.PROPOSED,
                "started", {"actions_to_save": len(extracted_actions)}
            )
            
            saved_actions = []
            
            for action in extracted_actions:
                # Save action to database
                action_data = {
                    "id": action.id,
                    "transcript_id": action.transcript_id,
                    "user_id": action.user_id,
                    "tool_type": action.tool_type.value,
                    "tool_name": action.tool_name,
                    "payload": action.payload,
                    "confidence": action.confidence,
                    "reasoning": action.reasoning,
                    "status": action.status.value,
                    "created_at": action.created_at.isoformat()
                }
                
                # TODO: Save to actual database
                # For now, we'll simulate saving
                logger.info(f"Would save action to database: {action_data}")
                saved_actions.append(action_data)
            
            await self._log_stage(
                job_id, transcript_id, ProcessingStage.PROPOSED,
                "completed", {"actions_saved": len(saved_actions)}
            )
            
            return saved_actions
            
        except Exception as e:
            await self._log_stage(
                job_id, transcript_id, ProcessingStage.PROPOSED,
                "failed", {"error": str(e)}
            )
            raise
    
    async def _finalize_processing_stage(
        self, 
        job_id: str, 
        transcript_id: str, 
        saved_actions: List[Dict[str, Any]]
    ):
        """Mark transcript as fully processed"""
        try:
            await self._log_stage(
                job_id, transcript_id, ProcessingStage.INDEXED,
                "completed", {
                    "total_actions": len(saved_actions),
                    "processing_completed": True
                }
            )
            
        except Exception as e:
            await self._log_stage(
                job_id, transcript_id, ProcessingStage.INDEXED,
                "failed", {"error": str(e)}
            )
            raise
    
    async def execute_approved_action(self, action: ExtractedAction) -> Dict[str, Any]:
        """
        Execute an approved action
        
        Args:
            action: The approved ExtractedAction to execute
            
        Returns:
            Dict containing execution results
        """
        job_id = str(uuid4())
        
        try:
            await self._log_stage(
                job_id, action.transcript_id, ProcessingStage.EXECUTED,
                "started", {"action_id": action.id, "tool_type": action.tool_type.value}
            )
            
            # Route to appropriate action executor
            if action.tool_type == ToolType.CALENDAR:
                result = execute_calendar_action(action)
            elif action.tool_type == ToolType.EMAIL:
                result = execute_email_action(action)
            elif action.tool_type == ToolType.TASK:
                result = execute_task_action(action)
            else:
                result = {"success": False, "message": f"Unknown tool type: {action.tool_type}"}
            
            # Log execution result
            status = "completed" if result.get("success") else "failed"
            await self._log_stage(
                job_id, action.transcript_id, ProcessingStage.EXECUTED,
                status, {
                    "action_id": action.id,
                    "result": result,
                    "tool_type": action.tool_type.value
                }
            )
            
            return {
                "job_id": job_id,
                "action_id": action.id,
                "success": result.get("success", False),
                "message": result.get("message", ""),
                "data": result.get("data", {}),
                "executed_at": datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            await self._log_stage(
                job_id, action.transcript_id, ProcessingStage.EXECUTED,
                "failed", {"action_id": action.id, "error": str(e)}
            )
            logger.error(f"Execution failed for action {action.id}: {e}")
            raise
    
    async def _log_stage(
        self, 
        job_id: str, 
        transcript_id: str, 
        stage: ProcessingStage, 
        status: str, 
        payload: Dict[str, Any]
    ):
        """Log a processing stage"""
        log_entry = ProcessingLog(
            job_id=job_id,
            transcript_id=transcript_id,
            stage=stage,
            status=status,
            payload=payload,
            created_at=datetime.utcnow()
        )
        
        self.processing_logs.append(log_entry)
        
        # TODO: Save to actual database
        logger.info(f"Processing log: {job_id} | {stage.value} | {status} | {payload}")
    
    async def get_processing_logs(self, job_id: Optional[str] = None) -> List[ProcessingLog]:
        """Get processing logs, optionally filtered by job_id"""
        if job_id:
            return [log for log in self.processing_logs if log.job_id == job_id]
        return self.processing_logs.copy()
    
    async def get_pending_actions(self, user_id: str) -> List[Dict[str, Any]]:
        """Get pending actions for a user (approval queue)"""
        # TODO: Query actual database
        # For now, return empty list
        return []
    
    async def approve_action(self, action_id: str, user_id: str) -> Dict[str, Any]:
        """
        Approve an action for execution
        
        Args:
            action_id: ID of the action to approve
            user_id: ID of the user approving the action
            
        Returns:
            Dict containing approval results
        """
        # TODO: Implement actual approval logic
        # For now, simulate approval
        return {
            "action_id": action_id,
            "approved": True,
            "approved_by": user_id,
            "approved_at": datetime.utcnow().isoformat()
        }
    
    async def deny_action(self, action_id: str, user_id: str, reason: str = "") -> Dict[str, Any]:
        """
        Deny an action
        
        Args:
            action_id: ID of the action to deny
            user_id: ID of the user denying the action
            reason: Optional reason for denial
            
        Returns:
            Dict containing denial results
        """
        # TODO: Implement actual denial logic
        # For now, simulate denial
        return {
            "action_id": action_id,
            "denied": True,
            "denied_by": user_id,
            "denied_at": datetime.utcnow().isoformat(),
            "reason": reason
        }


# Global processor instance
_processor: Optional[MCPProcessor] = None

def get_mcp_processor() -> MCPProcessor:
    """Get or create the MCP processor singleton"""
    global _processor
    if _processor is None:
        _processor = MCPProcessor()
    return _processor