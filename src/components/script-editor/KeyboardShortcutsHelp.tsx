import { Keyboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const SHORTCUTS = [
  { keys: "Shift + A", action: "Quick add menu" },
  { keys: "M", action: "Toggle mute node" },
  { keys: "H", action: "Toggle collapse node" },
  { keys: "Ctrl + J", action: "Create frame from selection" },
  { keys: "Ctrl + D", action: "Duplicate selection" },
  { keys: "Ctrl + Drag", action: "Cut links" },
  { keys: "Right Click", action: "Quick add menu at cursor" },
  { keys: "Delete / Backspace", action: "Delete selection" },
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
                    {keys}
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
