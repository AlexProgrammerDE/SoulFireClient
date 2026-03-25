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

  // 1. Fix `const { response } = await client...`
  // Actually, usually it's `const { response } = await client.something(...)`
  const destructureMatch =
    /const\s+\{\s*response\s*\}\s*=\s*await\s+(client\.[A-Za-z0-9_]+)\((.*?)\)/g;
  if (destructureMatch.test(content)) {
    content = content.replace(
      destructureMatch,
      "const response = await $1($2)",
    );
    changed = true;
  }

  // 2. Fix `const { response: myVar } = await client...`
  const destructureRenameMatch =
    /const\s+\{\s*response:\s*([A-Za-z0-9_]+)\s*\}\s*=\s*await\s+(client\.[A-Za-z0-9_]+)\((.*?)\)/g;
  if (destructureRenameMatch.test(content)) {
    content = content.replace(
      destructureRenameMatch,
      "const $1 = await $2($3)",
    );
    changed = true;
  }

  // 3. Fix `.response` accesses on promise results
  // e.g. (await client.method()).response
  const inlineResponseMatch =
    /\(await\s+client\.([A-Za-z0-9_]+)\((.*?)\)\)\.response/g;
  if (inlineResponseMatch.test(content)) {
    content = content.replace(inlineResponseMatch, "(await client.$1($2))");
    changed = true;
  }

  // 4. Fix streaming client.method().responses
  // connectrpc streams return an async iterable directly, so no `.responses`
  const responsesMatch = /(client\.[A-Za-z0-9_]+\(.*?\))\.responses/g;
  if (responsesMatch.test(content)) {
    content = content.replace(responsesMatch, "$1");
    changed = true;
  }

  // 5. Fix CallOptions { abort: ... } -> { signal: ... }
  const _abortMatch = /abort:\s*([^,}]+)/g;
  if (content.includes("abort:") && !content.includes("new AbortController")) {
    // Only replace inside client calls (heuristic: near `await client`) or just do it generally inside options objects
    content = content.replace(/abort:\s*([^,}]+)/g, "signal: $1");
    changed = true;
  }

  // 6. Fix `oneofKind` accesses. connectrpc uses `case`.
  // e.g. value.oneofKind === "string" -> value.case === "string"
  if (content.includes("oneofKind")) {
    content = content.replace(/\.oneofKind/g, ".case");
    changed = true;
  }

  if (changed) {
    writeFileSync(file, content);
  }
}
