import type { Env } from '../types';
import { getAgent } from '../db/agents';

export async function verifyUpvotePermission(env: Env, voterId: string): Promise<boolean> {
  try {
    const voter = await getAgent(env, voterId);
    
    if (!voter) {
      console.log(`[AUDIT] Upvote attempt by unknown voter: ${voterId}`);
      return false;
    }

    const isVerified = voter.verified;
    
    console.log(`[AUDIT] Upvote permission check - voter: ${voterId}, verified: ${isVerified}`);
    
    return isVerified;
  } catch (error) {
    console.error(`[AUDIT] Upvote permission check error:`, error);
    return false;
  }
}

export async function verifiedUpvote(
  env: Env,
  _agentName: string,
  voterId: string
): Promise<{ success: boolean; reason?: string }> {
  const hasPermission = await verifyUpvotePermission(env, voterId);
  
  if (!hasPermission) {
    return {
      success: false,
      reason: 'Only verified agents can upvote',
    };
  }

  return { success: true };
}
