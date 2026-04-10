import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { type as getOsType } from "@tauri-apps/plugin-os";
import { MinusIcon, SquareIcon, XIcon } from "lucide-react";
import {
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
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
    <div className="window-titlebar-no-drag flex items-stretch">
      <button
        type="button"
        className="window-titlebar-button"
        onClick={handleMinimize}
        aria-label="Minimize window"
        title="Minimize"
      >
        <MinusIcon className="size-4" />
      </button>
      <button
        type="button"
        className="window-titlebar-button"
        onClick={handleToggleMaximize}
        aria-label={isMaximized ? "Restore window" : "Maximize window"}
        title={isMaximized ? "Restore" : "Maximize"}
      >
        <SquareIcon className={cn("size-3.5", isMaximized && "scale-90")} />
      </button>
      <button
        type="button"
        className="window-titlebar-button window-titlebar-button-danger"
        onClick={handleClose}
        aria-label="Close window"
        title="Close"
      >
        <XIcon className="size-4" />
      </button>
    </div>
  );
}

export function WindowTitlebar(props: {
  leading?: ReactNode;
  center?: ReactNode;
  trailing?: ReactNode;
  className?: string;
}) {
  const desktopTauri = isDesktopTauri();

  return (
    <header className={cn("window-titlebar", props.className)}>
      {props.leading ? (
        <div className="window-titlebar-no-drag flex shrink-0 items-center gap-2 px-3">
          {props.leading}
        </div>
      ) : (
        <div className="window-titlebar-edge-spacer" />
      )}
      <div
        data-tauri-drag-region={desktopTauri ? "" : undefined}
        className="window-titlebar-drag flex min-w-0 flex-1 items-center px-2"
      >
        {props.center}
      </div>
      <div className="window-titlebar-no-drag ml-auto flex shrink-0 items-stretch pl-2">
        {props.trailing ? (
          <div className="flex items-center gap-2 px-2">{props.trailing}</div>
        ) : null}
        <WindowControls />
      </div>
    </header>
  );
}
