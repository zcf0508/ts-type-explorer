import antfu from '@antfu/eslint-config';

export default antfu(
  {
    typescript: true,
    markdown: false,
  },
  {
    ignores: [
      'tests/baselines/**',
      'tests/cases/**',
      '**/out/**',
      '**/dist/**',
      '**/scripts/**/*.js',
      '**/.vscode-test/**',
      'packages/typescript-explorer-vscode/src/test/**',
      'scripts/**',
    ],
  },
  {
    rules:
      {
        'curly': ['error', 'all'],
        'style/brace-style': 'error',
        'style/multiline-ternary': ['error', 'always'],
        'unused-imports/no-unused-imports': 'off',
        'unused-imports/no-unused-vars': [
          'warn',
          { args: 'after-used', argsIgnorePattern: '^_', vars: 'all', varsIgnorePattern: '^_' },
        ],
        'no-console': ['warn'],
        'style/semi': ['error', 'always'],
        'style/indent': ['error', 2, { SwitchCase: 1 }],
        'style/max-len': [
          'error',
          {
            code: 120,
            tabWidth: 2,
            ignoreRegExpLiterals: true,
            ignoreStrings: true,
            ignoreUrls: true,
            ignoreTemplateLiterals: true,
            ignoreComments: true,
          },
        ],
        'comma-dangle': ['error', 'always-multiline'],
        'style/quotes': ['error', 'single'],

        'ts/prefer-literal-enum-member': 'off',
        '@typescript-eslint/no-unused-vars': 'off',
        '@typescript-eslint/no-non-null-assertion': 'off',
        '@typescript-eslint/no-duplicate-enum-values': 'off',
        '@typescript-eslint/no-floating-promises': 'off',
        'import/no-extraneous-dependencies': [
          'warn',
          {
            devDependencies: false,
          },
        ],
      },
  },
);
