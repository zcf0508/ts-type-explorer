import * as vscode from 'vscode';

type GetAPI = (n: number) => {
  configurePlugin: <PluginName extends keyof PluginOptions>(
    pluginName: PluginName,
    options: PluginOptions[PluginName],
  ) => void
};

interface TypescriptLanguageFeatures {
  getAPI?: GetAPI
}

interface PluginOptions {
  '@ts-type-explorer/typescript-plugin-pack': {
    port: number
  }
}

function getTsFeatureExtension() {
  return vscode.extensions.getExtension<TypescriptLanguageFeatures>(
    'vscode.typescript-language-features',
  );
}

export async function startTsPlugin(port: number) {
  const tsFeatureExtension = getTsFeatureExtension();
  if (!tsFeatureExtension) {
    throw new Error('typescript-language-features extension not found');
  }

  await tsFeatureExtension.activate();
  const api = tsFeatureExtension.exports;

  if (api.getAPI) {
    const tsApi = api.getAPI(0);
    tsApi.configurePlugin('@ts-type-explorer/typescript-plugin-pack', {
      port,
    });
  }
}
