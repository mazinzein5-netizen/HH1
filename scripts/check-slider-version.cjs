#!/usr/bin/env node
/**
 * Verifies that the installed @react-native-community/slider version matches
 * the expected pin enforced by the pnpm-workspace.yaml override.
 *
 * Run automatically via the root postinstall script. If expo upgrade (or any
 * other tool) silently changes the resolved version, this script fails loudly
 * so the mismatch is caught at install time rather than at runtime on device.
 */

const EXPECTED = "5.0.1";
const PKG = "@react-native-community/slider";

const path = require("path");
const fs = require("fs");

const candidates = [
  path.resolve(__dirname, "../node_modules/@react-native-community/slider/package.json"),
  path.resolve(__dirname, "../artifacts/mobile/node_modules/@react-native-community/slider/package.json"),
];

const pkgJsonPath = candidates.find(fs.existsSync);

if (!pkgJsonPath) {
  console.warn(
    `[check-slider-version] WARN: ${PKG} not found in node_modules — skipping check.`
  );
  process.exit(0);
}

const { version } = JSON.parse(fs.readFileSync(pkgJsonPath, "utf8"));

if (version !== EXPECTED) {
  console.error(`
[check-slider-version] ERROR: installed ${PKG}@${version} does not match the
required pin ${EXPECTED} set in pnpm-workspace.yaml overrides.

This usually means expo upgrade (or a manual edit) changed the entry in
artifacts/mobile/package.json without updating pnpm-workspace.yaml.

Fix: restore the override in pnpm-workspace.yaml:
  overrides:
    "@react-native-community/slider": "${EXPECTED}"

Then re-run: pnpm install
`);
  process.exit(1);
}

console.log(`[check-slider-version] OK: ${PKG}@${version} matches pin ${EXPECTED}.`);
