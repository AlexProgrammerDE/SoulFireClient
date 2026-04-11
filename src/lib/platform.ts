import { type as getOsType } from "@tauri-apps/plugin-os";

export const isMac =
  typeof navigator !== "undefined" &&
  /Mac|iPod|iPhone|iPad/.test(navigator.userAgent);

function isTauriRuntime() {
  return (
    typeof window !== "undefined" &&
    (
      window as unknown as {
        __TAURI__?: unknown;
      }
    ).__TAURI__ !== undefined
  );
}

export function isDesktopTauri() {
  if (!isTauriRuntime()) {
    return false;
  }

  const osType = getOsType();
  return osType !== "android" && osType !== "ios";
}

/**
 * Replaces modifier key names for the current platform.
 * On macOS: Ctrl → ⌘, Alt → ⌥
 */
export function formatShortcut(shortcut: string): string {
  if (isMac) {
    return shortcut.replace(/Ctrl/g, "⌘").replace(/Alt/g, "⌥");
  }
  return shortcut;
}
