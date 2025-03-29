import type {
  CustomTypeScriptRequestId,
  CustomTypeScriptRequestOfId,
  CustomTypeScriptResponse,
  CustomTypeScriptResponseBody,
  SourceFileLocation,
  TypeInfo,
} from '@ts-type-explorer/api';
import type * as ts from 'typescript/lib/tsserverlibrary';
import type { AppType } from '../../typescript-plugin/src/server';
import getPorts from 'get-port';
import { hc } from 'hono/client';
import * as vscode from 'vscode';
import { maxRecursionDepth } from './config';
import { startTsPlugin } from './tsPlugin';
import {
  getDurationAlert,
  positionFromLineAndCharacter,
  rangeFromLineAndCharacters,
  rangeToTextRange,
  toFileLocationRequestArgs,
} from './util';

async function waitForServer(
  checkFn: () => Promise<boolean>,
  maxWaitTime: number = 5000,
): Promise<boolean> {
  const startTime = Date.now();
  const checkInterval = 500;

  while (Date.now() - startTime < maxWaitTime) {
    try {
      if (await checkFn()) {
        return true;
      }
    }
    catch (error) {
      console.log(error);
    }

    await new Promise(resolve => setTimeout(resolve, checkInterval));
  }

  // If we reached here, we timed out
  return false;
}

function createHonoClientLoader() {
  let client: ReturnType<typeof hc<AppType>> | undefined;

  async function createHonoClient() {
    if (client && await waitForServer(async () => (await client!.ping.$get()).ok)) {
      return client;
    }
    const port = await getPorts();

    const _client = hc<AppType>(`http://localhost:${port}/`);

    await startTsPlugin(port);

    if (await waitForServer(async () => (await _client.ping.$get()).ok)) {
      client = _client;
      return _client;
    }

    throw new Error('Failed to start TypeScript plugin server');
  }

  return createHonoClient;
}

async function getQuickInfoAtPosition(
  fileName: string,
  position: vscode.Position,
) {
  return await vscode.commands
    .executeCommand(
      'typescript.tsserverRequest',
      'quickinfo-full',
      toFileLocationRequestArgs(fileName, position),
    )
    .then(
      r => (r as ts.server.protocol.QuickInfoResponse).body,
      (e) => {
        if (!fileName.endsWith('.vue')) {
          throw e;
        }
      },
    );
}

/**
 * @deprecated
 */
async function customTypescriptRequest<Id extends CustomTypeScriptRequestId>(
  fileName: string,
  position: vscode.Position,
  request: CustomTypeScriptRequestOfId<Id>,
): Promise<CustomTypeScriptResponseBody<Id> | undefined> {
  const { register, abort } = getDurationAlert(
    'TSServer needs more time to respond, please wait a few seconds',
    3000,
  );

  register();

  return await vscode.commands
    .executeCommand('typescript.tsserverRequest', 'completionInfo', {
      ...toFileLocationRequestArgs(fileName, position),
      /**
       * We override the "triggerCharacter" property here as a hack so
       * that we can send custom commands to TSServer
       */
      triggerCharacter: request,
    })
    .then((val) => {
      abort();
      if (!val) {
        return undefined;
      }

      const response = val as CustomTypeScriptResponse;

      if (response.body.__tsExplorerResponse?.id === 'error') {
        const error = response.body.__tsExplorerResponse.error;

        const errorObj = new Error(error.message ?? '');
        errorObj.stack = error.stack;
        errorObj.name = error.name ?? errorObj.name;

        throw errorObj;
      }

      return response.body.__tsExplorerResponse as
        | CustomTypeScriptResponseBody<Id>
        | undefined;
    });
}

export function getQuickInfoAtLocation(location: SourceFileLocation) {
  return getQuickInfoAtPosition(
    location.fileName,
    positionFromLineAndCharacter(location.range.start),
  );
}

export function getTypeTreeAtLocation(
  location: SourceFileLocation,
): Promise<TypeInfo | undefined> {
  return getTypeTreeAtRange(
    location.fileName,
    rangeFromLineAndCharacters(location.range.start, location.range.end),
  );
}

const getHonoClient = createHonoClientLoader();

export async function getTypeTreeAtRange(
  fileName: string,
  range: vscode.Range,
): Promise<TypeInfo | undefined> {
  const { register, abort } = getDurationAlert(
    'TSServer needs more time to respond, please wait a few seconds',
    3000,
  );

  register();

  const client = await getHonoClient();

  const res = await client.type.$post({
    json: {
      fileName,
      range: rangeToTextRange(range),
      maxDepth: 6,
    },
  });

  abort();
  if (res.ok) {
    return (await res.json()).data;
  }
  throw res.status;
}
