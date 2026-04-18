export type DesktopTheme = "dark" | "light" | null;

export type DesktopBaseDirectory = "AppConfig" | "AppLocalData" | "Download";

export type DesktopFsEntry = {
  name: string;
  isFile: boolean;
  isDirectory: boolean;
  isSymlink: boolean;
};

export type DesktopFsWatchEvent = {
  paths: string[];
};

export type DesktopFsWatchOptions = {
  baseDir?: DesktopBaseDirectory;
  delayMs?: number;
  recursive?: boolean;
};

export type DesktopFsOptions = {
  baseDir?: DesktopBaseDirectory;
};

export type DesktopMkdirOptions = DesktopFsOptions & {
  recursive?: boolean;
};

export type DesktopFileFilter = {
  name: string;
  extensions: string[];
};

export type DesktopOpenDialogOptions = {
  title?: string;
  filters?: DesktopFileFilter[];
  defaultPath?: string;
  multiple?: boolean;
  directory?: boolean;
};

export type DesktopSaveDialogOptions = {
  title?: string;
  filters?: DesktopFileFilter[];
  defaultPath?: string;
};

export type DesktopUnlisten = () => void;

export interface SoulFireDesktopApi {
  appVersion: string;
  os: {
    arch: string;
    locale: string;
    platform: string;
    type: string;
    version: string;
  };
  app: {
    attachConsole: () => Promise<void>;
    exit: (code?: number) => Promise<void>;
    setTheme: (theme: DesktopTheme) => Promise<void>;
  };
  clipboard: {
    readText: () => Promise<string>;
    writeText: (text: string) => Promise<void>;
  };
  commands: {
    invoke: <T>(command: string, args?: Record<string, unknown>) => Promise<T>;
  };
  dialog: {
    open: (
      options: DesktopOpenDialogOptions,
    ) => Promise<string | string[] | null>;
    save: (options: DesktopSaveDialogOptions) => Promise<string | null>;
  };
  events: {
    emit: (event: string, payload?: unknown) => Promise<void>;
    listen: (
      event: string,
      callback: (payload: unknown) => void,
    ) => Promise<DesktopUnlisten>;
  };
  fs: {
    mkdir: (path: string, options?: DesktopMkdirOptions) => Promise<void>;
    readDir: (
      path: string,
      options?: DesktopFsOptions,
    ) => Promise<DesktopFsEntry[]>;
    readTextFile: (path: string, options?: DesktopFsOptions) => Promise<string>;
    watch: (
      path: string,
      callback: (event: DesktopFsWatchEvent) => void,
      options?: DesktopFsWatchOptions,
    ) => Promise<DesktopUnlisten>;
    writeTextFile: (
      path: string,
      contents: string,
      options?: DesktopFsOptions,
    ) => Promise<void>;
  };
  path: {
    appConfigDir: () => Promise<string>;
    appLocalDataDir: () => Promise<string>;
    downloadDir: () => Promise<string>;
    resolve: (...paths: string[]) => Promise<string>;
  };
  shell: {
    openExternal: (target: string) => Promise<void>;
    openPath: (target: string) => Promise<string>;
  };
  window: {
    close: () => Promise<void>;
    isMaximized: () => Promise<boolean>;
    maximize: () => Promise<void>;
    minimize: () => Promise<void>;
    onResized: (callback: () => void) => Promise<DesktopUnlisten>;
    setTheme: (theme: DesktopTheme) => Promise<void>;
    unmaximize: () => Promise<void>;
  };
}
