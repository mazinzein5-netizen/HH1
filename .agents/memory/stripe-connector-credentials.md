---
name: Stripe connector credential proxy quirks
description: Correct query param and settings field names when fetching Stripe secrets from the Replit connectors proxy.
---

Rule: query the connectors proxy with `connector_name=stripe` (SINGULAR) and read the key from `settings.secret` (prefix `sk_test_`/`sk_live_`), not `settings.secret_key`.

**Why:** `connector_names=stripe` (plural) silently returns 0 items even when the connection is healthy — it looks exactly like "integration not connected" and wasted a long debugging session. Settings keys are `account_id`, `secret`, `publishable`, `mcp`, `claim_url`.

**How to apply:** any code hitting `https://$REPLIT_CONNECTORS_HOSTNAME/api/v2/connection?include_secrets=true&connector_name=stripe` with header `X_REPLIT_TOKEN: repl $REPL_IDENTITY`. If items come back empty, first try dropping the filter to see whether the param — not the connection — is the problem. Also: `stripe-replit-sync` `runMigrations({ databaseUrl })` must succeed before `findOrCreateManagedWebhook`, or you get `relation "stripe.accounts" does not exist`.
