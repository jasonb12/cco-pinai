import { schemaMigrations, createTable, addColumns } from '@nozbe/watermelondb/Schema/migrations'

export default schemaMigrations({
  migrations: [
    {
      toVersion: 1,
      steps: [
        createTable({
          name: 'transcripts',
          columns: [
            { name: 'title', type: 'string' },
            { name: 'audio_url', type: 'string' },
            { name: 'transcript_text', type: 'string', isOptional: true },
            { name: 'status', type: 'string' },
            { name: 'created_at', type: 'number' },
            { name: 'updated_at', type: 'number' },
            { name: 'user_id', type: 'string' },
            { name: 'supabase_id', type: 'string', isOptional: true },
          ],
        }),
        createTable({
          name: 'mcp_servers',
          columns: [
            { name: 'name', type: 'string' },
            { name: 'url', type: 'string' },
            { name: 'status', type: 'string' },
            { name: 'description', type: 'string', isOptional: true },
            { name: 'created_at', type: 'number' },
            { name: 'updated_at', type: 'number' },
          ],
        }),
      ],
    },
  ],
})