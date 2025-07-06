import { Model } from '@nozbe/watermelondb'
import { field, date, readonly } from '@nozbe/watermelondb/decorators'

export class MCPServer extends Model {
  static table = 'mcp_servers'

  @field('name') name!: string
  @field('url') url!: string
  @field('status') status!: string
  @field('description') description?: string
  @readonly @date('created_at') createdAt!: Date
  @readonly @date('updated_at') updatedAt!: Date
}