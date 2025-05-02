import js from '@eslint/js';
import tsEslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import prettierPlugin from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';
import importPlugin from 'eslint-plugin-import';

export default [
  // Global ignores
  {
    ignores: ['.eslintrc.js', '**/*.spec.ts', '**/__tests__/**']
  },
  // Base JS config
  js.configs.recommended,
  // TypeScript config
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: 'tsconfig.json',
        tsconfigRootDir: import.meta.dirname,
        sourceType: 'module',
      },
      globals: {
        // Add globals that are used throughout the codebase
        'node': true,
        'jest': true,
        'process': true,
        'console': true,
        'Buffer': true,
        'setTimeout': true,
        'clearTimeout': true,
        'setInterval': true,
        'clearInterval': true,
        'URL': true,
        '__dirname': true,
        'NodeJS': true,
      },
    },
    plugins: {
      '@typescript-eslint': tsEslint,
      'prettier': prettierPlugin,
      'import': importPlugin,
    },
    rules: {
      // TypeScript rules - relaxed for migration
      '@typescript-eslint/no-empty-function': 'warn',
      '@typescript-eslint/explicit-function-return-type': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': 'warn',
      '@typescript-eslint/no-var-requires': 'warn',
      '@typescript-eslint/consistent-type-definitions': 'off', // Turn off for now
      '@typescript-eslint/explicit-member-accessibility': 'off',
      '@typescript-eslint/no-non-null-assertion': 'warn',
      '@typescript-eslint/no-namespace': 'warn',
      '@typescript-eslint/naming-convention': 'off', // Turn off naming convention checks temporarily

      // Import rules
      'no-restricted-imports': 'off',
      'import/no-unresolved': 'off',
      'import/no-relative-parent-imports': 'off',

      // General rules
      'no-console': 'warn', // Set to warn instead of error
      'no-undef': 'off', // Turn off since we're using TS
      'no-unused-vars': 'off', // Let TS handle this
      'prettier/prettier': 'warn',
      'no-self-assign': 'warn',
    },
    settings: {
      'import/resolver': {
        typescript: {
          project: './tsconfig.json',
        },
      },
    },
  },
  // Prettier config
  prettierConfig,
];