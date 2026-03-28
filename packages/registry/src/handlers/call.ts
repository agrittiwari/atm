import { runtimeLifecycle } from '../runtime/lifecycle';
import type { Env } from '../types';

export interface A2ACallRequest {
  method: string;
  params?: Record<string, unknown>;
  context?: Record<string, unknown>;
}

export interface A2ACallResponse {
  success: boolean;
  result?: unknown;
  error?: string;
  agentName?: string;
  version?: string;
  executionTimeMs?: number;
}

interface ParsedAgentRef {
  username: string;
  agentName: string;
  version: string;
}

export async function handleCall(
  env: Env,
  agentRef: string,
  request: A2ACallRequest
): Promise<A2ACallResponse> {
  const startTime = Date.now();

  try {
    const parsed = parseAgentReference(agentRef);
    
    const codeLoader = runtimeLifecycle.getCodeLoader();
    codeLoader.setR2Bucket(env.AGENT_TARBALLS);

    const loadedCode = await codeLoader.load(parsed.agentName, parsed.version);

    const isolatePool = runtimeLifecycle.getIsolatePool();
    const sandbox = await isolatePool.getIsolate(parsed.agentName);

    try {
      const context = {
        ...request.params,
        ...request.context,
        method: request.method,
        agentName: parsed.agentName,
        version: parsed.version,
        username: parsed.username,
      };

      const result = await sandbox.execute(
        loadedCode.code,
        context,
        loadedCode.handler
      );

      isolatePool.recordSuccess(parsed.agentName);
      runtimeLifecycle.incrementExecuted();

      const executionTimeMs = Date.now() - startTime;

      return {
        success: true,
        result,
        agentName: parsed.agentName,
        version: parsed.version,
        executionTimeMs,
      };
    } finally {
      await isolatePool.release(sandbox, parsed.agentName);
    }
  } catch (err) {
    const executionTimeMs = Date.now() - startTime;
    const errorMessage = err instanceof Error ? err.message : String(err);

    if (agentRef) {
      const parsed = parseAgentReference(agentRef);
      const isolatePool = runtimeLifecycle.getIsolatePool();
      isolatePool.recordFailure(parsed.agentName);
    }

    return {
      success: false,
      error: errorMessage,
      executionTimeMs,
    };
  }
}

function parseAgentReference(ref: string): ParsedAgentRef {
  const match = ref.match(/^@([^/]+)\/([^/]+)(?:\/([^/]+))?$/);
  
  if (!match) {
    if (ref.includes('/')) {
      const parts = ref.split('/');
      return {
        username: parts[0],
        agentName: parts[1],
        version: 'latest',
      };
    }
    return {
      username: 'default',
      agentName: ref,
      version: 'latest',
    };
  }

  return {
    username: match[1],
    agentName: match[2],
    version: match[3] || 'latest',
  };
}

export function parseAgentName(agentRef: string): { username: string; name: string; version: string } {
  const parsed = parseAgentReference(agentRef);
  return {
    username: parsed.username,
    name: parsed.agentName,
    version: parsed.version,
  };
}
