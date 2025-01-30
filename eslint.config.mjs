import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';

export default tseslint.config(
  {
    ignores: ['src/generated', 'src/routeTree.gen.ts', '**/protobuf'],
  },
  eslint.configs.recommended,
  tseslint.configs.recommended,
  {
    plugins: {
      reactHooks,
      reactRefresh,
    },
    rules: {
      '@typescript-eslint/no-empty-object-type': 'off',
    },
  },
);
