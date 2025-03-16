import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import react from 'eslint-plugin-react';
import globals from 'globals';

// noinspection JSCheckFunctionSignatures
export default tseslint.config(
  {
    ignores: [
      'src/generated',
      'src/routeTree.gen.ts',
      '**/protobuf',
      'node_modules',
      'src-tauri',
      'src/components/ui/chart.tsx',
    ],
  },
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: globals.browser,
    },
  },
  eslint.configs.recommended,
  tseslint.configs.recommendedTypeChecked,
  {
    plugins: {
      reactHooks,
      react,
    },
    rules: {
      '@typescript-eslint/no-empty-object-type': 'off',
    },
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
);
