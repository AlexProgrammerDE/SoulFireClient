import type {
  DesktopCastDevice,
  DesktopCastDisconnectedEvent,
  DesktopCastRemovedEvent,
  DesktopFsEntry,
  DesktopFsWatchEvent,
  DesktopFsWatchOptions,
  DesktopIntegratedServerCredentials,
  DesktopMkdirOptions,
  DesktopOpenDialogOptions,
  DesktopSaveDialogOptions,
  DesktopSystemInfo,
  DesktopTheme,
  SoulFireDesktopApi,
} from "@/lib/desktop-api";

declare global {
  interface Window {
    soulfireElectron?: SoulFireDesktopApi;
  }
}

function getDesktopRuntime(): SoulFireDesktopApi | null {
  if (typeof window === "undefined") {
    return null;
  }

  return window.soulfireElectron ?? null;
}

function requireDesktopRuntime(): SoulFireDesktopApi {
  const runtime = getDesktopRuntime();
  if (runtime === null) {
    throw new Error("Electron desktop runtime is not available");
  }

  return runtime;
}

export const desktop = {
  available(): boolean {
    return getDesktopRuntime() !== null;
  },
  app: {
    async onOpenUrl(callback: (url: string) => void): Promise<() => void> {
      return requireDesktopRuntime().app.onOpenUrl(callback);
    },
    async quit(): Promise<void> {
      await requireDesktopRuntime().app.quit();
    },
    async setTheme(theme: DesktopTheme): Promise<void> {
      await requireDesktopRuntime().app.setTheme(theme);
    },
  },
  cast: {
    async broadcast(payload?: unknown): Promise<void> {
      await requireDesktopRuntime().cast.broadcast(payload);
    },
    async connect(address: string, port: number): Promise<string> {
      return requireDesktopRuntime().cast.connect(address, port);
    },
    async discover(): Promise<void> {
      await requireDesktopRuntime().cast.discover();
    },
    async getDevices(): Promise<DesktopCastDevice[]> {
      return requireDesktopRuntime().cast.getDevices();
    },
    async onDisconnected(
      callback: (payload: DesktopCastDisconnectedEvent) => void,
    ): Promise<() => void> {
      return requireDesktopRuntime().cast.onDisconnected(callback);
    },
    async onDiscovered(
      callback: (device: DesktopCastDevice) => void,
    ): Promise<() => void> {
      return requireDesktopRuntime().cast.onDiscovered(callback);
    },
    async onRemoved(
      callback: (payload: DesktopCastRemovedEvent) => void,
    ): Promise<() => void> {
      return requireDesktopRuntime().cast.onRemoved(callback);
    },
  },
  clipboard: {
    async readText(): Promise<string> {
      return requireDesktopRuntime().clipboard.readText();
    },
    async writeText(text: string): Promise<void> {
      await requireDesktopRuntime().clipboard.writeText(text);
    },
  },
  dialog: {
    async open(options: DesktopOpenDialogOptions) {
      return requireDesktopRuntime().dialog.open(options);
    },
    async save(options: DesktopSaveDialogOptions) {
      return requireDesktopRuntime().dialog.save(options);
    },
  },
  discord: {
    async updateActivity(
      state: string,
      details?: string | null,
    ): Promise<void> {
      await requireDesktopRuntime().discord.updateActivity(state, details);
    },
  },
  fs: {
    async mkdir(dirPath: string, options?: DesktopMkdirOptions): Promise<void> {
      await requireDesktopRuntime().fs.mkdir(dirPath, options);
    },
    async readDir(dirPath: string): Promise<DesktopFsEntry[]> {
      return requireDesktopRuntime().fs.readDir(dirPath);
    },
    async readTextFile(filePath: string): Promise<string> {
      return requireDesktopRuntime().fs.readTextFile(filePath);
    },
    async watch(
      watchPath: string,
      callback: (event: DesktopFsWatchEvent) => void,
      options?: DesktopFsWatchOptions,
    ): Promise<() => void> {
      return requireDesktopRuntime().fs.watch(watchPath, callback, options);
    },
    async writeTextFile(filePath: string, contents: string): Promise<void> {
      await requireDesktopRuntime().fs.writeTextFile(filePath, contents);
    },
  },
  integratedServer: {
    async getVersion(): Promise<string> {
      return requireDesktopRuntime().integratedServer.getVersion();
    },
    async kill(): Promise<void> {
      await requireDesktopRuntime().integratedServer.kill();
    },
    async onStartLog(callback: (line: string) => void): Promise<() => void> {
      return requireDesktopRuntime().integratedServer.onStartLog(callback);
    },
    async resetData(): Promise<void> {
      await requireDesktopRuntime().integratedServer.resetData();
    },
    async run(options: {
      jvmArgs: string[];
    }): Promise<DesktopIntegratedServerCredentials> {
      return requireDesktopRuntime().integratedServer.run(options);
    },
  },
  path: {
    async appConfigDir(): Promise<string> {
      return requireDesktopRuntime().path.appConfigDir();
    },
    async appLocalDataDir(): Promise<string> {
      return requireDesktopRuntime().path.appLocalDataDir();
    },
    async downloadDir(): Promise<string> {
      return requireDesktopRuntime().path.downloadDir();
    },
    async resolve(...paths: string[]): Promise<string> {
      return requireDesktopRuntime().path.resolve(...paths);
    },
  },
  shell: {
    async openExternal(target: string): Promise<void> {
      await requireDesktopRuntime().shell.openExternal(target);
    },
    async openPath(target: string): Promise<string> {
      return requireDesktopRuntime().shell.openPath(target);
    },
  },
  system: {
    async getInfo(): Promise<DesktopSystemInfo> {
      return requireDesktopRuntime().system.getInfo();
    },
  },
  window: {
    async close(): Promise<void> {
      await requireDesktopRuntime().window.close();
    },
    async isMaximized(): Promise<boolean> {
      return requireDesktopRuntime().window.isMaximized();
    },
    async maximize(): Promise<void> {
      await requireDesktopRuntime().window.maximize();
    },
    async minimize(): Promise<void> {
      await requireDesktopRuntime().window.minimize();
    },
    async onResized(callback: () => void): Promise<() => void> {
      return requireDesktopRuntime().window.onResized(callback);
    },
    async unmaximize(): Promise<void> {
      await requireDesktopRuntime().window.unmaximize();
    },
  },
};

export function isDesktopApp(): boolean {
  return desktop.available();
}

export const isMac =
  typeof navigator !== "undefined" &&
  /Mac|iPod|iPhone|iPad/.test(navigator.userAgent);

export function formatShortcut(shortcut: string): string {
  if (isMac) {
    return shortcut.replace(/Ctrl/g, "⌘").replace(/Alt/g, "⌥");
  }
  return shortcut;
}
