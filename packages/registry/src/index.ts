import { createRouter } from './router';
import { runtimeLifecycle } from './runtime/lifecycle';

let runtimeStarted = false;

export default {
  async fetch(request: Request, env: any, ctx: ExecutionContext): Promise<Response> {
    if (!runtimeStarted) {
      runtimeStarted = true;
      ctx.waitUntil(runtimeLifecycle.warmUpPool());
    }

    const app = createRouter();
    return app.fetch(request, env, ctx);
  },
};
