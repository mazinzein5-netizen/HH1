---
name: OpenAI access via Replit AI Integrations
description: How the api-server gets OpenAI access — managed proxy env vars, no user API key.
---

The project has no user-provided OPENAI_API_KEY secret. OpenAI access is provisioned
through the Replit AI Integrations proxy (`setupReplitAIIntegrations`, slug "openai"),
which sets `AI_INTEGRATIONS_OPENAI_BASE_URL` and `AI_INTEGRATIONS_OPENAI_API_KEY`
(a dummy key that only works together with the base URL).

**Why:** Provisioning can require a one-time user phone verification; once done it
succeeds on re-runs.

**How to apply:** If an AI route returns `AI_NOT_CONFIGURED`, re-run
`setupReplitAIIntegrations` rather than asking the user for an API key.
