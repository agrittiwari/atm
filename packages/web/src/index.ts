import { cors } from 'hono/cors';
import { router } from './router';

export interface Env {
  REGISTRY_URL: string;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    return router.fetch(request, env, ctx);
  },
};
