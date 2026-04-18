import path from "node:path";
import chokidar from "chokidar";
import { clipboard, contextBridge, ipcRenderer, shell } from "electron";
import type {
  DesktopBaseDirectory,
  DesktopFsWatchOptions,
  DesktopTheme,
  SoulFireDesktopApi,
} from "../src/lib/desktop-api";

const staticInfo = ipcRenderer.sendSync("desktop:get-static") as {
  appVersion: string;
  os: SoulFireDesktopApi["os"];
};

function callMain<T>(
  namespace: string,
  method: string,
  ...args: unknown[]
): Promise<T> {
  return ipcRenderer.invoke("desktop:call", {
    args,
    method,
    namespace,
  }) as Promise<T>;
}

async function resolveBaseDirectory(
  baseDir?: DesktopBaseDirectory,
): Promise<string | null> {
  switch (baseDir) {
    case "AppConfig":
      return callMain("paths", "appConfigDir");
    case "AppLocalData":
      return callMain("paths", "appLocalDataDir");
    case "Download":
      return callMain("paths", "downloadDir");
    default:
      return null;
  }
}

async function resolveFsPath(
  targetPath: string,
  baseDir?: DesktopBaseDirectory,
): Promise<string> {
  const baseDirectory = await resolveBaseDirectory(baseDir);
  if (baseDirectory === null) {
    return targetPath;
  }

  return path.resolve(baseDirectory, targetPath);
}

const desktopApi: SoulFireDesktopApi = {
  app: {
    attachConsole: async () => {},
    exit: async (code = 0) => {
      await callMain("app", "exit", code);
    },
    setTheme: async (theme: DesktopTheme) => {
      await callMain("app", "setTheme", theme);
    },
  },
  appVersion: staticInfo.appVersion,
  clipboard: {
    readText: async () => clipboard.readText(),
    writeText: async (text: string) => {
      clipboard.writeText(text);
    },
  },
  commands: {
    invoke: async <T>(command: string, args?: Record<string, unknown>) =>
      callMain<T>("commands", "invoke", command, args ?? {}),
  },
  dialog: {
    open: async (options) => callMain("dialog", "open", options),
    save: async (options) => callMain("dialog", "save", options),
  },
  events: {
    emit: async (event: string, payload?: unknown) => {
      ipcRenderer.send("desktop:emit", {
        event,
        payload,
      });
    },
    listen: async (event: string, callback: (payload: unknown) => void) => {
      const channel = `desktop:event:${event}`;
      const listener = (
        _event: Electron.IpcRendererEvent,
        payload: unknown,
      ) => {
        callback(payload);
      };
      ipcRenderer.on(channel, listener);
      return () => {
        ipcRenderer.removeListener(channel, listener);
      };
    },
  },
  fs: {
    mkdir: async (targetPath, options) =>
      callMain("fs", "mkdir", targetPath, options),
    readDir: async (targetPath, options) =>
      callMain("fs", "readDir", targetPath, options),
    readTextFile: async (targetPath, options) =>
      callMain("fs", "readTextFile", targetPath, options),
    watch: async (watchPath, callback, options?: DesktopFsWatchOptions) => {
      const resolvedWatchPath = await resolveFsPath(
        watchPath,
        options?.baseDir,
      );
      const changedPaths = new Set<string>();
      const delayMs = options?.delayMs ?? 0;
      let debounceTimer: NodeJS.Timeout | null = null;

      const flush = () => {
        if (changedPaths.size === 0) {
          return;
        }

        const paths = Array.from(changedPaths);
        changedPaths.clear();
        callback({
          paths,
        });
      };

      const watcher = chokidar.watch(resolvedWatchPath, {
        depth: options?.recursive === false ? 0 : undefined,
        ignoreInitial: true,
        persistent: true,
      });

      const queuePath = (changedPath: string) => {
        changedPaths.add(changedPath);
        if (delayMs === 0) {
          flush();
          return;
        }

        if (debounceTimer !== null) {
          clearTimeout(debounceTimer);
        }
        debounceTimer = setTimeout(flush, delayMs);
      };

      watcher.on("add", queuePath);
      watcher.on("addDir", queuePath);
      watcher.on("change", queuePath);
      watcher.on("unlink", queuePath);
      watcher.on("unlinkDir", queuePath);

      return () => {
        if (debounceTimer !== null) {
          clearTimeout(debounceTimer);
        }
        void watcher.close();
      };
    },
    writeTextFile: async (targetPath, contents, options) =>
      callMain("fs", "writeTextFile", targetPath, contents, options),
  },
  os: staticInfo.os,
  path: {
    appConfigDir: async () => callMain("paths", "appConfigDir"),
    appLocalDataDir: async () => callMain("paths", "appLocalDataDir"),
    downloadDir: async () => callMain("paths", "downloadDir"),
    resolve: async (...paths: string[]) =>
      callMain("paths", "resolve", ...paths),
  },
  shell: {
    openExternal: async (target) => {
      await shell.openExternal(target);
    },
    openPath: async (target) => shell.openPath(target),
  },
  window: {
    close: async () => {
      await callMain("window", "close");
    },
    isMaximized: async () => callMain("window", "isMaximized"),
    maximize: async () => {
      await callMain("window", "maximize");
    },
    minimize: async () => {
      await callMain("window", "minimize");
    },
    onResized: async (callback: () => void) => {
      const channel = "desktop:event:window-resized";
      const listener = () => {
        callback();
      };
      ipcRenderer.on(channel, listener);
      return () => {
        ipcRenderer.removeListener(channel, listener);
      };
    },
    setTheme: async (theme: DesktopTheme) => {
      await callMain("window", "setTheme", theme);
    },
    unmaximize: async () => {
      await callMain("window", "unmaximize");
    },
  },
};

contextBridge.exposeInMainWorld("soulfireDesktop", desktopApi);
