import { createAgent, getAgent } from '../db/agents';
import type { Env, AgentManifest, Agent } from '../types';

export async function handleRegister(
  env: Env,
  data: AgentManifest
): Promise<{ agent: Agent }> {
  const existing = await getAgent(env, data.name);
  if (existing) {
    throw new Error('Agent already exists');
  }

  const agent = await createAgent(env, data);
  return { agent };
}
