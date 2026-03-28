import { getAgent } from '../db/agents';
import type { Env } from '../types';

const TARBALL_PREFIX = 'tarballs';

function getTarballKey(agentName: string, version: string): string {
  return `${TARBALL_PREFIX}/${agentName}/${version}.tar.gz`;
}

export async function handlePublish(
  env: Env,
  agentName: string,
  version: string,
  body: ReadableStream
): Promise<{ url: string }> {
  const agent = await getAgent(env, agentName);
  if (!agent) {
    throw new Error('Agent not found');
  }

  const key = getTarballKey(agentName, version);
  
  await env.AGENT_TARBALLS.put(key, body, {
    httpMetadata: {
      contentType: 'application/gzip',
    },
  });

  const url = `/tarballs/${agentName}/${version}.tar.gz`;
  return { url };
}

export async function getTarballUrl(
  env: Env,
  agentName: string,
  version: string
): Promise<string | null> {
  const key = getTarballKey(agentName, version);
  const object = await env.AGENT_TARBALLS.get(key);
  
  if (!object) {
    return null;
  }

  return `/tarballs/${agentName}/${version}.tar.gz`;
}

export async function deleteTarball(
  env: Env,
  agentName: string,
  version: string
): Promise<void> {
  const key = getTarballKey(agentName, version);
  await env.AGENT_TARBALLS.delete(key);
}
