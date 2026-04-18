import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import packageJson from "../package.json" with { type: "json" };

const electronDir = path.dirname(fileURLToPath(import.meta.url));
const _repoRoot = path.dirname(electronDir);

test("Linux desktop entry metadata keeps the window class aligned with the package name", () => {
  const desktopName = packageJson.desktopName;
  const startupWmClass =
    packageJson.build?.linux?.desktop?.entry?.StartupWMClass;

  assert.equal(desktopName, `${packageJson.name}.desktop`);
  assert.equal(startupWmClass, packageJson.name);
});
