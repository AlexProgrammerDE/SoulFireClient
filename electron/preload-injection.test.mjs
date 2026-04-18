import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const electronDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.dirname(electronDir);

function runCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: repoRoot,
      env: process.env,
      stdio: ["ignore", "pipe", "pipe"],
      ...options,
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.on("error", reject);
    child.on("close", (code, signal) => {
      resolve({ code, signal, stderr, stdout });
    });
  });
}

test("Electron preload bundle is executable as ESM when the package is type=module", {
  timeout: 120_000,
}, async () => {
  const build = await runCommand("pnpm", ["exec", "vite", "build"], {
    env: {
      ...process.env,
      SF_ELECTRON: "1",
    },
  });

  assert.equal(build.code, 0, build.stderr || build.stdout);

  const preloadBundle = await readFile(
    path.join(repoRoot, "dist-electron", "preload.mjs"),
    "utf8",
  );

  assert.doesNotMatch(
    preloadBundle,
    /\brequire\(/,
    "preload.mjs must not contain CommonJS require() calls because Electron runs it as an ES module with sandbox disabled",
  );
});
