import type * as vscode from 'vscode';
import { registerCommands } from './commands';
import { registerConfig } from './config';
import { StateManager } from './state/stateManager';
import { createAndRegisterViews } from './view/views';

// TODO: add config for e.g. max depth

export const stateManager = new StateManager();

export function activate(context: vscode.ExtensionContext) {
  const viewProviders = createAndRegisterViews(context, stateManager);

  registerCommands(context);
  registerConfig(context, viewProviders);

  stateManager.init(context, viewProviders);
}

export function deactivate() {
  // plugin deactivation
}
