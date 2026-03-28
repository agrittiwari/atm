export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/api/agent' && request.method === 'POST') {
      const body = await request.json();
      
      return Response.json({
        status: 'ok',
        message: 'Agent executed successfully',
        result: body,
      });
    }

    if (url.pathname === '/health') {
      return Response.json({ status: 'healthy' });
    }

    return new Response('Not Found', { status: 404 });
  },
};
