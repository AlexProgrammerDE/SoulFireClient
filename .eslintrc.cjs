module.exports = {
  root: true,
  env: { browser: true, es2021: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs', 'src/generated'],
  parser: '@typescript-eslint/parser',
  rules: {
    '@typescript-eslint/no-empty-object-type': 'off',
  },
};
