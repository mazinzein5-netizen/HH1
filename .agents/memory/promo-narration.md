---
name: Promo narration & captions
description: How voiceover and burned-in captions work in the promo video artifact
---
- Narration is one TTS mp3 per scene in `public/audio/vo_<sceneKey>.mp3`; each clip must be shorter than its scene slot. Fit clips by ffmpeg silence-trim + `atempo`; regenerate with shorter text if tempo would exceed ~1.15x (sounds rushed).
- **Why:** scene durations are fixed by the background clip alignment (0.8x clip spans scenes 1-3), so audio must adapt to scenes, not vice versa.
- Unmuted audio autoplay is usually blocked; template attempts once, then falls back to a sound toggle button. Captions are burned in and always visible so the video works with sound off.
- Caption/narration wording must follow the store-safe vocabulary in docs/store-metadata-checklist.md (no triage/diagnosis/clinical terms).
- **How to apply:** if scene text or durations change, re-check clip lengths and regenerate the matching vo_*.mp3.
