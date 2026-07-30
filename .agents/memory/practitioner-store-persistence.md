---
name: Practitioner store persistence
description: How practitioner portal data is persisted and its coupling to volatile portal accounts.
---
Practitioner portal data (patients, notes, prescriptions, slots, booking settings, bookings) is persisted as one JSONB document per account in the `practitioner_stores` Postgres table, hydrated into the in-memory Map before the API server listens. Rows are keyed by SHA-256 of the normalised account email — NOT the account id — because pilot portal accounts get fresh random ids each registration; the email hash reattaches a returning practitioner to their data.

**Why:** the pilot "zero-server" pattern kept everything in memory; a full-document upsert preserved the existing sync route handlers with minimal churn, and the email-hash key makes data survive even though accounts themselves are still volatile. Raw emails are never stored, only the hash.

**How to apply:** any new mutation of a practitioner store must call `persistPracStore(accountId)` (or `persistByKey`) afterwards, or the change silently dies on restart. Writes are serialized per account via a promise queue with snapshot-at-enqueue; `flushPracStores()` runs on SIGTERM/SIGINT. If portal accounts are ever persisted, keep the email-hash store key (or migrate carefully).
