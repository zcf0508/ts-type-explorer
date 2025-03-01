import { defineConfig } from 'tsup';

export default defineConfig([
  {
    entry: ['src/extension.ts'],
    outDir: 'out',
    splitting: false,
    sourcemap: true,
    clean: true,
    dts: false,
    format: ['cjs'],
    noExternal: ['@ts-type-explorer/api'],
    external: [
      'vscode',
      'typescript',
    ],
  },
  {
    entry: ['node_modules/@ts-type-explorer/typescript-plugin/dist/index.js'],
    outDir: 'node_modules/@ts-type-explorer/typescript-plugin-pack',
    splitting: false,
    sourcemap: false,
    clean: true,
    dts: false,
    format: ['cjs'],
  },
]);
