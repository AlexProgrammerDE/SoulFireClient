/// <reference types="@rsbuild/core/types" />
declare const APP_VERSION: string;
declare const APP_ENVIRONMENT: 'production' | 'development' | 'preview';
declare const APP_LOCALES: string;
declare const APP_NAMESPACES: string;

declare module '*.svg' {
  const content: string;
  export default content;
}
declare module '*.svg?react' {
  const ReactComponent: React.FunctionComponent<React.SVGProps<SVGSVGElement>>;
  export default ReactComponent;
}
