import type { Agent, AgentManifest, Env } from '../types';

function uuid(): string {
  return crypto.randomUUID();
}

export async function createAgent(env: Env, manifest: AgentManifest): Promise<Agent> {
  const id = uuid();
  const now = Date.now();
  
  const agent: Agent = {
    id,
    name: manifest.name,
    username: manifest.username,
    version: manifest.version,
    description: manifest.description,
    framework: manifest.framework,
    endpoint: manifest.endpoint,
    capabilities: manifest.capabilities,
    authConfig: manifest.authConfig,
    runtime: manifest.runtime || 'static',
    upvotes: 0,
    verified: false,
    createdAt: now,
    updatedAt: now,
  };

  await env.DB.prepare(`
    INSERT INTO agents (id, name, username, version, description, framework, endpoint, capabilities, auth_config, runtime, upvotes, verified, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    agent.id,
    agent.name,
    agent.username,
    agent.version,
    agent.description,
    agent.framework,
    agent.endpoint,
    JSON.stringify(agent.capabilities),
    JSON.stringify(agent.authConfig),
    agent.runtime,
    agent.upvotes,
    agent.verified ? 1 : 0,
    agent.createdAt,
    agent.updatedAt
  ).run();

  for (const capability of agent.capabilities) {
    const capId = uuid();
    await env.DB.prepare(`
      INSERT INTO agent_capabilities (id, agent_id, capability)
      VALUES (?, ?, ?)
    `).bind(capId, agent.id, capability).run();
  }

  return agent;
}

export async function getAgent(env: Env, name: string): Promise<Agent | null> {
  const result = await env.DB.prepare(`
    SELECT * FROM agents WHERE name = ?
  `).bind(name).first<any>();

  if (!result) return null;

  return mapRowToAgent(result);
}

export async function searchByCapability(
  env: Env,
  capability: string,
  limit: number = 10,
  offset: number = 0
): Promise<Agent[]> {
  const result = await env.DB.prepare(`
    SELECT a.* FROM agents a
    INNER JOIN agent_capabilities ac ON a.id = ac.agent_id
    WHERE ac.capability = ?
    ORDER BY a.upvotes DESC
    LIMIT ? OFFSET ?
  `).bind(capability, limit, offset).all<any>();

  return result.results.map(mapRowToAgent);
}

export async function getTopAgents(env: Env, limit: number = 10): Promise<Agent[]> {
  const result = await env.DB.prepare(`
    SELECT * FROM agents
    ORDER BY upvotes DESC
    LIMIT ?
  `).bind(limit).all<any>();

  return result.results.map(mapRowToAgent);
}

export async function searchAgents(
  env: Env,
  capability?: string,
  limit: number = 10,
  offset: number = 0
): Promise<Agent[]> {
  if (capability) {
    return searchByCapability(env, capability, limit, offset);
  }
  return getTopAgents(env, limit);
}

export async function updateAgent(
  env: Env,
  name: string,
  updates: Partial<AgentManifest>
): Promise<Agent> {
  const existing = await getAgent(env, name);
  if (!existing) {
    throw new Error('Agent not found');
  }

  const now = Date.now();
  const updated: Agent = {
    ...existing,
    ...updates,
    updatedAt: now,
  };

  await env.DB.prepare(`
    UPDATE agents SET
      username = ?,
      version = ?,
      description = ?,
      framework = ?,
      endpoint = ?,
      capabilities = ?,
      auth_config = ?,
      runtime = ?,
      updated_at = ?
    WHERE name = ?
  `).bind(
    updated.username,
    updated.version,
    updated.description,
    updated.framework,
    updated.endpoint,
    JSON.stringify(updated.capabilities),
    JSON.stringify(updated.authConfig),
    updated.runtime,
    updated.updatedAt,
    name
  ).run();

  if (updates.capabilities) {
    await env.DB.prepare(`DELETE FROM agent_capabilities WHERE agent_id = ?`)
      .bind(existing.id).run();
    
    for (const capability of updated.capabilities) {
      const capId = uuid();
      await env.DB.prepare(`
        INSERT INTO agent_capabilities (id, agent_id, capability)
        VALUES (?, ?, ?)
      `).bind(capId, existing.id, capability).run();
    }
  }

  return updated;
}

export async function deleteAgent(env: Env, name: string): Promise<void> {
  const existing = await getAgent(env, name);
  if (!existing) {
    throw new Error('Agent not found');
  }

  await env.DB.prepare(`DELETE FROM agents WHERE name = ?`).bind(name).run();
}

function mapRowToAgent(row: any): Agent {
  return {
    id: row.id,
    name: row.name,
    username: row.username,
    version: row.version,
    description: row.description,
    framework: row.framework,
    endpoint: row.endpoint,
    capabilities: JSON.parse(row.capabilities),
    authConfig: JSON.parse(row.auth_config),
    runtime: row.runtime,
    upvotes: row.upvotes,
    verified: row.verified === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
