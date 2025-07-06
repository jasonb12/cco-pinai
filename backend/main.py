from fastapi import FastAPI, WebSocket, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import asyncio
import json
import subprocess
import os
from typing import Dict, List, Optional
from datetime import datetime, date
import logging
from src.services.limitless import get_limitless_service, LimitlessAPIError
from src.services.sync import get_sync_service, SyncState
from src.services.database import get_database_service

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Audio Transcript MCP API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class MCPInstallRequest(BaseModel):
    name: str

class TranscriptProcessRequest(BaseModel):
    audio_url: str
    transcript_id: str

class LimitlessDateRequest(BaseModel):
    date: str  # ISO format: YYYY-MM-DD
    timezone: Optional[str] = "UTC"

class LimitlessRangeRequest(BaseModel):
    start_time: str  # ISO format datetime
    end_time: str    # ISO format datetime
    timezone: Optional[str] = "UTC"

class SyncRequest(BaseModel):
    start_date: str  # ISO format: YYYY-MM-DD
    end_date: Optional[str] = None  # ISO format: YYYY-MM-DD
    timezone: Optional[str] = "UTC"
    user_id: str  # User ID for the sync

class WebSocketManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"WebSocket connection established. Total connections: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)
        logger.info(f"WebSocket connection closed. Total connections: {len(self.active_connections)}")

    async def send_personal_message(self, message: str, websocket: WebSocket):
        await websocket.send_text(message)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            await connection.send_text(message)

manager = WebSocketManager()

@app.get("/")
async def root():
    return {"message": "Audio Transcript MCP API"}

@app.get("/health")
async def health():
    return {"status": "healthy"}

@app.get("/mcp/list")
async def list_mcps():
    try:
        result = subprocess.run(
            ["mcpm", "list"], 
            capture_output=True, 
            text=True, 
            timeout=30
        )
        
        if result.returncode != 0:
            logger.error(f"mcpm list failed: {result.stderr}")
            return {"mcps": [], "error": "Failed to list MCPs"}
        
        mcps = []
        for line in result.stdout.strip().split('\n'):
            if line.strip():
                mcps.append({"name": line.strip(), "status": "available"})
        
        return {"mcps": mcps}
    except subprocess.TimeoutExpired:
        logger.error("mcpm list command timed out")
        return {"mcps": [], "error": "Command timed out"}
    except FileNotFoundError:
        logger.error("mcpm command not found")
        return {"mcps": [], "error": "mcpm not installed"}
    except Exception as e:
        logger.error(f"Error listing MCPs: {e}")
        return {"mcps": [], "error": str(e)}

@app.post("/mcp/install")
async def install_mcp(request: MCPInstallRequest):
    try:
        result = subprocess.run(
            ["mcpm", "add", request.name], 
            capture_output=True, 
            text=True, 
            timeout=60
        )
        
        if result.returncode != 0:
            logger.error(f"mcpm add failed: {result.stderr}")
            raise HTTPException(status_code=400, detail=f"Failed to install MCP: {result.stderr}")
        
        await manager.broadcast(json.dumps({
            "type": "mcp_installed",
            "mcp_name": request.name,
            "status": "success"
        }))
        
        return {"message": f"MCP {request.name} installed successfully", "output": result.stdout}
    except subprocess.TimeoutExpired:
        logger.error("mcpm add command timed out")
        raise HTTPException(status_code=408, detail="Installation timed out")
    except FileNotFoundError:
        logger.error("mcpm command not found")
        raise HTTPException(status_code=500, detail="mcpm not installed")
    except Exception as e:
        logger.error(f"Error installing MCP: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/transcript/process")
async def process_transcript(request: TranscriptProcessRequest):
    try:
        await manager.broadcast(json.dumps({
            "type": "transcript_processing",
            "transcript_id": request.transcript_id,
            "status": "started"
        }))
        
        # Simulate transcript processing
        await asyncio.sleep(2)
        
        # Here you would implement actual transcript processing logic
        # For now, we'll simulate a successful result
        transcript_text = f"Processed transcript for audio: {request.audio_url}"
        
        await manager.broadcast(json.dumps({
            "type": "transcript_completed",
            "transcript_id": request.transcript_id,
            "status": "completed",
            "transcript_text": transcript_text
        }))
        
        return {
            "message": "Transcript processing completed",
            "transcript_id": request.transcript_id,
            "transcript_text": transcript_text
        }
    except Exception as e:
        logger.error(f"Error processing transcript: {e}")
        
        await manager.broadcast(json.dumps({
            "type": "transcript_error",
            "transcript_id": request.transcript_id,
            "status": "error",
            "error": str(e)
        }))
        
        raise HTTPException(status_code=500, detail=str(e))

# Limitless API endpoints
@app.get("/limitless/lifelogs/{lifelog_id}")
async def get_lifelog(lifelog_id: str):
    """Get a specific lifelog by ID"""
    try:
        limitless_service = get_limitless_service()
        lifelog = await limitless_service.get_lifelog_by_id(lifelog_id)
        return lifelog.dict()
    except LimitlessAPIError as e:
        logger.error(f"Limitless API error: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error getting lifelog: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/limitless/lifelogs/by-date")
async def list_lifelogs_by_date(request: LimitlessDateRequest):
    """List lifelogs for a specific date"""
    try:
        limitless_service = get_limitless_service()
        target_date = date.fromisoformat(request.date)
        lifelogs = await limitless_service.list_lifelogs_by_date(target_date, request.timezone)
        return {"lifelogs": [log.dict() for log in lifelogs]}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Invalid date format: {e}")
    except LimitlessAPIError as e:
        logger.error(f"Limitless API error: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error listing lifelogs by date: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/limitless/lifelogs/by-range")
async def list_lifelogs_by_range(request: LimitlessRangeRequest):
    """List lifelogs within a time range"""
    try:
        limitless_service = get_limitless_service()
        start_time = datetime.fromisoformat(request.start_time)
        end_time = datetime.fromisoformat(request.end_time)
        lifelogs = await limitless_service.list_lifelogs_by_range(start_time, end_time, request.timezone)
        return {"lifelogs": [log.dict() for log in lifelogs]}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Invalid datetime format: {e}")
    except LimitlessAPIError as e:
        logger.error(f"Limitless API error: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error listing lifelogs by range: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/limitless/lifelogs/recent")
async def list_recent_lifelogs(limit: int = 10):
    """List recent lifelogs"""
    try:
        limitless_service = get_limitless_service()
        lifelogs = await limitless_service.list_recent_lifelogs(limit)
        return {"lifelogs": [log.dict() for log in lifelogs]}
    except LimitlessAPIError as e:
        logger.error(f"Limitless API error: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error listing recent lifelogs: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/limitless/sync-to-transcripts")
async def sync_lifelogs_to_transcripts():
    """Sync recent Limitless lifelogs to transcript database"""
    try:
        limitless_service = get_limitless_service()
        
        # Get recent lifelogs
        lifelogs = await limitless_service.list_recent_lifelogs(20)
        
        # Here you would implement the logic to save to your Supabase database
        # For now, we'll just return the count
        synced_count = len(lifelogs)
        
        await manager.broadcast(json.dumps({
            "type": "limitless_sync_completed",
            "status": "success",
            "synced_count": synced_count
        }))
        
        return {
            "message": f"Synced {synced_count} lifelogs to transcripts",
            "synced_count": synced_count,
            "lifelogs": [log.dict() for log in lifelogs]
        }
    except LimitlessAPIError as e:
        logger.error(f"Limitless API error: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error syncing lifelogs: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Advanced Sync Endpoints with Cursor Pagination
@app.post("/limitless/sync/range")
async def sync_date_range(request: SyncRequest):
    """Sync lifelogs from a date range using cursor pagination"""
    try:
        sync_service = get_sync_service(request.user_id)
        
        start_date = date.fromisoformat(request.start_date)
        end_date = None
        if request.end_date:
            end_date = date.fromisoformat(request.end_date)
        
        # Create progress callback for WebSocket updates
        async def progress_callback(update):
            await manager.broadcast(json.dumps({
                "type": "sync_progress",
                **update
            }))
        
        # Start the sync process
        await manager.broadcast(json.dumps({
            "type": "sync_started",
            "start_date": request.start_date,
            "end_date": request.end_date or "today"
        }))
        
        sync_result = await sync_service.sync_from_date(
            start_date=start_date,
            end_date=end_date,
            timezone=request.timezone,
            progress_callback=progress_callback
        )
        
        await manager.broadcast(json.dumps({
            "type": "sync_completed",
            "total_synced": sync_result.total_synced,
            "errors": sync_result.errors
        }))
        
        return {
            "message": f"Sync completed successfully",
            "start_date": request.start_date,
            "end_date": sync_result.last_sync_date.isoformat(),
            "total_synced": sync_result.total_synced,
            "errors": sync_result.errors
        }
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Invalid date format: {e}")
    except Exception as e:
        logger.error(f"Error during sync: {e}")
        await manager.broadcast(json.dumps({
            "type": "sync_error",
            "error": str(e)
        }))
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/limitless/sync/incremental")
async def incremental_sync(user_id: str):
    """Perform incremental sync from the last sync point"""
    try:
        sync_service = get_sync_service(user_id)
        
        async def progress_callback(update):
            await manager.broadcast(json.dumps({
                "type": "sync_progress",
                **update
            }))
        
        await manager.broadcast(json.dumps({
            "type": "incremental_sync_started"
        }))
        
        sync_result = await sync_service.incremental_sync(
            progress_callback=progress_callback
        )
        
        await manager.broadcast(json.dumps({
            "type": "sync_completed",
            "total_synced": sync_result.total_synced,
            "errors": sync_result.errors
        }))
        
        return {
            "message": "Incremental sync completed",
            "synced_from": sync_result.last_sync_date.isoformat(),
            "total_synced": sync_result.total_synced,
            "errors": sync_result.errors
        }
        
    except Exception as e:
        logger.error(f"Error during incremental sync: {e}")
        await manager.broadcast(json.dumps({
            "type": "sync_error",
            "error": str(e)
        }))
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/limitless/sync/stats/{target_date}")
async def get_sync_stats(target_date: str, timezone: str = "UTC"):
    """Get sync statistics for a specific date"""
    try:
        sync_service = get_sync_service(request.user_id)
        target_date_obj = date.fromisoformat(target_date)
        
        stats = await sync_service.get_sync_stats(target_date_obj, timezone)
        return stats
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Invalid date format: {e}")
    except Exception as e:
        logger.error(f"Error getting sync stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Database Management Endpoints
@app.get("/transcripts/{user_id}")
async def get_user_transcripts(
    user_id: str, 
    source: Optional[str] = None,
    limit: int = 50,
    offset: int = 0
):
    """Get transcripts for a user"""
    try:
        database_service = get_database_service()
        transcripts = await database_service.get_transcripts_for_user(
            user_id=user_id,
            source=source,
            limit=limit,
            offset=offset
        )
        return {"transcripts": transcripts}
    except Exception as e:
        logger.error(f"Error getting transcripts: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/transcripts/{user_id}/stats")
async def get_user_transcript_stats(user_id: str):
    """Get transcript statistics for a user"""
    try:
        database_service = get_database_service()
        stats = await database_service.get_transcript_stats(user_id)
        return stats
    except Exception as e:
        logger.error(f"Error getting transcript stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/sync/{user_id}/state")
async def get_user_sync_state(user_id: str, service_name: str = "limitless"):
    """Get sync state for a user"""
    try:
        database_service = get_database_service()
        sync_state = await database_service.get_sync_state(user_id, service_name)
        return sync_state or {"message": "No sync state found"}
    except Exception as e:
        logger.error(f"Error getting sync state: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            try:
                message = json.loads(data)
                logger.info(f"Received WebSocket message: {message}")
                
                # Echo the message back for now
                await manager.send_personal_message(json.dumps({
                    "type": "echo",
                    "message": message
                }), websocket)
            except json.JSONDecodeError:
                await manager.send_personal_message(json.dumps({
                    "type": "error",
                    "message": "Invalid JSON"
                }), websocket)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
    finally:
        manager.disconnect(websocket)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)