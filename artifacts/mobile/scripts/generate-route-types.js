const fs = require("node:fs");
const path = require("node:path");

const projectRoot = path.resolve(__dirname, "..");

function fail(message) {
  console.error(`generate-route-types: ${message}`);
  process.exit(1);
}

let appConfig;
try {
  appConfig = JSON.parse(
    fs.readFileSync(path.join(projectRoot, "app.json"), "utf8"),
  );
} catch (error) {
  fail(`could not read app.json: ${error.message}`);
}

const expo = appConfig.expo || {};

if (!expo.experiments || !expo.experiments.typedRoutes) {
  console.log(
    "generate-route-types: typedRoutes experiment disabled, skipping",
  );
  process.exit(0);
}

const routerConfig = (expo.extra && expo.extra.router) || {};
const routerRoot = path.resolve(projectRoot, routerConfig.root || "app");

if (!fs.existsSync(routerRoot)) {
  fail(`router directory not found: ${routerRoot}`);
}

process.env.EXPO_ROUTER_APP_ROOT = routerRoot;

let requireContext;
let EXPO_ROUTER_CTX_IGNORE;
let getTypedRoutesDeclarationFile;
try {
  requireContext = require("expo-router/build/testing-library/require-context-ponyfill").default;
  ({ EXPO_ROUTER_CTX_IGNORE } = require("expo-router/_ctx-shared"));
  ({
    getTypedRoutesDeclarationFile,
  } = require("expo-router/build/typed-routes/generate"));
} catch (error) {
  fail(
    `could not load expo-router type generation internals (expo-router version may have changed): ${error.message}`,
  );
}

const ctx = requireContext(routerRoot, true, EXPO_ROUTER_CTX_IGNORE);

let declaration;
try {
  declaration = getTypedRoutesDeclarationFile(ctx, routerConfig);
} catch (error) {
  fail(`route type generation failed: ${error.message}`);
}

if (!declaration) {
  fail("route type generation produced no output");
}

const typesDirectory = path.join(projectRoot, ".expo", "types");
fs.mkdirSync(typesDirectory, { recursive: true });

const routerDts = path.join(typesDirectory, "router.d.ts");
fs.writeFileSync(routerDts, declaration);

const expoEnvDts = path.join(projectRoot, "expo-env.d.ts");
const expoEnvTemplate = `/// <reference types="expo/types" />

// NOTE: This file should not be edited and should be in your git ignore`;
if (!fs.existsSync(expoEnvDts)) {
  fs.writeFileSync(expoEnvDts, expoEnvTemplate);
  console.log(
    `generate-route-types: wrote ${path.relative(projectRoot, expoEnvDts)}`,
  );
}

console.log(
  `generate-route-types: wrote ${path.relative(projectRoot, routerDts)}`,
);
