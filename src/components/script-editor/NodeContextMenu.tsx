import {
  ChevronDownIcon,
  ChevronRightIcon,
  CopyIcon,
  EyeIcon,
  EyeOffIcon,
  PencilIcon,
  TrashIcon,
  UnplugIcon,
  VolumeIcon,
  VolumeOffIcon,
} from "lucide-react";
import type { CSSProperties } from "react";
import { useTranslation } from "react-i18next";
import {
  ContextMenuContainer,
  MenuItem,
  MenuSeparator,
  MenuShortcut,
} from "@/components/context-menu-primitives.tsx";
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
  onRename?: (nodeId: string) => void;
  onDisconnectAll?: (nodeId: string) => void;
  onToggleMute?: (nodeId: string) => void;
  onToggleCollapse?: (nodeId: string) => void;
  onTogglePreview?: (nodeId: string) => void;
  onClose?: () => void;
  style?: CSSProperties;
  className?: string;
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
  onRename,
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
    <ContextMenuContainer style={style} className={cn(className)}>
      <div>
        <MenuItem
          onClick={() => {
            onDuplicate?.(nodeId);
            onClose?.();
          }}
        >
          <CopyIcon />
          {t("scripts.editor.contextMenu.duplicate")}
          <MenuShortcut>Shift+D</MenuShortcut>
        </MenuItem>
        <MenuItem
          onClick={() => {
            onRename?.(nodeId);
            onClose?.();
          }}
        >
          <PencilIcon />
          {t("scripts.editor.contextMenu.rename")}
          <MenuShortcut>F2</MenuShortcut>
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
          <MenuShortcut>Del / X</MenuShortcut>
        </MenuItem>
      </div>
    </ContextMenuContainer>
  );
}
