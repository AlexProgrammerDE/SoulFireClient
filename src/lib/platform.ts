export const isMac =
  typeof navigator !== "undefined" &&
  /Mac|iPod|iPhone|iPad/.test(navigator.userAgent);

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
