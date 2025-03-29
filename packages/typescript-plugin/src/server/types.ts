import { type as arktype } from 'arktype';

export const pingRequstBody = arktype({
  fileName: 'string',
});

export const typeRequstBody = arktype({
  fileName: 'string',
  range: arktype({
    start: arktype({
      line: 'number',
      character: 'number',
    }),
    end: arktype({
      line: 'number',
      character: 'number',
    }),
  }),
  maxDepth: 'number',
});
