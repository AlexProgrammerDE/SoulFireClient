import { Link } from "@tanstack/react-router";
import {
  ArrowLeftIcon,
  LoaderCircleIcon,
  PlayIcon,
  SaveIcon,
  SquareIcon,
  Trash2Icon,
  ZoomInIcon,
  ZoomOutIcon,
} from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Separator } from "@/components/ui/separator.tsx";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip.tsx";
import { cn } from "@/lib/utils.tsx";
import { useScriptEditorStore } from "@/stores/script-editor-store.ts";

interface ScriptToolbarProps {
  instanceId: string;
  onSave?: () => void;
  onStart?: () => void;
  onStop?: () => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onFitView?: () => void;
  onClear?: () => void;
  isSaving?: boolean;
  className?: string;
}

export function ScriptToolbar({
  instanceId,
  onSave,
  onStart,
  onStop,
  onZoomIn,
  onZoomOut,
  onFitView,
  onClear,
  isSaving = false,
  className,
}: ScriptToolbarProps) {
  const scriptName = useScriptEditorStore((state) => state.scriptName);
  const setScriptName = useScriptEditorStore((state) => state.setScriptName);
  const isDirty = useScriptEditorStore((state) => state.isDirty);
  const isRunning = useScriptEditorStore((state) => state.isRunning);

  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(scriptName);

  const handleNameSubmit = () => {
    setIsEditingName(false);
    if (editedName.trim() && editedName !== scriptName) {
      setScriptName(editedName.trim());
    } else {
      setEditedName(scriptName);
    }
  };

  const handleNameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleNameSubmit();
    } else if (e.key === "Escape") {
      setIsEditingName(false);
      setEditedName(scriptName);
    }
  };

  return (
    <div
      className={cn(
        "flex h-12 items-center gap-2 border-b border-border bg-card px-3",
        className,
      )}
    >
      {/* Back Button */}
      <Button variant="ghost" size="icon" asChild>
        <Link
          to="/instance/$instance/scripts"
          params={{ instance: instanceId }}
        >
          <ArrowLeftIcon className="size-4" />
          <span className="sr-only">Back to Scripts</span>
        </Link>
      </Button>

      <Separator orientation="vertical" className="h-6" />

      {/* Script Name */}
      <div className="flex items-center gap-2">
        {isEditingName ? (
          <Input
            value={editedName}
            onChange={(e) => setEditedName(e.target.value)}
            onBlur={handleNameSubmit}
            onKeyDown={handleNameKeyDown}
            className="h-7 w-48 text-sm font-medium"
            autoFocus
          />
        ) : (
          <button
            type="button"
            onClick={() => {
              setIsEditingName(true);
              setEditedName(scriptName);
            }}
            className="flex items-center gap-1 rounded px-2 py-1 text-sm font-medium transition-colors hover:bg-muted"
          >
            <span>{scriptName}</span>
            {isDirty && (
              <span className="text-muted-foreground" title="Unsaved changes">
                *
              </span>
            )}
          </button>
        )}
        {isDirty && !isEditingName && (
          <Badge variant="secondary" className="shrink-0 text-xs">
            Unsaved
          </Badge>
        )}
      </div>

      <Separator orientation="vertical" className="h-6" />

      {/* Save Button */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            onClick={onSave}
            disabled={isSaving || !isDirty}
            className="gap-1.5"
          >
            {isSaving ? (
              <LoaderCircleIcon className="size-4 animate-spin" />
            ) : (
              <SaveIcon className="size-4" />
            )}
            Save
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Save script (Ctrl+S)</p>
        </TooltipContent>
      </Tooltip>

      <Separator orientation="vertical" className="h-6" />

      {/* Execution Controls */}
      <div className="flex items-center gap-1">
        {isRunning ? (
          <>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onStop}
                  className="gap-1.5"
                >
                  <SquareIcon className="size-4" />
                  Stop
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Stop script execution</p>
              </TooltipContent>
            </Tooltip>
            <Badge variant="default" className="gap-1.5 bg-green-600">
              <div className="size-2 animate-pulse rounded-full bg-white" />
              Running
            </Badge>
          </>
        ) : (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={onStart}
                className="gap-1.5"
              >
                <PlayIcon className="size-4" />
                Run
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Run script (F5)</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>

      <div className="flex-1" />

      {/* Clear Button */}
      {onClear && (
        <>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={onClear}>
                <Trash2Icon className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Clear canvas</p>
            </TooltipContent>
          </Tooltip>
          <Separator orientation="vertical" className="h-6" />
        </>
      )}

      {/* Zoom Controls */}
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={onZoomOut}
          title="Zoom out"
        >
          <ZoomOutIcon className="size-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={onZoomIn} title="Zoom in">
          <ZoomInIcon className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onFitView}
          className="text-xs"
        >
          Fit
        </Button>
      </div>
    </div>
  );
}
