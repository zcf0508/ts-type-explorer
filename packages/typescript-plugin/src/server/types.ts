import { type as arktype } from 'arktype';

export const queBody = arktype({
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
