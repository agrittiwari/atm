import type { Env } from '../types';

function uuid(): string {
  return crypto.randomUUID();
}

export async function upvote(env: Env, agentName: string, voterId: string): Promise<{ success: boolean; error?: string }> {
  const agentResult = await env.DB.prepare(`SELECT id, verified FROM agents WHERE name = ?`)
    .bind(agentName)
    .first<{ id: string; verified: number }>();

  if (!agentResult) {
    return { success: false, error: 'Agent not found' };
  }

  if (agentResult.verified !== 1) {
    return { success: false, error: 'Only verified agents can upvote' };
  }

  const existingVote = await env.DB.prepare(
    `SELECT id FROM upvotes WHERE agent_id = ? AND voter_id = ?`
  ).bind(agentResult.id, voterId).first();

  if (existingVote) {
    return { success: false, error: 'Already upvoted' };
  }

  try {
    const upVoteId = uuid();
    const now = Date.now();

    await env.DB.batch([
      env.DB.prepare(`
        INSERT INTO upvotes (id, agent_id, voter_id, created_at)
        VALUES (?, ?, ?, ?)
      `).bind(upVoteId, agentResult.id, voterId, now),
      env.DB.prepare(`
        UPDATE agents SET upvotes = upvotes + 1 WHERE name = ?
      `).bind(agentName),
    ]);

    return { success: true };
  } catch (e) {
    return { success: false, error: 'Failed to upvote' };
  }
}

export async function hasUpvoted(env: Env, agentName: string, voterId: string): Promise<boolean> {
  const agentResult = await env.DB.prepare(`SELECT id FROM agents WHERE name = ?`)
    .bind(agentName)
    .first<{ id: string }>();

  if (!agentResult) {
    return false;
  }

  const result = await env.DB.prepare(
    `SELECT id FROM upvotes WHERE agent_id = ? AND voter_id = ?`
  ).bind(agentResult.id, voterId).first();

  return !!result;
}

export async function getUpvoteCount(env: Env, agentName: string): Promise<number> {
  const result = await env.DB.prepare(`SELECT upvotes FROM agents WHERE name = ?`)
    .bind(agentName)
    .first<{ upvotes: number }>();

  return result?.upvotes ?? 0;
}
