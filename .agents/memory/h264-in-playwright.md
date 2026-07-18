---
name: H.264 video in Playwright tests
description: Playwright Chromium can't decode H.264 MP4s; how to still e2e-test video autoplay/attention logic.
---

Playwright's bundled Chromium lacks proprietary codecs, so `play()` on an H.264 MP4 rejects with `NotSupportedError: The element has no supported sources` even though the server serves it fine (206, video/mp4). This is an environment limitation, not a site bug — real Chrome/Safari play it.

**How to apply:** to e2e-test IntersectionObserver/autoplay/pause logic, generate a tiny VP9 webm with ffmpeg into the site's public dir, have the test swap `video.src` to it on the SAME element (listeners/observers are element-bound, source-agnostic), then delete the temp file after.

Also: the testing subagent often omits diagnostic values from success reports — phrase verify steps so failure requires quoting the JSON, or make quoting the values the assertion itself.
