---
name: expo-audio voice recording
description: Non-obvious expo-audio recorder config for metering-based silence detection
---

# expo-audio voice input

- **Rule:** Any feature reading `recorder.getStatus().metering` (e.g. silence
  auto-stop) must create the recorder with
  `useAudioRecorder({ ...RecordingPresets.HIGH_QUALITY, isMeteringEnabled: true })`.
- **Why:** The presets do NOT enable metering; it defaults to `false` on both
  iOS and Android, so `metering` stays undefined and any guard like
  `typeof level !== "number"` silently disables the feature. Typecheck and
  curl tests cannot catch this — it only shows on a device.
- **How to apply:** Whenever adding/refactoring native voice recording in the
  mobile app, spread `isMeteringEnabled: true` into the recorder options and
  keep the finite-number guard as a fallback, not as the primary path.

# AI proxy transcription

- The Replit AI proxy does NOT support `whisper-1`; use
  `gpt-4o-mini-transcribe` for `/audio/transcriptions` (verified by curl).
- Unauthenticated, per-call-cost endpoints (like transcription) need per-IP
  rate limiting and a route-scoped large JSON body limit — never raise the
  global express.json limit for one route.
