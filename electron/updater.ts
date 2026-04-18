import { app } from "electron";
import electronLog from "electron-log";
import electronUpdater from "electron-updater";

const { autoUpdater } = electronUpdater;

function normalizeUpdaterPlatform(
  platformName: NodeJS.Platform,
): string | null {
  switch (platformName) {
    case "darwin":
      return "macos";
    case "linux":
      return "linux";
    case "win32":
      return "windows";
    default:
      return null;
  }
}

function normalizeUpdaterArch(archName: string): string | null {
  switch (archName) {
    case "arm64":
      return "arm64";
    case "x64":
      return "x64";
    default:
      return null;
  }
}

function getUpdaterChannel(): string | null {
  const platformName = normalizeUpdaterPlatform(process.platform);
  const archName = normalizeUpdaterArch(process.arch);
  if (platformName === null || archName === null) {
    return null;
  }

  return `${platformName}-${archName}`;
}

export function startUpdater(): void {
  if (
    !app.isPackaged ||
    process.env.SOULFIRE_DISABLE_UPDATER !== undefined ||
    process.env.SF_ELECTRON_DISABLE_UPDATER !== undefined
  ) {
    return;
  }

  const updaterChannel = getUpdaterChannel();
  if (updaterChannel === null) {
    electronLog.warn(
      "Skipping updater because the current platform/arch is unsupported",
      {
        arch: process.arch,
        platform: process.platform,
      },
    );
    return;
  }

  electronLog.transports.file.level = "info";
  autoUpdater.logger = electronLog;
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = false;
  autoUpdater.channel = updaterChannel;

  autoUpdater.on("checking-for-update", () => {
    electronLog.info("Checking for updates", {
      channel: updaterChannel,
    });
  });
  autoUpdater.on("update-available", (info) => {
    electronLog.info("Update available", info);
  });
  autoUpdater.on("update-not-available", (info) => {
    electronLog.info("No update available", info);
  });
  autoUpdater.on("download-progress", (progress) => {
    electronLog.info("Update download progress", progress);
  });
  autoUpdater.on("update-downloaded", (info) => {
    electronLog.info("Update downloaded, installing now", info);
    autoUpdater.quitAndInstall();
  });
  autoUpdater.on("error", (error) => {
    electronLog.error("Auto-update failed", error);
  });

  void autoUpdater.checkForUpdates();
}
