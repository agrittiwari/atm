-- Migration: 001_create_agents
-- Description: Create agents table for ATM Registry

CREATE TABLE IF NOT EXISTS agents (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  username TEXT NOT NULL,
  version TEXT NOT NULL,
  description TEXT NOT NULL,
  framework TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  capabilities TEXT NOT NULL,
  auth_config TEXT NOT NULL,
  runtime TEXT NOT NULL DEFAULT 'static',
  upvotes INTEGER NOT NULL DEFAULT 0,
  verified INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_agents_name ON agents(name);
CREATE INDEX IF NOT EXISTS idx_agents_username ON agents(username);
CREATE INDEX IF NOT EXISTS idx_agents_framework ON agents(framework);
CREATE INDEX IF NOT EXISTS idx_agents_runtime ON agents(runtime);
CREATE INDEX IF NOT EXISTS idx_agents_upvotes ON agents(upvotes DESC);
