---
name: EAS APK builds from main agent
description: How to build/fetch Android APKs with eas-cli in this workspace, and the version-mismatch crash to check first
---

- Run eas-cli with `EAS_NO_VCS=1` — otherwise it touches `.git` and is blocked by main-agent git restrictions.
- `EXPO_TOKEN` secret enables non-interactive eas-cli; fetch APK link via `eas-cli build:list/build:view --json` (`artifacts.buildUrl`).
- **Why:** an installed APK crashed at launch with `java.lang.NoClassDefFoundError: expo/modules/kotlin/ModuleRegistry` because expo-media-library/expo-sharing were on a newer-SDK major (57.x) than Expo SDK 54.
- **How to apply:** before any EAS build, run `npx expo install --check` in artifacts/mobile and fix mismatches (`pnpm add pkg@expected` — `expo install --fix` hangs here). Dev/Expo Go and web preview do NOT catch this; only real builds crash.
- Free-tier build queue can be 45+ min; poll patiently, `build:view` sometimes times out — retry.
