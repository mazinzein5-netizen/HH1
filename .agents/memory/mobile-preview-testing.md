---
name: Mobile web-preview testing quirks
description: How to screenshot/test the Expo app's web preview past the consent gate and demo-user state
---

- Fresh web-preview sessions land on the ConsentGate; append `?preview=1` to any route (e.g. `/register?preview=1`) to skip it for screenshots.
- The default signed-in user on web preview is the guest/demo account (`isGuest: true`), so screens that gate features for guests will show the guest state, not the full feature.
- **Why:** screenshots without `?preview=1` silently show the consent screen instead of the target route, wasting rounds.
- Pilot-gated screens (telemedicine portal, companion, etc.) redirect away when `pilotMode` is false; append `&pilot=1` alongside `?preview=1` to preview them (dev-only web override in AppModeContext, never active in store builds).
- MDI glyphmap for icon-name validation lives under the pnpm store: `node_modules/.pnpm/@expo+vector-icons*/node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/glyphmaps/MaterialCommunityIcons.json` (not at the workspace-root hoisted path).
