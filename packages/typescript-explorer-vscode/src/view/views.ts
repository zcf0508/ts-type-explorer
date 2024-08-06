import * as vscode from "vscode"
import { StateManager } from "../state/stateManager"
import { TypeTreeItem, TypeTreeProvider } from "./typeTreeView"

export type ViewProviders = {
    typeTreeProvider: TypeTreeProvider
}

export let treeView: vscode.TreeView<TypeTreeItem> | undefined

export function createAndRegisterViews(
    context: vscode.ExtensionContext,
    stateManager: StateManager
): ViewProviders {
    const typeTreeProvider = new TypeTreeProvider(stateManager)

    treeView = vscode.window.createTreeView("type-tree", {
        treeDataProvider: typeTreeProvider,
    })

    context.subscriptions.push(treeView)

    return { typeTreeProvider }
}
