import type { TypescriptContext } from '@ts-type-explorer/api';
import { normalize } from 'node:path';

export const contextMap = new Map<string, () => (TypescriptContext | undefined)>();

export function getFileContext(filePath: string): TypescriptContext | undefined {
  console.log(filePath, Array.from(contextMap.values()).join(','));

  for (const state of contextMap.values()) {
    const context = state();
    const { program } = context ?? {};
    if (
      program?.getSourceFile(normalize(filePath))
    ) {
      return context;
    }
  }
  return undefined;
}
