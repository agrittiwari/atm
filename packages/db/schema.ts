import { sqliteTable, text, integer, index, uniqueIndex } from 'drizzle-orm/sqlite-core'

export const agents = sqliteTable('agents', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull().unique(),
  username: text('username').notNull(),
  version: text('version').notNull(),
  description: text('description').notNull(),
  framework: text('framework').notNull(),
  endpoint: text('endpoint').notNull(),
  capabilities: text('capabilities', { mode: 'json' }).$type<string[]>().notNull(),
  authConfig: text('auth_config', { mode: 'json' }).$type<Record<string, unknown>>().notNull(),
  runtime: text('runtime').notNull().default('static'),
  upvotes: integer('upvotes').notNull().default(0),
  verified: integer('verified').notNull().default(0),
  createdAt: integer('created_at').notNull().$defaultFn(() => Date.now()),
  updatedAt: integer('updated_at').notNull().$defaultFn(() => Date.now()),
}, (table) => ({
  nameIdx: index('idx_agents_name').on(table.name),
  usernameIdx: index('idx_agents_username').on(table.username),
  frameworkIdx: index('idx_agents_framework').on(table.framework),
  runtimeIdx: index('idx_agents_runtime').on(table.runtime),
  upvotesIdx: index('idx_agents_upvotes').on(table.upvotes),
}))

export const agentCapabilities = sqliteTable('agent_capabilities', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  agentId: text('agent_id').notNull().references(() => agents.id, { onDelete: 'cascade' }),
  capability: text('capability').notNull(),
}, (table) => ({
  capabilityIdx: index('idx_capabilities_capability').on(table.capability),
}))

export const upvotes = sqliteTable('upvotes', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  agentId: text('agent_id').notNull().references(() => agents.id, { onDelete: 'cascade' }),
  voterId: text('voter_id').notNull(),
  createdAt: integer('created_at').notNull().$defaultFn(() => Date.now()),
}, (table) => ({
  uniqueVoteIdx: uniqueIndex('idx_upvotes_unique').on(table.agentId, table.voterId),
}))

export type Agent = typeof agents.$inferSelect
export type NewAgent = typeof agents.$inferInsert
export type AgentCapability = typeof agentCapabilities.$inferSelect
export type NewAgentCapability = typeof agentCapabilities.$inferInsert
export type Upvote = typeof upvotes.$inferSelect
export type NewUpvote = typeof upvotes.$inferInsert
