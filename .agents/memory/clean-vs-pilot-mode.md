---
name: Clean vs pilot mode gating
description: Store-compliance rule — how clean/pilot behavior must be gated and worded across mobile + API.
---

# Clean vs pilot mode gating

**Rule:** The store build must never show clinical/triage behavior or wording. Any feature with clinical output must be gated on pilot mode. Note the current reality: the mobile app validates the pilot code CLIENT-side (AppModeContext compares against a local constant and persists a boolean) — that is a UI convenience only. Any SERVER behavior that differs for pilot must validate the pilot code server-side in the request; never trust a bare client `pilotMode: true` flag.

**Why:** Code review flagged trusting a client-supplied `pilotMode: true` as a material access-control flaw for the regulated clean/pilot separation; also Apple/Google review will reject clinical-decision wording.

**How to apply:**
- New pilot features: check `pilotMode` on mobile AND validate the pilot code server-side; clean mode gets neutral, administrative wording or nothing.
- Clean-mode UI copy must avoid: Triage, Diagnos*, Clinical Assessment, Red Flag, Referral, urgency categories. Approved vocabulary and store-submission wording live in `docs/store-metadata-checklist.md`.
- Server AI replies in clean mode are sanitized (red-flag prefixes stripped) as a guardrail — keep that pattern for any new AI route.
