import { database } from '../database'
import { Transcript } from '../database/models/Transcript'
import { MCPServer } from '../database/models/MCPServer'
import { Q } from '@nozbe/watermelondb'

export class DatabaseService {
  static async getTranscripts(userId: string): Promise<Transcript[]> {
    const transcriptsCollection = database.get<Transcript>('transcripts')
    return await transcriptsCollection.query(
      Q.where('user_id', userId),
      Q.sortBy('created_at', Q.desc)
    ).fetch()
  }

  static async createTranscript(data: {
    title: string
    audioUrl: string
    status: string
    userId: string
    supabaseId?: string
  }): Promise<Transcript> {
    return await database.write(async () => {
      return await database.get<Transcript>('transcripts').create(transcript => {
        transcript.title = data.title
        transcript.audioUrl = data.audioUrl
        transcript.status = data.status
        transcript.userId = data.userId
        if (data.supabaseId) {
          transcript.supabaseId = data.supabaseId
        }
      })
    })
  }

  static async updateTranscript(id: string, updates: {
    transcriptText?: string
    status?: string
  }): Promise<Transcript | null> {
    try {
      const transcript = await database.get<Transcript>('transcripts').find(id)
      return await database.write(async () => {
        return await transcript.update(transcript => {
          if (updates.transcriptText !== undefined) {
            transcript.transcriptText = updates.transcriptText
          }
          if (updates.status !== undefined) {
            transcript.status = updates.status
          }
        })
      })
    } catch (error) {
      console.error('Transcript not found:', error)
      return null
    }
  }

  static async getMCPServers(): Promise<MCPServer[]> {
    const mcpCollection = database.get<MCPServer>('mcp_servers')
    return await mcpCollection.query(
      Q.sortBy('created_at', Q.desc)
    ).fetch()
  }

  static async createMCPServer(data: {
    name: string
    url: string
    status: string
    description?: string
  }): Promise<MCPServer> {
    return await database.write(async () => {
      return await database.get<MCPServer>('mcp_servers').create(server => {
        server.name = data.name
        server.url = data.url
        server.status = data.status
        if (data.description) {
          server.description = data.description
        }
      })
    })
  }

  static async updateMCPServer(id: string, updates: {
    status?: string
    description?: string
  }): Promise<MCPServer | null> {
    try {
      const server = await database.get<MCPServer>('mcp_servers').find(id)
      return await database.write(async () => {
        return await server.update(server => {
          if (updates.status !== undefined) {
            server.status = updates.status
          }
          if (updates.description !== undefined) {
            server.description = updates.description
          }
        })
      })
    } catch (error) {
      console.error('MCP Server not found:', error)
      return null
    }
  }

  static async clearAllData(): Promise<void> {
    await database.write(async () => {
      await database.unsafeResetDatabase()
    })
  }

  static async syncTranscriptWithSupabase(localTranscript: Transcript, supabaseId: string): Promise<void> {
    await database.write(async () => {
      await localTranscript.update(transcript => {
        transcript.supabaseId = supabaseId
      })
    })
  }
}