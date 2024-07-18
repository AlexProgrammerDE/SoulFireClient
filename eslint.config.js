// @ts-check

import globals from 'globals';
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import eslintPluginReact from 'eslint-plugin-react';
import eslintPluginReactHooks from 'eslint-plugin-react-hooks';
import eslintPluginReactRefresh from 'eslint-plugin-react-refresh';
import { fixupPluginRules } from '@eslint/compat';
import tselintParser from '@typescript-eslint/parser';

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  eslintPluginPrettierRecommended,
  {
    plugins: {
      react: eslintPluginReact,
      'react-hooks': fixupPluginRules(eslintPluginReactHooks),
      'react-refresh': fixupPluginRules(eslintPluginReactRefresh),
    },
    languageOptions: {
      parser: tselintParser,
      globals: { ...globals.browser },
      parserOptions: {
        project: true,
        tsconfigRootDir: import.meta.dirname,
        ecmaFeatures: { jsx: true },
      },
    },
    rules: {
      ...eslintPluginReactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      '@typescript-eslint/dot-notation': 'off',
    },
  },
  {
    files: ['**/*.js', 'src/generated/**/*'],
    ...tseslint.configs.disableTypeChecked,
  },
  {
    ignores: ['src-tauri/**/*', 'dist/**/*', 'src/generated/**/*'],
  },
);
