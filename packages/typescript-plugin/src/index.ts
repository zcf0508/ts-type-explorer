import type {
  TypescriptContext,
} from '@ts-type-explorer/api';

import type * as ts from 'typescript/lib/tsserverlibrary';

import type { PluginConfiguration } from './config';
import { context } from './context';
import { start } from './server';

const init: ts.server.PluginModuleFactory = (modules) => {
  return {
    create: (info: ts.server.PluginCreateInfo) => {
      function getContext(_info: ts.server.PluginCreateInfo): () => TypescriptContext | undefined {
        const info = _info;
        return () => {
        // @ts-expect-error - ts internal
          const program = info.project.program as ts.Program | undefined;

          if (!program) {
            return undefined;
          }

          const typeChecker = program.getTypeChecker();

          return {
            program,
            typeChecker,
            ts: modules.typescript,
          };
        };
      }

      if (!context.get()) {
        context.set(getContext(info));
      }

      return info.languageService;
    },
    onConfigurationChanged: (config: typeof PluginConfiguration.infer) => {
      start(config.port);
    },
  };
};

// eslint-disable-next-line no-restricted-syntax
export = init;
