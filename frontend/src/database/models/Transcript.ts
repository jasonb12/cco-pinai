import { Model } from '@nozbe/watermelondb'
import { field, date, readonly } from '@nozbe/watermelondb/decorators'

export class Transcript extends Model {
  static table = 'transcripts'

  @field('title') title!: string
  @field('audio_url') audioUrl!: string
  @field('transcript_text') transcriptText?: string
  @field('status') status!: string
  @field('user_id') userId!: string
  @field('supabase_id') supabaseId?: string
  @readonly @date('created_at') createdAt!: Date
  @readonly @date('updated_at') updatedAt!: Date
}