-- Migration: 001_create_upvotes
-- Description: Create upvotes table with unique constraint to prevent duplicate voting

CREATE TABLE IF NOT EXISTS upvotes (
  id TEXT PRIMARY KEY,
  agent_id TEXT NOT NULL,
  voter_id TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE,
  UNIQUE(agent_id, voter_id)
);
