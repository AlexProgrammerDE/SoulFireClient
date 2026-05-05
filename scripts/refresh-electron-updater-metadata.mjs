import { createHash } from "node:crypto";
import {
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";

const releaseArtifactsDir = path.resolve(
  process.argv[2] ?? "release-artifacts",
);

function listFilesRecursive(directory) {
  const entries = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      entries.push(...listFilesRecursive(entryPath));
    } else if (entry.isFile()) {
      entries.push(entryPath);
    }
  }
  return entries;
}

function findSingleTopLevelFile(directory, matcher) {
  const matches = readdirSync(directory, { withFileTypes: true })
    .filter((entry) => entry.isFile() && matcher(entry.name))
    .map((entry) => path.join(directory, entry.name));

  if (matches.length !== 1) {
    throw new Error(
      `Expected exactly one matching file in ${directory}, found ${matches.length}`,
    );
  }

  return matches[0];
}

const signedInstallerPath = findSingleTopLevelFile(
  releaseArtifactsDir,
  (name) => name.endsWith(".exe"),
);
const signedInstallerName = path.basename(signedInstallerPath);
const signedInstallerContents = readFileSync(signedInstallerPath);
const signedInstallerHash = createHash("sha512")
  .update(signedInstallerContents)
  .digest("base64");
const signedInstallerSize = statSync(signedInstallerPath).size;
const metadataFiles = listFilesRecursive(releaseArtifactsDir).filter(
  (filePath) => /\.(ya?ml)$/i.test(filePath),
);

let updatedMetadataFiles = 0;
for (const metadataFile of metadataFiles) {
  const metadata = readFileSync(metadataFile, "utf8");
  if (!metadata.includes(signedInstallerName)) {
    continue;
  }

  const updatedMetadata = metadata
    .replace(/^(\s*sha512:\s*).+$/gm, `$1${signedInstallerHash}`)
    .replace(/^(\s*size:\s*)\d+$/gm, `$1${signedInstallerSize}`)
    .replace(/^\s+blockMapSize:\s*\d+\r?\n/gm, "");

  writeFileSync(metadataFile, updatedMetadata);
  updatedMetadataFiles += 1;
}

if (updatedMetadataFiles === 0) {
  throw new Error(
    `No Electron updater metadata referenced ${signedInstallerName}`,
  );
}

for (const filePath of listFilesRecursive(releaseArtifactsDir)) {
  if (filePath.endsWith(".exe.blockmap")) {
    rmSync(filePath, { force: true });
  }
}
