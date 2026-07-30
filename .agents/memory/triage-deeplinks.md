---
name: Triage deep-link reset
description: How body-map → triage deep-links guarantee a fresh questionnaire state
---
Rule: navigation into the triage screen with `?pathway=` must always reinitialize (red flags, answers, step) — even when the pathway is the same as last time.
**Why:** expo-router keeps the tab screen mounted, so a repeated deep-link with identical params won't re-fire the effect; stale answers would persist in a clinical flow.
**How to apply:** senders append a fresh `ts=Date.now()` param and the triage effect depends on both `pathway` and `ts`. Any new entry point into triage must do the same.
