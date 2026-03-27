# Task 1: Infrastructure - Detailed Specification

## Overview

Design and implement the database schema and storage infrastructure for the ATM Registry.

---

## Deliverables

### 1. D1 Database Schema

Create `packages/db/schema.ts` with the following tables:

#### Agents Table
```sql
CREATE TABLE agents (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  username TEXT NOT NULL,
  version TEXT NOT NULL,
  description TEXT NOT NULL,
  framework TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  capabilities TEXT NOT NULL, -- JSON array
  auth_config TEXT NOT NULL, -- JSON object
  runtime TEXT NOT NULL DEFAULT 'static',
  upvotes INTEGER NOT NULL DEFAULT 0,
  verified INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX idx_agents_name ON agents(name);
CREATE INDEX idx_agents_username ON agents(username);
CREATE INDEX idx_agents_framework ON agents(framework);
CREATE INDEX idx_agents_runtime ON agents(runtime);
CREATE INDEX idx_agents_upvotes ON agents(upvotes DESC);
```

#### Capabilities Table (for efficient searching)
```sql
CREATE TABLE agent_capabilities (
  id TEXT PRIMARY KEY,
  agent_id TEXT NOT NULL,
  capability TEXT NOT NULL,
  FOREIGN KEY (agent_id) REFERENCES agents(id)
);

CREATE INDEX idx_capabilities_capability ON agent_capabilities(capability);
```

#### Upvotes Table
```sql
CREATE TABLE upvotes (
  id TEXT PRIMARY KEY,
  agent_id TEXT NOT NULL,
  voter_id TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (agent_id) REFERENCES agents(id),
  UNIQUE(agent_id, voter_id)
);
```

### 2. R2 Configuration

Configure `wrangler.toml`:

```toml
[[r2_buckets]]
binding = "AGENT_TARBALLS"
bucket_name = "agent-tarballs"
```

### 3. Migration Scripts

Create `migrations/` directory with:
- `001_create_agents.sql`
- `001_create_capabilities.sql`
- `001_create_upvotes.sql`

---

## Acceptance Criteria

- [ ] All D1 tables created with proper indexes
- [ ] Schema supports millions of agents
- [ ] Capabilities are efficiently queryable, embedding searchable
- [ ] Upvotes prevent duplicate voting per user
- [ ] R2 bucket configured for agent tarballs
- [ ] Migration scripts are idempotent

---

## Implementation Notes

- Use Drizzle ORM for type-safe queries
- Agent ID should be UUID v4
- Timestamps should be Unix epoch milliseconds
- Capabilities stored as JSON array for flexibility
