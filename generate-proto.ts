import { execSync } from "node:child_process";
import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";

function findProtoFiles(dir: string): string[] {
  let files: string[] = [];
  const entries = readdirSync(dir);
  for (const entry of entries) {
    const fullPath = join(dir, entry);
    if (statSync(fullPath).isDirectory()) {
      files = files.concat(findProtoFiles(fullPath));
    } else if (entry.endsWith(".proto")) {
      files.push(fullPath);
    }
  }
  return files;
}

function compileProtos(): void {
  const protoFiles = findProtoFiles("protos");
  if (protoFiles.length === 0) {
    console.log("No .proto files found.");
    return;
  }

  const command = `protoc --ts_out src/generated --ts_opt long_type_string --ts_opt optimize_code_size --ts_opt eslint_disable --ts_opt ts_nocheck --proto_path protos ${protoFiles.join(" ")}`;
  console.log(`Running: ${command}`);

  // Disable Web Storage API for Node.js v25+ compatibility
  // This fixes @typescript/vfs which is used by protoc-gen-ts
  const major = Number(process.versions.node.split(".")[0]);
  const existingNodeOptions = process.env.NODE_OPTIONS ?? "";
  const env =
    major >= 25
      ? {
          ...process.env,
          NODE_OPTIONS: `${existingNodeOptions} --no-webstorage`.trim(),
        }
      : process.env;

  execSync(command, { stdio: "inherit", env });
}

compileProtos();
