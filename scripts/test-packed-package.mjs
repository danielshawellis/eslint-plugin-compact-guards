#!/usr/bin/env node
// Smoke test that verifies the *packed* package (what npm would publish) can be
// installed and imported through both its ESM and CommonJS entry points.
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const projectRoot = process.cwd();
const workDir = mkdtempSync(join(tmpdir(), "compact-guards-pack-"));

function run(command, args, cwd) {
  execFileSync(command, args, { cwd, stdio: "inherit" });
}

try {
  console.log("→ Packing the package...");
  run("npm", ["pack", "--pack-destination", workDir], projectRoot);

  const tarball = readdirSync(workDir).find((file) => file.endsWith(".tgz"));
  if (!tarball) {
    throw new Error("npm pack did not produce a .tgz tarball");
  }
  const tarballPath = join(workDir, tarball);
  console.log(`→ Produced tarball: ${tarball}`);

  const consumerDir = mkdtempSync(join(tmpdir(), "compact-guards-consumer-"));
  console.log("→ Installing the tarball into a throwaway consumer project...");
  run("npm", ["init", "-y"], consumerDir);
  run(
    "npm",
    ["install", "--no-audit", "--no-fund", "--no-save", tarballPath],
    consumerDir,
  );

  const esmCheck = `
    import plugin from "eslint-plugin-compact-guards";
    const rule = plugin.rules?.["compact-guard-clause"];
    if (!rule) throw new Error("ESM: compact-guard-clause rule missing");
    if (plugin.meta?.name !== "eslint-plugin-compact-guards") {
      throw new Error("ESM: unexpected plugin meta name");
    }
    if (!plugin.configs?.recommended) throw new Error("ESM: recommended config missing");
    console.log("  ✓ ESM import works");
  `;
  const cjsCheck = `
    const plugin = require("eslint-plugin-compact-guards").default
      ?? require("eslint-plugin-compact-guards");
    const rule = plugin.rules && plugin.rules["compact-guard-clause"];
    if (!rule) throw new Error("CJS: compact-guard-clause rule missing");
    if (plugin.meta.name !== "eslint-plugin-compact-guards") {
      throw new Error("CJS: unexpected plugin meta name");
    }
    if (!plugin.configs.recommended) throw new Error("CJS: recommended config missing");
    console.log("  \u2713 CJS require works");
  `;

  writeFileSync(join(consumerDir, "esm-check.mjs"), esmCheck);
  writeFileSync(join(consumerDir, "cjs-check.cjs"), cjsCheck);

  console.log("→ Verifying entry points...");
  run("node", ["esm-check.mjs"], consumerDir);
  run("node", ["cjs-check.cjs"], consumerDir);

  rmSync(consumerDir, { recursive: true, force: true });
  console.log("✓ Packed-package smoke test passed");
} finally {
  rmSync(workDir, { recursive: true, force: true });
}
