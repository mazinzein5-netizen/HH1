---
name: Canvas mobile screen previews
description: How the mobile app's screens are shown live on the canvas and why extraction was avoided
---
Rule: to preview mobile (Expo/RN) screens on the canvas, embed the real Expo web dev server's per-route URLs (`https://$REPLIT_EXPO_DEV_DOMAIN/<route>?preview=1`) as live iframes; do NOT extract RN screens into the vite mockup sandbox.

**Why:** react-native-web inside the vite sandbox is high-failure (metro/babel-dependent expo packages); the Expo app already runs on web, and iframing real routes means edits to real app code hot-reload in the previews.

**How to apply:** Expo router strips group segments (`(app)/(tabs)/dashboard` → `/dashboard`). The consent gate is skipped via a dev+web-only `?preview=1` bypass in the app-mode context (guarded by `__DEV__`, never persisted). Canvas frames are 390x844, shape IDs `scr-*`.
