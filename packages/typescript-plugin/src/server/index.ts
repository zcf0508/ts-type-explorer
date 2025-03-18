import { serve } from '@hono/node-server';
import app from './routers';

let server: ReturnType<typeof serve> | undefined;

export function start(port: number) {
  if (server) {
    server.close();
  }

  server = serve({
    fetch: app.fetch,
    port,
  });
}

export type AppType = typeof app;
