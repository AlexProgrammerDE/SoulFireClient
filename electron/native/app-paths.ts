import path from "node:path";
import type { App } from "electron";
import type { DesktopBaseDirectory } from "../../src/lib/desktop-api";

export function getAppConfigDir(app: App): string {
  return path.join(app.getPath("userData"), "config");
}

export function getAppLocalDataDir(app: App): string {
  return path.join(app.getPath("userData"), "local-data");
}

export function getBaseDirectoryPath(
  app: App,
  baseDir?: DesktopBaseDirectory,
): string | null {
  switch (baseDir) {
    case "AppConfig":
      return getAppConfigDir(app);
    case "AppLocalData":
      return getAppLocalDataDir(app);
    case "Download":
      return app.getPath("downloads");
    default:
      return null;
  }
}
