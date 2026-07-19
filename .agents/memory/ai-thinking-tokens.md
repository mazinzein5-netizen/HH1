---
name: AI proxy thinking tokens
description: Reasoning tokens silently eat max_tokens on structured AI calls via the Replit AI proxy.
---

The chat model behind the Replit AI Integrations proxy spends internal reasoning tokens out of `max_tokens`. Small-budget structured calls (JSON verdicts, letters) come back truncated with a "[Wafer: response was truncated before the model finished its internal reasoning...]" message instead of content.

**Why:** hit this on the companion supervisor JSON pass and GP-letter drafting — both returned truncated output at max_tokens 500–700.

**How to apply:** for structured/deterministic outputs, pass `...({ chat_template_kwargs: { enable_thinking: false } } as object)` and/or raise `max_tokens` well above the expected output length. Conversational calls can keep reasoning enabled.
