export interface User {
  id: string;
  email: string;
  user_metadata: {
    full_name?: string;
    avatar_url?: string;
  };
  created_at: string;
}

export interface Transcript {
  id: string;
  title: string;
  audio_url: string;
  transcript_text?: string;
  status: TranscriptStatus;
  user_id: string;
  supabase_id?: string;
  created_at: string;
  updated_at: string;
}

export type TranscriptStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface MCPServer {
  id: string;
  name: string;
  url: string;
  status: MCPStatus;
  description?: string;
  created_at: string;
  updated_at: string;
}

export type MCPStatus = 'installed' | 'available' | 'error';

export interface AudioFile {
  uri: string;
  name: string;
  size: number;
  type: string;
  file?: File; // For web platform
}

export interface UploadResult {
  url: string;
  path: string;
}

export interface WebSocketMessage {
  type: 'transcript_processing' | 'transcript_completed' | 'transcript_error' | 'mcp_installed' | 'echo' | 'error';
  transcript_id?: string;
  mcp_name?: string;
  status?: string;
  transcript_text?: string;
  error?: string;
  message?: any;
}

export interface APIResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
}

export interface MCPListResponse {
  mcps: MCPServer[];
  error?: string;
}

export interface MCPInstallRequest {
  name: string;
}

export interface MCPInstallResponse {
  message: string;
  output: string;
}

export interface TranscriptProcessRequest {
  audio_url: string;
  transcript_id: string;
}

export interface TranscriptProcessResponse {
  message: string;
  transcript_id: string;
  transcript_text: string;
}

export interface AuthError {
  message: string;
  status?: number;
}

export interface FileUploadError {
  message: string;
  code?: string;
}