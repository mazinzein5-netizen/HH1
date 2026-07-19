---
name: Sarah companion architecture
description: How the Sarah (ex-Queen B) companion routes intents, gates the GP letter, and handles mic consent.
---
- "Show my prescriptions/appointments/etc." requests are answered by an on-device regex intent layer (companionTools) with cards + deep links — never sent to the AI. Keep new personal-data lookups there (Zero-Server).
- **Why:** personal records must not leave the device; AI only gets a compact non-identifying appContext string.
- GP-letter drafting is pilot-gated server-side (pilotCode) and always consent-gated in UI: offer banner → draft → review modal → user shares manually. Never auto-send.
- Mic permission + transcription disclosure are granted once at first-launch consent (ConsentGate sets @hive_voice_disclosure_v1); useVoiceInput keeps a fallback prompt but must never re-prompt after consent.
- AsyncStorage keys still use the legacy queenb_* prefix on purpose (backward compat) despite the Sarah rename.
