import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";

function findFiles(dir: string): string[] {
  let results: string[] = [];
  const list = readdirSync(dir);
  for (const file of list) {
    const filePath = join(dir, file);
    const stat = statSync(filePath);
    if (stat?.isDirectory()) {
      results = results.concat(findFiles(filePath));
    } else {
      if (filePath.endsWith(".ts") || filePath.endsWith(".tsx")) {
        results.push(filePath);
      }
    }
  }
  return results;
}

const files = findFiles("src");

for (const file of files) {
  let content = readFileSync(file, "utf8");
  let changed = false;

  // Replace .client imports
  if (content.includes(".client")) {
    const newContent = content.replace(
      /@\/generated\/([a-zA-Z0-9_/-]+)\.client/g,
      "@/generated/$1_pb",
    );
    if (newContent !== content) changed = true;
    content = newContent;
  }

  // Replace simple .ts imports for generated files
  if (content.includes("@/generated/")) {
    const c1 = content.replace(
      /@\/generated\/([a-zA-Z0-9_/-]+)(?<!_pb)\.ts"/g,
      '@/generated/$1_pb.ts"',
    );
    const c2 = c1.replace(
      /@\/generated\/([a-zA-Z0-9_/-]+)(?<!_pb)"/g,
      '@/generated/$1_pb"',
    );
    if (c2 !== content) changed = true;
    content = c2;
  }

  // Replace client instantiations
  // e.g. new ClientServiceClient(transport) -> createClient(ClientService, transport)
  const clientMatch = /new ([A-Za-z]+Service)Client\((.*?)\)/g;
  if (clientMatch.test(content)) {
    content = content.replace(clientMatch, "createClient($1, $2)");
    if (
      !content.includes("createClient") ||
      !content.includes("@connectrpc/connect")
    ) {
      content = `import { createClient } from "@connectrpc/connect";\n${content}`;
    }
    changed = true;
  }

  // Replace client type imports/usages
  // e.g. ClientServiceClient -> ClientService
  const clientImportMatch = /([A-Za-z]+Service)Client\b/g;
  if (clientImportMatch.test(content)) {
    const newContent = content.replace(/([A-Za-z]+Service)Client\b/g, "$1");
    if (newContent !== content) changed = true;
    content = newContent;
  }

  // Also replace `import { create } from "@connectrpc/connect"` if I added it wrongly? No, the new regex adds createClient.

  if (changed) {
    writeFileSync(file, content);
  }
}
