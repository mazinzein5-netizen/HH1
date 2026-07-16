---
name: Exporting video artifacts to MP4
description: How to turn a video-js artifact into a hosted MP4 file (no platform export tool exists) and the loop-alignment pitfall.
---

# Exporting video artifacts to MP4

There is no platform/sandbox callback that exports a video artifact. The promo recorder (`scripts/record-promo.mjs`, run via `pnpm --filter @workspace/scripts run export:promo`) is now a one-command export: it parses SCENE_DURATIONS out of the promo's VideoTemplate.tsx (never hardcode the total), records via puppeteer-core + nix-store playwright Chromium + CDP `Page.startScreencast`, encodes with ffmpeg (ambient audio muxed), and extracts the poster. A staleness guard (`check:promo-freshness`) exits 1 when the promo source is newer than the hosted MP4. The surgical video follows the identical pattern (`export:surgical` / `check:surgical-freshness`); the surgical freshness check is also registered as a validation command (`surgical-freshness`).

**Rules:**
- Capture must be aligned to a loop boundary or the MP4 starts/ends mid-scene. Do a warm-up load first (fonts + background clips cache), keep the screencast running, then `page.reload()` and start keeping frames when the fresh mount calls `window.startRecording` — that pins frame 0 to scene 1.
- Do NOT trust `waitUntil: networkidle2` to land before the first pass ends; the first `stopRecording` may already have fired, which silently misaligns capture.
- Screencast frames arrive at whatever rate rendering allows; write a concat manifest using each frame's `metadata.timestamp` deltas, then `fps=30` in ffmpeg to get clean CFR output. 1080p renders ~15 fps in headless; 720p reaches ~28 fps — prefer 720p.
- The website's ambient audio track can be muxed into the export (`atrim` to the video length + `afade` out) since the animation itself is silent.
- Encode with `libx264 -crf 20 -movflags +faststart` and extract a poster frame with `-ss <t> -frames:v 1`.

**Why:** the first export attempt keyed capture off the first `stopRecording` call and produced a video that began and ended in the middle of the privacy scene.

**How to apply:** whenever a video artifact needs to ship as a real MP4/WebM file (website embeds, social media cuts, downloads). Re-run the recorder after any scene change so the hosted file doesn't go stale.
- The e2e testing browser (Playwright Chromium) lacks the proprietary H.264 codec: hosted MP4s show readyState 0 / never play there while working fine in real browsers. Assert dialog/src/controls behavior instead of currentTime.
