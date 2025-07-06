import { MCPListResponse, MCPInstallRequest, MCPInstallResponse, TranscriptProcessRequest, TranscriptProcessResponse } from '../types'
import { withRetryableOperation } from './retry'

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000'

export const api = {
  async listMCPs(): Promise<MCPListResponse> {
    return withRetryableOperation(async () => {
      const response = await fetch(`${API_BASE_URL}/mcp/list`)
      if (!response.ok) {
        const error = new Error('Failed to fetch MCPs')
        ;(error as any).status = response.status
        throw error
      }
      return await response.json()
    }, { maxRetries: 3, baseDelay: 1000 })
  },

  async installMCP(mcpName: string): Promise<MCPInstallResponse> {
    return withRetryableOperation(async () => {
      const request: MCPInstallRequest = { name: mcpName }
      const response = await fetch(`${API_BASE_URL}/mcp/install`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const error = new Error(errorData.detail || 'Failed to install MCP')
        ;(error as any).status = response.status
        throw error
      }
      
      return await response.json()
    }, { maxRetries: 2, baseDelay: 2000 })
  },

  async processTranscript(audioUrl: string, transcriptId: string): Promise<TranscriptProcessResponse> {
    return withRetryableOperation(async () => {
      const request: TranscriptProcessRequest = { 
        audio_url: audioUrl, 
        transcript_id: transcriptId 
      }
      const response = await fetch(`${API_BASE_URL}/transcript/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const error = new Error(errorData.detail || 'Failed to process transcript')
        ;(error as any).status = response.status
        throw error
      }
      
      return await response.json()
    }, { maxRetries: 3, baseDelay: 1500 })
  },
}