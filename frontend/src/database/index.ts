import { Database } from '@nozbe/watermelondb'
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite'
import { schema } from './schema'
import { Transcript } from './models/Transcript'
import { MCPServer } from './models/MCPServer'
import migrations from './migrations/001_initial'

const adapter = new SQLiteAdapter({
  schema,
  dbName: 'AudioTranscriptMCP',
  migrations,
  jsi: true,
  onSetUpError: (error) => {
    console.error('Database setup error:', error)
  }
})

export const database = new Database({
  adapter,
  modelClasses: [Transcript, MCPServer],
})