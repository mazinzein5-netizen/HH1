---
name: Stripe checkout idempotency
description: How the membership card payment flow avoids duplicate charges on retry/timeout.
---

Rule: any retry of a card payment for the same membership choice must resolve to the SAME Stripe Checkout Session, never a new one.

**Why:** polling can time out after the user actually paid (network drop, app closed). A naive retry then creates a second subscription and charges twice. Architect review flagged this as a blocking correctness gap.

**How to apply:** two layers, both required:
- Server: pass an `idempotencyKey` derived from `(userId, reference, tier, billing, priceId)` to `stripe.checkout.sessions.create` — Stripe returns the same session for 24h.
- Client: persist the pending session (id + url) in AsyncStorage keyed by user; on retry, check its status first — if paid, activate without creating anything; if still open, reopen the same URL; only create a new session when none is pending or it expired. Clear on paid/expired.
