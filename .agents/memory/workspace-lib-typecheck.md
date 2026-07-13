---
name: Workspace lib typecheck ordering
description: New lib/* packages need root tsconfig reference + tsc --build before artifact --noEmit typechecks, or TS6305 appears.
---

Rule: any new `lib/*` workspace package with a composite tsconfig must be added to the root `tsconfig.json` references. Artifact typechecks (`tsc --noEmit`) fail with TS6305 unless the lib's declarations exist in `dist/` — and `dist/` is gitignored.

**Why:** Adding `lib/privacy-policy` made mobile and api-server typechecks fail on a fresh checkout until declarations were built. The root `typecheck` script already solves this: it runs `typecheck:libs` (`tsc --build`, driven by root references) before per-artifact typechecks.

**How to apply:** After creating a lib package, add it to root `tsconfig.json` references and to the consuming artifacts' `references`. Verify with `rm -rf lib/<pkg>/dist` then `pnpm run typecheck` (note: mockup-sandbox has a pre-existing unrelated failure). Never run a bare artifact `tsc --noEmit` as proof of CI-cleanliness without building libs first.
