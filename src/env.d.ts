/// <reference types="vite/client" />
import type { SoulFireDesktopApi } from "@/lib/desktop-api";

declare global {
  const APP_VERSION: string;
  const APP_ENVIRONMENT: "production" | "development" | "preview";
  const APP_LOCALES: string;
  const APP_NAMESPACES: string;

  interface Window {
    soulfireDesktop?: SoulFireDesktopApi;
  }
}

declare module "*.svg" {
  const content: string;
  export default content;
}
declare module "*.svg?react" {
  const ReactComponent: React.FunctionComponent<React.SVGProps<SVGSVGElement>>;
  export default ReactComponent;
}
