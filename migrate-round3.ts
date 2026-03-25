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

  // 1. Fix missing response destructuring
  const destructureMatch =
    /const\s+\{\s*response\s*\}\s*=\s*await\s+([A-Za-z0-9_.]+)\s*\(/g;
  if (destructureMatch.test(content)) {
    content = content.replace(destructureMatch, "const response = await $1(");
    changed = true;
  }

  const destructureRenameMatch =
    /const\s+\{\s*response:\s*([A-Za-z0-9_]+)\s*\}\s*=\s*await\s+([A-Za-z0-9_.]+)\s*\(/g;
  if (destructureRenameMatch.test(content)) {
    content = content.replace(destructureRenameMatch, "const $1 = await $2(");
    changed = true;
  }

  // 2. Fix inline response accesses
  const inlineResponseMatch =
    /\(await\s+([A-Za-z0-9_.]+)\s*\(([\s\S]*?)\)\)\.response/g;
  if (inlineResponseMatch.test(content)) {
    content = content.replace(inlineResponseMatch, "(await $1($2))");
    changed = true;
  }

  // Fix responses streaming iteration
  const _responsesMatch = /\.responses/g;
  if (
    content.includes(".responses") &&
    !content.includes("response.responses")
  ) {
    content = content.replace(/\.responses/g, "");
    changed = true;
  }

  // Fix missed `new ServiceClient(...)` cases
  const missedClient = /new ([A-Za-z]+Service)\((.*?)\)/g;
  if (missedClient.test(content)) {
    content = content.replace(missedClient, "createClient($1, $2)");
    if (!content.includes("createClient")) {
      content = `import { createClient } from "@connectrpc/connect";\n${content}`;
    }
    changed = true;
  }

  // Fix @protobuf-ts/runtime imports
  if (content.includes("@protobuf-ts/runtime-rpc")) {
    content = content.replace(
      /@protobuf-ts\/runtime-rpc/g,
      "@connectrpc/connect",
    );
    content = content.replace(/RpcTransport/g, "Transport");
    changed = true;
  }

  if (content.includes("@protobuf-ts/runtime")) {
    content = content.replace(/@protobuf-ts\/runtime/g, "@bufbuild/protobuf");
    changed = true;
  }

  // Fix Value / JsonValue usage if Value is missing
  // In connectrpc v2, the wrapper types are handled via Any/Value from @bufbuild/protobuf/wkt
  // Let's replace `Value` with `any` in generic settings if they are failing, but wait:
  // "Value only refers to a type, but is being used as a value here"
  if (content.includes("Value.fromJson")) {
    content = content.replace(/Value\.fromJson\((.*?)\)/g, "$1 as any");
    changed = true;
  }
  if (content.includes("Value.toJson")) {
    content = content.replace(/Value\.toJson\((.*?)\)/g, "$1");
    changed = true;
  }

  if (changed) {
    writeFileSync(file, content);
  }
}
