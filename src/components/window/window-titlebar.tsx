import { useCanGoBack, useRouter } from "@tanstack/react-router";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  MinusIcon,
  SquareIcon,
  XIcon,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import DynamicIcon from "@/components/dynamic-icon.tsx";
import { Button } from "@/components/ui/button.tsx";
import { ButtonGroup } from "@/components/ui/button-group.tsx";
import { useCurrentRouteChrome } from "@/hooks/use-current-route-title.ts";
import { isDesktopTauri } from "@/lib/platform.ts";
import { cn } from "@/lib/utils.tsx";

const titlebarClassName =
  "window-topbar border-sidebar-border bg-sidebar text-sidebar-foreground flex h-(--titlebar-height) shrink-0 items-stretch border-b";

const titlebarButtonClassName =
  "text-sidebar-foreground/72 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground disabled:text-sidebar-foreground/35 disabled:hover:bg-transparent size-7 shadow-none transition-colors";

function WindowControls() {
  const desktopTauri = isDesktopTauri();
  const appWindow = useMemo(
    () => (desktopTauri ? getCurrentWebviewWindow() : null),
    [desktopTauri],
  );
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    if (!appWindow) {
      return;
    }

    let disposed = false;
    let unlisten: null | (() => void) = null;
    const syncWindowState = async () => {
      const maximized = await appWindow.isMaximized();
      if (!disposed) {
        setIsMaximized(maximized);
      }
    };

    void syncWindowState();
    void appWindow
      .onResized(() => {
        void syncWindowState();
      })
      .then((cleanup) => {
        if (disposed) {
          cleanup();
        } else {
          unlisten = cleanup;
        }
      });

    return () => {
      disposed = true;
      unlisten?.();
    };
  }, [appWindow]);

  const handleMinimize = useCallback(() => {
    if (!appWindow) {
      return;
    }

    void appWindow.minimize();
  }, [appWindow]);

  const handleToggleMaximize = useCallback(() => {
    if (!appWindow) {
      return;
    }

    void (async () => {
      if (await appWindow.isMaximized()) {
        await appWindow.unmaximize();
        setIsMaximized(false);
      } else {
        await appWindow.maximize();
        setIsMaximized(true);
      }
    })();
  }, [appWindow]);

  const handleClose = useCallback(() => {
    if (!appWindow) {
      return;
    }

    void appWindow.close();
  }, [appWindow]);

  if (!desktopTauri) {
    return null;
  }

  return (
    <ButtonGroup className="window-topbar-no-drag items-center">
      <Button
        className={titlebarButtonClassName}
        size="icon-xs"
        type="button"
        variant="ghost"
        onClick={handleMinimize}
        aria-label="Minimize window"
        title="Minimize"
      >
        <MinusIcon className="size-3.5" />
      </Button>
      <Button
        className={titlebarButtonClassName}
        size="icon-xs"
        type="button"
        variant="ghost"
        onClick={handleToggleMaximize}
        aria-label={isMaximized ? "Restore window" : "Maximize window"}
        title={isMaximized ? "Restore" : "Maximize"}
      >
        <SquareIcon className={cn("size-3", isMaximized && "scale-90")} />
      </Button>
      <Button
        className={cn(
          titlebarButtonClassName,
          "hover:bg-destructive hover:text-white active:bg-destructive/90",
        )}
        size="icon-xs"
        type="button"
        variant="ghost"
        onClick={handleClose}
        aria-label="Close window"
        title="Close"
      >
        <XIcon className="size-3.5" />
      </Button>
    </ButtonGroup>
  );
}

export function WindowTitlebar() {
  const router = useRouter();
  const canGoBack = useCanGoBack();
  const desktopTauri = isDesktopTauri();
  const { title: pageTitle, icon: pageIcon } = useCurrentRouteChrome();
  const canGoForward =
    typeof window !== "undefined" &&
    router.history.location.state.__TSR_index < router.history.length - 1;

  const handleBack = useCallback(() => {
    router.history.back();
  }, [router]);

  const handleForward = useCallback(() => {
    router.history.forward();
  }, [router]);

  if (!desktopTauri) {
    return null;
  }

  return (
    <header className={titlebarClassName}>
      <ButtonGroup className="window-topbar-no-drag items-center px-2">
        <Button
          className={titlebarButtonClassName}
          size="icon-xs"
          type="button"
          variant="ghost"
          onClick={handleBack}
          disabled={!canGoBack}
          aria-label="Go back"
          title="Back"
        >
          <ChevronLeftIcon className="size-3.5" />
        </Button>
        <Button
          className="window-topbar-button"
          size="icon-xs"
          type="button"
          variant="ghost"
          onClick={handleForward}
          disabled={!canGoForward}
          aria-label="Go forward"
          title="Forward"
        >
          <ChevronRightIcon className="size-3.5" />
        </Button>
      </ButtonGroup>
      <div
        data-tauri-drag-region={desktopTauri ? "" : undefined}
        className="flex min-w-0 flex-1 items-center"
      >
        <div
          data-tauri-drag-region={desktopTauri ? "" : undefined}
          className="mx-auto flex min-w-0 max-w-full items-center gap-1.5 px-3 text-center [&>*]:pointer-events-none"
        >
          {pageIcon?.kind === "dynamic" && (
            <DynamicIcon
              name={pageIcon.name}
              className="text-titlebar-foreground/58 size-3.5 shrink-0"
            />
          )}
          {pageIcon?.kind === "logo" && (
            <img
              src={pageIcon.src}
              alt={pageIcon.alt}
              className="size-3.5 shrink-0 rounded-sm object-cover"
            />
          )}
          <p className="text-titlebar-foreground/58 truncate text-[11px] font-medium tracking-[0.02em]">
            {pageTitle}
          </p>
        </div>
      </div>
      <WindowControls />
    </header>
  );
}

export { titlebarClassName };
