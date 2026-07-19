---
name: Companion supervisor pattern
description: Safety-review layer convention for patient-facing AI replies in pilot mode.
---

Rule: patient-facing pilot AI endpoints run a second "supervisor" model call that reviews the draft reply against safety policy (no diagnosis, no dose changes, red-flag emergency escalation) and may revise it. If the supervisor call fails, serve the original reply with `supervised: false` — the mobile UI shows an amber "Safety check unavailable" indicator instead of blocking the conversation.

**Why:** Older patients in long voice sessions must never be left hanging on an infra failure, but unreviewed replies must be visibly flagged.

**How to apply:** Any new patient-facing AI reply path in pilot mode should reuse this review-then-flag pattern (see the companion endpoint on the api-server). The supervisor pass is also where conversation memory facts are extracted and returned to the client — memory persists only on-device (Zero-Server rule).
