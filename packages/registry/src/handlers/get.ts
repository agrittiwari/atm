import { getAgent } from '../db/agents';
import type { Env, Agent } from '../types';

export async function handleGet(
  env: Env,
  name: string
): Promise<Agent> {
  const agent = await getAgent(env, name);
  if (!agent) {
    throw new Error('Agent not found');
  }
  return agent;
}
