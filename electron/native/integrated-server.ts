import { type ChildProcessWithoutNullStreams, spawn } from "node:child_process";
import { createHash, createHmac } from "node:crypto";
import { createReadStream } from "node:fs";
import {
  copyFile,
  mkdir,
  readFile,
  rename,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import { createRequire } from "node:module";
import net from "node:net";
import path from "node:path";
import readline from "node:readline";
import type { App } from "electron";
import * as tar from "tar";
import { getAppLocalDataDir } from "./app-paths";

const require = createRequire(import.meta.url);
const AdmZip = require("adm-zip") as {
  new (
    path: string,
  ): {
    extractAllTo: (targetPath: string, overwrite?: boolean) => void;
  };
};

const ROOT_USER_UUID = "00000000-0000-0000-0000-000000000000";

export type IntegratedServerState = {
  starting: boolean;
  child: ChildProcessWithoutNullStreams | null;
};

export function createIntegratedServerState(): IntegratedServerState {
  return {
    starting: false,
    child: null,
  };
}

export async function getSoulFireServerVersion(
  app: App,
  fallbackVersion: string,
): Promise<string> {
  try {
    const versionPath = path.join(
      app.getAppPath(),
      "soulfire-server-version.txt",
    );
    const contents = await readFile(versionPath, "utf8");
    const version = contents.trim();
    if (version.length > 0) {
      return version;
    }
  } catch {}

  return fallbackVersion;
}

export async function resetIntegratedData(app: App): Promise<void> {
  const appLocalDataDir = getAppLocalDataDir(app);

  await rm(path.join(appLocalDataDir, "jvm-25"), {
    force: true,
    recursive: true,
  });
  await rm(path.join(appLocalDataDir, "jars"), {
    force: true,
    recursive: true,
  });
}

export async function killIntegratedServer(
  state: IntegratedServerState,
): Promise<void> {
  const child = state.child;
  state.child = null;
  state.starting = false;

  if (child === null || child.killed) {
    return;
  }

  child.kill("SIGTERM");

  await new Promise<void>((resolve) => {
    const timeout = setTimeout(() => {
      child.kill("SIGKILL");
      resolve();
    }, 5_000);

    child.once("exit", () => {
      clearTimeout(timeout);
      resolve();
    });
  });
}

export async function runIntegratedServer(
  app: App,
  state: IntegratedServerState,
  jvmArgs: string[],
  broadcast: (event: string, payload?: unknown) => void,
  fallbackVersion: string,
): Promise<string> {
  if (state.starting) {
    throw new Error("Server already starting");
  }
  if (state.child !== null) {
    throw new Error("Integrated server is already running");
  }

  state.starting = true;
  try {
    const serverVersion = await getSoulFireServerVersion(app, fallbackVersion);
    const appLocalDataDir = getAppLocalDataDir(app);
    await mkdir(appLocalDataDir, {
      recursive: true,
    });

    const jvmDir = path.join(appLocalDataDir, "jvm-25");
    await ensureJvm(jvmDir, broadcast);

    const jarsDir = path.join(appLocalDataDir, "jars");
    await mkdir(jarsDir, {
      recursive: true,
    });

    const soulFireJarName = `SoulFireDedicated-${serverVersion}.jar`;
    const soulFireJarPath = path.join(jarsDir, soulFireJarName);
    await ensureSoulFireJar(
      serverVersion,
      soulFireJarName,
      soulFireJarPath,
      broadcast,
    );

    const soulFireRunDir = path.join(appLocalDataDir, "soulfire");
    await mkdir(soulFireRunDir, {
      recursive: true,
    });

    const javaHomeDir = getJavaHomeDir(jvmDir);
    const javaExecPath = path.join(javaHomeDir, "bin", getJavaExecutableName());
    const availablePort = await findRandomAvailablePort();

    broadcast("integrated-server-start-log", "Starting SoulFire server...");

    const child = spawn(
      javaExecPath,
      [...jvmArgs, `-Dsf.grpc.port=${availablePort}`, "-jar", soulFireJarPath],
      {
        cwd: soulFireRunDir,
        env: {
          ...process.env,
          JAVA_HOME: javaHomeDir,
          LD_LIBRARY_PATH: [
            path.join(javaHomeDir, "lib"),
            path.join(javaHomeDir, "lib", "server"),
            process.env.LD_LIBRARY_PATH ?? "",
          ].join(path.delimiter),
          DYLD_LIBRARY_PATH: [
            path.join(javaHomeDir, "lib"),
            path.join(javaHomeDir, "lib", "server"),
            process.env.DYLD_LIBRARY_PATH ?? "",
          ].join(path.delimiter),
        },
        stdio: "pipe",
        windowsHide: true,
      },
    );

    state.child = child;

    await waitForServerReady(child, broadcast, state);

    const secretKey = await readFile(
      path.join(soulFireRunDir, "secret-key.bin"),
    );
    const token = createRootApiToken(secretKey);
    return `http://127.0.0.1:${availablePort}\n${token}`;
  } finally {
    state.starting = false;
  }
}

async function waitForServerReady(
  child: ChildProcessWithoutNullStreams,
  broadcast: (event: string, payload?: unknown) => void,
  state: IntegratedServerState,
): Promise<void> {
  let finishedLoading = false;

  await new Promise<void>((resolve, reject) => {
    const handleLine = (rawLine: string) => {
      const line = stripAnsi(rawLine).trim();
      if (!line) {
        return;
      }

      broadcast("integrated-server-start-log", line);
      if (line.includes("Finished loading!")) {
        finishedLoading = true;
        resolve();
      }
    };

    const stdout = readline.createInterface({
      input: child.stdout,
    });
    const stderr = readline.createInterface({
      input: child.stderr,
    });

    stdout.on("line", handleLine);
    stderr.on("line", handleLine);

    child.once("exit", () => {
      state.child = null;
      if (!finishedLoading) {
        reject(new Error("SoulFire didn't properly finish loading"));
      }
    });
    child.once("error", (error) => {
      state.child = null;
      reject(error);
    });
  });
}

async function ensureJvm(
  jvmDir: string,
  broadcast: (event: string, payload?: unknown) => void,
): Promise<void> {
  if (await exists(jvmDir)) {
    broadcast("integrated-server-start-log", "JVM detected");
    return;
  }

  const adoptiumOs = detectOs();
  const adoptiumArch = detectArchitecture();
  const jvmUrl = `https://api.adoptium.net/v3/assets/latest/25/hotspot?architecture=${adoptiumArch}&image_type=jre&os=${adoptiumOs}&vendor=eclipse`;

  broadcast("integrated-server-start-log", "Fetching JVM data...");
  const metadataResponse = await fetch(jvmUrl);
  if (!metadataResponse.ok) {
    throw new Error("Failed to fetch JVM metadata");
  }

  const metadata = (await metadataResponse.json()) as Array<{
    binary?: {
      package?: {
        checksum?: string;
        link?: string;
      };
    };
    release_name?: string;
  }>;
  const release = metadata[0];
  const checksum = release?.binary?.package?.checksum;
  const downloadUrl = release?.binary?.package?.link;
  const releaseName = release?.release_name;
  if (!checksum || !downloadUrl || !releaseName) {
    throw new Error("JVM metadata was incomplete");
  }

  const archiveTmpPath = `${jvmDir}.download`;
  const extractTmpRoot = `${jvmDir}.extract`;
  await rm(archiveTmpPath, {
    force: true,
  });
  await rm(extractTmpRoot, {
    force: true,
    recursive: true,
  });

  await downloadToFile(downloadUrl, archiveTmpPath, (percent) => {
    broadcast("integrated-server-start-log", `Downloading JVM... ${percent}%`);
  });
  await verifyFileChecksum(archiveTmpPath, checksum, "JVM");

  broadcast("integrated-server-start-log", "Extracting JVM...");
  await mkdir(extractTmpRoot, {
    recursive: true,
  });

  if (downloadUrl.endsWith(".zip")) {
    const zip = new AdmZip(archiveTmpPath);
    zip.extractAllTo(extractTmpRoot, true);
  } else if (downloadUrl.endsWith(".tar.gz")) {
    await tar.x({
      cwd: extractTmpRoot,
      file: archiveTmpPath,
    });
  } else {
    throw new Error("Unsupported JVM archive type");
  }

  const extractedJvmDir = path.join(extractTmpRoot, `${releaseName}-jre`);
  const extractedJavaExec = path.join(
    getJavaHomeDir(extractedJvmDir),
    "bin",
    getJavaExecutableName(),
  );
  if (!(await exists(extractedJavaExec))) {
    throw new Error("Extracted JVM is missing the Java executable");
  }

  await atomicReplaceDirectory(extractedJvmDir, jvmDir);
  await rm(archiveTmpPath, {
    force: true,
  });
  await rm(extractTmpRoot, {
    force: true,
    recursive: true,
  });

  broadcast("integrated-server-start-log", "Downloaded JVM");
}

async function ensureSoulFireJar(
  version: string,
  jarName: string,
  jarPath: string,
  broadcast: (event: string, payload?: unknown) => void,
): Promise<void> {
  broadcast(
    "integrated-server-start-log",
    "Fetching SoulFire checksum metadata...",
  );

  const expectedChecksum = await fetchSoulFireJarChecksum(version, jarName);
  if (await exists(jarPath)) {
    const existingChecksum = await sha256FileHex(jarPath);
    if (existingChecksum.toLowerCase() === expectedChecksum.toLowerCase()) {
      broadcast(
        "integrated-server-start-log",
        "SoulFire already downloaded and verified",
      );
      return;
    }
  }

  const jarUrl = `https://github.com/soulfiremc-com/SoulFire/releases/download/${version}/${jarName}`;
  const tempJarPath = `${jarPath}.download`;
  await rm(tempJarPath, {
    force: true,
  });

  broadcast("integrated-server-start-log", "Fetching SoulFire data...");
  await downloadToFile(jarUrl, tempJarPath, (percent) => {
    broadcast(
      "integrated-server-start-log",
      `Downloading SoulFire... ${percent}%`,
    );
  });
  await verifyFileChecksum(tempJarPath, expectedChecksum, "SoulFire jar");
  await atomicReplaceFile(tempJarPath, jarPath);
  broadcast("integrated-server-start-log", "Downloaded SoulFire");
}

async function fetchSoulFireJarChecksum(
  version: string,
  jarName: string,
): Promise<string> {
  const response = await fetch(
    `https://api.github.com/repos/soulfiremc-com/SoulFire/releases/tags/${version}`,
    {
      headers: {
        "User-Agent": "SoulFireClient",
      },
    },
  );
  if (!response.ok) {
    throw new Error("Failed to fetch SoulFire release metadata");
  }

  const release = (await response.json()) as {
    assets?: Array<{
      name?: string;
      digest?: string;
    }>;
  };
  const asset = release.assets?.find((entry) => entry.name === jarName);
  const digest = asset?.digest?.replace(/^sha256:/, "");
  if (!digest) {
    throw new Error("SoulFire release metadata did not include a checksum");
  }

  return digest;
}

async function downloadToFile(
  url: string,
  destinationPath: string,
  onProgress: (percent: number) => void,
): Promise<void> {
  const response = await fetch(url);
  if (!response.ok || response.body === null) {
    throw new Error(`Download failed for ${url}`);
  }

  const contentLengthHeader = response.headers.get("content-length");
  const totalSize = contentLengthHeader ? Number(contentLengthHeader) : 0;
  const chunks: Buffer[] = [];
  let downloaded = 0;
  let lastPercent = -1;

  for await (const chunk of response.body) {
    const buffer = Buffer.from(chunk);
    chunks.push(buffer);
    downloaded += buffer.length;

    if (totalSize > 0) {
      const percent = Math.floor((downloaded / totalSize) * 100);
      if (percent !== lastPercent) {
        lastPercent = percent;
        onProgress(percent);
      }
    }
  }

  await writeFile(destinationPath, Buffer.concat(chunks));
}

async function verifyFileChecksum(
  filePath: string,
  expectedChecksum: string,
  label: string,
): Promise<void> {
  const actualChecksum = await sha256FileHex(filePath);
  if (actualChecksum.toLowerCase() !== expectedChecksum.toLowerCase()) {
    throw new Error(`${label} checksum verification failed`);
  }
}

async function sha256FileHex(filePath: string): Promise<string> {
  const hash = createHash("sha256");
  const stream = createReadStream(filePath);

  await new Promise<void>((resolve, reject) => {
    stream.on("data", (chunk) => hash.update(chunk));
    stream.on("end", () => resolve());
    stream.on("error", reject);
  });

  return hash.digest("hex");
}

async function atomicReplaceDirectory(
  sourcePath: string,
  targetPath: string,
): Promise<void> {
  const replacementPath = `${targetPath}.tmp`;
  await rm(replacementPath, {
    force: true,
    recursive: true,
  });
  await rename(sourcePath, replacementPath);
  await rm(targetPath, {
    force: true,
    recursive: true,
  });
  await rename(replacementPath, targetPath);
}

async function atomicReplaceFile(
  sourcePath: string,
  targetPath: string,
): Promise<void> {
  await mkdir(path.dirname(targetPath), {
    recursive: true,
  });
  if (await exists(targetPath)) {
    await rm(targetPath, {
      force: true,
    });
  }
  await copyFile(sourcePath, targetPath);
  await rm(sourcePath, {
    force: true,
  });
}

function createRootApiToken(secretKey: Buffer): string {
  const issuedAt = Math.floor(Date.now() / 1000);
  const header = base64urlEncode(
    JSON.stringify({
      alg: "HS256",
      typ: "JWT",
    }),
  );
  const claims = base64urlEncode(
    JSON.stringify({
      sub: ROOT_USER_UUID,
      iat: issuedAt,
      aud: ["api"],
    }),
  );
  const unsignedToken = `${header}.${claims}`;
  const signature = createHmac("sha256", secretKey)
    .update(unsignedToken)
    .digest("base64url");
  return `${unsignedToken}.${signature}`;
}

function base64urlEncode(value: string): string {
  return Buffer.from(value).toString("base64url");
}

function detectArchitecture(): string {
  switch (process.arch) {
    case "x64":
      return "x64";
    case "ia32":
      return "x32";
    case "ppc64":
      return "ppc64";
    case "s390x":
      return "s390x";
    case "arm64":
      return "aarch64";
    case "arm":
      return "arm";
    case "riscv64":
      return "riscv64";
    default:
      return "unknown";
  }
}

function detectOs(): string {
  switch (process.platform) {
    case "linux":
      return "linux";
    case "win32":
      return "windows";
    case "darwin":
      return "mac";
    default:
      return "unknown";
  }
}

function getJavaExecutableName(): string {
  return process.platform === "win32" ? "java.exe" : "java";
}

function getJavaHomeDir(baseDir: string): string {
  if (process.platform === "darwin") {
    return path.join(baseDir, "Contents", "Home");
  }
  return baseDir;
}

async function findRandomAvailablePort(): Promise<number> {
  const server = net.createServer();

  return new Promise<number>((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (!address || typeof address === "string") {
        reject(new Error("Failed to resolve an available port"));
        return;
      }

      const port = address.port;
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(port);
      });
    });
  });
}

async function exists(targetPath: string): Promise<boolean> {
  try {
    await stat(targetPath);
    return true;
  } catch {
    return false;
  }
}

function stripAnsi(value: string): string {
  return value.replace(
    // biome-ignore lint/suspicious/noControlCharactersInRegex: ANSI control sequence stripping
    /\u001B\[[0-9;]*[A-Za-z]/g,
    "",
  );
}
