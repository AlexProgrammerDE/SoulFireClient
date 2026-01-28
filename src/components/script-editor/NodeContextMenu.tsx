import {
  ChevronDownIcon,
  ChevronRightIcon,
  CopyIcon,
  EyeIcon,
  EyeOffIcon,
  TrashIcon,
  UnplugIcon,
  VolumeIcon,
  VolumeOffIcon,
} from "lucide-react";
import type { CSSProperties } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils.tsx";

interface NodeContextMenuProps {
  nodeId: string;
  isMuted?: boolean;
  isCollapsed?: boolean;
  previewEnabled?: boolean;
  supportsMuting?: boolean;
  supportsPreview?: boolean;
  onDelete?: (nodeId: string) => void;
  onDuplicate?: (nodeId: string) => void;
  onDisconnectAll?: (nodeId: string) => void;
  onToggleMute?: (nodeId: string) => void;
  onToggleCollapse?: (nodeId: string) => void;
  onTogglePreview?: (nodeId: string) => void;
  onClose?: () => void;
  style?: CSSProperties;
  className?: string;
}

function MenuItem({
  className,
  variant = "default",
  onClick,
  children,
}: {
  className?: string;
  variant?: "default" | "destructive";
  onClick?: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      data-variant={variant}
      className={cn(
        "hover:bg-accent hover:text-accent-foreground data-[variant=destructive]:text-destructive data-[variant=destructive]:hover:bg-destructive/10 dark:data-[variant=destructive]:hover:bg-destructive/20 data-[variant=destructive]:hover:text-destructive gap-2 rounded-sm px-2 py-1.5 text-sm [&_svg:not([class*='size-'])]:size-4 relative flex w-full cursor-default items-center outline-hidden select-none [&_svg]:pointer-events-none [&_svg]:shrink-0",
        className,
      )}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function MenuSeparator({ className }: { className?: string }) {
  return <div className={cn("bg-border -mx-1 my-1 h-px", className)} />;
}

function MenuShortcut({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "text-muted-foreground ml-auto text-xs tracking-widest",
        className,
      )}
    >
      {children}
    </span>
  );
}

export function NodeContextMenu({
  nodeId,
  isMuted = false,
  isCollapsed = false,
  previewEnabled = false,
  supportsMuting = true,
  supportsPreview = true,
  onDelete,
  onDuplicate,
  onDisconnectAll,
  onToggleMute,
  onToggleCollapse,
  onTogglePreview,
  onClose,
  style,
  className,
}: NodeContextMenuProps) {
  const { t } = useTranslation("instance");

  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: context menu is mouse-triggered
    // biome-ignore lint/a11y/noStaticElementInteractions: context menu container
    <div
      style={style}
      className={cn(
        "animate-in fade-in-0 zoom-in-95 ring-foreground/10 bg-popover text-popover-foreground min-w-32 rounded-md p-1 shadow-md ring-1",
        className,
      )}
      onClick={(e) => e.stopPropagation()}
      onContextMenu={(e) => e.preventDefault()}
    >
      <div>
        <MenuItem
          onClick={() => {
            onDuplicate?.(nodeId);
            onClose?.();
          }}
        >
          <CopyIcon />
          {t("scripts.editor.contextMenu.duplicate")}
          <MenuShortcut>Ctrl+D</MenuShortcut>
        </MenuItem>
        <MenuItem
          onClick={() => {
            onDisconnectAll?.(nodeId);
            onClose?.();
          }}
        >
          <UnplugIcon />
          {t("scripts.editor.contextMenu.disconnectAll")}
        </MenuItem>
      </div>
      <MenuSeparator />
      <div>
        <MenuItem
          onClick={() => {
            onToggleCollapse?.(nodeId);
            onClose?.();
          }}
        >
          {isCollapsed ? <ChevronDownIcon /> : <ChevronRightIcon />}
          {isCollapsed
            ? t("scripts.editor.contextMenu.expand")
            : t("scripts.editor.contextMenu.collapse")}
          <MenuShortcut>H</MenuShortcut>
        </MenuItem>
        {supportsMuting && (
          <MenuItem
            onClick={() => {
              onToggleMute?.(nodeId);
              onClose?.();
            }}
          >
            {isMuted ? <VolumeIcon /> : <VolumeOffIcon />}
            {isMuted
              ? t("scripts.editor.contextMenu.unmute")
              : t("scripts.editor.contextMenu.mute")}
            <MenuShortcut>M</MenuShortcut>
          </MenuItem>
        )}
        {supportsPreview && (
          <MenuItem
            onClick={() => {
              onTogglePreview?.(nodeId);
              onClose?.();
            }}
          >
            {previewEnabled ? <EyeOffIcon /> : <EyeIcon />}
            {previewEnabled
              ? t("scripts.editor.contextMenu.hidePreview")
              : t("scripts.editor.contextMenu.showPreview")}
            <MenuShortcut>Shift+H</MenuShortcut>
          </MenuItem>
        )}
      </div>
      <MenuSeparator />
      <div>
        <MenuItem
          variant="destructive"
          onClick={() => {
            onDelete?.(nodeId);
            onClose?.();
          }}
        >
          <TrashIcon />
          {t("scripts.editor.contextMenu.delete")}
          <MenuShortcut>Del</MenuShortcut>
        </MenuItem>
      </div>
    </div>
  );
}
