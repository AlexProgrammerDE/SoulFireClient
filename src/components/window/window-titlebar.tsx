import { useCanGoBack, useLocation, useRouter } from "@tanstack/react-router";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { type as getOsType } from "@tauri-apps/plugin-os";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  MinusIcon,
  SquareIcon,
  XIcon,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { cn, isTauri } from "@/lib/utils.tsx";

function isDesktopTauri() {
  if (!isTauri()) {
    return false;
  }

  const osType = getOsType();
  return osType !== "android" && osType !== "ios";
}

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
    <div className="window-topbar-no-drag flex items-stretch">
      <button
        type="button"
        className="window-topbar-button"
        onClick={handleMinimize}
        aria-label="Minimize window"
        title="Minimize"
      >
        <MinusIcon className="size-3.5" />
      </button>
      <button
        type="button"
        className="window-topbar-button"
        onClick={handleToggleMaximize}
        aria-label={isMaximized ? "Restore window" : "Maximize window"}
        title={isMaximized ? "Restore" : "Maximize"}
      >
        <SquareIcon className={cn("size-3", isMaximized && "scale-90")} />
      </button>
      <button
        type="button"
        className="window-topbar-button window-topbar-button-danger"
        onClick={handleClose}
        aria-label="Close window"
        title="Close"
      >
        <XIcon className="size-3.5" />
      </button>
    </div>
  );
}

export function WindowTitlebar() {
  const router = useRouter();
  const canGoBack = useCanGoBack();
  const location = useLocation();
  const desktopTauri = isDesktopTauri();
  const canGoForward =
    typeof window !== "undefined" &&
    router.history.location.state.__TSR_index < router.history.length - 1;

  const handleBack = useCallback(() => {
    router.history.back();
  }, [router]);

  const handleForward = useCallback(() => {
    router.history.forward();
  }, [router]);

  return (
    <header className="window-topbar">
      <div className="window-topbar-no-drag flex items-stretch gap-1 px-2">
        <button
          type="button"
          className="window-topbar-button"
          onClick={handleBack}
          disabled={!canGoBack}
          aria-label="Go back"
          title="Back"
        >
          <ChevronLeftIcon className="size-3.5" />
        </button>
        <button
          type="button"
          className="window-topbar-button"
          onClick={handleForward}
          disabled={!canGoForward}
          aria-label="Go forward"
          title="Forward"
        >
          <ChevronRightIcon className="size-3.5" />
        </button>
      </div>
      <div
        data-tauri-drag-region={desktopTauri ? "" : undefined}
        className="window-topbar-drag flex min-w-0 flex-1 items-center"
      >
        <div className="window-topbar-no-drag mx-auto max-w-full px-3 text-center">
          <p className="text-titlebar-foreground/58 truncate text-[11px] font-medium tracking-[0.02em]">
            {location.pathname === "/" ? "SoulFire" : location.pathname}
          </p>
        </div>
      </div>
      <WindowControls />
    </header>
  );
}
