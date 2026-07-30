---
name: Whop connector quirks
description: Non-obvious gotchas when authenticating to and calling Whop from this project.
---

# Whop connector quirks

- The Replit credential proxy can ignore the `connector_name` filter and return ALL connections. Always select the item by `connector_name === "whop"` — never trust `items[0]`.
  - **Why:** during setup the first item returned was the Stripe connection, which would silently authenticate against the wrong provider.
- `listConnections('whop')` in the code-execution sandbox returned 0 items even with a live connection; the raw proxy fetch worked. Fall back to a direct fetch when the sandbox helper comes back empty.
- `checkoutConfigurations.create` REJECTS `company_id` ("Cannot provide company_id for this configuration") — the API key is already company-scoped.
- The `@whop/sdk` param/response types are complete (plan_id variant, metadata, cursor pages) — no `as never` casts needed; if types seem to fight you, check the union variant, not the SDK.

**How to apply:** server code goes through `getWhopClient()` in the api-server; the mobile app only talks to `/api/whop/*` routes, which keep the same idempotency + pending-checkout resume contract the Stripe flow had.
