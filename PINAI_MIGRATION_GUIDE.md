# 🚀 PinAI Feature Migration Guide

## **Complete Step-by-Step Process for Importing Original PinAI Features**

This guide provides a comprehensive roadmap for importing the most valuable features from the original PinAI project into the current project. The migration is organized into 4 phases with detailed implementation steps.

---

## **📋 Pre-Migration Checklist**

### **Environment Setup**
```bash
# 1. Ensure you have access to both projects
cd /Users/jason/src/cco-pinai
ls -la pinai/  # Original project
ls -la frontend/  # Current project

# 2. Backup current project
git checkout -b backup-before-migration
git add -A && git commit -m "Backup before PinAI migration"

# 3. Create migration branch
git checkout -b feature/pinai-migration
```

### **Dependencies Analysis**
```bash
# Check current project dependencies
cd frontend
cat package.json | grep -A 50 "dependencies"

# Check original project dependencies
cd ../pinai/packages/frontend
cat package.json | grep -A 50 "dependencies"
cd ../backend
cat requirements.txt
```

---

## **🏗️ Phase 1: Core Infrastructure (Weeks 1-2)**

### **1.1 Enhanced Sync System Import**

#### **Step 1: Create Backend Structure**
```bash
# Create backend directory structure
mkdir -p backend/src/{models,services,routes,middleware}
mkdir -p backend/src/services/sync
```

#### **Step 2: Import Sync Models**
```bash
# Copy sync-related models from original project
cp pinai/packages/backend/src/models/sync_status.py backend/src/models/
cp pinai/packages/backend/src/models/transcript.py backend/src/models/
cp pinai/packages/backend/src/models/user.py backend/src/models/
```

**File: `backend/src/models/sync_status.py`**
```python
from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, Dict, Any
from enum import Enum

class SyncOperation(str, Enum):
    FULL_SYNC = "full_sync"
    DIFFERENTIAL_SYNC = "differential_sync"
    MANUAL_SYNC = "manual_sync"

class SyncStatus(BaseModel):
    id: Optional[int] = None
    user_id: str
    last_sync_cursor: Optional[str] = None
    total_synced_count: int = 0
    is_syncing: bool = False
    last_successful_sync: Optional[datetime] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

class SyncLog(BaseModel):
    id: Optional[int] = None
    user_id: str
    sync_operation: SyncOperation
    transcripts_fetched: int = 0
    transcripts_synced: int = 0
    transcripts_skipped: int = 0
    api_calls_made: int = 0
    performance_metrics: Optional[Dict[str, Any]] = None
    error_message: Optional[str] = None
    started_at: datetime = Field(default_factory=datetime.utcnow)
    completed_at: Optional[datetime] = None
    success: bool = False
```

#### **Step 3: Import Sync Services**
```bash
# Copy sync services
cp pinai/packages/backend/src/services/sync_status_service.py backend/src/services/sync/
cp pinai/packages/backend/src/services/enhanced_transcript_sync_service.py backend/src/services/sync/
cp pinai/packages/backend/src/services/background_sync_service.py backend/src/services/sync/
```

#### **Step 4: Database Schema Migration**
```sql
-- File: backend/migrations/001_sync_system.sql
-- Enhanced Sync System Schema

-- Sync Status Table
CREATE TABLE IF NOT EXISTS sync_status (
    id SERIAL PRIMARY KEY,
    user_id TEXT NOT NULL UNIQUE,
    last_sync_cursor TEXT,
    total_synced_count INTEGER DEFAULT 0,
    is_syncing BOOLEAN DEFAULT FALSE,
    last_successful_sync TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sync Log Table
CREATE TABLE IF NOT EXISTS sync_logs (
    id SERIAL PRIMARY KEY,
    user_id TEXT NOT NULL,
    sync_operation TEXT NOT NULL,
    transcripts_fetched INTEGER DEFAULT 0,
    transcripts_synced INTEGER DEFAULT 0,
    transcripts_skipped INTEGER DEFAULT 0,
    api_calls_made INTEGER DEFAULT 0,
    performance_metrics JSONB,
    error_message TEXT,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    success BOOLEAN DEFAULT FALSE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_sync_status_user_id ON sync_status(user_id);
CREATE INDEX IF NOT EXISTS idx_sync_status_is_syncing ON sync_status(is_syncing);
CREATE INDEX IF NOT EXISTS idx_sync_logs_user_id ON sync_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_sync_logs_created_at ON sync_logs(started_at);

-- Sync status view with metrics
CREATE VIEW sync_status_with_metrics AS
SELECT 
    ss.*,
    COUNT(sl.id) as total_sync_operations,
    AVG(EXTRACT(EPOCH FROM (sl.completed_at - sl.started_at))) as avg_sync_duration,
    COUNT(CASE WHEN sl.success = true THEN 1 END) as successful_syncs,
    COUNT(CASE WHEN sl.success = false THEN 1 END) as failed_syncs
FROM sync_status ss
LEFT JOIN sync_logs sl ON ss.user_id = sl.user_id
GROUP BY ss.id;
```

#### **Step 5: Update Frontend Services**
```bash
# Create frontend sync service
mkdir -p frontend/src/services/sync
```

**File: `frontend/src/services/sync/syncService.ts`**
```typescript
import { api } from '../api';

export interface SyncStatus {
  user_id: string;
  last_sync_cursor?: string;
  total_synced_count: number;
  is_syncing: boolean;
  last_successful_sync?: string;
}

export interface SyncMetrics {
  transcripts_fetched: number;
  transcripts_synced: number;
  transcripts_skipped: number;
  api_calls_made: number;
  sync_duration: number;
  success: boolean;
}

class SyncService {
  private baseUrl = '/api/sync';

  async getSyncStatus(): Promise<SyncStatus> {
    const response = await api.get(`${this.baseUrl}/status`);
    return response.data;
  }

  async triggerSync(): Promise<SyncMetrics> {
    const response = await api.post(`${this.baseUrl}/trigger`);
    return response.data;
  }

  async getSyncHistory(limit: number = 10): Promise<any[]> {
    const response = await api.get(`${this.baseUrl}/history?limit=${limit}`);
    return response.data;
  }

  // Real-time sync status updates
  subscribeToSyncStatus(callback: (status: SyncStatus) => void) {
    // Implementation depends on your real-time system (WebSocket, Server-Sent Events, etc.)
    // This is a placeholder for real-time updates
    const eventSource = new EventSource(`${this.baseUrl}/status/stream`);
    eventSource.onmessage = (event) => {
      const status = JSON.parse(event.data);
      callback(status);
    };
    return eventSource;
  }
}

export const syncService = new SyncService();
```

### **1.2 Supabase Authentication Service**

#### **Step 1: Install Supabase Dependencies**
```bash
cd frontend
npm install @supabase/supabase-js
```

#### **Step 2: Copy Authentication Service**
```bash
# Copy Supabase auth service
cp pinai/packages/frontend/services/supabaseAuthService.ts frontend/src/services/
```

#### **Step 3: Environment Configuration**
```bash
# Update .env file
cat >> frontend/.env << EOF
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
EOF
```

#### **Step 4: Update Authentication Flow**
**File: `frontend/src/services/supabaseAuthService.ts`**
```typescript
import { createClient, SupabaseClient, User, Session } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

class SupabaseAuthService {
  private supabase: SupabaseClient;
  private currentUser: User | null = null;
  private currentSession: Session | null = null;

  constructor() {
    this.supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    });

    // Listen for auth changes
    this.supabase.auth.onAuthStateChange((event, session) => {
      this.currentSession = session;
      this.currentUser = session?.user || null;
    });
  }

  async signIn(email: string, password: string) {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    return data;
  }

  async signUp(email: string, password: string) {
    const { data, error } = await this.supabase.auth.signUp({
      email,
      password,
    });

    if (error) throw error;
    return data;
  }

  async signOut() {
    const { error } = await this.supabase.auth.signOut();
    if (error) throw error;
  }

  async getCurrentUser(): Promise<User | null> {
    if (this.currentUser) return this.currentUser;
    
    const { data: { user } } = await this.supabase.auth.getUser();
    this.currentUser = user;
    return user;
  }

  async getSession(): Promise<Session | null> {
    if (this.currentSession) return this.currentSession;
    
    const { data: { session } } = await this.supabase.auth.getSession();
    this.currentSession = session;
    return session;
  }

  getSupabaseClient(): SupabaseClient {
    return this.supabase;
  }
}

export const supabaseAuthService = new SupabaseAuthService();
```

### **1.3 Basic MCP Integration Framework**

#### **Step 1: Create MCP Structure**
```bash
# Create MCP directories
mkdir -p backend/src/mcp/{clients,servers,models}
mkdir -p frontend/src/services/mcp
```

#### **Step 2: Copy MCP Models**
```bash
# Copy MCP-related models
cp pinai/packages/backend/src/models/approval.py backend/src/models/
```

#### **Step 3: Basic MCP Service**
**File: `backend/src/mcp/clients/base_mcp_client.py`**
```python
from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional
from pydantic import BaseModel

class MCPTool(BaseModel):
    name: str
    description: str
    parameters: Dict[str, Any]
    requires_approval: bool = True
    confidence_threshold: float = 0.6

class MCPResponse(BaseModel):
    success: bool
    result: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    requires_approval: bool = False
    approval_id: Optional[str] = None

class BaseMCPClient(ABC):
    def __init__(self, name: str):
        self.name = name
        self.tools: Dict[str, MCPTool] = {}
        self.is_connected = False

    @abstractmethod
    async def connect(self) -> bool:
        """Connect to the MCP server"""
        pass

    @abstractmethod
    async def disconnect(self) -> bool:
        """Disconnect from the MCP server"""
        pass

    @abstractmethod
    async def list_tools(self) -> List[MCPTool]:
        """List available tools"""
        pass

    @abstractmethod
    async def call_tool(self, tool_name: str, parameters: Dict[str, Any]) -> MCPResponse:
        """Call a specific tool"""
        pass

    async def get_tool_info(self, tool_name: str) -> Optional[MCPTool]:
        """Get information about a specific tool"""
        return self.tools.get(tool_name)
```

#### **Step 4: Frontend MCP Service**
**File: `frontend/src/services/mcp/mcpService.ts`**
```typescript
import { api } from '../api';

export interface MCPTool {
  name: string;
  description: string;
  parameters: Record<string, any>;
  requires_approval: boolean;
  confidence_threshold: number;
}

export interface MCPResponse {
  success: boolean;
  result?: Record<string, any>;
  error?: string;
  requires_approval: boolean;
  approval_id?: string;
}

class MCPService {
  private baseUrl = '/api/mcp';

  async listTools(): Promise<MCPTool[]> {
    const response = await api.get(`${this.baseUrl}/tools`);
    return response.data;
  }

  async callTool(toolName: string, parameters: Record<string, any>): Promise<MCPResponse> {
    const response = await api.post(`${this.baseUrl}/tools/${toolName}/call`, {
      parameters
    });
    return response.data;
  }

  async getToolInfo(toolName: string): Promise<MCPTool> {
    const response = await api.get(`${this.baseUrl}/tools/${toolName}`);
    return response.data;
  }
}

export const mcpService = new MCPService();
```

### **1.4 Approval Workflow System**

#### **Step 1: Database Schema**
```sql
-- File: backend/migrations/002_approval_system.sql
-- Approval Workflow System

CREATE TABLE IF NOT EXISTS approvals (
    id SERIAL PRIMARY KEY,
    user_id TEXT NOT NULL,
    approval_type TEXT NOT NULL,
    tool_name TEXT,
    parameters JSONB,
    status TEXT DEFAULT 'pending',
    confidence_score FLOAT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    approved_at TIMESTAMP,
    executed_at TIMESTAMP,
    result JSONB,
    error_message TEXT
);

CREATE INDEX IF NOT EXISTS idx_approvals_user_id ON approvals(user_id);
CREATE INDEX IF NOT EXISTS idx_approvals_status ON approvals(status);
CREATE INDEX IF NOT EXISTS idx_approvals_created_at ON approvals(created_at);
```

#### **Step 2: Copy Approval Service**
```bash
# Copy approval service
cp pinai/packages/backend/src/services/approval_service.py backend/src/services/
```

#### **Step 3: Frontend Approval Components**
**File: `frontend/src/components/ApprovalCard.tsx`**
```typescript
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface ApprovalCardProps {
  approval: {
    id: string;
    tool_name: string;
    parameters: Record<string, any>;
    confidence_score: number;
    created_at: string;
  };
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}

export const ApprovalCard: React.FC<ApprovalCardProps> = ({
  approval,
  onApprove,
  onReject
}) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleApprove = async () => {
    setIsProcessing(true);
    try {
      await onApprove(approval.id);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    setIsProcessing(true);
    try {
      await onReject(approval.id);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.toolName}>{approval.tool_name}</Text>
        <Text style={styles.confidence}>
          {Math.round(approval.confidence_score * 100)}% confidence
        </Text>
      </View>
      
      <View style={styles.parameters}>
        <Text style={styles.parametersTitle}>Parameters:</Text>
        <Text style={styles.parametersText}>
          {JSON.stringify(approval.parameters, null, 2)}
        </Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.button, styles.approveButton]}
          onPress={handleApprove}
          disabled={isProcessing}
        >
          <Text style={styles.buttonText}>Approve</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.button, styles.rejectButton]}
          onPress={handleReject}
          disabled={isProcessing}
        >
          <Text style={styles.buttonText}>Reject</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f5f5f5',
    padding: 16,
    margin: 8,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  toolName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  confidence: {
    fontSize: 14,
    color: '#666',
  },
  parameters: {
    marginBottom: 16,
  },
  parametersTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  parametersText: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'monospace',
    backgroundColor: '#f0f0f0',
    padding: 8,
    borderRadius: 4,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  button: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 6,
    minWidth: 100,
    alignItems: 'center',
  },
  approveButton: {
    backgroundColor: '#4CAF50',
  },
  rejectButton: {
    backgroundColor: '#f44336',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
```

---

## **📊 Phase 1 Success Metrics**

### **Validation Checklist**
- [ ] Enhanced sync system imports and runs successfully
- [ ] Supabase authentication works across web and mobile
- [ ] Basic MCP framework is functional
- [ ] Approval workflow creates and processes approvals
- [ ] Database migrations complete without errors
- [ ] Frontend components render and function properly

### **Performance Targets**
- **Sync Efficiency**: 5x reduction in redundant API calls
- **Authentication**: <200ms login response time
- **MCP Tools**: Basic tool listing and execution
- **Approval Flow**: End-to-end approval processing

### **Testing Commands**
```bash
# Test sync service
curl -X POST http://localhost:9000/api/sync/trigger

# Test authentication
curl -X POST http://localhost:9000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "password"}'

# Test MCP tools
curl http://localhost:9000/api/mcp/tools

# Test approval system
curl http://localhost:9000/api/approvals/pending
```

---

## **🤖 Phase 2: AI Enhancement Integration (Weeks 3-4)**

### **2.1 LangGraph Integration**

#### **Step 1: Install LangGraph Dependencies**
```bash
# Backend dependencies
cd backend
pip install langgraph langchain langchain-openai

# Frontend dependencies
cd ../frontend
npm install @langchain/core @langchain/openai
```

#### **Step 2: Copy LangGraph Workflow**
```bash
# Copy workflow files
cp pinai/packages/backend/src/workflows/enhanced_ai_workflow.py backend/src/workflows/
cp pinai/packages/backend/src/workflows/mcp_langgraph_workflow.py backend/src/workflows/
```

#### **Step 3: Enhanced AI Service**
**File: `backend/src/services/enhanced_ai_service.py`**
```python
from typing import Dict, Any, List, Optional
from langchain_openai import ChatOpenAI
from langgraph.graph import StateGraph, END
from langgraph.graph.message import add_messages
from langchain_core.messages import HumanMessage, SystemMessage
import json

class AIServiceState:
    def __init__(self):
        self.messages: List = []
        self.query_type: Optional[str] = None
        self.confidence: float = 0.0
        self.actions: List[Dict] = []
        self.response: Optional[str] = None

class EnhancedAIService:
    def __init__(self):
        self.llm = ChatOpenAI(model="gpt-4o", temperature=0.1)
        self.workflow = self._create_workflow()
        
    def _create_workflow(self) -> StateGraph:
        """Create LangGraph workflow for AI processing"""
        workflow = StateGraph(AIServiceState)
        
        # Add nodes
        workflow.add_node("classify_query", self._classify_query)
        workflow.add_node("extract_actions", self._extract_actions)
        workflow.add_node("generate_response", self._generate_response)
        
        # Add edges
        workflow.add_edge("classify_query", "extract_actions")
        workflow.add_edge("extract_actions", "generate_response")
        workflow.add_edge("generate_response", END)
        
        # Set entry point
        workflow.set_entry_point("classify_query")
        
        return workflow.compile()
    
    async def _classify_query(self, state: AIServiceState) -> AIServiceState:
        """Classify the user query type"""
        system_prompt = """
        Classify the user query into one of these categories:
        1. SQL - Structured data queries requiring database operations
        2. ANALYTICS - Analysis, trends, or statistical questions
        3. RAG - General questions requiring knowledge retrieval
        4. ACTION - Requests for automation or task execution
        
        Return only the category name.
        """
        
        messages = [
            SystemMessage(content=system_prompt),
            HumanMessage(content=state.messages[-1] if state.messages else "")
        ]
        
        response = await self.llm.ainvoke(messages)
        state.query_type = response.content.strip().upper()
        state.confidence = 0.8  # Default confidence
        
        return state
    
    async def _extract_actions(self, state: AIServiceState) -> AIServiceState:
        """Extract actionable items from the query"""
        if state.query_type != "ACTION":
            return state
            
        system_prompt = """
        Extract actionable items from the user's message. For each action, provide:
        1. action_type: create_task, send_email, schedule_meeting, etc.
        2. parameters: relevant parameters for the action
        3. confidence: confidence score 0-1
        4. requires_approval: true if action needs user approval
        
        Return as JSON array of actions.
        """
        
        messages = [
            SystemMessage(content=system_prompt),
            HumanMessage(content=state.messages[-1] if state.messages else "")
        ]
        
        response = await self.llm.ainvoke(messages)
        try:
            actions = json.loads(response.content)
            state.actions = actions if isinstance(actions, list) else []
        except:
            state.actions = []
            
        return state
    
    async def _generate_response(self, state: AIServiceState) -> AIServiceState:
        """Generate final response based on query type and extracted actions"""
        if state.query_type == "ACTION" and state.actions:
            state.response = f"I found {len(state.actions)} actionable items that need approval."
        else:
            state.response = "I'll process your request."
            
        return state
    
    async def process_query(self, query: str, context: Dict[str, Any] = None) -> Dict[str, Any]:
        """Process a user query through the LangGraph workflow"""
        initial_state = AIServiceState()
        initial_state.messages = [query]
        
        # Run through workflow
        result = await self.workflow.ainvoke(initial_state)
        
        return {
            "query_type": result.query_type,
            "confidence": result.confidence,
            "actions": result.actions,
            "response": result.response
        }
```

#### **Step 4: Frontend AI Service**
**File: `frontend/src/services/ai/aiService.ts`**
```typescript
import { api } from '../api';

export interface AIQuery {
  query: string;
  context?: Record<string, any>;
}

export interface AIResponse {
  query_type: string;
  confidence: number;
  actions: any[];
  response: string;
}

export interface ActionItem {
  id: string;
  action_type: string;
  parameters: Record<string, any>;
  confidence: number;
  requires_approval: boolean;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
}

class AIService {
  private baseUrl = '/api/ai';

  async processQuery(query: AIQuery): Promise<AIResponse> {
    const response = await api.post(`${this.baseUrl}/process`, query);
    return response.data;
  }

  async extractActions(text: string): Promise<ActionItem[]> {
    const response = await api.post(`${this.baseUrl}/extract-actions`, { text });
    return response.data;
  }

  async getQueryAnalytics(timeRange: string = '7d'): Promise<any> {
    const response = await api.get(`${this.baseUrl}/analytics?range=${timeRange}`);
    return response.data;
  }
}

export const aiService = new AIService();
```

### **2.2 Google OAuth Implementation**

#### **Step 1: Install Google OAuth Dependencies**
```bash
# Backend
pip install google-auth google-auth-oauthlib google-auth-httplib2 google-api-python-client

# Frontend
npm install @react-native-google-signin/google-signin
```

#### **Step 2: Copy Google OAuth Services**
```bash
# Copy Google OAuth implementation
cp pinai/packages/backend/src/auth/google_oauth.py backend/src/auth/
cp pinai/packages/backend/src/services/google_oauth_token_service.py backend/src/services/
cp pinai/packages/backend/src/services/oauth_service.py backend/src/services/
```

#### **Step 3: Google OAuth Configuration**
**File: `backend/src/auth/google_oauth.py`**
```python
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build
import json
from typing import Dict, Any, Optional

class GoogleOAuthManager:
    def __init__(self):
        self.client_config = {
            "web": {
                "client_id": os.getenv("GOOGLE_CLIENT_ID"),
                "client_secret": os.getenv("GOOGLE_CLIENT_SECRET"),
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
                "redirect_uris": [os.getenv("GOOGLE_REDIRECT_URI")]
            }
        }
        
        self.scopes = [
            'https://www.googleapis.com/auth/calendar',
            'https://www.googleapis.com/auth/tasks',
            'https://www.googleapis.com/auth/drive.file',
            'https://www.googleapis.com/auth/gmail.compose',
            'https://www.googleapis.com/auth/userinfo.email',
            'https://www.googleapis.com/auth/userinfo.profile'
        ]
    
    def get_authorization_url(self, state: str) -> str:
        """Generate Google OAuth authorization URL"""
        flow = Flow.from_client_config(
            self.client_config,
            scopes=self.scopes,
            state=state
        )
        flow.redirect_uri = self.client_config["web"]["redirect_uris"][0]
        
        authorization_url, _ = flow.authorization_url(
            access_type='offline',
            include_granted_scopes='true',
            prompt='consent'
        )
        
        return authorization_url
    
    async def exchange_code_for_tokens(self, code: str, state: str) -> Dict[str, Any]:
        """Exchange authorization code for tokens"""
        flow = Flow.from_client_config(
            self.client_config,
            scopes=self.scopes,
            state=state
        )
        flow.redirect_uri = self.client_config["web"]["redirect_uris"][0]
        
        flow.fetch_token(code=code)
        
        credentials = flow.credentials
        
        # Get user info
        service = build('oauth2', 'v2', credentials=credentials)
        user_info = service.userinfo().get().execute()
        
        return {
            "access_token": credentials.token,
            "refresh_token": credentials.refresh_token,
            "token_uri": credentials.token_uri,
            "client_id": credentials.client_id,
            "client_secret": credentials.client_secret,
            "scopes": credentials.scopes,
            "user_info": user_info
        }
    
    async def refresh_token(self, refresh_token: str) -> Dict[str, Any]:
        """Refresh Google OAuth token"""
        credentials = Credentials(
            token=None,
            refresh_token=refresh_token,
            token_uri=self.client_config["web"]["token_uri"],
            client_id=self.client_config["web"]["client_id"],
            client_secret=self.client_config["web"]["client_secret"]
        )
        
        credentials.refresh(Request())
        
        return {
            "access_token": credentials.token,
            "expires_in": 3600,  # Default expiry
            "token_type": "Bearer"
        }
```

#### **Step 4: Google Services Integration**
**File: `backend/src/services/google_services.py`**
```python
from googleapiclient.discovery import build
from google.oauth2.credentials import Credentials
from typing import Dict, Any, List, Optional
import logging

logger = logging.getLogger(__name__)

class GoogleServicesManager:
    def __init__(self, credentials: Credentials):
        self.credentials = credentials
        self.services = {}
    
    def _get_service(self, service_name: str, version: str):
        """Get or create Google API service"""
        key = f"{service_name}_{version}"
        if key not in self.services:
            self.services[key] = build(service_name, version, credentials=self.credentials)
        return self.services[key]
    
    async def create_calendar_event(self, event_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a Google Calendar event"""
        try:
            service = self._get_service('calendar', 'v3')
            event = service.events().insert(
                calendarId='primary',
                body=event_data
            ).execute()
            
            return {
                "success": True,
                "event_id": event['id'],
                "html_link": event['htmlLink']
            }
        except Exception as e:
            logger.error(f"Error creating calendar event: {str(e)}")
            return {
                "success": False,
                "error": str(e)
            }
    
    async def create_task(self, task_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a Google Task"""
        try:
            service = self._get_service('tasks', 'v1')
            task = service.tasks().insert(
                tasklist='@default',
                body=task_data
            ).execute()
            
            return {
                "success": True,
                "task_id": task['id'],
                "title": task['title']
            }
        except Exception as e:
            logger.error(f"Error creating task: {str(e)}")
            return {
                "success": False,
                "error": str(e)
            }
    
    async def send_email(self, email_data: Dict[str, Any]) -> Dict[str, Any]:
        """Send an email via Gmail API"""
        try:
            service = self._get_service('gmail', 'v1')
            message = service.users().messages().send(
                userId='me',
                body=email_data
            ).execute()
            
            return {
                "success": True,
                "message_id": message['id']
            }
        except Exception as e:
            logger.error(f"Error sending email: {str(e)}")
            return {
                "success": False,
                "error": str(e)
            }
```

### **2.3 Action Extraction Service**

#### **Step 1: Copy Action Services**
```bash
# Copy action-related services
cp pinai/packages/backend/src/services/action_item_service.py backend/src/services/
cp pinai/packages/backend/src/services/event_driven_action_service.py backend/src/services/
```

#### **Step 2: Action Extraction Models**
**File: `backend/src/models/action_item.py`**
```python
from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, Dict, Any, List
from enum import Enum

class ActionType(str, Enum):
    CREATE_TASK = "create_task"
    SCHEDULE_MEETING = "schedule_meeting"
    SEND_EMAIL = "send_email"
    CREATE_REMINDER = "create_reminder"
    UPDATE_DOCUMENT = "update_document"
    MAKE_CALL = "make_call"
    RESEARCH = "research"
    FOLLOW_UP = "follow_up"

class ActionStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    COMPLETED = "completed"
    FAILED = "failed"

class ActionItem(BaseModel):
    id: Optional[str] = None
    user_id: str
    transcript_id: Optional[str] = None
    action_type: ActionType
    title: str
    description: Optional[str] = None
    parameters: Dict[str, Any] = Field(default_factory=dict)
    confidence: float = Field(ge=0.0, le=1.0)
    requires_approval: bool = True
    status: ActionStatus = ActionStatus.PENDING
    due_date: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    approved_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    error_message: Optional[str] = None
    result: Optional[Dict[str, Any]] = None

class ActionExtractionRequest(BaseModel):
    text: str
    context: Optional[Dict[str, Any]] = None
    auto_approve_threshold: float = 0.9

class ActionExtractionResponse(BaseModel):
    actions: List[ActionItem]
    summary: str
    confidence: float
    processing_time: float
```

#### **Step 3: Frontend Action Components**
**File: `frontend/src/components/ActionExtractionPanel.tsx`**
```typescript
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { aiService, ActionItem } from '../services/ai/aiService';
import { ApprovalCard } from './ApprovalCard';

interface ActionExtractionPanelProps {
  text: string;
  onActionsExtracted: (actions: ActionItem[]) => void;
}

export const ActionExtractionPanel: React.FC<ActionExtractionPanelProps> = ({
  text,
  onActionsExtracted
}) => {
  const [actions, setActions] = useState<ActionItem[]>([]);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionSummary, setExtractionSummary] = useState<string>('');

  useEffect(() => {
    if (text.length > 50) {
      extractActions();
    }
  }, [text]);

  const extractActions = async () => {
    setIsExtracting(true);
    try {
      const result = await aiService.extractActions(text);
      setActions(result);
      setExtractionSummary(`Found ${result.length} actionable items`);
      onActionsExtracted(result);
    } catch (error) {
      console.error('Error extracting actions:', error);
    } finally {
      setIsExtracting(false);
    }
  };

  const handleApproveAction = async (actionId: string) => {
    // Implementation for approving actions
    console.log('Approving action:', actionId);
  };

  const handleRejectAction = async (actionId: string) => {
    // Implementation for rejecting actions
    console.log('Rejecting action:', actionId);
  };

  const renderActionItem = ({ item }: { item: ActionItem }) => (
    <ApprovalCard
      approval={{
        id: item.id,
        tool_name: item.action_type,
        parameters: item.parameters,
        confidence_score: item.confidence,
        created_at: item.created_at
      }}
      onApprove={handleApproveAction}
      onReject={handleRejectAction}
    />
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Action Extraction</Text>
        {isExtracting && <Text style={styles.status}>Extracting...</Text>}
      </View>
      
      {extractionSummary && (
        <Text style={styles.summary}>{extractionSummary}</Text>
      )}
      
      <FlatList
        data={actions}
        renderItem={renderActionItem}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        style={styles.list}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  status: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  summary: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
    textAlign: 'center',
  },
  list: {
    flex: 1,
  },
});
```

### **2.4 Real-time Updates Service**

#### **Step 1: Copy Real-time Services**
```bash
# Copy real-time services
cp pinai/packages/backend/src/services/realtime_event_processor.py backend/src/services/
cp pinai/packages/frontend/services/realtimeService.ts frontend/src/services/
```

#### **Step 2: WebSocket Integration**
**File: `backend/src/services/websocket_service.py`**
```python
import asyncio
import json
from typing import Dict, Any, Set
from fastapi import WebSocket, WebSocketDisconnect
import logging

logger = logging.getLogger(__name__)

class WebSocketManager:
    def __init__(self):
        self.active_connections: Dict[str, Set[WebSocket]] = {}
        self.user_connections: Dict[str, str] = {}
    
    async def connect(self, websocket: WebSocket, user_id: str):
        """Connect a user's WebSocket"""
        await websocket.accept()
        
        if user_id not in self.active_connections:
            self.active_connections[user_id] = set()
        
        self.active_connections[user_id].add(websocket)
        self.user_connections[id(websocket)] = user_id
        
        logger.info(f"User {user_id} connected via WebSocket")
    
    def disconnect(self, websocket: WebSocket):
        """Disconnect a WebSocket"""
        connection_id = id(websocket)
        if connection_id in self.user_connections:
            user_id = self.user_connections[connection_id]
            
            if user_id in self.active_connections:
                self.active_connections[user_id].discard(websocket)
                if not self.active_connections[user_id]:
                    del self.active_connections[user_id]
            
            del self.user_connections[connection_id]
            logger.info(f"User {user_id} disconnected from WebSocket")
    
    async def send_to_user(self, user_id: str, message: Dict[str, Any]):
        """Send message to all user's WebSocket connections"""
        if user_id in self.active_connections:
            dead_connections = set()
            
            for websocket in self.active_connections[user_id]:
                try:
                    await websocket.send_text(json.dumps(message))
                except:
                    dead_connections.add(websocket)
            
            # Remove dead connections
            for websocket in dead_connections:
                self.active_connections[user_id].discard(websocket)
    
    async def broadcast_to_all(self, message: Dict[str, Any]):
        """Broadcast message to all connected users"""
        for user_id in self.active_connections:
            await self.send_to_user(user_id, message)

# Global WebSocket manager instance
websocket_manager = WebSocketManager()
```

#### **Step 3: Frontend Real-time Service**
**File: `frontend/src/services/realtime/realtimeService.ts`**
```typescript
import { supabaseAuthService } from '../supabaseAuthService';

export interface RealtimeEvent {
  type: string;
  data: any;
  timestamp: number;
}

export interface RealtimeSubscription {
  id: string;
  callback: (event: RealtimeEvent) => void;
  active: boolean;
}

class RealtimeService {
  private ws: WebSocket | null = null;
  private subscriptions: Map<string, RealtimeSubscription> = new Map();
  private reconnectInterval: NodeJS.Timeout | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectDelay = 1000;

  async connect(): Promise<void> {
    const user = await supabaseAuthService.getCurrentUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const wsUrl = `ws://localhost:9000/ws/${user.id}`;
    
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.reconnectAttempts = 0;
        resolve();
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleMessage(data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.ws.onclose = () => {
        console.log('WebSocket disconnected');
        this.attemptReconnect();
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        reject(error);
      };
    });
  }

  private handleMessage(data: RealtimeEvent): void {
    // Broadcast to all relevant subscriptions
    this.subscriptions.forEach((subscription) => {
      if (subscription.active) {
        subscription.callback(data);
      }
    });
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    this.reconnectInterval = setTimeout(() => {
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      this.connect().catch(console.error);
    }, delay);
  }

  subscribe(id: string, callback: (event: RealtimeEvent) => void): void {
    this.subscriptions.set(id, {
      id,
      callback,
      active: true
    });
  }

  unsubscribe(id: string): void {
    const subscription = this.subscriptions.get(id);
    if (subscription) {
      subscription.active = false;
      this.subscriptions.delete(id);
    }
  }

  send(message: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  disconnect(): void {
    if (this.reconnectInterval) {
      clearTimeout(this.reconnectInterval);
      this.reconnectInterval = null;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.subscriptions.clear();
  }
}

export const realtimeService = new RealtimeService();
```

---

## **📊 Phase 2 Success Metrics**

### **Validation Checklist**
- [ ] LangGraph workflow processes queries correctly
- [ ] Google OAuth authentication works end-to-end
- [ ] Action extraction identifies actionable items
- [ ] Real-time updates work across components
- [ ] AI service classifies queries accurately
- [ ] Google services integration functions properly

### **Performance Targets**
- **AI Processing**: <2s for query classification and action extraction
- **Google OAuth**: <5s for token exchange and validation
- **Real-time Updates**: <100ms message delivery
- **Action Extraction**: >80% accuracy for common action types

### **Testing Commands**
```bash
# Test AI service
curl -X POST http://localhost:9000/api/ai/process \
  -H "Content-Type: application/json" \
  -d '{"query": "Schedule a meeting with John tomorrow at 2pm"}'

# Test Google OAuth
curl http://localhost:9000/api/auth/google/authorize

# Test action extraction
curl -X POST http://localhost:9000/api/ai/extract-actions \
  -H "Content-Type: application/json" \
  -d '{"text": "I need to call Sarah and send an email to the team about the project update"}'

# Test WebSocket connection
wscat -c ws://localhost:9000/ws/user_id
```

---

## **🔍 Phase 3: Advanced Features Implementation (Weeks 5-6)**

### **3.1 Advanced Search Engine**

#### **Step 1: Install Search Dependencies**
```bash
# Backend dependencies
pip install whoosh elasticsearch-dsl sentence-transformers

# Frontend dependencies
npm install fuse.js
```

#### **Step 2: Copy Search Engine**
```bash
# Copy search implementation
cp pinai/packages/backend/src/search/search_engine.py backend/src/search/
```

#### **Step 3: Advanced Search Service**
**File: `backend/src/search/advanced_search_service.py`**
```python
from typing import List, Dict, Any, Optional
from sentence_transformers import SentenceTransformer
import numpy as np
from whoosh.index import create_index, open_dir
from whoosh.fields import Schema, TEXT, ID, DATETIME, NUMERIC
from whoosh.qparser import MultifieldParser
from whoosh.query import Term, And, Or
import os
import json
from datetime import datetime

class AdvancedSearchService:
    def __init__(self, index_dir: str = "search_index"):
        self.index_dir = index_dir
        self.semantic_model = SentenceTransformer('all-MiniLM-L6-v2')
        self.schema = Schema(
            id=ID(stored=True),
            title=TEXT(stored=True),
            content=TEXT(stored=True),
            summary=TEXT(stored=True),
            created_at=DATETIME(stored=True),
            user_id=ID(stored=True),
            embedding=TEXT(stored=True),
            tags=TEXT(stored=True),
            confidence=NUMERIC(stored=True, type=float)
        )
        self._initialize_index()
    
    def _initialize_index(self):
        """Initialize or open the search index"""
        if not os.path.exists(self.index_dir):
            os.makedirs(self.index_dir)
            self.index = create_index(self.schema, self.index_dir)
        else:
            self.index = open_dir(self.index_dir)
    
    async def index_document(self, doc_id: str, title: str, content: str, 
                           user_id: str, metadata: Dict[str, Any] = None) -> bool:
        """Index a document with semantic embeddings"""
        try:
            # Generate semantic embedding
            embedding = self.semantic_model.encode(content)
            embedding_str = json.dumps(embedding.tolist())
            
            # Create search summary
            summary = self._create_summary(content)
            
            # Extract tags
            tags = self._extract_tags(content)
            
            writer = self.index.writer()
            writer.add_document(
                id=doc_id,
                title=title,
                content=content,
                summary=summary,
                created_at=datetime.utcnow(),
                user_id=user_id,
                embedding=embedding_str,
                tags=' '.join(tags),
                confidence=1.0
            )
            writer.commit()
            return True
            
        except Exception as e:
            print(f"Error indexing document: {e}")
            return False
    
    async def search(self, query: str, user_id: str, 
                    search_type: str = "hybrid", limit: int = 10) -> List[Dict[str, Any]]:
        """Perform advanced search with multiple methods"""
        
        if search_type == "semantic":
            return await self._semantic_search(query, user_id, limit)
        elif search_type == "text":
            return await self._text_search(query, user_id, limit)
        elif search_type == "hybrid":
            return await self._hybrid_search(query, user_id, limit)
        else:
            return []
    
    async def _semantic_search(self, query: str, user_id: str, limit: int) -> List[Dict[str, Any]]:
        """Semantic search using embeddings"""
        query_embedding = self.semantic_model.encode(query)
        
        results = []
        with self.index.searcher() as searcher:
            # Get all documents for user
            user_query = Term("user_id", user_id)
            docs = searcher.search(user_query, limit=None)
            
            # Calculate similarity scores
            for doc in docs:
                doc_embedding = np.array(json.loads(doc['embedding']))
                similarity = np.dot(query_embedding, doc_embedding) / (
                    np.linalg.norm(query_embedding) * np.linalg.norm(doc_embedding)
                )
                
                if similarity > 0.3:  # Threshold for relevance
                    results.append({
                        'id': doc['id'],
                        'title': doc['title'],
                        'content': doc['content'],
                        'summary': doc['summary'],
                        'score': float(similarity),
                        'search_type': 'semantic'
                    })
        
        # Sort by similarity score
        results.sort(key=lambda x: x['score'], reverse=True)
        return results[:limit]
    
    async def _text_search(self, query: str, user_id: str, limit: int) -> List[Dict[str, Any]]:
        """Traditional text search"""
        results = []
        with self.index.searcher() as searcher:
            # Parse query for multiple fields
            parser = MultifieldParser(['title', 'content', 'summary', 'tags'], self.index.schema)
            parsed_query = parser.parse(query)
            
            # Combine with user filter
            user_query = Term("user_id", user_id)
            combined_query = And([user_query, parsed_query])
            
            docs = searcher.search(combined_query, limit=limit)
            
            for doc in docs:
                results.append({
                    'id': doc['id'],
                    'title': doc['title'],
                    'content': doc['content'],
                    'summary': doc['summary'],
                    'score': float(doc.score),
                    'search_type': 'text'
                })
        
        return results
    
    async def _hybrid_search(self, query: str, user_id: str, limit: int) -> List[Dict[str, Any]]:
        """Hybrid search combining text and semantic results"""
        text_results = await self._text_search(query, user_id, limit)
        semantic_results = await self._semantic_search(query, user_id, limit)
        
        # Combine and deduplicate results
        combined_results = {}
        
        # Add text results with weight
        for result in text_results:
            result['combined_score'] = result['score'] * 0.6  # Text weight
            combined_results[result['id']] = result
        
        # Add semantic results with weight
        for result in semantic_results:
            if result['id'] in combined_results:
                # Combine scores
                combined_results[result['id']]['combined_score'] += result['score'] * 0.4
                combined_results[result['id']]['search_type'] = 'hybrid'
            else:
                result['combined_score'] = result['score'] * 0.4  # Semantic weight
                combined_results[result['id']] = result
        
        # Sort by combined score
        final_results = list(combined_results.values())
        final_results.sort(key=lambda x: x['combined_score'], reverse=True)
        
        return final_results[:limit]
    
    def _create_summary(self, content: str, max_length: int = 200) -> str:
        """Create a summary of the content"""
        if len(content) <= max_length:
            return content
        
        # Simple extractive summarization
        sentences = content.split('.')
        summary = ""
        for sentence in sentences:
            if len(summary + sentence) <= max_length:
                summary += sentence + "."
            else:
                break
        
        return summary.strip()
    
    def _extract_tags(self, content: str) -> List[str]:
        """Extract tags from content"""
        # Simple keyword extraction
        import re
        words = re.findall(r'\b\w+\b', content.lower())
        
        # Filter for meaningful words (simple implementation)
        stop_words = {'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'must'}
        
        meaningful_words = [word for word in words if len(word) > 3 and word not in stop_words]
        
        # Get most frequent words as tags
        from collections import Counter
        word_counts = Counter(meaningful_words)
        tags = [word for word, count in word_counts.most_common(10)]
        
        return tags
    
    async def get_search_suggestions(self, query: str, user_id: str, limit: int = 5) -> List[str]:
        """Get search suggestions based on query"""
        suggestions = []
        
        with self.index.searcher() as searcher:
            # Get user's documents
            user_query = Term("user_id", user_id)
            docs = searcher.search(user_query, limit=100)
            
            # Extract frequent terms
            all_terms = []
            for doc in docs:
                all_terms.extend(doc['tags'].split())
            
            # Filter suggestions based on query
            query_lower = query.lower()
            matching_terms = [term for term in set(all_terms) if query_lower in term.lower()]
            
            # Sort by frequency
            from collections import Counter
            term_counts = Counter(matching_terms)
            suggestions = [term for term, count in term_counts.most_common(limit)]
        
        return suggestions
```

#### **Step 4: Frontend Search Interface**
**File: `frontend/src/components/AdvancedSearchPanel.tsx`**
```typescript
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet } from 'react-native';

interface SearchResult {
  id: string;
  title: string;
  content: string;
  summary: string;
  score: number;
  search_type: string;
  combined_score?: number;
}

interface SearchSuggestion {
  text: string;
  count: number;
}

interface AdvancedSearchPanelProps {
  onResultSelect: (result: SearchResult) => void;
}

export const AdvancedSearchPanel: React.FC<AdvancedSearchPanelProps> = ({
  onResultSelect
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [searchType, setSearchType] = useState<'text' | 'semantic' | 'hybrid'>('hybrid');
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (query.length > 2) {
      // Debounce search
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
      
      searchTimeout.current = setTimeout(() => {
        performSearch();
        getSuggestions();
      }, 300);
    } else {
      setResults([]);
      setSuggestions([]);
    }

    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
  }, [query, searchType]);

  const performSearch = async () => {
    if (!query.trim()) return;

    setIsSearching(true);
    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          search_type: searchType,
          limit: 20
        })
      });

      const data = await response.json();
      setResults(data.results || []);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const getSuggestions = async () => {
    if (!query.trim()) return;

    try {
      const response = await fetch(`/api/search/suggestions?query=${encodeURIComponent(query)}`);
      const data = await response.json();
      setSuggestions(data.suggestions || []);
    } catch (error) {
      console.error('Suggestions error:', error);
    }
  };

  const handleSuggestionSelect = (suggestion: string) => {
    setQuery(suggestion);
    setShowSuggestions(false);
  };

  const renderSearchResult = ({ item }: { item: SearchResult }) => (
    <TouchableOpacity
      style={styles.resultItem}
      onPress={() => onResultSelect(item)}
    >
      <View style={styles.resultHeader}>
        <Text style={styles.resultTitle}>{item.title}</Text>
        <View style={styles.scoreContainer}>
          <Text style={styles.searchType}>{item.search_type}</Text>
          <Text style={styles.score}>
            {(item.combined_score || item.score).toFixed(2)}
          </Text>
        </View>
      </View>
      <Text style={styles.resultSummary} numberOfLines={2}>
        {item.summary}
      </Text>
    </TouchableOpacity>
  );

  const renderSuggestion = ({ item }: { item: string }) => (
    <TouchableOpacity
      style={styles.suggestionItem}
      onPress={() => handleSuggestionSelect(item)}
    >
      <Text style={styles.suggestionText}>{item}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search transcripts, actions, and insights..."
          value={query}
          onChangeText={setQuery}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
        />
        
        <View style={styles.searchTypes}>
          {['text', 'semantic', 'hybrid'].map((type) => (
            <TouchableOpacity
              key={type}
              style={[
                styles.searchTypeButton,
                searchType === type && styles.searchTypeButtonActive
              ]}
              onPress={() => setSearchType(type as any)}
            >
              <Text style={[
                styles.searchTypeText,
                searchType === type && styles.searchTypeTextActive
              ]}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {showSuggestions && suggestions.length > 0 && (
        <View style={styles.suggestionsContainer}>
          <FlatList
            data={suggestions}
            renderItem={renderSuggestion}
            keyExtractor={(item) => item}
            showsVerticalScrollIndicator={false}
            style={styles.suggestionsList}
          />
        </View>
      )}

      <View style={styles.resultsContainer}>
        <View style={styles.resultsHeader}>
          <Text style={styles.resultsTitle}>
            {isSearching ? 'Searching...' : `${results.length} results`}
          </Text>
        </View>
        
        <FlatList
          data={results}
          renderItem={renderSearchResult}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          style={styles.resultsList}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  searchContainer: {
    marginBottom: 16,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  searchTypes: {
    flexDirection: 'row',
    marginTop: 8,
    justifyContent: 'space-around',
  },
  searchTypeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  searchTypeButtonActive: {
    backgroundColor: '#007AFF',
  },
  searchTypeText: {
    color: '#666',
    fontSize: 14,
  },
  searchTypeTextActive: {
    color: '#fff',
  },
  suggestionsContainer: {
    position: 'absolute',
    top: 80,
    left: 16,
    right: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    maxHeight: 200,
    zIndex: 1000,
  },
  suggestionsList: {
    maxHeight: 200,
  },
  suggestionItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  suggestionText: {
    fontSize: 16,
    color: '#333',
  },
  resultsContainer: {
    flex: 1,
  },
  resultsHeader: {
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    marginBottom: 16,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  resultsList: {
    flex: 1,
  },
  resultItem: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 8,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchType: {
    fontSize: 12,
    color: '#666',
    marginRight: 8,
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  score: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: 'bold',
  },
  resultSummary: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});
```

### **3.2 Comprehensive Analytics**

#### **Step 1: Copy Analytics Services**
```bash
# Copy analytics implementation
cp pinai/packages/backend/src/ai/analytics/action_analytics.py backend/src/analytics/
```

#### **Step 2: Analytics Dashboard Service**
**File: `backend/src/analytics/analytics_service.py`**
```python
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
import pandas as pd
from sqlalchemy import text
from collections import defaultdict, Counter
import json

class AnalyticsService:
    def __init__(self, database_service):
        self.db = database_service
    
    async def get_user_analytics(self, user_id: str, timeframe: str = "7d") -> Dict[str, Any]:
        """Get comprehensive user analytics"""
        
        # Parse timeframe
        days = int(timeframe.replace('d', ''))
        start_date = datetime.utcnow() - timedelta(days=days)
        
        # Get basic metrics
        basic_metrics = await self._get_basic_metrics(user_id, start_date)
        
        # Get AI performance metrics
        ai_metrics = await self._get_ai_performance(user_id, start_date)
        
        # Get action analytics
        action_analytics = await self._get_action_analytics(user_id, start_date)
        
        # Get search analytics
        search_analytics = await self._get_search_analytics(user_id, start_date)
        
        # Get sync performance
        sync_performance = await self._get_sync_performance(user_id, start_date)
        
        return {
            "user_id": user_id,
            "timeframe": timeframe,
            "generated_at": datetime.utcnow().isoformat(),
            "basic_metrics": basic_metrics,
            "ai_performance": ai_metrics,
            "action_analytics": action_analytics,
            "search_analytics": search_analytics,
            "sync_performance": sync_performance
        }
    
    async def _get_basic_metrics(self, user_id: str, start_date: datetime) -> Dict[str, Any]:
        """Get basic usage metrics"""
        query = text("""
            SELECT 
                COUNT(DISTINCT t.id) as total_transcripts,
                COUNT(DISTINCT CASE WHEN t.created_at >= :start_date THEN t.id END) as recent_transcripts,
                COUNT(DISTINCT a.id) as total_actions,
                COUNT(DISTINCT CASE WHEN a.created_at >= :start_date THEN a.id END) as recent_actions,
                COUNT(DISTINCT CASE WHEN a.status = 'completed' THEN a.id END) as completed_actions,
                AVG(CASE WHEN a.confidence IS NOT NULL THEN a.confidence END) as avg_confidence
            FROM transcripts t
            LEFT JOIN actions a ON t.user_id = a.user_id
            WHERE t.user_id = :user_id
        """)
        
        result = await self.db.execute(query, {
            "user_id": user_id,
            "start_date": start_date
        })
        
        row = result.fetchone()
        
        return {
            "total_transcripts": row[0] or 0,
            "recent_transcripts": row[1] or 0,
            "total_actions": row[2] or 0,
            "recent_actions": row[3] or 0,
            "completed_actions": row[4] or 0,
            "avg_confidence": float(row[5]) if row[5] else 0.0
        }
    
    async def _get_ai_performance(self, user_id: str, start_date: datetime) -> Dict[str, Any]:
        """Get AI performance metrics"""
        query = text("""
            SELECT 
                a.action_type,
                COUNT(*) as total_suggested,
                COUNT(CASE WHEN a.status = 'approved' THEN 1 END) as approved_count,
                COUNT(CASE WHEN a.status = 'rejected' THEN 1 END) as rejected_count,
                COUNT(CASE WHEN a.status = 'completed' THEN 1 END) as completed_count,
                AVG(a.confidence) as avg_confidence
            FROM actions a
            WHERE a.user_id = :user_id AND a.created_at >= :start_date
            GROUP BY a.action_type
        """)
        
        result = await self.db.execute(query, {
            "user_id": user_id,
            "start_date": start_date
        })
        
        performance_by_type = {}
        total_suggested = 0
        total_approved = 0
        
        for row in result:
            action_type = row[0]
            suggested = row[1]
            approved = row[2]
            rejected = row[3]
            completed = row[4]
            confidence = row[5]
            
            approval_rate = (approved / suggested) * 100 if suggested > 0 else 0
            completion_rate = (completed / suggested) * 100 if suggested > 0 else 0
            
            performance_by_type[action_type] = {
                "suggested": suggested,
                "approved": approved,
                "rejected": rejected,
                "completed": completed,
                "approval_rate": approval_rate,
                "completion_rate": completion_rate,
                "avg_confidence": float(confidence) if confidence else 0.0
            }
            
            total_suggested += suggested
            total_approved += approved
        
        overall_approval_rate = (total_approved / total_suggested) * 100 if total_suggested > 0 else 0
        
        return {
            "overall_approval_rate": overall_approval_rate,
            "performance_by_type": performance_by_type,
            "total_suggestions": total_suggested
        }
    
    async def _get_action_analytics(self, user_id: str, start_date: datetime) -> Dict[str, Any]:
        """Get detailed action analytics"""
        query = text("""
            SELECT 
                DATE(a.created_at) as date,
                a.action_type,
                COUNT(*) as count,
                AVG(a.confidence) as avg_confidence
            FROM actions a
            WHERE a.user_id = :user_id AND a.created_at >= :start_date
            GROUP BY DATE(a.created_at), a.action_type
            ORDER BY date DESC
        """)
        
        result = await self.db.execute(query, {
            "user_id": user_id,
            "start_date": start_date
        })
        
        daily_actions = defaultdict(lambda: defaultdict(int))
        action_trends = defaultdict(list)
        
        for row in result:
            date = row[0].isoformat()
            action_type = row[1]
            count = row[2]
            confidence = row[3]
            
            daily_actions[date][action_type] = count
            action_trends[action_type].append({
                "date": date,
                "count": count,
                "avg_confidence": float(confidence) if confidence else 0.0
            })
        
        return {
            "daily_actions": dict(daily_actions),
            "action_trends": dict(action_trends)
        }
    
    async def _get_search_analytics(self, user_id: str, start_date: datetime) -> Dict[str, Any]:
        """Get search analytics"""
        # This would require search logging implementation
        return {
            "total_searches": 0,
            "avg_results_per_search": 0,
            "most_searched_terms": [],
            "search_success_rate": 0
        }
    
    async def _get_sync_performance(self, user_id: str, start_date: datetime) -> Dict[str, Any]:
        """Get sync performance metrics"""
        query = text("""
            SELECT 
                COUNT(*) as total_syncs,
                COUNT(CASE WHEN success = true THEN 1 END) as successful_syncs,
                AVG(EXTRACT(EPOCH FROM (completed_at - started_at))) as avg_duration,
                SUM(transcripts_synced) as total_transcripts_synced,
                SUM(api_calls_made) as total_api_calls
            FROM sync_logs
            WHERE user_id = :user_id AND started_at >= :start_date
        """)
        
        result = await self.db.execute(query, {
            "user_id": user_id,
            "start_date": start_date
        })
        
        row = result.fetchone()
        
        total_syncs = row[0] or 0
        successful_syncs = row[1] or 0
        avg_duration = row[2] or 0
        total_transcripts = row[3] or 0
        total_api_calls = row[4] or 0
        
        success_rate = (successful_syncs / total_syncs) * 100 if total_syncs > 0 else 0
        efficiency = total_transcripts / total_api_calls if total_api_calls > 0 else 0
        
        return {
            "total_syncs": total_syncs,
            "success_rate": success_rate,
            "avg_duration": avg_duration,
            "total_transcripts_synced": total_transcripts,
            "sync_efficiency": efficiency
        }
    
    async def get_word_frequency_analysis(self, user_id: str, timeframe: str = "30d") -> Dict[str, Any]:
        """Get word frequency analysis from transcripts"""
        days = int(timeframe.replace('d', ''))
        start_date = datetime.utcnow() - timedelta(days=days)
        
        query = text("""
            SELECT content FROM transcripts
            WHERE user_id = :user_id AND created_at >= :start_date
        """)
        
        result = await self.db.execute(query, {
            "user_id": user_id,
            "start_date": start_date
        })
        
        all_text = ' '.join([row[0] for row in result if row[0]])
        
        # Simple word frequency analysis
        import re
        words = re.findall(r'\b\w+\b', all_text.lower())
        
        # Filter stop words
        stop_words = {'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'must', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them', 'my', 'your', 'his', 'her', 'its', 'our', 'their'}
        
        filtered_words = [word for word in words if len(word) > 2 and word not in stop_words]
        
        word_counts = Counter(filtered_words)
        
        return {
            "total_words": len(words),
            "unique_words": len(set(words)),
            "top_words": word_counts.most_common(50),
            "word_frequency": dict(word_counts)
        }
```

#### **Step 3: Analytics Dashboard Component**
**File: `frontend/src/components/AnalyticsDashboard.tsx`**
```typescript
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Dimensions } from 'react-native';

interface AnalyticsData {
  basic_metrics: {
    total_transcripts: number;
    recent_transcripts: number;
    total_actions: number;
    recent_actions: number;
    completed_actions: number;
    avg_confidence: number;
  };
  ai_performance: {
    overall_approval_rate: number;
    performance_by_type: Record<string, any>;
    total_suggestions: number;
  };
  sync_performance: {
    total_syncs: number;
    success_rate: number;
    avg_duration: number;
    sync_efficiency: number;
  };
}

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  color?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, subtitle, color = '#007AFF' }) => (
  <View style={[styles.metricCard, { borderLeftColor: color }]}>
    <Text style={styles.metricTitle}>{title}</Text>
    <Text style={[styles.metricValue, { color }]}>{value}</Text>
    {subtitle && <Text style={styles.metricSubtitle}>{subtitle}</Text>}
  </View>
);

export const AnalyticsDashboard: React.FC = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('7d');

  useEffect(() => {
    fetchAnalytics();
  }, [timeframe]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/analytics/user?timeframe=${timeframe}`);
      const data = await response.json();
      setAnalytics(data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading analytics...</Text>
      </View>
    );
  }

  if (!analytics) {
    return (
      <View style={styles.errorContainer}>
        <Text>Error loading analytics</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Analytics Dashboard</Text>
        <Text style={styles.headerSubtitle}>Last {timeframe}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Usage Overview</Text>
        <View style={styles.metricsGrid}>
          <MetricCard
            title="Total Transcripts"
            value={analytics.basic_metrics.total_transcripts}
            subtitle={`${analytics.basic_metrics.recent_transcripts} recent`}
            color="#34C759"
          />
          <MetricCard
            title="Actions Generated"
            value={analytics.basic_metrics.total_actions}
            subtitle={`${analytics.basic_metrics.recent_actions} recent`}
            color="#FF9500"
          />
          <MetricCard
            title="Actions Completed"
            value={analytics.basic_metrics.completed_actions}
            subtitle={`${(analytics.basic_metrics.completed_actions / analytics.basic_metrics.total_actions * 100).toFixed(1)}% completion rate`}
            color="#007AFF"
          />
          <MetricCard
            title="AI Confidence"
            value={`${(analytics.basic_metrics.avg_confidence * 100).toFixed(1)}%`}
            subtitle="Average confidence"
            color="#5856D6"
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>AI Performance</Text>
        <View style={styles.metricsGrid}>
          <MetricCard
            title="Approval Rate"
            value={`${analytics.ai_performance.overall_approval_rate.toFixed(1)}%`}
            subtitle="Overall approval rate"
            color="#34C759"
          />
          <MetricCard
            title="Total Suggestions"
            value={analytics.ai_performance.total_suggestions}
            subtitle="AI-generated suggestions"
            color="#FF9500"
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Sync Performance</Text>
        <View style={styles.metricsGrid}>
          <MetricCard
            title="Sync Success Rate"
            value={`${analytics.sync_performance.success_rate.toFixed(1)}%`}
            subtitle={`${analytics.sync_performance.total_syncs} total syncs`}
            color="#34C759"
          />
          <MetricCard
            title="Avg Sync Duration"
            value={`${analytics.sync_performance.avg_duration.toFixed(1)}s`}
            subtitle="Average sync time"
            color="#FF9500"
          />
          <MetricCard
            title="Sync Efficiency"
            value={analytics.sync_performance.sync_efficiency.toFixed(1)}
            subtitle="Transcripts per API call"
            color="#007AFF"
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Action Types Performance</Text>
        {Object.entries(analytics.ai_performance.performance_by_type).map(([type, data]: [string, any]) => (
          <View key={type} style={styles.actionTypeCard}>
            <Text style={styles.actionTypeTitle}>{type.replace('_', ' ').toUpperCase()}</Text>
            <View style={styles.actionTypeMetrics}>
              <Text style={styles.actionTypeMetric}>
                Suggested: {data.suggested}
              </Text>
              <Text style={styles.actionTypeMetric}>
                Approved: {data.approved} ({data.approval_rate.toFixed(1)}%)
              </Text>
              <Text style={styles.actionTypeMetric}>
                Completed: {data.completed} ({data.completion_rate.toFixed(1)}%)
              </Text>
              <Text style={styles.actionTypeMetric}>
                Avg Confidence: {(data.avg_confidence * 100).toFixed(1)}%
              </Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  section: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  metricCard: {
    width: '48%',
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    marginBottom: 12,
  },
  metricTitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  metricSubtitle: {
    fontSize: 12,
    color: '#999',
  },
  actionTypeCard: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  actionTypeTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  actionTypeMetrics: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionTypeMetric: {
    fontSize: 14,
    color: '#666',
    width: '48%',
    marginBottom: 4,
  },
});
```

### **3.3 Full Google Workspace Automation**

#### **Step 1: Copy Google Services**
```bash
# Copy Google services integration
cp pinai/packages/backend/src/services/google_tasks_service.py backend/src/services/
cp pinai/packages/backend/src/mcp_servers/google_server.py backend/src/mcp_servers/
```

#### **Step 2: Google Workspace Integration Service**
**File: `backend/src/services/google_workspace_service.py`**
```python
from typing import Dict, Any, List, Optional
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
import base64
import email.mime.text
import email.mime.multipart
import email.mime.base
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)

class GoogleWorkspaceService:
    def __init__(self, credentials: Credentials):
        self.credentials = credentials
        self.services = {}
    
    def _get_service(self, service_name: str, version: str):
        """Get or create a Google API service"""
        key = f"{service_name}_{version}"
        if key not in self.services:
            self.services[key] = build(service_name, version, credentials=self.credentials)
        return self.services[key]
    
    # Calendar Operations
    async def create_calendar_event(self, event_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a comprehensive calendar event"""
        try:
            service = self._get_service('calendar', 'v3')
            
            # Enhanced event creation with smart defaults
            event = {
                'summary': event_data.get('title', 'Meeting'),
                'description': event_data.get('description', ''),
                'start': {
                    'dateTime': event_data.get('start_time'),
                    'timeZone': event_data.get('timezone', 'UTC'),
                },
                'end': {
                    'dateTime': event_data.get('end_time'),
                    'timeZone': event_data.get('timezone', 'UTC'),
                },
                'attendees': [
                    {'email': email} for email in event_data.get('attendees', [])
                ],
                'reminders': {
                    'useDefault': False,
                    'overrides': [
                        {'method': 'email', 'minutes': 24 * 60},
                        {'method': 'popup', 'minutes': 10},
                    ],
                },
                'conferenceData': {
                    'createRequest': {
                        'requestId': f"meet-{datetime.utcnow().timestamp()}",
                        'conferenceSolutionKey': {'type': 'hangoutsMeet'}
                    }
                } if event_data.get('create_meet', False) else None
            }
            
            created_event = service.events().insert(
                calendarId='primary',
                body=event,
                conferenceDataVersion=1 if event_data.get('create_meet', False) else 0
            ).execute()
            
            return {
                'success': True,
                'event_id': created_event['id'],
                'html_link': created_event['htmlLink'],
                'meet_link': created_event.get('conferenceData', {}).get('entryPoints', [{}])[0].get('uri') if event_data.get('create_meet', False) else None
            }
            
        except HttpError as e:
            logger.error(f"Calendar event creation failed: {e}")
            return {'success': False, 'error': str(e)}
    
    async def get_calendar_events(self, start_date: str, end_date: str) -> List[Dict[str, Any]]:
        """Get calendar events in date range"""
        try:
            service = self._get_service('calendar', 'v3')
            
            events_result = service.events().list(
                calendarId='primary',
                timeMin=start_date,
                timeMax=end_date,
                singleEvents=True,
                orderBy='startTime'
            ).execute()
            
            events = events_result.get('items', [])
            
            formatted_events = []
            for event in events:
                formatted_events.append({
                    'id': event['id'],
                    'title': event.get('summary', 'No Title'),
                    'start': event['start'].get('dateTime', event['start'].get('date')),
                    'end': event['end'].get('dateTime', event['end'].get('date')),
                    'description': event.get('description', ''),
                    'attendees': [attendee.get('email') for attendee in event.get('attendees', [])],
                    'location': event.get('location', ''),
                    'html_link': event.get('htmlLink', '')
                })
            
            return formatted_events
            
        except HttpError as e:
            logger.error(f"Calendar events fetch failed: {e}")
            return []
    
    # Tasks Operations
    async def create_task(self, task_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a Google Task with enhanced features"""
        try:
            service = self._get_service('tasks', 'v1')
            
            task = {
                'title': task_data.get('title', 'Task'),
                'notes': task_data.get('description', ''),
                'due': task_data.get('due_date'),
                'status': 'needsAction'
            }
            
            # Create in specific tasklist if provided
            tasklist_id = task_data.get('tasklist_id', '@default')
            
            created_task = service.tasks().insert(
                tasklist=tasklist_id,
                body=task
            ).execute()
            
            return {
                'success': True,
                'task_id': created_task['id'],
                'title': created_task['title'],
                'due': created_task.get('due'),
                'tasklist_id': tasklist_id
            }
            
        except HttpError as e:
            logger.error(f"Task creation failed: {e}")
            return {'success': False, 'error': str(e)}
    
    async def get_tasks(self, tasklist_id: str = '@default') -> List[Dict[str, Any]]:
        """Get all tasks from a tasklist"""
        try:
            service = self._get_service('tasks', 'v1')
            
            tasks_result = service.tasks().list(tasklist=tasklist_id).execute()
            tasks = tasks_result.get('items', [])
            
            formatted_tasks = []
            for task in tasks:
                formatted_tasks.append({
                    'id': task['id'],
                    'title': task.get('title', 'No Title'),
                    'notes': task.get('notes', ''),
                    'due': task.get('due'),
                    'status': task.get('status', 'needsAction'),
                    'completed': task.get('completed'),
                    'updated': task.get('updated')
                })
            
            return formatted_tasks
            
        except HttpError as e:
            logger.error(f"Tasks fetch failed: {e}")
            return []
    
    # Gmail Operations
    async def send_email(self, email_data: Dict[str, Any]) -> Dict[str, Any]:
        """Send email with enhanced features"""
        try:
            service = self._get_service('gmail', 'v1')
            
            message = email.mime.multipart.MIMEMultipart()
            message['to'] = ', '.join(email_data.get('to', []))
            message['cc'] = ', '.join(email_data.get('cc', []))
            message['bcc'] = ', '.join(email_data.get('bcc', []))
            message['subject'] = email_data.get('subject', 'No Subject')
            
            # Add body
            body = email.mime.text.MIMEText(email_data.get('body', ''), 'html' if email_data.get('html', False) else 'plain')
            message.attach(body)
            
            # Add attachments if any
            for attachment in email_data.get('attachments', []):
                with open(attachment['path'], 'rb') as f:
                    attachment_data = f.read()
                
                part = email.mime.base.MIMEBase('application', 'octet-stream')
                part.set_payload(attachment_data)
                email.encoders.encode_base64(part)
                part.add_header(
                    'Content-Disposition',
                    f'attachment; filename= {attachment["name"]}'
                )
                message.attach(part)
            
            # Encode message
            raw_message = base64.urlsafe_b64encode(message.as_bytes()).decode()
            
            sent_message = service.users().messages().send(
                userId='me',
                body={'raw': raw_message}
            ).execute()
            
            return {
                'success': True,
                'message_id': sent_message['id'],
                'thread_id': sent_message.get('threadId')
            }
            
        except HttpError as e:
            logger.error(f"Email send failed: {e}")
            return {'success': False, 'error': str(e)}
    
    async def get_emails(self, query: str = '', max_results: int = 10) -> List[Dict[str, Any]]:
        """Get emails with search query"""
        try:
            service = self._get_service('gmail', 'v1')
            
            results = service.users().messages().list(
                userId='me',
                q=query,
                maxResults=max_results
            ).execute()
            
            messages = results.get('messages', [])
            
            formatted_emails = []
            for message in messages:
                msg = service.users().messages().get(
                    userId='me',
                    id=message['id']
                ).execute()
                
                headers = msg['payload'].get('headers', [])
                subject = next((h['value'] for h in headers if h['name'] == 'Subject'), 'No Subject')
                from_email = next((h['value'] for h in headers if h['name'] == 'From'), 'Unknown')
                date = next((h['value'] for h in headers if h['name'] == 'Date'), 'Unknown')
                
                formatted_emails.append({
                    'id': message['id'],
                    'thread_id': msg['threadId'],
                    'subject': subject,
                    'from': from_email,
                    'date': date,
                    'snippet': msg['snippet']
                })
            
            return formatted_emails
            
        except HttpError as e:
            logger.error(f"Emails fetch failed: {e}")
            return []
    
    # Drive Operations
    async def create_document(self, doc_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a Google Doc"""
        try:
            service = self._get_service('docs', 'v1')
            
            document = {
                'title': doc_data.get('title', 'Untitled Document')
            }
            
            created_doc = service.documents().create(body=document).execute()
            
            # Add content if provided
            if doc_data.get('content'):
                requests = [{
                    'insertText': {
                        'location': {'index': 1},
                        'text': doc_data['content']
                    }
                }]
                
                service.documents().batchUpdate(
                    documentId=created_doc['documentId'],
                    body={'requests': requests}
                ).execute()
            
            return {
                'success': True,
                'document_id': created_doc['documentId'],
                'title': created_doc['title'],
                'revision_id': created_doc['revisionId']
            }
            
        except HttpError as e:
            logger.error(f"Document creation failed: {e}")
            return {'success': False, 'error': str(e)}
    
    async def create_spreadsheet(self, sheet_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a Google Spreadsheet"""
        try:
            service = self._get_service('sheets', 'v4')
            
            spreadsheet = {
                'properties': {
                    'title': sheet_data.get('title', 'Untitled Spreadsheet')
                }
            }
            
            created_sheet = service.spreadsheets().create(body=spreadsheet).execute()
            
            # Add data if provided
            if sheet_data.get('data'):
                values = {
                    'values': sheet_data['data']
                }
                
                service.spreadsheets().values().update(
                    spreadsheetId=created_sheet['spreadsheetId'],
                    range='A1',
                    valueInputOption='RAW',
                    body=values
                ).execute()
            
            return {
                'success': True,
                'spreadsheet_id': created_sheet['spreadsheetId'],
                'title': created_sheet['properties']['title'],
                'url': created_sheet['spreadsheetUrl']
            }
            
        except HttpError as e:
            logger.error(f"Spreadsheet creation failed: {e}")
            return {'success': False, 'error': str(e)}
```

---

## **📊 Phase 3 Success Metrics**

### **Validation Checklist**
- [ ] Advanced search returns relevant results across all search types
- [ ] Analytics dashboard displays comprehensive metrics
- [ ] Google Workspace integration works for all services
- [ ] Search suggestions provide helpful autocomplete
- [ ] Word frequency analysis processes transcript data
- [ ] Performance metrics track system efficiency

### **Performance Targets**
- **Search Response Time**: <500ms for text search, <2s for semantic search
- **Analytics Generation**: <3s for comprehensive user analytics
- **Google API Calls**: <2s response time for Workspace operations
- **Search Accuracy**: >85% relevance for top 10 results

### **Testing Commands**
```bash
# Test advanced search
curl -X POST http://localhost:9000/api/search \
  -H "Content-Type: application/json" \
  -d '{"query": "meeting notes", "search_type": "hybrid", "limit": 10}'

# Test analytics
curl http://localhost:9000/api/analytics/user?timeframe=7d

# Test Google Workspace
curl -X POST http://localhost:9000/api/google/calendar/events \
  -H "Content-Type: application/json" \
  -d '{"title": "Team Meeting", "start_time": "2024-01-15T10:00:00Z", "end_time": "2024-01-15T11:00:00Z"}'

# Test search suggestions
curl http://localhost:9000/api/search/suggestions?query=meet
```

---

## **🚀 Phase 4: Polish and Scale Preparation (Weeks 7-8)**

### **4.1 Performance Optimization**

#### **Step 1: Caching Layer Implementation**
**File: `backend/src/cache/cache_service.py`**
```python
import redis
import json
from typing import Any, Optional
from datetime import datetime, timedelta
import pickle
import logging

logger = logging.getLogger(__name__)

class CacheService:
    def __init__(self, redis_url: str = "redis://localhost:6379"):
        self.redis_client = redis.from_url(redis_url)
        self.default_ttl = 3600  # 1 hour
    
    async def get(self, key: str) -> Optional[Any]:
        """Get value from cache"""
        try:
            cached_value = self.redis_client.get(key)
            if cached_value:
                return pickle.loads(cached_value)
            return None
        except Exception as e:
            logger.error(f"Cache get error: {e}")
            return None
    
    async def set(self, key: str, value: Any, ttl: Optional[int] = None) -> bool:
        """Set value in cache with TTL"""
        try:
            serialized_value = pickle.dumps(value)
            ttl = ttl or self.default_ttl
            return self.redis_client.setex(key, ttl, serialized_value)
        except Exception as e:
            logger.error(f"Cache set error: {e}")
            return False
    
    async def delete(self, key: str) -> bool:
        """Delete key from cache"""
        try:
            return bool(self.redis_client.delete(key))
        except Exception as e:
            logger.error(f"Cache delete error: {e}")
            return False
    
    async def clear_pattern(self, pattern: str) -> int:
        """Clear all keys matching pattern"""
        try:
            keys = self.redis_client.keys(pattern)
            if keys:
                return self.redis_client.delete(*keys)
            return 0
        except Exception as e:
            logger.error(f"Cache clear pattern error: {e}")
            return 0
    
    def cache_key(self, prefix: str, *args) -> str:
        """Generate cache key from prefix and arguments"""
        key_parts = [prefix] + [str(arg) for arg in args]
        return ":".join(key_parts)

# Global cache instance
cache = CacheService()
```

#### **Step 2: Database Connection Pooling**
**File: `backend/src/database/connection_pool.py`**
```python
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import QueuePool
import os
from contextlib import asynccontextmanager
import logging

logger = logging.getLogger(__name__)

class DatabaseManager:
    def __init__(self):
        self.database_url = os.getenv("DATABASE_URL", "postgresql://user:password@localhost/db")
        self.engine = create_engine(
            self.database_url,
            poolclass=QueuePool,
            pool_size=20,
            max_overflow=30,
            pool_pre_ping=True,
            pool_recycle=3600,
            echo=False
        )
        self.SessionLocal = sessionmaker(bind=self.engine)
    
    @asynccontextmanager
    async def get_session(self):
        """Get database session with automatic cleanup"""
        session = self.SessionLocal()
        try:
            yield session
            session.commit()
        except Exception as e:
            session.rollback()
            logger.error(f"Database session error: {e}")
            raise
        finally:
            session.close()
    
    async def health_check(self) -> bool:
        """Check database connection health"""
        try:
            async with self.get_session() as session:
                session.execute("SELECT 1")
                return True
        except Exception as e:
            logger.error(f"Database health check failed: {e}")
            return False

# Global database manager
db_manager = DatabaseManager()
```

#### **Step 3: API Rate Limiting**
**File: `backend/src/middleware/rate_limiter.py`**
```python
from fastapi import Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware
import time
from collections import defaultdict, deque
from typing import Dict, Deque
import logging

logger = logging.getLogger(__name__)

class RateLimiter:
    def __init__(self, requests_per_minute: int = 60):
        self.requests_per_minute = requests_per_minute
        self.requests: Dict[str, Deque[float]] = defaultdict(deque)
    
    def is_allowed(self, client_id: str) -> bool:
        """Check if request is allowed for client"""
        now = time.time()
        minute_ago = now - 60
        
        # Clean old requests
        client_requests = self.requests[client_id]
        while client_requests and client_requests[0] < minute_ago:
            client_requests.popleft()
        
        # Check if under limit
        if len(client_requests) >= self.requests_per_minute:
            return False
        
        # Add current request
        client_requests.append(now)
        return True
    
    def get_remaining_requests(self, client_id: str) -> int:
        """Get remaining requests for client"""
        return max(0, self.requests_per_minute - len(self.requests[client_id]))

class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, requests_per_minute: int = 60):
        super().__init__(app)
        self.rate_limiter = RateLimiter(requests_per_minute)
    
    async def dispatch(self, request: Request, call_next):
        # Get client identifier
        client_id = request.client.host
        
        # Check if user is authenticated and use user ID
        if hasattr(request.state, 'user_id'):
            client_id = request.state.user_id
        
        # Check rate limit
        if not self.rate_limiter.is_allowed(client_id):
            remaining = self.rate_limiter.get_remaining_requests(client_id)
            logger.warning(f"Rate limit exceeded for client {client_id}")
            raise HTTPException(
                status_code=429,
                detail="Rate limit exceeded",
                headers={"X-RateLimit-Remaining": str(remaining)}
            )
        
        response = await call_next(request)
        
        # Add rate limit headers
        remaining = self.rate_limiter.get_remaining_requests(client_id)
        response.headers["X-RateLimit-Limit"] = str(self.rate_limiter.requests_per_minute)
        response.headers["X-RateLimit-Remaining"] = str(remaining)
        
        return response
```

#### **Step 4: Frontend Performance Optimization**
**File: `frontend/src/utils/performance.ts`**
```typescript
import { useCallback, useRef, useEffect } from 'react';

// Debounce hook for performance optimization
export const useDebounce = (callback: (...args: any[]) => void, delay: number) => {
  const timeoutRef = useRef<NodeJS.Timeout>();
  
  const debouncedCallback = useCallback((...args: any[]) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      callback(...args);
    }, delay);
  }, [callback, delay]);
  
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);
  
  return debouncedCallback;
};

// Throttle hook for performance optimization
export const useThrottle = (callback: (...args: any[]) => void, delay: number) => {
  const lastCallRef = useRef<number>(0);
  
  const throttledCallback = useCallback((...args: any[]) => {
    const now = Date.now();
    if (now - lastCallRef.current >= delay) {
      lastCallRef.current = now;
      callback(...args);
    }
  }, [callback, delay]);
  
  return throttledCallback;
};

// Lazy loading utility
export const LazyComponent = ({ 
  children, 
  placeholder = <div>Loading...</div> 
}: { 
  children: React.ReactNode;
  placeholder?: React.ReactNode;
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    
    if (ref.current) {
      observer.observe(ref.current);
    }
    
    return () => observer.disconnect();
  }, []);
  
  return (
    <div ref={ref}>
      {isVisible ? children : placeholder}
    </div>
  );
};

// Performance metrics tracking
export class PerformanceTracker {
  private metrics: Map<string, number> = new Map();
  
  startTracking(operation: string): void {
    this.metrics.set(operation, performance.now());
  }
  
  endTracking(operation: string): number {
    const startTime = this.metrics.get(operation);
    if (!startTime) {
      console.warn(`No start time found for operation: ${operation}`);
      return 0;
    }
    
    const duration = performance.now() - startTime;
    this.metrics.delete(operation);
    
    // Log slow operations
    if (duration > 1000) {
      console.warn(`Slow operation detected: ${operation} took ${duration}ms`);
    }
    
    return duration;
  }
  
  trackAsync = async <T>(operation: string, asyncFn: () => Promise<T>): Promise<T> => {
    this.startTracking(operation);
    try {
      const result = await asyncFn();
      this.endTracking(operation);
      return result;
    } catch (error) {
      this.endTracking(operation);
      throw error;
    }
  };
}

export const performanceTracker = new PerformanceTracker();
```

### **4.2 Monitoring and Observability**

#### **Step 1: Metrics Collection**
**File: `backend/src/monitoring/metrics.py`**
```python
from prometheus_client import Counter, Histogram, Gauge, generate_latest
import time
from functools import wraps
import logging

logger = logging.getLogger(__name__)

# Metrics definitions
REQUEST_COUNT = Counter('requests_total', 'Total requests', ['method', 'endpoint', 'status'])
REQUEST_DURATION = Histogram('request_duration_seconds', 'Request duration', ['method', 'endpoint'])
ACTIVE_CONNECTIONS = Gauge('active_connections', 'Active connections')
SYNC_OPERATIONS = Counter('sync_operations_total', 'Total sync operations', ['status'])
AI_PROCESSING_TIME = Histogram('ai_processing_seconds', 'AI processing time', ['operation'])
CACHE_HITS = Counter('cache_hits_total', 'Cache hits', ['operation'])
CACHE_MISSES = Counter('cache_misses_total', 'Cache misses', ['operation'])
DATABASE_QUERIES = Counter('database_queries_total', 'Database queries', ['operation'])
ERROR_COUNT = Counter('errors_total', 'Total errors', ['error_type'])

class MetricsCollector:
    def __init__(self):
        self.start_time = time.time()
    
    def record_request(self, method: str, endpoint: str, status_code: int, duration: float):
        """Record HTTP request metrics"""
        REQUEST_COUNT.labels(method=method, endpoint=endpoint, status=str(status_code)).inc()
        REQUEST_DURATION.labels(method=method, endpoint=endpoint).observe(duration)
    
    def record_sync_operation(self, success: bool):
        """Record sync operation metrics"""
        status = 'success' if success else 'failure'
        SYNC_OPERATIONS.labels(status=status).inc()
    
    def record_ai_processing(self, operation: str, duration: float):
        """Record AI processing metrics"""
        AI_PROCESSING_TIME.labels(operation=operation).observe(duration)
    
    def record_cache_hit(self, operation: str):
        """Record cache hit"""
        CACHE_HITS.labels(operation=operation).inc()
    
    def record_cache_miss(self, operation: str):
        """Record cache miss"""
        CACHE_MISSES.labels(operation=operation).inc()
    
    def record_database_query(self, operation: str):
        """Record database query"""
        DATABASE_QUERIES.labels(operation=operation).inc()
    
    def record_error(self, error_type: str):
        """Record error"""
        ERROR_COUNT.labels(error_type=error_type).inc()
    
    def get_metrics(self) -> str:
        """Get all metrics in Prometheus format"""
        return generate_latest()

# Global metrics collector
metrics = MetricsCollector()

def track_performance(operation: str):
    """Decorator to track performance of functions"""
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            start_time = time.time()
            try:
                result = await func(*args, **kwargs)
                duration = time.time() - start_time
                metrics.record_ai_processing(operation, duration)
                return result
            except Exception as e:
                duration = time.time() - start_time
                metrics.record_error(type(e).__name__)
                metrics.record_ai_processing(operation, duration)
                raise
        return wrapper
    return decorator
```

#### **Step 2: Health Check System**
**File: `backend/src/health/health_checker.py`**
```python
from typing import Dict, Any, List
import asyncio
import time
from dataclasses import dataclass
from enum import Enum
import logging

logger = logging.getLogger(__name__)

class HealthStatus(Enum):
    HEALTHY = "healthy"
    UNHEALTHY = "unhealthy"
    DEGRADED = "degraded"

@dataclass
class HealthCheck:
    name: str
    status: HealthStatus
    response_time: float
    message: str
    timestamp: float

class HealthChecker:
    def __init__(self):
        self.checks: Dict[str, callable] = {}
        self.thresholds = {
            'response_time': 1.0,  # 1 second
            'error_rate': 0.05,    # 5%
        }
    
    def register_check(self, name: str, check_func: callable):
        """Register a health check function"""
        self.checks[name] = check_func
    
    async def run_check(self, name: str, check_func: callable) -> HealthCheck:
        """Run a single health check"""
        start_time = time.time()
        try:
            result = await check_func()
            response_time = time.time() - start_time
            
            # Determine status based on response time
            if response_time > self.thresholds['response_time']:
                status = HealthStatus.DEGRADED
                message = f"Response time {response_time:.2f}s exceeds threshold"
            else:
                status = HealthStatus.HEALTHY if result else HealthStatus.UNHEALTHY
                message = "OK" if result else "Check failed"
            
            return HealthCheck(
                name=name,
                status=status,
                response_time=response_time,
                message=message,
                timestamp=time.time()
            )
        except Exception as e:
            response_time = time.time() - start_time
            logger.error(f"Health check {name} failed: {e}")
            return HealthCheck(
                name=name,
                status=HealthStatus.UNHEALTHY,
                response_time=response_time,
                message=str(e),
                timestamp=time.time()
            )
    
    async def run_all_checks(self) -> Dict[str, HealthCheck]:
        """Run all registered health checks"""
        results = {}
        
        # Run all checks concurrently
        check_tasks = [
            self.run_check(name, check_func)
            for name, check_func in self.checks.items()
        ]
        
        if check_tasks:
            check_results = await asyncio.gather(*check_tasks)
            results = {check.name: check for check in check_results}
        
        return results
    
    async def get_system_health(self) -> Dict[str, Any]:
        """Get overall system health"""
        checks = await self.run_all_checks()
        
        # Calculate overall status
        statuses = [check.status for check in checks.values()]
        
        if not statuses:
            overall_status = HealthStatus.HEALTHY
        elif HealthStatus.UNHEALTHY in statuses:
            overall_status = HealthStatus.UNHEALTHY
        elif HealthStatus.DEGRADED in statuses:
            overall_status = HealthStatus.DEGRADED
        else:
            overall_status = HealthStatus.HEALTHY
        
        return {
            "status": overall_status.value,
            "timestamp": time.time(),
            "checks": {name: {
                "status": check.status.value,
                "response_time": check.response_time,
                "message": check.message,
                "timestamp": check.timestamp
            } for name, check in checks.items()}
        }

# Global health checker
health_checker = HealthChecker()

# Database health check
async def check_database_health():
    """Check database connectivity"""
    try:
        from .database.connection_pool import db_manager
        return await db_manager.health_check()
    except Exception as e:
        logger.error(f"Database health check failed: {e}")
        return False

# Cache health check
async def check_cache_health():
    """Check cache connectivity"""
    try:
        from .cache.cache_service import cache
        test_key = "health_check"
        await cache.set(test_key, "test", 60)
        result = await cache.get(test_key)
        await cache.delete(test_key)
        return result == "test"
    except Exception as e:
        logger.error(f"Cache health check failed: {e}")
        return False

# MCP services health check
async def check_mcp_services_health():
    """Check MCP services connectivity"""
    try:
        # This would check if MCP servers are responsive
        # Implementation depends on your MCP setup
        return True
    except Exception as e:
        logger.error(f"MCP services health check failed: {e}")
        return False

# Register health checks
health_checker.register_check("database", check_database_health)
health_checker.register_check("cache", check_cache_health)
health_checker.register_check("mcp_services", check_mcp_services_health)
```

#### **Step 3: Logging Configuration**
**File: `backend/src/logging/logging_config.py`**
```python
import logging
import logging.handlers
import json
import sys
from datetime import datetime
from typing import Dict, Any
import os

class JSONFormatter(logging.Formatter):
    """Custom JSON formatter for structured logging"""
    
    def format(self, record: logging.LogRecord) -> str:
        log_entry = {
            "timestamp": datetime.utcnow().isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno,
        }
        
        # Add exception info if present
        if record.exc_info:
            log_entry["exception"] = self.formatException(record.exc_info)
        
        # Add extra fields
        if hasattr(record, 'user_id'):
            log_entry["user_id"] = record.user_id
        if hasattr(record, 'request_id'):
            log_entry["request_id"] = record.request_id
        if hasattr(record, 'performance_metrics'):
            log_entry["performance_metrics"] = record.performance_metrics
        
        return json.dumps(log_entry)

def setup_logging(log_level: str = "INFO", log_file: str = "app.log"):
    """Setup comprehensive logging configuration"""
    
    # Create logger
    logger = logging.getLogger()
    logger.setLevel(getattr(logging, log_level.upper()))
    
    # Clear existing handlers
    logger.handlers.clear()
    
    # Console handler with JSON formatting
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(logging.INFO)
    console_handler.setFormatter(JSONFormatter())
    logger.addHandler(console_handler)
    
    # File handler with rotation
    file_handler = logging.handlers.RotatingFileHandler(
        log_file,
        maxBytes=10*1024*1024,  # 10MB
        backupCount=5
    )
    file_handler.setLevel(logging.DEBUG)
    file_handler.setFormatter(JSONFormatter())
    logger.addHandler(file_handler)
    
    # Error file handler
    error_handler = logging.handlers.RotatingFileHandler(
        "error.log",
        maxBytes=10*1024*1024,  # 10MB
        backupCount=5
    )
    error_handler.setLevel(logging.ERROR)
    error_handler.setFormatter(JSONFormatter())
    logger.addHandler(error_handler)
    
    logging.info("Logging configuration completed")
```

### **4.3 Production Deployment Preparation**

#### **Step 1: Environment Configuration**
**File: `backend/src/config/production.py`**
```python
import os
from typing import Dict, Any
import secrets

class ProductionConfig:
    """Production configuration settings"""
    
    # Database
    DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://user:password@localhost/db")
    DATABASE_POOL_SIZE = int(os.getenv("DATABASE_POOL_SIZE", "20"))
    DATABASE_MAX_OVERFLOW = int(os.getenv("DATABASE_MAX_OVERFLOW", "30"))
    
    # Redis Cache
    REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")
    CACHE_TTL = int(os.getenv("CACHE_TTL", "3600"))
    
    # Security
    SECRET_KEY = os.getenv("SECRET_KEY") or secrets.token_urlsafe(32)
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY") or secrets.token_urlsafe(32)
    JWT_ALGORITHM = "HS256"
    JWT_EXPIRE_MINUTES = int(os.getenv("JWT_EXPIRE_MINUTES", "30"))
    
    # CORS
    CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
    
    # Rate Limiting
    RATE_LIMIT_REQUESTS = int(os.getenv("RATE_LIMIT_REQUESTS", "100"))
    RATE_LIMIT_WINDOW = int(os.getenv("RATE_LIMIT_WINDOW", "60"))
    
    # External APIs
    OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
    LIMITLESS_TOKEN = os.getenv("LIMITLESS_TOKEN")
    
    # Google OAuth
    GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
    GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
    GOOGLE_REDIRECT_URI = os.getenv("GOOGLE_REDIRECT_URI")
    
    # Supabase
    SUPABASE_URL = os.getenv("SUPABASE_URL")
    SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")
    SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")
    
    # Monitoring
    SENTRY_DSN = os.getenv("SENTRY_DSN")
    LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
    
    # Performance
    WORKER_COUNT = int(os.getenv("WORKER_COUNT", "4"))
    WORKER_TIMEOUT = int(os.getenv("WORKER_TIMEOUT", "30"))
    
    @classmethod
    def validate(cls) -> Dict[str, Any]:
        """Validate required configuration"""
        required_vars = [
            "DATABASE_URL",
            "REDIS_URL",
            "SECRET_KEY",
            "OPENAI_API_KEY",
            "SUPABASE_URL",
            "SUPABASE_ANON_KEY"
        ]
        
        missing_vars = []
        for var in required_vars:
            if not getattr(cls, var):
                missing_vars.append(var)
        
        if missing_vars:
            raise ValueError(f"Missing required environment variables: {', '.join(missing_vars)}")
        
        return {
            "valid": True,
            "message": "Configuration validated successfully"
        }
```

#### **Step 2: Docker Configuration**
**File: `Dockerfile`**
```dockerfile
# Multi-stage build for production
FROM node:18-alpine AS frontend-builder

# Build frontend
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci --only=production

COPY frontend/ ./
RUN npm run build

# Python backend
FROM python:3.11-slim AS backend

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN useradd --create-home --shell /bin/bash app

# Set working directory
WORKDIR /app

# Install Python dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY backend/ ./backend/
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist/

# Change ownership to app user
RUN chown -R app:app /app

# Switch to non-root user
USER app

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Start command
CMD ["python", "-m", "uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

**File: `docker-compose.prod.yml`**
```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://postgres:password@db:5432/pinai
      - REDIS_URL=redis://redis:6379
      - LOG_LEVEL=INFO
    depends_on:
      - db
      - redis
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  db:
    image: postgres:15
    environment:
      - POSTGRES_DB=pinai
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - app
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
```

#### **Step 3: CI/CD Pipeline**
**File: `.github/workflows/deploy.yml`**
```yaml
name: Deploy to Production

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
      
      redis:
        image: redis:7
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Set up Python
      uses: actions/setup-python@v4
      with:
        python-version: '3.11'
    
    - name: Set up Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
    
    - name: Install backend dependencies
      run: |
        cd backend
        pip install -r requirements.txt
        pip install pytest pytest-asyncio
    
    - name: Install frontend dependencies
      run: |
        cd frontend
        npm ci
    
    - name: Run backend tests
      run: |
        cd backend
        pytest tests/
      env:
        DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test
        REDIS_URL: redis://localhost:6379
    
    - name: Run frontend tests
      run: |
        cd frontend
        npm test
    
    - name: Build frontend
      run: |
        cd frontend
        npm run build
  
  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Set up Docker Buildx
      uses: docker/setup-buildx-action@v2
    
    - name: Login to Container Registry
      uses: docker/login-action@v2
      with:
        registry: ghcr.io
        username: ${{ github.actor }}
        password: ${{ secrets.GITHUB_TOKEN }}
    
    - name: Build and push Docker image
      uses: docker/build-push-action@v4
      with:
        context: .
        push: true
        tags: ghcr.io/${{ github.repository }}:latest
        cache-from: type=gha
        cache-to: type=gha,mode=max
    
    - name: Deploy to production
      uses: appleboy/ssh-action@v0.1.7
      with:
        host: ${{ secrets.HOST }}
        username: ${{ secrets.USERNAME }}
        key: ${{ secrets.SSH_KEY }}
        script: |
          cd /app
          docker-compose -f docker-compose.prod.yml pull
          docker-compose -f docker-compose.prod.yml up -d
          docker system prune -f
```

### **4.4 Security Hardening**

#### **Step 1: Security Middleware**
**File: `backend/src/middleware/security.py`**
```python
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
import secrets
from typing import Dict, Any
import logging

logger = logging.getLogger(__name__)

class SecurityMiddleware(BaseHTTPMiddleware):
    def __init__(self, app):
        super().__init__(app)
        self.csp_policy = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline' 'unsafe-eval'; "
            "style-src 'self' 'unsafe-inline'; "
            "img-src 'self' data: https:; "
            "font-src 'self' https:; "
            "connect-src 'self' https:; "
            "frame-ancestors 'none';"
        )
    
    async def dispatch(self, request: Request, call_next):
        # Generate nonce for CSP
        nonce = secrets.token_urlsafe(16)
        request.state.nonce = nonce
        
        response = await call_next(request)
        
        # Security headers
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        response.headers["Content-Security-Policy"] = self.csp_policy
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
        
        # Remove server header
        response.headers.pop("Server", None)
        
        return response

class InputValidationMiddleware(BaseHTTPMiddleware):
    """Middleware for input validation and sanitization"""
    
    def __init__(self, app):
        super().__init__(app)
        self.max_request_size = 10 * 1024 * 1024  # 10MB
        self.blocked_patterns = [
            r'<script[^>]*>.*?</script>',
            r'javascript:',
            r'on\w+\s*=',
            r'expression\s*\(',
            r'@import',
            r'<%.*?%>',
        ]
    
    async def dispatch(self, request: Request, call_next):
        # Check request size
        if hasattr(request, 'content_length') and request.content_length:
            if request.content_length > self.max_request_size:
                logger.warning(f"Request size {request.content_length} exceeds limit")
                return Response("Request too large", status_code=413)
        
        # Basic XSS protection (more comprehensive validation should be done at the route level)
        if request.method in ["POST", "PUT", "PATCH"]:
            try:
                body = await request.body()
                body_str = body.decode('utf-8')
                
                # Check for suspicious patterns
                import re
                for pattern in self.blocked_patterns:
                    if re.search(pattern, body_str, re.IGNORECASE):
                        logger.warning(f"Suspicious pattern detected: {pattern}")
                        return Response("Invalid input", status_code=400)
                
                # Reset body for downstream processing
                request._body = body
                
            except Exception as e:
                logger.error(f"Error processing request body: {e}")
        
        return await call_next(request)
```

#### **Step 2: API Key Management**
**File: `backend/src/auth/api_key_manager.py`**
```python
import secrets
import hashlib
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from sqlalchemy import text
import logging

logger = logging.getLogger(__name__)

class APIKeyManager:
    def __init__(self, database_service):
        self.db = database_service
    
    async def generate_api_key(self, user_id: str, name: str, 
                             expires_days: int = 365) -> Dict[str, Any]:
        """Generate a new API key for a user"""
        # Generate secure key
        key = secrets.token_urlsafe(32)
        key_hash = hashlib.sha256(key.encode()).hexdigest()
        
        # Set expiration
        expires_at = datetime.utcnow() + timedelta(days=expires_days)
        
        # Store in database
        query = text("""
            INSERT INTO api_keys (user_id, name, key_hash, expires_at, created_at, is_active)
            VALUES (:user_id, :name, :key_hash, :expires_at, :created_at, TRUE)
            RETURNING id
        """)
        
        result = await self.db.execute(query, {
            "user_id": user_id,
            "name": name,
            "key_hash": key_hash,
            "expires_at": expires_at,
            "created_at": datetime.utcnow()
        })
        
        key_id = result.fetchone()[0]
        
        logger.info(f"Generated API key {key_id} for user {user_id}")
        
        return {
            "key_id": key_id,
            "key": key,  # Return once, never store
            "expires_at": expires_at.isoformat(),
            "name": name
        }
    
    async def validate_api_key(self, key: str) -> Optional[Dict[str, Any]]:
        """Validate an API key and return user info"""
        key_hash = hashlib.sha256(key.encode()).hexdigest()
        
        query = text("""
            SELECT ak.id, ak.user_id, ak.name, ak.expires_at, ak.last_used_at,
                   u.email, u.is_active
            FROM api_keys ak
            JOIN users u ON ak.user_id = u.id
            WHERE ak.key_hash = :key_hash 
              AND ak.is_active = TRUE
              AND ak.expires_at > :now
              AND u.is_active = TRUE
        """)
        
        result = await self.db.execute(query, {
            "key_hash": key_hash,
            "now": datetime.utcnow()
        })
        
        row = result.fetchone()
        if not row:
            return None
        
        # Update last used timestamp
        await self._update_last_used(row[0])
        
        return {
            "key_id": row[0],
            "user_id": row[1],
            "key_name": row[2],
            "expires_at": row[3],
            "last_used_at": row[4],
            "user_email": row[5],
            "user_active": row[6]
        }
    
    async def revoke_api_key(self, key_id: int, user_id: str) -> bool:
        """Revoke an API key"""
        query = text("""
            UPDATE api_keys 
            SET is_active = FALSE, revoked_at = :now
            WHERE id = :key_id AND user_id = :user_id
        """)
        
        result = await self.db.execute(query, {
            "key_id": key_id,
            "user_id": user_id,
            "now": datetime.utcnow()
        })
        
        success = result.rowcount > 0
        if success:
            logger.info(f"Revoked API key {key_id} for user {user_id}")
        
        return success
    
    async def _update_last_used(self, key_id: int):
        """Update last used timestamp for API key"""
        query = text("""
            UPDATE api_keys 
            SET last_used_at = :now
            WHERE id = :key_id
        """)
        
        await self.db.execute(query, {
            "key_id": key_id,
            "now": datetime.utcnow()
        })
```

---

## **📊 Phase 4 Success Metrics**

### **Validation Checklist**
- [ ] Caching layer reduces response times by >50%
- [ ] Rate limiting prevents abuse and DOS attacks
- [ ] Health checks provide comprehensive system status
- [ ] Monitoring collects performance and error metrics
- [ ] Security middleware blocks common attacks
- [ ] Docker containers run efficiently in production
- [ ] CI/CD pipeline deploys automatically
- [ ] API key management provides secure access

### **Performance Targets**
- **Response Time**: <100ms for cached requests, <500ms for uncached
- **Throughput**: Handle 1000+ concurrent users
- **Availability**: 99.9% uptime with health checks
- **Security**: All security headers present, input validation active

### **Production Readiness**
- **Monitoring**: Prometheus metrics, structured logging
- **Scaling**: Horizontal scaling with load balancer
- **Security**: Rate limiting, input validation, secure headers
- **Deployment**: Automated CI/CD with Docker containers

---

## **🎯 Complete Migration Summary**

### **What You'll Have After All 4 Phases**

#### **Phase 1: Core Infrastructure** ✅
- Enhanced cursor-based sync system (5x API efficiency)
- Supabase authentication with cross-platform support
- Basic MCP integration framework
- Approval workflow system with security controls

#### **Phase 2: AI Enhancement** ✅
- LangGraph workflows for intelligent query processing
- Google OAuth with full Workspace API access
- AI-powered action extraction from natural language
- Real-time updates via WebSocket connections

#### **Phase 3: Advanced Features** ✅
- Advanced search with semantic, text, and hybrid modes
- Comprehensive analytics dashboard with performance metrics
- Full Google Workspace automation (Calendar, Tasks, Gmail, Docs)
- Performance monitoring and optimization tools

#### **Phase 4: Production Ready** ✅
- Caching layer for 50%+ performance improvement
- Rate limiting and security hardening
- Comprehensive monitoring and health checks
- Production deployment with Docker and CI/CD

### **Key Benefits Achieved**
1. **5x API Efficiency**: Cursor-based sync eliminates redundant calls
2. **Real-time Experience**: Live updates across all features
3. **Enterprise Security**: Production-ready auth and security
4. **Intelligent Automation**: AI-powered workflows with approval gates
5. **Advanced Search**: Semantic search across all user data
6. **Comprehensive Analytics**: Performance tracking and insights
7. **Scalable Architecture**: Production-ready with monitoring
8. **Google Integration**: Full Workspace automation capabilities

### **Final Implementation Timeline**
- **Total Duration**: 8 weeks
- **Phase 1**: 2 weeks (Core Infrastructure)
- **Phase 2**: 2 weeks (AI Enhancement)
- **Phase 3**: 2 weeks (Advanced Features)
- **Phase 4**: 2 weeks (Production Polish)

This comprehensive migration guide transforms your current project into a production-ready, AI-powered platform with all the sophisticated features from the original PinAI project, plus additional improvements for scalability and security.

---