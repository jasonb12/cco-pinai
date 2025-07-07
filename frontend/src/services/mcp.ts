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

class MCPServiceClient {
  private websocket: WebSocket | null = null;
  private listeners: Map<string, (update: ProcessingUpdate) => void> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 1000;

  constructor() {
    this.connectWebSocket();
  }

  private connectWebSocket() {
    try {
      const wsUrl = API_BASE_URL.replace('http', 'ws') + '/ws';
      this.websocket = new WebSocket(wsUrl);

      this.websocket.onopen = () => {
        console.log('MCP WebSocket connected');
        this.reconnectAttempts = 0;
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
        this.attemptReconnect();
      };

      this.websocket.onerror = (error) => {
        console.error('MCP WebSocket error:', error);
      };
    } catch (error) {
      console.error('Error connecting to WebSocket:', error);
      this.attemptReconnect();
    }
  }

  private attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect WebSocket (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      setTimeout(() => {
        this.connectWebSocket();
      }, this.reconnectInterval * this.reconnectAttempts);
    } else {
      console.error('Max reconnection attempts reached');
    }
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

  // List available MCP services
  async listMCPServices(): Promise<MCPService[]> {
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

  // Cleanup resources
  disconnect() {
    if (this.websocket) {
      this.websocket.close();
      this.websocket = null;
    }
    this.listeners.clear();
  }
}

// Export singleton instance
export const mcpService = new MCPServiceClient();

// Export service as default
export default mcpService; 