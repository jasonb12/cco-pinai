import { appSchema, tableSchema } from '@nozbe/watermelondb'

export const schema = appSchema({
  version: 1,
  tables: [
    tableSchema({
      name: 'transcripts',
      columns: [
        { name: 'title', type: 'string' },
        { name: 'audio_url', type: 'string' },
        { name: 'transcript_text', type: 'string', isOptional: true },
        { name: 'status', type: 'string' }, // 'pending', 'processing', 'completed', 'failed'
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
        { name: 'user_id', type: 'string' },
        { name: 'supabase_id', type: 'string', isOptional: true },
      ],
    }),
    tableSchema({
      name: 'mcp_servers',
      columns: [
        { name: 'name', type: 'string' },
        { name: 'url', type: 'string' },
        { name: 'status', type: 'string' }, // 'installed', 'available', 'error'
        { name: 'description', type: 'string', isOptional: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
  ],
})