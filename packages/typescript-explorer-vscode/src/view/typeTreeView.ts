import type {
  LocalizedTypeInfo,
  LocalizedTypeInfoOrError,
} from '@ts-type-explorer/api';
import type { StateManager } from '../state/stateManager';
import assert from 'node:assert';
import {
  TypeInfoResolver,
} from '@ts-type-explorer/api';
import * as vscode from 'vscode';
import { showBaseClassInfo, showTypeParameterInfo } from '../config';
import { markdownDocumentation } from '../markdown';
import { getQuickInfoAtLocation, getTypeTreeAtLocation } from '../server';
import {
  getDurationAlert,
  logError,
  rangeFromLineAndCharacters,
  showError,
} from '../util';
import { getMeta, getMetaWithTypeArguments } from './typeTreeViewLocalizer';

export interface TypeTreeChildrenUpdateInfo {
  parent: TypeTreeItem | undefined
  children: TypeTreeItem[]
}

export class TypeTreeProvider implements vscode.TreeDataProvider<TypeTreeItem> {
  constructor(private stateManager: StateManager) {}

  private typeInfoResolver: TypeInfoResolver | undefined;

  private _onDidChangeTreeData: vscode.EventEmitter<
        TypeTreeItem | undefined | null | void
  > = new vscode.EventEmitter();

  readonly onDidChangeTreeData: vscode.Event<
        TypeTreeItem | undefined | null | void
  > = this._onDidChangeTreeData.event;

  private _onDidGetChildren: vscode.EventEmitter<TypeTreeChildrenUpdateInfo>
    = new vscode.EventEmitter();

  readonly onDidGetChildren: vscode.Event<TypeTreeChildrenUpdateInfo>
    = this._onDidGetChildren.event;

  refresh(): void {
    this.typeInfoResolver = undefined;
    this._onDidChangeTreeData.fire();
  }

  async getTreeItem(element: TypeTreeItem) {
    if (element.typeInfo.error) {
      return element;
    }

    if (
      element.typeInfo.typeArguments
      && element.typeInfo.typeArguments.length > 0
    ) {
      const typeArguments = await this.localizeTypeInfoTypeArguments(
        element.typeInfo,
      );

      const newMeta = getMetaWithTypeArguments(
        element.typeInfo,
        typeArguments,
      );

      if (newMeta) {
        if (newMeta.description) {
          element.description = newMeta.description;
        }

        if (newMeta.label) {
          element.label = newMeta.label;
        }
      }
    }

    return element;
  }

  async resolveTreeItem(item: TypeTreeItem): Promise<TypeTreeItem> {
    if (!item.typeInfo.error && item.typeInfo.locations) {
      for (const location of item.typeInfo.locations) {
        const { documentation, tags }
          = (await getQuickInfoAtLocation(location)) ?? {};

        if (documentation && documentation.length > 0) {
          item.tooltip = markdownDocumentation(
            documentation,
            tags ?? [],
            vscode.Uri.file(location.fileName),
          );
          break;
        }
      }
    }
    return item;
  }

  async getChildren(element?: TypeTreeItem): Promise<TypeTreeItem[]> {
    const { register, abort } = getDurationAlert(
      'TSServer needs more time to get children information, please wait a few seconds',
      3000,
    );

    register();

    const children = await this.getChildrenWorker(element).catch((e) => {
      logError(e, 'Error getting children');
      showError(e.message ?? 'Error getting children');
      return [];
    });

    abort();

    this._onDidGetChildren.fire({ parent: element, children });

    return children;
  }

  private async localizeTypeInfoChildren(
    typeInfo: LocalizedTypeInfo,
    typeArguments?: boolean,
  ) {
    if (!this.typeInfoResolver?.hasLocalizedTypeInfo(typeInfo)) {
      return [];
    }

    return this.typeInfoResolver.localizeChildren(typeInfo, typeArguments);
  }

  private async localizeTypeInfoTypeArguments(typeInfo: LocalizedTypeInfo) {
    return this.localizeTypeInfoChildren(typeInfo, true);
  }

  private async getChildrenWorker(
    element?: TypeTreeItem,
  ): Promise<TypeTreeItem[]> {
    if (!element) {
      const typeInfo = this.stateManager.getTypeTree();
      if (!typeInfo) {
        return [];
      }

      this.typeInfoResolver = new TypeInfoResolver(getTypeTreeAtLocation);

      const localizedTypeInfo = await this.typeInfoResolver?.localize(
        typeInfo,
      );

      return [
        this.createTypeNode(localizedTypeInfo, /* root */ undefined),
      ];
    }
    else {
      const resolveMaxDepthItem = async (parentItem?: TypeTreeItem) => {
        const location = parentItem?.typeInfo.locations?.[0];

        if (!location) {
          return [];
        }

        const childrenTypeInfo = await getTypeTreeAtLocation(location).catch(() => undefined);

        if (!childrenTypeInfo) {
          return [];
        }

        const localizedTypeInfoChildren = (await this.typeInfoResolver!.localize(
          childrenTypeInfo,
        )).children ?? [];

        const res = (await Promise.all(
          localizedTypeInfoChildren?.map(async info => await this.typeInfoResolver?.localize(
            info.info!,
          )),
        )).filter(Boolean) as LocalizedTypeInfoOrError[];

        return res;
      };
      const _localizedChildren = await (async () => {
        if (element.typeInfo.kind === 'max_depth') {
          return await resolveMaxDepthItem(element.parent);
        }
        else {
          return await this.localizeTypeInfoChildren(
            element.typeInfo,
          );
        }
      })();

      const hasMaxDepth = _localizedChildren.some(info => info.kind === 'max_depth');

      // 如果 _localizedChildren 中有 max_depth 节点，需要 resolveMaxDepthItem 之后，用返回的数组替换原本的 max_depth 节点, 注意，原本是一个节点，替换后应该是多个节点
      const localizedChildren = await (async () => {
        if (hasMaxDepth) {
          return await resolveMaxDepthItem(element);
        }
        else {
          return _localizedChildren;
        }
      })();

      return localizedChildren
        .map(info => this.createTypeNode(info, element))
        .filter(
          ({ typeInfo: { purpose } }) =>
            showTypeParameterInfo.get()
            || !(
              purpose === 'type_argument_list'
              || purpose === 'type_parameter_list'
            ),
        )
        .filter(
          ({ typeInfo: { purpose } }) =>
            showBaseClassInfo.get()
            || !(
              purpose === 'class_base_type'
              || purpose === 'class_implementations'
              || purpose === 'object_class'
            ),
        );
    }
  }

  createTypeNode(
    typeInfo: LocalizedTypeInfoOrError,
    parent: TypeTreeItem | undefined,
  ) {
    return new TypeTreeItem(typeInfo, this, parent);
  }
}

export class TypeTreeItem extends vscode.TreeItem {
  protected depth: number;

  constructor(
    public typeInfo: LocalizedTypeInfoOrError,
    private provider: TypeTreeProvider,
    public parent?: TypeTreeItem,
  ) {
    const depth = (parent?.depth ?? 0) + 1;

    const {
      label,
      description,
      contextValue,
      icon,
      collapsibleState,
      tooltip,
    } = getMeta(typeInfo, depth);

    super(label, collapsibleState);

    this.depth = depth;
    this.description = description;
    this.contextValue = contextValue;
    this.iconPath = icon;
    this.tooltip = tooltip;
  }

  protected createTypeNode(typeInfo: LocalizedTypeInfo) {
    return this.provider.createTypeNode(typeInfo, this);
  }

  private definitionIndex = 0;

  goToDefinition() {
    const locations = !this.typeInfo.error
      ? this.typeInfo.locations
      : this.typeInfo.error.typeInfo?.symbolMeta?.declarations?.map(
        ({ location }) => location,
      );

    assert(locations && locations.length > 0, 'Type has no locations!');

    const location = locations[this.definitionIndex];
    this.definitionIndex = (this.definitionIndex + 1) % locations.length;

    const args: [vscode.Uri, vscode.TextDocumentShowOptions] = [
      vscode.Uri.file(location.fileName),
      {
        selection: rangeFromLineAndCharacters(
          location.range.start,
          location.range.end,
        ),
      },
    ];

    vscode.commands.executeCommand('vscode.open', ...args);
  }
}
