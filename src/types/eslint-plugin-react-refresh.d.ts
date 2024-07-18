// This is only a type-shim and is not meant to be a perfect representation of eslint-plugin-react-hooks.

declare module 'eslint-plugin-react-refresh' {
  import type { ESLint } from 'eslint';
  const plugin: Omit<ESLint.Plugin, 'configs'> & {
    // eslint-plugin-react-hooks does not use FlatConfig yet
    configs: Record<string, ESLint.ConfigData>;
  };
  export default plugin;
}
