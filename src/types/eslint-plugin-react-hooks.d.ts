// This is only a type-shim and is not meant to be a perfect representation of eslint-plugin-react-hooks.

declare module 'eslint-plugin-react-hooks' {
  const plugin: {
    // eslint-plugin-react-hooks does not use FlatConfig yet
    configs: Record;
  };
  export default plugin;
}
