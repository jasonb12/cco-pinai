import { supabase } from '../config/supabase';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';

export interface TranscriptProcessRequest {
  audio_url: string;
  transcript_id: string;
}

export interface ProcessingUpdate {
  type: 'transcript_processing' | 'transcript_completed' | 'transcript_error';
  transcript_id: string;
  status: 'started' | 'completed' | 'error';
  transcript_text?: string;
  error?: string;
  progress?: number;
}

export interface MCPService {
  name: string;
  status: 'available' | 'installed' | 'error';
}

export interface MCPConnectionStatus {
  isConnected: boolean;
  isReconnecting: boolean;
  backendAvailable: boolean;
  lastError?: string;
  reconnectAttempts: number;
  maxReconnectAttempts: number;
}

class MCPServiceClient {
  private websocket: WebSocket | null = null;
  private listeners: Map<string, (update: ProcessingUpdate) => void> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 1000;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private connectionStatus: MCPConnectionStatus = {
    isConnected: false,
    isReconnecting: false,
    backendAvailable: false,
    reconnectAttempts: 0,
    maxReconnectAttempts: 5,
  };
  private statusListeners: ((status: MCPConnectionStatus) => void)[] = [];

  constructor() {
    this.checkBackendHealth();
  }

  private async checkBackendHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/health`, {
        method: 'GET',
        timeout: 5000,
      } as RequestInit);
      
      if (response.ok) {
        this.connectionStatus.backendAvailable = true;
        this.connectionStatus.lastError = undefined;
        this.notifyStatusChange();
        this.connectWebSocket();
        return true;
      }
    } catch (error) {
      this.connectionStatus.backendAvailable = false;
      this.connectionStatus.lastError = 'Backend service is not available';
      this.notifyStatusChange();
      
      // Retry health check less frequently when backend is down
      setTimeout(() => this.checkBackendHealth(), 10000);
      return false;
    }
    return false;
  }

  private connectWebSocket() {
    if (!this.connectionStatus.backendAvailable) {
      return;
    }

    try {
      this.connectionStatus.isReconnecting = true;
      this.notifyStatusChange();

      const wsUrl = API_BASE_URL.replace('http', 'ws') + '/ws';
      this.websocket = new WebSocket(wsUrl);

      this.websocket.onopen = () => {
        console.log('MCP WebSocket connected');
        this.connectionStatus.isConnected = true;
        this.connectionStatus.isReconnecting = false;
        this.connectionStatus.reconnectAttempts = 0;
        this.connectionStatus.lastError = undefined;
        this.reconnectAttempts = 0;
        this.notifyStatusChange();
      };

      this.websocket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleWebSocketMessage(data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.websocket.onclose = () => {
        console.log('MCP WebSocket disconnected');
        this.connectionStatus.isConnected = false;
        this.connectionStatus.isReconnecting = false;
        this.notifyStatusChange();
        this.attemptReconnect();
      };

      this.websocket.onerror = (error) => {
        console.warn('MCP WebSocket error:', error);
        this.connectionStatus.lastError = 'WebSocket connection failed';
        this.notifyStatusChange();
      };
    } catch (error) {
      console.error('Error connecting to WebSocket:', error);
      this.connectionStatus.lastError = 'Failed to initialize WebSocket';
      this.attemptReconnect();
    }
  }

  private attemptReconnect() {
    if (this.connectionStatus.reconnectAttempts < this.connectionStatus.maxReconnectAttempts) {
      this.connectionStatus.reconnectAttempts++;
      this.connectionStatus.isReconnecting = true;
      this.notifyStatusChange();

      const delay = Math.min(this.reconnectInterval * Math.pow(2, this.connectionStatus.reconnectAttempts - 1), 30000);
      
      console.log(`Attempting to reconnect WebSocket (${this.connectionStatus.reconnectAttempts}/${this.connectionStatus.maxReconnectAttempts})`);
      
      this.reconnectTimeout = setTimeout(() => {
        this.checkBackendHealth();
      }, delay);
    } else {
      console.warn('Max reconnection attempts reached');
      this.connectionStatus.isReconnecting = false;
      this.connectionStatus.lastError = 'Maximum reconnection attempts reached';
      this.notifyStatusChange();
    }
  }

  private notifyStatusChange() {
    this.statusListeners.forEach(listener => listener({...this.connectionStatus}));
  }

  private handleWebSocketMessage(data: any) {
    if (data.type && data.transcript_id) {
      const listener = this.listeners.get(data.transcript_id);
      if (listener) {
        listener(data as ProcessingUpdate);
      }
    }

    // Broadcast to all listeners for general updates
    this.listeners.forEach((listener, key) => {
      if (key === 'global') {
        listener(data as ProcessingUpdate);
      }
    });
  }

  // Subscribe to processing updates for a specific transcript
  subscribeToTranscript(transcriptId: string, callback: (update: ProcessingUpdate) => void) {
    this.listeners.set(transcriptId, callback);
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(transcriptId);
    };
  }

  // Subscribe to global updates
  subscribeToGlobal(callback: (update: ProcessingUpdate) => void) {
    this.listeners.set('global', callback);
    
    return () => {
      this.listeners.delete('global');
    };
  }

  // Subscribe to connection status changes
  onStatusChange(listener: (status: MCPConnectionStatus) => void) {
    this.statusListeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      const index = this.statusListeners.indexOf(listener);
      if (index > -1) {
        this.statusListeners.splice(index, 1);
      }
    };
  }

  // Get current connection status
  getConnectionStatus(): MCPConnectionStatus {
    return {...this.connectionStatus};
  }

  // Retry connection
  retryConnection() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }
    this.connectionStatus.reconnectAttempts = 0;
    this.checkBackendHealth();
  }

  // List available MCP services
  async listMCPServices(): Promise<MCPService[]> {
    if (!this.connectionStatus.backendAvailable) {
      throw new Error('Backend service is not available. Please check your connection.');
    }

    try {
      const response = await fetch(`${API_BASE_URL}/mcp/list`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to list MCP services');
      }
      
      return data.mcps || [];
    } catch (error) {
      console.error('Error listing MCP services:', error);
      throw error;
    }
  }

  // Install an MCP service
  async installMCPService(serviceName: string): Promise<void> {
    if (!this.connectionStatus.backendAvailable) {
      throw new Error('Backend service is not available. Please check your connection.');
    }

    try {
      const response = await fetch(`${API_BASE_URL}/mcp/install`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: serviceName }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.detail || 'Failed to install MCP service');
      }
    } catch (error) {
      console.error('Error installing MCP service:', error);
      throw error;
    }
  }

  // Process a transcript using MCP services
  async processTranscript(request: TranscriptProcessRequest): Promise<void> {
    if (!this.connectionStatus.backendAvailable) {
      throw new Error('Backend service is not available. Processing will be available when the service is restored.');
    }

    try {
      const response = await fetch(`${API_BASE_URL}/transcript/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.detail || 'Failed to process transcript');
      }
      
      return data;
    } catch (error) {
      console.error('Error processing transcript:', error);
      throw error;
    }
  }

  // Update transcript status in Supabase
  async updateTranscriptStatus(
    transcriptId: string, 
    status: 'uploaded' | 'processing' | 'completed' | 'error',
    transcriptText?: string,
    error?: string
  ): Promise<void> {
    try {
      const updateData: any = {
        status,
        updated_at: new Date().toISOString(),
      };

      if (transcriptText) {
        updateData.transcript_text = transcriptText;
        updateData.processed_at = new Date().toISOString();
      }

      if (error) {
        updateData.error_message = error;
      }

      const { error: supabaseError } = await supabase
        .from('transcripts')
        .update(updateData)
        .eq('id', transcriptId);

      if (supabaseError) {
        throw supabaseError;
      }
    } catch (error) {
      console.error('Error updating transcript status:', error);
      throw error;
    }
  }

  // Start processing a transcript
  async startTranscriptProcessing(
    transcriptId: string,
    audioUrl: string,
    onUpdate?: (update: ProcessingUpdate) => void
  ): Promise<void> {
    if (!this.connectionStatus.backendAvailable) {
      // Update status to indicate backend is unavailable
      await this.updateTranscriptStatus(
        transcriptId, 
        'error', 
        undefined, 
        'Backend service is not available. Please try again later.'
      );
      throw new Error('Backend service is not available. Please try again later.');
    }

    try {
      // Update status to processing
      await this.updateTranscriptStatus(transcriptId, 'processing');

      // Subscribe to updates if callback provided
      let unsubscribe: (() => void) | null = null;
      if (onUpdate) {
        unsubscribe = this.subscribeToTranscript(transcriptId, onUpdate);
      }

      // Start processing
      await this.processTranscript({
        audio_url: audioUrl,
        transcript_id: transcriptId,
      });

      // Set up automatic cleanup after processing
      if (unsubscribe) {
        setTimeout(() => {
          unsubscribe!();
        }, 30000); // Clean up after 30 seconds
      }
    } catch (error) {
      // Update status to error
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await this.updateTranscriptStatus(transcriptId, 'error', undefined, errorMessage);
      throw error;
    }
  }

  // Get transcript processing history
  async getTranscriptHistory(userId: string): Promise<any[]> {
    if (!this.connectionStatus.backendAvailable) {
      throw new Error('Backend service is not available. Please check your connection.');
    }

    try {
      const response = await fetch(`${API_BASE_URL}/transcripts/${userId}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.detail || 'Failed to get transcript history');
      }
      
      return data.transcripts || [];
    } catch (error) {
      console.error('Error getting transcript history:', error);
      throw error;
    }
  }

  // Get user transcript statistics
  async getTranscriptStats(userId: string): Promise<any> {
    if (!this.connectionStatus.backendAvailable) {
      throw new Error('Backend service is not available. Please check your connection.');
    }

    try {
      const response = await fetch(`${API_BASE_URL}/transcripts/${userId}/stats`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.detail || 'Failed to get transcript stats');
      }
      
      return data;
    } catch (error) {
      console.error('Error getting transcript stats:', error);
      throw error;
    }
  }

  // Check if backend is available
  isBackendAvailable(): boolean {
    return this.connectionStatus.backendAvailable;
  }

  // Check if WebSocket is connected
  isConnected(): boolean {
    return this.connectionStatus.isConnected;
  }

  // Cleanup resources
  disconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }
    if (this.websocket) {
      this.websocket.close();
      this.websocket = null;
    }
    this.listeners.clear();
    this.statusListeners.length = 0;
  }
}

// Export singleton instance
export const mcpService = new MCPServiceClient();

// Export service as default
export default mcpService; 