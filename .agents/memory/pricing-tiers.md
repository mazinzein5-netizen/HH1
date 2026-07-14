---
name: Pricing tiers (Blue/Gold)
description: Durable decisions behind the Blue/Gold membership model and monthly entitlements — keep future work consistent with these.
---

# Blue/Gold pricing decisions

- Blue Card = no membership record; a Gold membership record (any status, including "pending") grants Gold entitlements.
  **Why:** payments settle out-of-band at HIVE nodes (Zero-Server, no in-app payment processing), so "pending" is the normal paid state during the pilot.
  **How to apply:** never gate Gold benefits on `status === "active"` unless the product decision changes.
- Usage counters are per-user, per-calendar-month AsyncStorage keys; they reset implicitly on month rollover. Old month keys are left behind intentionally (tiny, on-device only).
- Pain-complaint usage is recorded at intake START, not completion.
  **Why:** AI cost is incurred at start; counting at completion would allow unlimited free runs via abandonment.
- Cancelled interpreter bookings do NOT refund the free-session allowance (accepted pilot behavior).
- Blue trial expiry is copy-only: Blue benefits continue forever after the trial banner flips; no enforcement. Confirm with the user before ever hard-locking Blue accounts.
- Legacy plans (essential/plus/family) are normalized to gold/monthly on read only, never persisted back.
- Web (react-native-web) note: Alert.alert buttons don't fire on web — use window.confirm for destructive confirms (e.g. downgrade).
