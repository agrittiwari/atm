-- Migration: 001_create_capabilities
-- Description: Create agent_capabilities table for efficient capability searching

CREATE TABLE IF NOT EXISTS agent_capabilities (
  id TEXT PRIMARY KEY,
  agent_id TEXT NOT NULL,
  capability TEXT NOT NULL,
  FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_capabilities_capability ON agent_capabilities(capability);
