import type {
  DesktopBaseDirectory,
  DesktopFsEntry,
  DesktopFsWatchEvent,
  DesktopFsWatchOptions,
  DesktopMkdirOptions,
  DesktopOpenDialogOptions,
  DesktopSaveDialogOptions,
  DesktopTheme,
  SoulFireDesktopApi,
} from "@/lib/desktop-api";

declare global {
  interface Window {
    soulfireDesktop?: SoulFireDesktopApi;
  }
}

function getDesktopRuntime(): SoulFireDesktopApi | null {
  if (typeof window === "undefined") {
    return null;
  }

  return window.soulfireDesktop ?? null;
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
    async attachConsole(): Promise<void> {
      await requireDesktopRuntime().app.attachConsole();
    },
    async exit(code = 0): Promise<void> {
      await requireDesktopRuntime().app.exit(code);
    },
    async setTheme(theme: DesktopTheme): Promise<void> {
      await requireDesktopRuntime().app.setTheme(theme);
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
  commands: {
    invoke<T>(command: string, args?: Record<string, unknown>): Promise<T> {
      return requireDesktopRuntime().commands.invoke<T>(command, args);
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
  events: {
    async emit(event: string, payload?: unknown): Promise<void> {
      await requireDesktopRuntime().events.emit(event, payload);
    },
    async listen(
      event: string,
      callback: (payload: unknown) => void,
    ): Promise<() => void> {
      return requireDesktopRuntime().events.listen(event, callback);
    },
  },
  fs: {
    async mkdir(dirPath: string, options?: DesktopMkdirOptions): Promise<void> {
      await requireDesktopRuntime().fs.mkdir(dirPath, options);
    },
    async readDir(
      dirPath: string,
      options?: {
        baseDir?: DesktopBaseDirectory;
      },
    ): Promise<DesktopFsEntry[]> {
      return requireDesktopRuntime().fs.readDir(dirPath, options);
    },
    async readTextFile(
      filePath: string,
      options?: {
        baseDir?: DesktopBaseDirectory;
      },
    ): Promise<string> {
      return requireDesktopRuntime().fs.readTextFile(filePath, options);
    },
    async watch(
      watchPath: string,
      callback: (event: DesktopFsWatchEvent) => void,
      options?: DesktopFsWatchOptions,
    ): Promise<() => void> {
      return requireDesktopRuntime().fs.watch(watchPath, callback, options);
    },
    async writeTextFile(
      filePath: string,
      contents: string,
      options?: {
        baseDir?: DesktopBaseDirectory;
      },
    ): Promise<void> {
      await requireDesktopRuntime().fs.writeTextFile(
        filePath,
        contents,
        options,
      );
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
  window: {
    current() {
      return {
        close: async () => {
          await requireDesktopRuntime().window.close();
        },
        isMaximized: async () => {
          return requireDesktopRuntime().window.isMaximized();
        },
        maximize: async () => {
          await requireDesktopRuntime().window.maximize();
        },
        minimize: async () => {
          await requireDesktopRuntime().window.minimize();
        },
        onResized: async (callback: () => void) => {
          return requireDesktopRuntime().window.onResized(callback);
        },
        setTheme: async (theme: DesktopTheme) => {
          await requireDesktopRuntime().window.setTheme(theme);
        },
        unmaximize: async () => {
          await requireDesktopRuntime().window.unmaximize();
        },
      };
    },
  },
  os: {
    arch(): string {
      return requireDesktopRuntime().os.arch;
    },
    locale(): string {
      return requireDesktopRuntime().os.locale;
    },
    platform(): string {
      return requireDesktopRuntime().os.platform;
    },
    type(): string {
      return requireDesktopRuntime().os.type;
    },
    version(): string {
      return requireDesktopRuntime().os.version;
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
