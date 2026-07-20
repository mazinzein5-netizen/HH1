---
name: Health HIVE brand assets
description: Canonical brand/mascot images, where they live and how they are used across website and mobile.
---

- Canonical brand images live in `attached_assets/` (user-supplied, July 2026):
  - `IMG_0651_1784507381258.jpeg` — HEALTH HIVE ecosystem emblem (dark bg, blue wordmark, "Ibn Ceena Ltd."). Used in website hero.
  - `IMG_0654_1784507381258.jpeg` — HIVE Companion Patient Portal art. Used in website Companion section.
  - `IMG_0658_1784507522095.jpeg` — HIVE Hospital Surgical Assistant art. Used in website Surgical section.
  - `IMG_0656_1784507381258.png` — square app-icon style bee badge → website favicon (`public/favicon.png`, resized 256px).
  - `bee_mascot_transparent.png` — bee mascot with background removed (derived from IMG_0655). THE project mascot/logo.
- Bee mascot copies: `artifacts/mobile/assets/images/bee-mascot.png` (used in dashboard hero widget + SarahBubble header); website header imports it via `@assets` alias.
- **Why:** user wants this bee/honeycomb art as the project logo and as a small in-app widget; prefer these images over the procedural HiveLogo hexagons for new branding surfaces.
- **How to apply:** for new marketing/branding surfaces, reuse these assets (via `@assets` on web, `require("@/assets/images/bee-mascot.png")` on mobile) instead of generating new art.
