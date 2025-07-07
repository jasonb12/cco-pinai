"""
MCP Schemas for CCOPINAI
"""
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum


class ActionStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    DENIED = "denied"
    EXECUTED = "executed"
    FAILED = "failed"


class ToolType(str, Enum):
    CALENDAR = "calendar"
    EMAIL = "email"
    TASK = "task"
    CONTACT = "contact"
    REMINDER = "reminder"
    CUSTOM = "custom"


class TextInput(BaseModel):
    text: str


class ActionOutput(BaseModel):
    actions: List[Dict[str, Any]]
    confidence: float
    reasoning: str


class ExtractedAction(BaseModel):
    id: str
    transcript_id: str
    tool_type: ToolType
    tool_name: str
    payload: Dict[str, Any]
    confidence: float
    reasoning: str
    status: ActionStatus = ActionStatus.PENDING
    created_at: datetime
    user_id: str


class ActionApproval(BaseModel):
    action_id: str
    approved: bool
    user_feedback: Optional[str] = None


class ProcessingStage(str, Enum):
    INGESTED = "ingested"
    VECTORIZED = "vectorized"
    PARSED = "parsed"
    PROPOSED = "proposed"
    APPROVED = "approved"
    EXECUTED = "executed"
    INDEXED = "indexed"
    FAILED = "failed"


class ProcessingLog(BaseModel):
    id: Optional[int] = None
    job_id: str
    transcript_id: Optional[str] = None
    stage: ProcessingStage
    status: str
    payload: Dict[str, Any]
    created_at: datetime
    error_message: Optional[str] = None


class MCPJobResult(BaseModel):
    job_id: str
    result: Dict[str, Any]
    created_at: datetime


class ScheduleRequest(BaseModel):
    action_id: str
    cron_expression: str
    enabled: bool = True
    timezone: str = "UTC"


class ToolConfig(BaseModel):
    name: str
    version: str
    enabled: bool = True
    oauth_provider: Optional[str] = None
    default_params: Dict[str, Any] = {}
    trigger_rules: List[Dict[str, Any]] = []