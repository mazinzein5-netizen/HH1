---
name: Expo route typegen without dev server
description: How mobile typecheck regenerates gitignored Expo Router route types headlessly
---

Expo Router's typed routes (`.expo/types/router.d.ts`) and `expo-env.d.ts` are gitignored and normally only written while `expo start` runs. Any typecheck in a clean checkout fails on routes that exist on disk.

**Why:** Route types are generated artifacts, not source; CI/fresh environments never run the dev server.

**How to apply:** The mobile package's `typecheck` script runs `scripts/generate-route-types.js` first, which calls `expo-router/build/typed-routes/generate` (`getTypedRoutesDeclarationFile`) directly with a require-context ponyfill — bypassing the 1s-debounced `regenerateDeclarations` wrapper so it can run synchronously and exit. Output is byte-identical to the dev server's. If an Expo upgrade breaks those internal imports, the script fails loudly rather than typechecking against stale types. `pnpm run typegen` regenerates on demand.
