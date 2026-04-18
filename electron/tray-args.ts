export const TRAY_GUID = "08dbd6ec-34c7-4dc2-a8a3-59cef3cc4644";

export function trayGuidForPlatform(platform: NodeJS.Platform): string | null {
  return platform === "linux" ? null : TRAY_GUID;
}
