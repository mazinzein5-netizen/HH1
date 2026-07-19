---
name: HIVE HUB professional membership
description: How the paid practitioner membership entitlement works and its invariants
---

- Entitlement lives server-side on PracStore.membership (optional field; absent = inactive via membershipOf()). Never trust a client boolean.
- Gated surfaces: practitioner settings PUT, slot add/delete, bookings GET, booking session POST (requireMembership middleware) AND patient-facing hiveBooking directory/slots/book via acceptingBookings(store) = membership active && bookingEnabled. Any new booking-related endpoint must use one of these two gates.
- Stripe: lookup keys `hive_pro_monthly` (€49) / `hive_pro_yearly` (€490); prices lazily seeded on first checkout. **Why:** avoids manual dashboard setup, but concurrent first checkouts could duplicate prices (known minor race).
- Confirm endpoint verifies session paid + metadata purpose=pro_membership + accountKey match; `devActivate` only when NODE_ENV!==production.
- Revocation: membership stores subscriptionId/customerId; reconcileMembership() lazily re-verifies the Stripe subscription (15 min TTL) on every gated access and on patient-facing directory/booking, deactivating on lapsed status (only active/trialing/past_due stay live). Stripe outages fail open. Dev-simulated records are force-revoked if ever seen in production.
- **How to apply:** unlocking new pro features → add to requireMembership-gated routes, not client checks; membership changes must persistPracStore.
