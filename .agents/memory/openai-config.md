---
name: OpenAI access via Replit AI Integrations
description: How the api-server gets OpenAI access — managed proxy env vars, no user API key.
---

The project has no user-provided OPENAI_API_KEY secret. OpenAI access is provisioned
through the Replit AI Integrations proxy (`setupReplitAIIntegrations`, slug "openai"),
which sets `AI_INTEGRATIONS_OPENAI_BASE_URL` and `AI_INTEGRATIONS_OPENAI_API_KEY`
(a dummy key that only works together with the base URL).

**Why:** Provisioning required user phone verification once (July 2026); after that it
succeeds. `getOpenAI()` in the api-server accepts either `OPENAI_API_KEY` or the
`AI_INTEGRATIONS_OPENAI_API_KEY` fallback.

**How to apply:** If an AI route returns `AI_NOT_CONFIGURED`, re-run
`setupReplitAIIntegrations` rather than asking the user for an API key.
