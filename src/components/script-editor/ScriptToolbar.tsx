import { Link } from "@tanstack/react-router";
import {
  ArrowLeftIcon,
  DownloadIcon,
  LoaderCircleIcon,
  PauseIcon,
  PlayIcon,
  SaveIcon,
  Trash2Icon,
  UploadIcon,
  ZoomInIcon,
  ZoomOutIcon,
} from "lucide-react";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
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
import { ComplexityScore } from "./ComplexityScore";
import { DryRunDialog } from "./DryRunDialog";
import { ScriptDiffDialog } from "./ScriptDiffDialog";

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
  const { t } = useTranslation("instance");
  const scriptName = useScriptEditorStore((state) => state.scriptName);
  const setScriptName = useScriptEditorStore((state) => state.setScriptName);
  const scriptDescription = useScriptEditorStore(
    (state) => state.scriptDescription,
  );
  const isDirty = useScriptEditorStore((state) => state.isDirty);
  const paused = useScriptEditorStore((state) => state.paused);
  const nodes = useScriptEditorStore((state) => state.nodes);
  const edges = useScriptEditorStore((state) => state.edges);
  const loadScriptData = useScriptEditorStore((state) => state.loadScriptData);

  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(scriptName);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const exportData = {
      version: 1,
      name: scriptName,
      description: scriptDescription,
      paused,
      nodes,
      edges,
      exportedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${scriptName.replace(/[^a-z0-9]/gi, "_")}.soulfire-script.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success(t("scripts.editor.toolbar.exportSuccess"));
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const importData = JSON.parse(content);

        if (!importData.nodes || !importData.edges) {
          throw new Error("Invalid script file format");
        }

        loadScriptData({
          nodes: importData.nodes,
          edges: importData.edges,
          name: importData.name ?? scriptName,
          description: importData.description ?? scriptDescription,
          paused: importData.paused ?? false,
        });

        toast.success(t("scripts.editor.toolbar.importSuccess"));
      } catch {
        toast.error(t("scripts.editor.toolbar.importError"));
      }
    };
    reader.readAsText(file);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

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
          <span className="sr-only">
            {t("scripts.editor.toolbar.backToScripts")}
          </span>
        </Link>
      </Button>

      <Separator orientation="vertical" className="h-6 my-auto" />

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
            {t("scripts.editor.toolbar.unsaved")}
          </Badge>
        )}
        <ComplexityScore />
      </div>

      <Separator orientation="vertical" className="h-6 my-auto" />

      {/* Save Button + Diff */}
      <ScriptDiffDialog />
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
            {t("scripts.editor.toolbar.save")}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{t("scripts.editor.toolbar.saveTooltip")}</p>
        </TooltipContent>
      </Tooltip>

      <Separator orientation="vertical" className="h-6 my-auto" />

      {/* Execution Controls */}
      <div className="flex items-center gap-1">
        {paused ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={onStart}
                className="gap-1.5"
              >
                <PlayIcon className="size-4" />
                {t("scripts.editor.toolbar.resume")}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{t("scripts.editor.toolbar.resumeTooltip")}</p>
            </TooltipContent>
          </Tooltip>
        ) : (
          <>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onStop}
                  className="gap-1.5"
                >
                  <PauseIcon className="size-4" />
                  {t("scripts.editor.toolbar.pause")}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{t("scripts.editor.toolbar.pauseTooltip")}</p>
              </TooltipContent>
            </Tooltip>
            <Badge variant="default" className="gap-1.5 bg-green-600">
              <div className="size-2 animate-pulse rounded-full bg-white" />
              {t("scripts.running")}
            </Badge>
          </>
        )}
        <DryRunDialog />
      </div>

      <div className="flex-1" />

      {/* Export/Import */}
      <div className="flex items-center gap-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" onClick={handleExport}>
              <DownloadIcon className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{t("scripts.editor.toolbar.export")}</p>
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
            >
              <UploadIcon className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{t("scripts.editor.toolbar.import")}</p>
          </TooltipContent>
        </Tooltip>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,.soulfire-script.json"
          onChange={handleImport}
          className="hidden"
        />
      </div>

      <Separator orientation="vertical" className="h-6 my-auto" />

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
              <p>{t("scripts.editor.toolbar.clearCanvas")}</p>
            </TooltipContent>
          </Tooltip>
          <Separator orientation="vertical" className="h-6 my-auto" />
        </>
      )}

      {/* Zoom Controls */}
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={onZoomOut}
          title={t("scripts.editor.toolbar.zoomOut")}
        >
          <ZoomOutIcon className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={onZoomIn}
          title={t("scripts.editor.toolbar.zoomIn")}
        >
          <ZoomInIcon className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onFitView}
          className="text-xs"
        >
          {t("scripts.editor.toolbar.fit")}
        </Button>
      </div>
    </div>
  );
}
