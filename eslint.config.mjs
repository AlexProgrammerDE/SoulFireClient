import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';

export default tseslint.config(
  {
    ignores: ['src/generated', 'src/routeTree.gen.ts', '**/protobuf'],
  },
  eslint.configs.recommended,
  tseslint.configs.recommended,
  {
    plugins: {
      reactHooks,
    },
    rules: {
      '@typescript-eslint/no-empty-object-type': 'off',
    },
  },
);
