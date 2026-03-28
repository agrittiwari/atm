import { upvote as dbUpvote, hasUpvoted as dbHasUpvoted } from '../db/upvotes';
import type { Env } from '../types';

export interface UpvoteRequest {
  voterId: string;
}

export async function handleUpvote(
  env: Env,
  agentName: string,
  data: UpvoteRequest
): Promise<{ success: boolean; error?: string }> {
  return dbUpvote(env, agentName, data.voterId);
}

export async function handleHasUpvoted(
  env: Env,
  agentName: string,
  voterId: string
): Promise<{ hasUpvoted: boolean }> {
  const result = await dbHasUpvoted(env, agentName, voterId);
  return { hasUpvoted: result };
}
