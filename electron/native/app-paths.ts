import path from "node:path";
import type { App } from "electron";

export function getAppConfigDir(app: App): string {
  return path.join(app.getPath("userData"), "config");
}

export function getAppLocalDataDir(app: App): string {
  return path.join(app.getPath("userData"), "local-data");
}
