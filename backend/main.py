from fastapi import FastAPI, WebSocket, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import asyncio
import json
import subprocess
import os
from typing import Dict, List
import logging

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