import { ClipboardCopyIcon, CloudUploadIcon, SearchIcon } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard.ts";
import { openExternalUrl, uploadToMcLogs } from "@/lib/utils.tsx";

interface MenuPosition {
  x: number;
  y: number;
  text: string;
}

function hasSelectTextAncestor(element: Element | null): boolean {
  let current = element;
  while (current) {
    if (current.classList.contains("select-text")) {
      return true;
    }
    current = current.parentElement;
  }
  return false;
}

const MENU_ITEM_CLASS =
  "hover:bg-accent hover:text-accent-foreground flex w-full cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none";

export function CustomContextMenu() {
  const [menu, setMenu] = useState<MenuPosition | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const copyToClipboard = useCopyToClipboard();
  const { t } = useTranslation("common");

  const dismiss = useCallback(() => setMenu(null), []);

  useEffect(() => {
    function onContextMenu(e: MouseEvent) {
      e.preventDefault();

      const target = e.target as Element | null;
      if (!target || !hasSelectTextAncestor(target)) {
        setMenu(null);
        return;
      }

      const selection = window.getSelection();
      const selectedText = selection?.toString() ?? "";
      if (selectedText.length === 0) {
        setMenu(null);
        return;
      }

      setMenu({ x: e.clientX, y: e.clientY, text: selectedText });
    }

    document.addEventListener("contextmenu", onContextMenu);
    return () => document.removeEventListener("contextmenu", onContextMenu);
  }, []);

  useEffect(() => {
    if (!menu) return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        dismiss();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("scroll", dismiss, true);
    window.addEventListener("blur", dismiss);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("scroll", dismiss, true);
      window.removeEventListener("blur", dismiss);
    };
  }, [menu, dismiss]);

  useEffect(() => {
    if (!menu) return;

    function onMouseDown(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        dismiss();
      }
    }

    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, [menu, dismiss]);

  if (!menu) return null;

  return createPortal(
    <div
      ref={menuRef}
      className="bg-popover text-popover-foreground ring-foreground/10 animate-in fade-in-0 zoom-in-95 fixed z-50 min-w-32 rounded-md p-1 shadow-md ring-1 duration-100"
      style={{ left: menu.x, top: menu.y }}
    >
      <button
        type="button"
        className={MENU_ITEM_CLASS}
        onClick={() => {
          copyToClipboard(menu.text);
          dismiss();
        }}
      >
        <ClipboardCopyIcon className="size-4" />
        {t("copyToClipboard")}
      </button>
      <button
        type="button"
        className={MENU_ITEM_CLASS}
        onClick={() => {
          toast.promise(
            uploadToMcLogs(menu.text).then((response) => {
              if (response.success) {
                copyToClipboard(response.url);
                return response.url;
              }
              throw new Error(`Upload failed: ${response.error}`);
            }),
            {
              loading: t("mcLogsUpload.loading"),
              success: (url) => t("mcLogsUpload.success", { url }),
              error: t("mcLogsUpload.error"),
            },
          );
          dismiss();
        }}
      >
        <CloudUploadIcon className="size-4" />
        {t("uploadToMcLogs")}
      </button>
      <button
        type="button"
        className={MENU_ITEM_CLASS}
        onClick={() => {
          openExternalUrl(
            `https://www.google.com/search?q=${encodeURIComponent(menu.text)}`,
          );
          dismiss();
        }}
      >
        <SearchIcon className="size-4" />
        {t("searchWithGoogle")}
      </button>
    </div>,
    document.body,
  );
}
