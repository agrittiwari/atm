import { searchAgents } from '../db/agents';
import type { Env, Agent } from '../types';

export interface SearchParams {
  capability?: string;
  limit?: number;
  offset?: number;
}

export async function handleSearch(
  env: Env,
  params: SearchParams
): Promise<{ agents: Agent[] }> {
  const limit = Math.min(Math.max(params.limit || 10, 1), 100);
  const offset = Math.max(params.offset || 0, 0);

  const agents = await searchAgents(env, params.capability, limit, offset);
  return { agents };
}
