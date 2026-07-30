---
name: Video artifact tsconfig lib omission
description: New video-js artifact scaffolds may omit the DOM lib in tsconfig, breaking tsc --noEmit
---

Some video-js artifact scaffolds are generated without `"lib": ["esnext", "dom", "dom.iterable"]` in `tsconfig.json`, so `tsc --noEmit` fails with dozens of "Cannot find name 'window'/'document'" errors even in untouched scaffold files.

**Why:** Hit this on a new video artifact; the sibling video artifacts all had the `lib` line and typechecked clean. The base tsconfig only sets `"lib": ["es2022"]` (no DOM).

**How to apply:** After bootstrapping a new video-js artifact, if a typecheck spews `window`/`document` not-found errors, compare its `tsconfig.json` against an existing video artifact and add the missing `lib` line instead of touching source files. Vite/dev server works either way — only tsc is affected.
