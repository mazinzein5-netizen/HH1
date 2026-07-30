---
name: Website video embed hover/audio pattern
description: How the marketing site's VideoEmbed pop-out scale and ambient audio are structured, and the pitfalls to avoid when touching them.
---

# Website video embed hover/audio pattern

The hub and surgical videos on the website are `VideoEmbed` iframes with hover/focus pop-out (scale 1.12) and click-to-expand lightbox (role=dialog, Escape/X close, ambient audio keeps playing while open) plus parent-page ambient audio. Ambient audio now fades IN on hover/focus (highlight) as well as while expanded, and fades out on leave/blur; iframes mount eagerly on page load (idle overlay just fades) so playback is instant. The Companion promo is different: it is a hosted MP4 export (`public/videos/`, native `<video controls poster>`, soundtrack muxed in) — see the video-export-pipeline memory. Re-export it if the promo artifact's scenes change.

**Rules:**
- The pop-out scale must live on an UNCLIPPED wrapper; rounded/overflow-hidden framing goes inside via the `frameClassName` prop. If a call site's card must keep clipping (e.g. the surgical browser-chrome card), pass `scaleOnHover={false}` and put `hover:scale-*` on the card itself.
- Audio plays in the PARENT page (`<audio>` in VideoEmbed, files in `public/audio/`), never inside the video iframes — browser autoplay policy blocks unmuted iframe audio. Hover tries `play()`; on rejection a "Tap for sound" button provides the required gesture.
- Any async `audio.play()` promise must re-check intent refs (`activeRef`/`soundOnRef`) on resolution, or rapid hover-off leaves audio playing.
- The promo video's 10s background clip runs at `playbackRate 0.8` (12.5s effective) and must exactly span scenes 1-3 durations (context+features+privacy = 12500ms). If scene durations change, keep that sum or the clip freezes/cuts visibly.

**Why:** all three embed call sites originally clipped the video frame with `overflow-hidden` wrappers, which silently swallowed the scale effect; and autoplay-with-sound is blocked until the user interacts with the page.

**How to apply:** whenever adding a new video embed to the website or re-pacing the promo video's scenes.
