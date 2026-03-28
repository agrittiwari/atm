import { Hono } from 'hono';
import { handleRegister } from './handlers/register';
import { handleGet } from './handlers/get';
import { handleSearch } from './handlers/search';
import { handlePublish } from './handlers/publish';
import { handleUpvote } from './handlers/upvote';
import { handleCall } from './handlers/call';
import { deleteAgent } from './db/agents';
import { authMiddleware } from './middleware/auth';
import { rateLimitByAgent, LIMITS } from './middleware/rate-limit';
import { verifiedUpvote } from './middleware/verified-upvote';
import type { Env } from './types';

export function createRouter() {
  const app = new Hono<{ Bindings: Env }>();

  app.notFound((c) => {
    return c.json({ error: 'Not found' }, 404);
  });

  app.onError((err, c) => {
    console.error('Error:', err.message);
    const status = err.message.includes('not found') ? 404 : 
                   err.message.includes('already exists') ? 409 :
                   err.message.includes('Only verified') ? 403 :
                   err.message.includes('Already upvoted') ? 409 : 500;
    return c.json({ error: err.message }, status);
  });

  app.post('/agents', 
    authMiddleware,
    rateLimitByAgent({ ...LIMITS.write, keyGenerator: (req, userId) => userId || req.headers.get('CF-Connecting-IP') || 'unknown' }),
    async (c) => {
      const data = await c.req.json();
      const result = await handleRegister(c.env, data);
      return c.json(result, 201);
    }
  );

  app.get('/agents', 
    rateLimitByAgent({ ...LIMITS.read, keyGenerator: (req) => req.headers.get('CF-Connecting-IP') || 'unknown' }),
    async (c) => {
      const capability = c.req.query('capability');
      const limit = parseInt(c.req.query('limit') || '10', 10);
      const offset = parseInt(c.req.query('offset') || '0', 10);
      const result = await handleSearch(c.env, { capability, limit, offset });
      return c.json(result);
    }
  );

  app.get('/agents/:name', 
    rateLimitByAgent({ ...LIMITS.read, keyGenerator: (req) => req.headers.get('CF-Connecting-IP') || 'unknown' }),
    async (c) => {
      const name = c.req.param('name') ?? '';
      const agent = await handleGet(c.env, name);
      return c.json({ agent });
    }
  );

  app.delete('/agents/:name', 
    authMiddleware,
    rateLimitByAgent({ ...LIMITS.write, keyGenerator: (req, userId) => userId || req.headers.get('CF-Connecting-IP') || 'unknown' }),
    async (c) => {
      const name = c.req.param('name') ?? '';
      await deleteAgent(c.env, name);
      return c.json({ success: true });
    }
  );

  app.post('/agents/:name/publish', 
    authMiddleware,
    rateLimitByAgent({ ...LIMITS.write, keyGenerator: (req, userId) => userId || req.headers.get('CF-Connecting-IP') || 'unknown' }),
    async (c) => {
      const name = c.req.param('name') ?? '';
      const { version } = await c.req.json().catch(() => ({}));
      if (!version) {
        return c.json({ error: 'Version is required' }, 400);
      }
      const result = await handlePublish(c.env, name, version, c.req.raw.body!);
      return c.json(result);
    }
  );

  app.post('/agents/:name/upvote', 
    rateLimitByAgent({ ...LIMITS.upvote, keyGenerator: (req) => req.headers.get('CF-Connecting-IP') || 'unknown' }),
    async (c) => {
      const name = c.req.param('name') ?? '';
      const data = await c.req.json();
      if (!data.voterId) {
        return c.json({ error: 'voterId is required' }, 400);
      }
      const verifiedCheck = await verifiedUpvote(c.env, name, data.voterId);
      if (!verifiedCheck.success) {
        return c.json({ error: verifiedCheck.reason }, 403);
      }
      const result = await handleUpvote(c.env, name, data);
      if (!result.success) {
        return c.json({ error: result.error }, 403);
      }
      return c.json(result);
    }
  );

  app.get('/tarballs/:name/:version', async (c) => {
    const name = c.req.param('name') ?? '';
    const version = c.req.param('version') ?? '';
    const key = `tarballs/${name}/${version}.tar.gz`;
    const object = await c.env.AGENT_TARBALLS.get(key);
    
    if (!object) {
      return c.json({ error: 'Tarball not found' }, 404);
    }

    return new Response(object.body, {
      headers: {
        'Content-Type': 'application/gzip',
        'Content-Disposition': `attachment; filename="${name}-${version}.tar.gz"`,
      },
    });
  });

  app.post('/call/:agentRef', async (c) => {
    const agentRef = c.req.param('agentRef') ?? '';
    const data = await c.req.json().catch(() => ({}));
    
    const result = await handleCall(c.env, agentRef, {
      method: data.method || 'default',
      params: data.params,
      context: data.context,
    });
    
    if (!result.success) {
      return c.json({ error: result.error }, 500);
    }
    
    return c.json(result);
  });

  app.get('/runtime/metrics', async (c) => {
    const { runtimeLifecycle } = await import('./runtime/lifecycle');
    const metrics = runtimeLifecycle.getPoolMetrics();
    return c.json(metrics);
  });

  return app;
}
