const js = require('@eslint/js');
const globals = require('globals');
const { FlatCompat } = require('@eslint/eslintrc');
const path = require('path');

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

module.exports = [
  js.configs.recommended,

  ...compat.extends('plugin:@typescript-eslint/recommended', 'plugin:prettier/recommended'),

  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.es2020,
      },
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
      },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'error',
      'no-console': 'warn',
      'prettier/prettier': 'error',
    },
  },

  {
    ignores: ['node_modules/**', 'dist/**', 'build/**', 'coverage/**', '**/*.d.ts'],
  },
];
