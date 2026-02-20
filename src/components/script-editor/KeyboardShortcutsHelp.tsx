import { Keyboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatShortcut } from "@/lib/platform.ts";

const SHORTCUTS = [
  { keys: "A", action: "Select all nodes" },
  { keys: "Alt + A", action: "Deselect all" },
  { keys: "Shift + A", action: "Quick add menu" },
  { keys: "Shift + D", action: "Duplicate selection" },
  { keys: "L", action: "Select linked nodes" },
  { keys: "Ctrl + L", action: "Select upstream nodes" },
  { keys: "Alt + L", action: "Select downstream nodes" },
  { keys: "Shift + S", action: "Select similar nodes" },
  { keys: "Tab", action: "Enter/Exit group" },
  { keys: "M", action: "Toggle mute node" },
  { keys: "H", action: "Toggle collapse node" },
  { keys: "Ctrl + H", action: "Hide unconnected sockets" },
  { keys: "Shift + H", action: "Toggle node preview" },
  { keys: "Ctrl + G", action: "Create group from selection" },
  { keys: "Ctrl + Alt + G", action: "Ungroup selected" },
  { keys: "Ctrl + J", action: "Create frame from selection" },
  { keys: "Ctrl + C", action: "Copy selection" },
  { keys: "Ctrl + V", action: "Paste" },
  { keys: "Ctrl + Shift + ←↑↓→", action: "Align nodes" },
  { keys: "Alt + Shift + H/V", action: "Distribute nodes" },
  { keys: "Alt + Drag", action: "Cut links" },
  { keys: "Shift + Right Click", action: "Quick reroute on edge" },
  { keys: "Right Click", action: "Quick add menu at cursor" },
  { keys: "Delete / Backspace / X", action: "Delete selection" },
  { keys: "F2", action: "Rename selected node" },
];

/**
 * A help button that shows available keyboard shortcuts.
 * Blender-style: Users can quickly reference shortcuts while learning.
 */
export function KeyboardShortcutsHelp() {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline" size="icon" className="h-8 w-8">
            <Keyboard className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="left" className="w-64">
          <div className="space-y-2">
            <p className="font-medium">Keyboard Shortcuts</p>
            <div className="space-y-1">
              {SHORTCUTS.map(({ keys, action }) => (
                <div
                  key={keys}
                  className="flex items-center justify-between text-xs"
                >
                  <span className="text-muted-foreground">{action}</span>
                  <kbd className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
                    {formatShortcut(keys)}
                  </kbd>
                </div>
              ))}
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
