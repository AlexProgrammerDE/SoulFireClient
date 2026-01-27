import * as clipboard from "@tauri-apps/plugin-clipboard-manager";
import type { Edge, Node } from "@xyflow/react";
import { isTauri } from "./utils";

const CLIPBOARD_PREFIX = "SOULFIRE_SCRIPT_CLIPBOARD:";
const LOCAL_STORAGE_KEY = "script-editor-clipboard";

export interface ScriptClipboardData {
  nodes: Node[];
  edges: Edge[];
  sourceScriptId: string | null;
}

/**
 * Serialize clipboard data for storage/transfer.
 */
function serializeClipboardData(data: ScriptClipboardData): string {
  return CLIPBOARD_PREFIX + JSON.stringify(data);
}

/**
 * Parse clipboard text into ScriptClipboardData if valid.
 */
function parseClipboardText(text: string): ScriptClipboardData | null {
  if (!text.startsWith(CLIPBOARD_PREFIX)) return null;

  try {
    const jsonData = text.slice(CLIPBOARD_PREFIX.length);
    const parsed = JSON.parse(jsonData) as ScriptClipboardData;
    if (parsed.nodes && parsed.edges) {
      return parsed;
    }
  } catch {
    // Invalid JSON
  }
  return null;
}

/**
 * Handle native copy event - write to clipboard without permission prompt.
 * Call this from a 'copy' event handler.
 */
export function handleNativeCopy(
  event: ClipboardEvent,
  data: ScriptClipboardData,
): void {
  const serialized = serializeClipboardData(data);

  // Write to native clipboard via the event (no permission needed)
  event.clipboardData?.setData("text/plain", serialized);
  event.preventDefault();

  // Also save to localStorage as fallback
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
}

/**
 * Handle native paste event - read from clipboard without permission prompt.
 * Call this from a 'paste' event handler.
 */
export function handleNativePaste(
  event: ClipboardEvent,
): ScriptClipboardData | null {
  const text = event.clipboardData?.getData("text/plain") ?? "";

  // Try to parse from clipboard
  const fromClipboard = parseClipboardText(text);
  if (fromClipboard) {
    event.preventDefault();
    return fromClipboard;
  }

  // Fallback to localStorage
  const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (stored) {
    try {
      const parsed = JSON.parse(stored) as ScriptClipboardData;
      if (parsed.nodes && parsed.edges) {
        event.preventDefault();
        return parsed;
      }
    } catch {
      // Invalid localStorage data
    }
  }

  return null;
}

/**
 * Copy to clipboard using Tauri native API (for non-event contexts).
 * Only use this for Tauri, as browser requires user gesture.
 */
export async function copyToClipboardTauri(
  data: ScriptClipboardData,
): Promise<void> {
  if (!isTauri()) {
    // For browser, just save to localStorage - actual clipboard write
    // should happen via handleNativeCopy in a copy event
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
    return;
  }

  const serialized = serializeClipboardData(data);
  await clipboard.writeText(serialized);
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
}

/**
 * Read from clipboard using Tauri native API (for non-event contexts).
 * Only use this for Tauri, as browser requires user gesture.
 */
export async function readFromClipboardTauri(): Promise<ScriptClipboardData | null> {
  if (!isTauri()) {
    // For browser, read from localStorage - actual clipboard read
    // should happen via handleNativePaste in a paste event
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as ScriptClipboardData;
        if (parsed.nodes && parsed.edges) {
          return parsed;
        }
      } catch {
        // Invalid data
      }
    }
    return null;
  }

  try {
    const text = await clipboard.readText();
    const fromClipboard = parseClipboardText(text);
    if (fromClipboard) return fromClipboard;
  } catch {
    // Clipboard read failed
  }

  // Fallback to localStorage
  const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (stored) {
    try {
      const parsed = JSON.parse(stored) as ScriptClipboardData;
      if (parsed.nodes && parsed.edges) {
        return parsed;
      }
    } catch {
      // Invalid data
    }
  }

  return null;
}

/**
 * Check if there's valid script data available (localStorage check only).
 */
export function hasScriptClipboardData(): boolean {
  const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (stored) {
    try {
      const parsed = JSON.parse(stored) as ScriptClipboardData;
      return parsed?.nodes?.length > 0;
    } catch {
      return false;
    }
  }
  return false;
}
