import { clearLocalBaselines, generateBaselineTests } from './baselines';

beforeAll(async () => {
  await clearLocalBaselines();
});

describe('baselines', generateBaselineTests);
