const { execFileSync } = require("node:child_process");
const path = require("node:path");

function isWindowsExecutable(filePath) {
  const extension = path.extname(filePath).toLowerCase();
  return extension === ".exe";
}

exports.default = async function sign(configuration) {
  const artifactPath = configuration.path;
  if (!artifactPath || !isWindowsExecutable(artifactPath)) {
    return;
  }

  const policySlug = process.env.SIGNPATH_POLICY_SLUG;
  const apiToken = process.env.SIGNPATH_API_KEY;
  if (!policySlug || !apiToken) {
    console.warn(
      `Skipping SignPath signing for ${artifactPath} because SIGNPATH_POLICY_SLUG or SIGNPATH_API_KEY is not set.`,
    );
    return;
  }

  execFileSync(
    "powershell",
    [
      "-NoLogo",
      "-NoProfile",
      "-NonInteractive",
      "-Command",
      [
        '$ErrorActionPreference = "Stop"',
        `Submit-SigningRequest -InputArtifactPath '${artifactPath.replace(/'/g, "''")}'`,
        `-ApiToken '${apiToken.replace(/'/g, "''")}'`,
        "-OrganizationId 'e091b552-3623-4d9d-83d7-059d8f32978b'",
        "-ProjectSlug 'SoulFireClient'",
        `-SigningPolicySlug '${policySlug.replace(/'/g, "''")}'`,
        `-OutputArtifactPath '${artifactPath.replace(/'/g, "''")}'`,
        "-WaitForCompletion",
      ].join("; "),
    ],
    {
      stdio: "inherit",
    },
  );
};
