import path from 'node:path';
import { fileURLToPath } from 'node:url';

// ESM
export const filename = fileURLToPath(import.meta.url);
export const dirname = path.dirname(filename);

export const rootPath = path.join(dirname, '../');
export const testCasePath = path.join(dirname, '../cases');
export const baselinesPath = path.join(dirname, '../baselines');
export const baselinesLocalPath = path.join(baselinesPath, 'local');
export const baselinesReferencePath = path.join(baselinesPath, 'reference');
