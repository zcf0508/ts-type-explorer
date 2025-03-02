import type { StateManager } from '../state/stateManager';
import type { TypeTreeItem } from './typeTreeView';
import * as vscode from 'vscode';
import { TypeTreeProvider } from './typeTreeView';

export interface ViewProviders {
  typeTreeProvider: TypeTreeProvider
}

// eslint-disable-next-line import/no-mutable-exports
export let treeView: vscode.TreeView<TypeTreeItem> | undefined;

export function createAndRegisterViews(
  context: vscode.ExtensionContext,
  stateManager: StateManager,
): ViewProviders {
  const typeTreeProvider = new TypeTreeProvider(stateManager);

  treeView = vscode.window.createTreeView('type-tree', {
    treeDataProvider: typeTreeProvider,
  });

  context.subscriptions.push(treeView);

  return { typeTreeProvider };
}
