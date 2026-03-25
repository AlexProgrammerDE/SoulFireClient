import { readFileSync, writeFileSync } from "node:fs";

let content = readFileSync("src/demo-data.ts", "utf8");

content = content.replace(
  /export const demoServerInfo: ServerInfo = \{/g,
  `export const demoServerInfo = {`,
);
content = content.replace(
  /export const demoGlobalPermissions: GlobalPermissionState\[\] = \[/g,
  `export const demoGlobalPermissions = [`,
);
content = content.replace(
  /export const demoSettingsDefinitions: SettingsEntry\[\] = \[/g,
  `export const demoSettingsDefinitions = [`,
);
content = content.replace(
  /export const demoSettings: SettingsEntryValue\[\] = \[/g,
  `export const demoSettings = [`,
);
content = content.replace(
  /export const demoProfiles: UserProfile\[\] = \[/g,
  `export const demoProfiles = [`,
);
content = content.replace(
  /export const demoInstances: Instance\[\] = \[/g,
  `export const demoInstances = [`,
);
content = content.replace(
  /export const demoBots: Bot\[\] = \[/g,
  `export const demoBots = [`,
);
content = content.replace(
  /export const demoScripts: Script\[\] = \[/g,
  `export const demoScripts = [`,
);

writeFileSync("src/demo-data.ts", content);
