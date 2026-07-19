---
name: Emergency portal auth
description: Server-side auth model for the HIVE Emergency Portal relay endpoints
---

Portal auth must be enforced by the api-server, never by browser storage alone.

**Why:** Code review failed the first portal build because login/2FA lived only in sessionStorage while /emergency-share/claim and /caretaker-link/:code were open — any caller could bypass the UI, and anonymous demo access reached real patient shares.

**How to apply:** Any portal-sensitive read endpoint requires `Authorization: Bearer <sessionToken>` issued by the in-memory portal auth flow (register → password login → client WebAuthn → /portal/2fa token exchange). Demo sessions (`demo:true`) may only ever receive canned fictional data (demo codes HES-DEMO-2026 / HCL-DEMO-2026), never real shares. Signup must not create a session — full login is always required. Accounts/sessions are in-memory only (zero-server rule), so they reset on server restart.
