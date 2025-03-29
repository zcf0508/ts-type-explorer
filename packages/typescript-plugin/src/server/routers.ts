import { arktypeValidator } from '@hono/arktype-validator';
import { getTypeInfoAtRange } from '@ts-type-explorer/api';
import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { getFileContext } from '../context';
import { pingRequstBody, typeRequstBody } from './types';

const app = new Hono()
  .use(logger())
  .post('/ping', arktypeValidator('json', pingRequstBody), (c) => {
    const { fileName } = c.req.valid('json');
    console.log('ping', fileName);
    if (!getFileContext(fileName)) {
      return c.json({
        error: 'Context not initialized',
      }, 500);
    }

    return c.text('pong');
  })
  .post('/type', arktypeValidator('json', typeRequstBody), async (c) => {
    const { fileName, range, maxDepth } = c.req.valid('json');

    const context = getFileContext(fileName);

    if (!context) {
      return c.json({
        error: 'Context not initialized',
      }, 500);
    }

    const data = getTypeInfoAtRange(
      context,
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
