import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  app,
  BrowserWindow,
  dialog,
  ipcMain,
  Menu,
  nativeImage,
  nativeTheme,
  Tray,
} from "electron";
import Store from "electron-store";
import type {
  DesktopBaseDirectory,
  DesktopTheme,
} from "../src/lib/desktop-api";
import {
  getAppConfigDir,
  getAppLocalDataDir,
  getBaseDirectoryPath,
} from "./native/app-paths";
import { CastManager } from "./native/cast";
import { DiscordPresenceManager } from "./native/discord";
import {
  createIntegratedServerState,
  getSoulFireServerVersion,
  killIntegratedServer,
  resetIntegratedData,
  runIntegratedServer,
} from "./native/integrated-server";

const APP_ID = "com.soulfiremc.soulfire";
const DEFAULT_WINDOW_HEIGHT = 675;
const DEFAULT_WINDOW_WIDTH = 1200;

type StoredWindowState = {
  height: number;
  isMaximized: boolean;
  width: number;
};

const windowStateStore = new Store<{
  window: StoredWindowState;
}>({
  defaults: {
    window: {
      height: DEFAULT_WINDOW_HEIGHT,
      isMaximized: false,
      width: DEFAULT_WINDOW_WIDTH,
    },
  },
  name: "window-state",
});

const integratedServerState = createIntegratedServerState();
const discordPresence = new DiscordPresenceManager();
const castManager = new CastManager((event, payload) => {
  broadcastToRenderer(event, payload);
});

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;

function preloadPath(): string {
  return fileURLToPath(new URL("./preload.mjs", import.meta.url));
}

function rendererIndexPath(): string {
  return path.join(app.getAppPath(), "dist", "index.html");
}

function resolveAssetPath(relativePath: string): string {
  const basePath = app.isPackaged ? app.getAppPath() : process.cwd();
  return path.join(basePath, relativePath);
}

function broadcastToRenderer(event: string, payload?: unknown): void {
  if (mainWindow?.webContents.isDestroyed()) {
    return;
  }

  mainWindow?.webContents.send(`desktop:event:${event}`, payload);
}

async function createMainWindow(): Promise<BrowserWindow> {
  const iconPath = resolveAssetPath("build/icons/icon.png");
  const state = app.isPackaged
    ? loadStoredWindowState()
    : {
        height: DEFAULT_WINDOW_HEIGHT,
        isMaximized: false,
        width: DEFAULT_WINDOW_WIDTH,
      };

  const window = new BrowserWindow({
    center: true,
    frame: false,
    height: state.height,
    icon: nativeImage.createFromPath(iconPath),
    minHeight: 500,
    minWidth: 940,
    show: true,
    title: "SoulFire",
    webPreferences: {
      contextIsolation: true,
      preload: preloadPath(),
      sandbox: false,
    },
    width: state.width,
  });

  if (state.isMaximized) {
    window.maximize();
  }

  window.on("close", () => {
    void killIntegratedServer(integratedServerState);
  });
  window.on("resize", () => {
    broadcastToRenderer("window-resized");
  });
  window.on("resize", () => {
    persistWindowState(window);
  });
  window.on("maximize", () => {
    persistWindowState(window);
  });
  window.on("unmaximize", () => {
    persistWindowState(window);
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    await window.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    await window.loadFile(rendererIndexPath());
  }

  return window;
}

function loadStoredWindowState(): StoredWindowState {
  const state = windowStateStore.get("window");
  return {
    height:
      typeof state.height === "number" && state.height >= 500
        ? state.height
        : DEFAULT_WINDOW_HEIGHT,
    isMaximized: state.isMaximized === true,
    width:
      typeof state.width === "number" && state.width >= 940
        ? state.width
        : DEFAULT_WINDOW_WIDTH,
  };
}

function persistWindowState(window: BrowserWindow): void {
  if (!app.isPackaged || window.isDestroyed()) {
    return;
  }

  const bounds = window.getBounds();
  const current = windowStateStore.get("window");
  windowStateStore.set("window", {
    height: window.isMaximized() ? current.height : bounds.height,
    isMaximized: window.isMaximized(),
    width: window.isMaximized() ? current.width : bounds.width,
  });
}

function createAppTray(): void {
  const iconPath = resolveAssetPath("build/icons/icon.png");
  const image = nativeImage.createFromPath(iconPath);
  tray = new Tray(image);
  tray.setToolTip("SoulFire");
  tray.setContextMenu(
    Menu.buildFromTemplate([
      {
        click: () => {
          mainWindow?.show();
          void mainWindow?.focus();
        },
        label: "Open SoulFire",
      },
      {
        click: () => {
          app.quit();
        },
        label: "Quit",
      },
    ]),
  );
  tray.on("click", () => {
    mainWindow?.show();
    void mainWindow?.focus();
  });
}

function registerSyncHandlers(): void {
  ipcMain.on("desktop:get-static", (event) => {
    event.returnValue = {
      appVersion: app.getVersion(),
      os: {
        arch: process.arch,
        locale: app.getLocale(),
        platform: process.platform,
        type: mapPlatformToType(process.platform),
        version: os.release(),
      },
    };
  });
}

function registerAsyncHandlers(): void {
  ipcMain.handle(
    "desktop:call",
    async (
      event,
      request: { args: unknown[]; method: string; namespace: string },
    ) => {
      const senderWindow =
        BrowserWindow.fromWebContents(event.sender) ?? mainWindow;
      const [firstArg, secondArg] = request.args;

      switch (`${request.namespace}.${request.method}`) {
        case "app.attachConsole":
          return;
        case "app.exit":
          app.exit((firstArg as number | undefined) ?? 0);
          return;
        case "app.setTheme":
          setThemeSource((firstArg as DesktopTheme) ?? null);
          return;
        case "commands.invoke":
          return handleCommandInvocation(
            firstArg as string,
            (secondArg as Record<string, unknown> | undefined) ?? {},
          );
        case "dialog.open":
          return openDialog(
            senderWindow,
            firstArg as Parameters<typeof openDialog>[1],
          );
        case "dialog.save":
          return saveDialog(
            senderWindow,
            firstArg as Parameters<typeof saveDialog>[1],
          );
        case "fs.mkdir":
          return fsMkdir(
            firstArg as string,
            secondArg as FsOptions | undefined,
          );
        case "fs.readDir":
          return fsReadDir(
            firstArg as string,
            secondArg as FsOptions | undefined,
          );
        case "fs.readTextFile":
          return fsReadTextFile(
            firstArg as string,
            secondArg as FsOptions | undefined,
          );
        case "fs.writeTextFile":
          return fsWriteTextFile(
            firstArg as string,
            request.args[1] as string,
            request.args[2] as FsOptions | undefined,
          );
        case "paths.appConfigDir":
          return getAppConfigDir(app);
        case "paths.appLocalDataDir":
          return getAppLocalDataDir(app);
        case "paths.downloadDir":
          return app.getPath("downloads");
        case "paths.resolve":
          return path.resolve(...(request.args as string[]));
        case "window.close":
          senderWindow?.close();
          return;
        case "window.isMaximized":
          return senderWindow?.isMaximized() ?? false;
        case "window.maximize":
          senderWindow?.maximize();
          return;
        case "window.minimize":
          senderWindow?.minimize();
          return;
        case "window.setTheme":
          setThemeSource((firstArg as DesktopTheme) ?? null);
          return;
        case "window.unmaximize":
          senderWindow?.unmaximize();
          return;
        default:
          throw new Error(
            `Unknown desktop call: ${request.namespace}.${request.method}`,
          );
      }
    },
  );

  ipcMain.on(
    "desktop:emit",
    (_event, request: { event: string; payload?: unknown }) => {
      switch (request.event) {
        case "cast-global-message":
          castManager.broadcastMessage(request.payload);
          return;
        case "kill-integrated-server":
          void killIntegratedServer(integratedServerState).then(() => {
            broadcastToRenderer("integrated-server-killed");
          });
          return;
        default:
          return;
      }
    },
  );
}

type FsOptions = {
  baseDir?: DesktopBaseDirectory;
  recursive?: boolean;
};

async function fsMkdir(targetPath: string, options?: FsOptions): Promise<void> {
  await mkdir(resolveFsPath(targetPath, options?.baseDir), {
    recursive: options?.recursive ?? false,
  });
}

async function fsReadDir(targetPath: string, options?: FsOptions) {
  const entries = await readdir(resolveFsPath(targetPath, options?.baseDir), {
    withFileTypes: true,
  });
  return entries.map((entry) => ({
    isDirectory: entry.isDirectory(),
    isFile: entry.isFile(),
    isSymlink: entry.isSymbolicLink(),
    name: entry.name,
  }));
}

async function fsReadTextFile(
  targetPath: string,
  options?: FsOptions,
): Promise<string> {
  return readFile(resolveFsPath(targetPath, options?.baseDir), "utf8");
}

async function fsWriteTextFile(
  targetPath: string,
  contents: string,
  options?: FsOptions,
): Promise<void> {
  const resolvedPath = resolveFsPath(targetPath, options?.baseDir);
  await mkdir(path.dirname(resolvedPath), {
    recursive: true,
  });
  await writeFile(resolvedPath, contents, "utf8");
}

function resolveFsPath(
  targetPath: string,
  baseDir?: DesktopBaseDirectory,
): string {
  const baseDirectoryPath = getBaseDirectoryPath(app, baseDir);
  if (baseDirectoryPath === null) {
    return targetPath;
  }

  return path.resolve(baseDirectoryPath, targetPath);
}

async function openDialog(
  window: BrowserWindow | null,
  options: {
    defaultPath?: string;
    directory?: boolean;
    filters?: Array<{ extensions: string[]; name: string }>;
    multiple?: boolean;
    title?: string;
  },
): Promise<string | string[] | null> {
  const dialogOptions = {
    defaultPath: options.defaultPath,
    filters: options.filters,
    properties: [
      ...(options.directory ? ["openDirectory"] : ["openFile"]),
      ...(options.multiple ? ["multiSelections"] : []),
    ] as Array<
      | "openDirectory"
      | "openFile"
      | "multiSelections"
      | "showHiddenFiles"
      | "createDirectory"
      | "promptToCreate"
      | "noResolveAliases"
      | "treatPackageAsDirectory"
      | "dontAddToRecent"
    >,
    title: options.title,
  };
  const result = window
    ? await dialog.showOpenDialog(window, dialogOptions)
    : await dialog.showOpenDialog(dialogOptions);

  if (result.canceled) {
    return null;
  }

  if (options.multiple) {
    return result.filePaths;
  }

  return result.filePaths[0] ?? null;
}

async function saveDialog(
  window: BrowserWindow | null,
  options: {
    defaultPath?: string;
    filters?: Array<{ extensions: string[]; name: string }>;
    title?: string;
  },
): Promise<string | null> {
  const dialogOptions = {
    defaultPath: options.defaultPath,
    filters: options.filters,
    title: options.title,
  };
  const result = window
    ? await dialog.showSaveDialog(window, dialogOptions)
    : await dialog.showSaveDialog(dialogOptions);

  if (result.canceled) {
    return null;
  }

  return result.filePath ?? null;
}

async function handleCommandInvocation(
  command: string,
  args: Record<string, unknown>,
): Promise<unknown> {
  switch (command) {
    case "connect_cast":
      return castManager.connect(args.address as string, args.port as number);
    case "discover_casts":
      castManager.discover();
      return null;
    case "get_casts":
      return castManager.getCasts();
    case "get_sf_server_version":
      return getSoulFireServerVersion(app, app.getVersion());
    case "reset_integrated_data":
      return resetIntegratedData(app);
    case "run_integrated_server":
      return runIntegratedServer(
        app,
        integratedServerState,
        ((args.jvmArgs as string[]) ?? []).map(String),
        broadcastToRenderer,
        app.getVersion(),
      );
    case "update_discord_activity":
      return discordPresence.update(
        String(args.state ?? ""),
        args.details ? String(args.details) : null,
      );
    default:
      throw new Error(`Unknown command: ${command}`);
  }
}

function setThemeSource(theme: DesktopTheme): void {
  nativeTheme.themeSource =
    theme === null ? "system" : theme === "dark" ? "dark" : "light";
}

function mapPlatformToType(platformName: string): string {
  switch (platformName) {
    case "darwin":
      return "macos";
    case "win32":
      return "windows";
    case "linux":
      return "linux";
    default:
      return platformName;
  }
}

async function bootstrap(): Promise<void> {
  app.setAppUserModelId(APP_ID);

  if (app.isPackaged) {
    if (!app.requestSingleInstanceLock()) {
      app.quit();
      return;
    }

    app.on("second-instance", async () => {
      if (mainWindow === null || mainWindow.isDestroyed()) {
        mainWindow = await createMainWindow();
        if (tray === null) {
          createAppTray();
        }
        return;
      }

      mainWindow.show();
      if (mainWindow.isMinimized()) {
        mainWindow.restore();
      }
      void mainWindow.focus();
    });
  }

  app.on("open-url", (_event, _url) => {
    mainWindow?.show();
    void mainWindow?.focus();
  });

  app.on("before-quit", () => {
    castManager.dispose();
    void killIntegratedServer(integratedServerState);
  });

  registerSyncHandlers();
  registerAsyncHandlers();

  mainWindow = await createMainWindow();
  createAppTray();

  app.on("activate", async () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      mainWindow = await createMainWindow();
    }
  });

  app.on("window-all-closed", () => {
    app.quit();
  });
}

await app.whenReady();
await bootstrap();
