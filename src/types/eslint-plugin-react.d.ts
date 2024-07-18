// This is only a type-shim and is not meant to be a perfect representation of eslint-plugin-react.

declare module 'eslint-plugin-react' {
  const plugin: {
    // eslint-plugin-react does not use FlatConfig yet
    configs: Record;
  };
  export default plugin;
}
