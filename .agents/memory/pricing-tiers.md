---
name: Pricing tiers (Blue/Gold/Red)
description: Durable decisions behind the Blue/Gold/Red membership model and monthly entitlements — keep future work consistent with these.
---

# Blue/Gold/Red pricing decisions

- Tiers: Blue Card (free, 2 pain complaints/mo), Gold Card (€90/mo or €700/yr; 30 complaints, 3 consultations, 3 interpreter), Red Geriatric Safety Pack (unlimited complaints, 10 HIVE Doc consultations, 3 interpreter; other consultations at "partner price").
- Red price is a PLACEHOLDER: €150/mo, €1,200/yr. The user never confirmed it (prompt failed twice). Confirm before launch and update TIER_PRICING plus any copy/tests asserting these amounts.
- Blue Card = no membership record; a paid membership record (Gold or Red, any status, including "pending") grants that tier's entitlements.
  **Why:** payments settle out-of-band at HIVE nodes (Zero-Server, no in-app payment processing), so "pending" is the normal paid state during the pilot.
  **How to apply:** never gate paid benefits on `status === "active"` unless the product decision changes.
- Unlimited entitlements are modeled as `Infinity` in plan limits. Any UI that renders a limit or remaining count must guard with `Number.isFinite` (or the isUnlimited helper) or it will print "Infinity" to users.
- Coverage checks must be `tier !== "blue" && remaining > 0`, never `tier === "gold"` — that pattern silently excludes Red.
- Overage wording differs per tier: Gold overages at "standard rate", Red at "partner price" (OVERAGE_LABEL centralizes this).
- Usage counters are per-user, per-calendar-month AsyncStorage keys; they reset implicitly on month rollover. Old month keys are left behind intentionally (tiny, on-device only).
- Pain-complaint usage is recorded at intake START, not completion.
  **Why:** AI cost is incurred at start; counting at completion would allow unlimited free runs via abandonment.
- Cancelled interpreter bookings do NOT refund the free-session allowance (accepted pilot behavior).
- Blue trial expiry is copy-only: Blue benefits continue forever after the trial banner flips; no enforcement. Confirm with the user before ever hard-locking Blue accounts.
- Legacy plans (essential/plus/family) are normalized to gold/monthly on read only, never persisted back.
- Member QR codes (HHC-XXXX-XXXX) are non-secret check-in identifiers, per-user, regenerable; staff match them against verified identity. QR payload holds name + tier only, no medical data. Guests get no QR card.
- Web (react-native-web) note: Alert.alert buttons don't fire on web — use window.confirm for destructive confirms (e.g. downgrade, QR regenerate).
