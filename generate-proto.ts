import { execSync } from "node:child_process";
import { readdirSync, rmSync, statSync } from "node:fs";
import { join } from "node:path";

function removeLegacyGeneratedFiles(dir: string): void {
  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      removeLegacyGeneratedFiles(fullPath);
      continue;
    }
    if (!entry.endsWith("_pb.ts")) {
      rmSync(fullPath);
    }
  }
}

function compileProtos(): void {
  const commands = ["pnpm exec buf generate"];

  for (const command of commands) {
    console.log(`Running: ${command}`);
    execSync(command, { stdio: "inherit" });
  }

  removeLegacyGeneratedFiles("src/generated");

  const biomeCommand = "pnpm biome check --write src/generated";
  console.log(`Running: ${biomeCommand}`);
  execSync(biomeCommand, { stdio: "inherit" });
}

compileProtos();
