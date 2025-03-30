import type { LocalizedTypeInfo } from '@ts-type-explorer/api';
import type { TypeTreeItem } from '../../packages/typescript-explorer-vscode/src/view/typeTreeView';

const mapped = ([] as LocalizedTypeInfo[]).map(
  x => x as unknown as TypeTreeItem,
);
