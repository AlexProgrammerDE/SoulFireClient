import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import reactCompiler from 'eslint-plugin-react-compiler';
import react from 'eslint-plugin-react';
import globals from 'globals';

// noinspection JSCheckFunctionSignatures
export default tseslint.config(
  {
    ignores: ['src/generated', 'src/routeTree.gen.ts', '**/protobuf'],
  },
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: globals.browser,
    },
  },
  eslint.configs.recommended,
  tseslint.configs.recommended,
  reactCompiler.configs.recommended,
  {
    plugins: {
      reactHooks,
      react,
    },
    rules: {
      '@typescript-eslint/no-empty-object-type': 'off',
    },
  },
);
