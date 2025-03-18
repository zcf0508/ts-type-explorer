import { arktypeValidator } from '@hono/arktype-validator';
import { getTypeInfoAtRange } from '@ts-type-explorer/api';
import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { context } from '../context';
import { queBody } from './types';

const app = new Hono()
  .use(logger())
  .get('/ping', (c) => {
    if (!context.get()) {
      return c.json({
        error: 'Context not initialized',
      }, 500);
    }

    return c.text('pong');
  })
  .post('/type', arktypeValidator('json', queBody), async (c) => {
    const { fileName, range, maxDepth } = c.req.valid('json');
    if (!context.get()) {
      return c.json({
        error: 'Context not initialized',
      }, 500);
    }

    const data = getTypeInfoAtRange(
      context.get()!,
      {
        fileName,
        range,
      },
      {
        referenceDefinedTypes: true,
        maxDepth,
      },
    );

    return c.json({
      data,
    });
  });

export default app;
