import type { Context, Next } from 'hono';
import type { Env } from '../types';

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  keyGenerator: (req: Request, userId?: string) => string;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

export const LIMITS = {
  read: { windowMs: 60000, maxRequests: 1000 },
  write: { windowMs: 60000, maxRequests: 10 },
  upvote: { windowMs: 3600000, maxRequests: 10 },
};

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetAt: number;
  };
}

const memoryStore: RateLimitStore = {};

async function getFromKV(env: Env, key: string): Promise<{ count: number; resetAt: number } | null> {
  if (!env.RATE_LIMIT_KV) {
    return null;
  }
  const value = await env.RATE_LIMIT_KV.get(key, 'json');
  return value as { count: number; resetAt: number } | null;
}

async function setToKV(env: Env, key: string, value: { count: number; resetAt: number }): Promise<void> {
  if (!env.RATE_LIMIT_KV) {
    return;
  }
  const ttl = Math.ceil((value.resetAt - Date.now()) / 1000);
  if (ttl > 0) {
    await env.RATE_LIMIT_KV.put(key, JSON.stringify(value), { expirationTtl: ttl });
  }
}

export async function checkRateLimit(
  env: Env,
  key: string,
  windowMs: number,
  maxRequests: number
): Promise<RateLimitResult> {
  const now = Date.now();
  const resetAt = now + windowMs;

  let storeEntry: { count: number; resetAt: number } | null = null;
  
  if (env.RATE_LIMIT_KV) {
    storeEntry = await getFromKV(env, `ratelimit:${key}`);
  } else {
    storeEntry = memoryStore[key] || null;
  }

  if (!storeEntry || storeEntry.resetAt < now) {
    const newEntry = { count: 1, resetAt };
    
    if (env.RATE_LIMIT_KV) {
      await setToKV(env, key, newEntry);
    } else {
      memoryStore[key] = newEntry;
    }
    
    return {
      allowed: true,
      remaining: maxRequests - 1,
      resetAt,
    };
  }

  if (storeEntry.count >= maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: storeEntry.resetAt,
    };
  }

  storeEntry.count += 1;
  
  if (env.RATE_LIMIT_KV) {
    await setToKV(env, key, storeEntry);
  } else {
    memoryStore[key] = storeEntry;
  }

  return {
    allowed: true,
    remaining: maxRequests - storeEntry.count,
    resetAt: storeEntry.resetAt,
  };
}

export function rateLimitByAgent(config: RateLimitConfig) {
  return async (c: Context<{ Bindings: Env }>, next: Next): Promise<Response | undefined> => {
    const user = (c as any).get('user') as { sub: string } | undefined;
    const userId = user?.sub;
    const key = config.keyGenerator(c.req.raw, userId);
    
    const result = await checkRateLimit(c.env, key, config.windowMs, config.maxRequests);

    c.res.headers.set('X-RateLimit-Limit', config.maxRequests.toString());
    c.res.headers.set('X-RateLimit-Remaining', result.remaining.toString());
    c.res.headers.set('X-RateLimit-Reset', Math.ceil(result.resetAt / 1000).toString());

    if (!result.allowed) {
      return c.json(
        { error: 'Rate limit exceeded', retryAfter: Math.ceil((result.resetAt - Date.now()) / 1000) },
        429,
        {
          'Retry-After': Math.ceil((result.resetAt - Date.now()) / 1000).toString(),
        }
      );
    }

    await next();
    return undefined;
  };
}

export function getAgentIdFromRequest(req: Request, userId?: string): string {
  if (userId) {
    return userId;
  }
  return req.headers.get('CF-Connecting-IP') || 'anonymous';
}
