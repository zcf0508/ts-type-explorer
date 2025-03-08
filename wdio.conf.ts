import type {} from 'wdio-vscode-service';
import path, { dirname } from 'node:path';

import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export const config: WebdriverIO.Config = {
  runner: 'local',
  tsConfigPath: './tsconfig.e2e.json',

  specs: ['./tests/e2e/vscode/**/*.ts'],
  exclude: [],
  maxInstances: 1,
  capabilities: [
    {
      // https://github.com/webdriverio/webdriverio/issues/13519#issuecomment-2331663601
      'wdio:enforceWebDriverClassic': true,
      'browserName': 'vscode',
      'browserVersion': '1.86.0',
      'wdio:vscodeOptions': {
        extensionPath: path.join(
          __dirname,
          'packages/typescript-explorer-vscode',
        ),
        userSettings: {
          'editor.fontSize': 14,
        },
      },
    },
  ],
  logLevel: 'warn',
  bail: 0,
  baseUrl: 'http://localhost',
  waitforTimeout: 10000,
  connectionRetryTimeout: 120000,
  connectionRetryCount: 3,

  services: ['vscode'],

  framework: 'mocha',
  reporters: ['spec'],

  mochaOpts: {
    ui: 'bdd',
    timeout: 60000,
  },
};
