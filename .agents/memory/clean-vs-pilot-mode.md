---
name: Clean vs pilot mode gating
description: Store-compliance rule — how clean/pilot behavior must be gated and worded across mobile + API.
---

# Clean vs pilot mode gating

**Rule:** The store build must never show clinical/triage behavior or wording. Any feature with clinical output must be gated on pilot mode end-to-end: mobile checks `useAppMode().pilotMode`, and the API must derive pilot behavior from the pilot access code sent in the request (validated against `PILOT_ACCESS_CODE` env) — never from a bare client boolean.

**Why:** Task #-era code review flagged trusting a client-supplied `pilotMode: true` as a material access-control flaw for the regulated clean/pilot separation; also Apple/Google review will reject clinical-decision wording.

**How to apply:**
- New pilot features: check `pilotMode` on mobile AND validate the pilot code server-side; clean mode gets neutral, administrative wording or nothing.
- Clean-mode UI copy must avoid: Triage, Diagnos*, Clinical Assessment, Red Flag, Referral, urgency categories. Approved vocabulary and store-submission wording live in `docs/store-metadata-checklist.md`.
- Server AI replies in clean mode are sanitized (red-flag prefixes stripped) as a guardrail — keep that pattern for any new AI route.
