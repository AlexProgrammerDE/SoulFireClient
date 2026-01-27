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

async function writeToSystemClipboard(text: string): Promise<void> {
  if (isTauri()) {
    return clipboard.writeText(text);
  } else {
    return navigator.clipboard.writeText(text);
  }
}

async function readFromSystemClipboard(): Promise<string> {
  if (isTauri()) {
    return clipboard.readText();
  } else {
    return navigator.clipboard.readText();
  }
}

/**
 * Copy script nodes/edges to both system clipboard and localStorage.
 * System clipboard enables cross-browser/cross-app paste.
 * localStorage serves as fallback when clipboard access is denied.
 */
export async function copyToScriptClipboard(
  data: ScriptClipboardData,
): Promise<void> {
  const jsonData = JSON.stringify(data);

  // Always save to localStorage as fallback
  localStorage.setItem(LOCAL_STORAGE_KEY, jsonData);

  // Try to write to system clipboard
  try {
    await writeToSystemClipboard(CLIPBOARD_PREFIX + jsonData);
  } catch (error) {
    // Clipboard access denied - localStorage fallback is already in place
    console.warn("Could not write to system clipboard:", error);
  }
}

/**
 * Read script clipboard data from system clipboard or localStorage.
 * Prioritizes system clipboard for cross-browser support.
 */
export async function readFromScriptClipboard(): Promise<ScriptClipboardData | null> {
  // Try system clipboard first
  try {
    const text = await readFromSystemClipboard();
    if (text.startsWith(CLIPBOARD_PREFIX)) {
      const jsonData = text.slice(CLIPBOARD_PREFIX.length);
      const parsed = JSON.parse(jsonData) as ScriptClipboardData;
      if (parsed.nodes && parsed.edges) {
        return parsed;
      }
    }
  } catch (error) {
    // Clipboard access denied or invalid data
    console.warn("Could not read from system clipboard:", error);
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
      // Invalid localStorage data
    }
  }

  return null;
}

/**
 * Check if there's valid script data in the clipboard.
 */
export async function hasScriptClipboardData(): Promise<boolean> {
  const data = await readFromScriptClipboard();
  return data !== null && data.nodes.length > 0;
}
