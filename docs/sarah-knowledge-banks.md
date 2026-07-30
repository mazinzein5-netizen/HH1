# Sarah Knowledge Data-Banks — Research & Recommendation

**Task:** T006 — Research/compare medical knowledge APIs and data banks that could give
Sarah (our conversational health companion) trustworthy, evidence-based knowledge, while
respecting the "Zero-Server" privacy model (no patient data leaves the device except the
minimal text Sarah needs to reason with).

**Bottom line up front:** Sarah does **not** need a live patient record store — she already
has that on the device. What she needs is a *reference* layer: authoritative medical facts
(drugs, guidelines, evidence) she can look things up in. The best fit is a small set of
**free, public, read-only reference APIs** (PubMed, openFDA, NICE, RxNorm) queried with
**non-identifying** terms only. Paid/gated "answer engine" APIs (OpenEvidence) are a possible
future upgrade but are enterprise-only and don't fit a self-serve, privacy-first build today.

---

## What "Zero-Server privacy fit" means here

For each option we ask three privacy questions:

1. **Does it require sending patient-identifying data?** (Bad — breaks Zero-Server.)
2. **Can it be queried with generic terms only** (a drug name, a symptom, a guideline topic)?
   (Good — no PII leaves the device.)
3. **Could the reference data be cached / bundled on-device** so lookups don't hit a server
   at all? (Best — fully offline-capable.)

A "good privacy fit" means we only ever send *de-identified reference queries* (e.g.
"ibuprofen interactions", "NICE knee pain guideline", "metformin side effects"), never the
user's name, records, or history.

---

## Comparison table

| Source | What it gives Sarah | Cost | Access / auth | Rate limits | Privacy fit (Zero-Server) |
|---|---|---|---|---|---|
| **PubMed / NLM E-utilities** | Search + retrieve biomedical literature & citations across 38 NCBI databases | **Free** | No key needed; free API key raises limits | 3 req/s (no key), 10 req/s (key), higher on request | **Good** — generic topic queries only; no PII required |
| **openFDA** | Drug labels, adverse events, recalls, device data (public FDA data) | **Free** | Free API key recommended | 1,000/day (no key); 240/min & 120k/day (key) | **Good** — public data, no PII; can query by drug name |
| **NICE Syndication API** | UK NICE clinical guidelines content + metadata | **Free in UK**; fees for international use (metadata free) | Application + licence required | Per licence terms | **Good for facts** — guideline lookups by topic; **UK-only free**, needs application. Best cached on-device |
| **RxNorm / RxNav API** | Normalised drug names, ingredients, RxClass, RxTerms | **Free** | No licence for core RxNorm API | ~20 req/s guidance; cache 12–24h | **Good** — drug-name normalisation, no PII |
| **RxNav Drug-Interaction API** | Structured drug–drug interactions | Was free | **⚠️ DISCONTINUED (~Jan 2024)** | n/a | Was good, but **no longer available** — do not build on it |
| **UMLS Metathesaurus** | Master terminology / concept mapping (SNOMED CT, ICD, etc.) | **Free** | UMLS licence + UTS account (per-individual; ~5 business-day approval; annual usage report) | Per UTS terms | **Good for facts**, but licensing overhead is per-person and reporting-heavy |
| **OpenPrescribing** | NHS prescribing spend/volume trends (population-level) | **Free** | No registration currently | Open | **Good but low clinical value** for Sarah — it's spend analytics, not clinical guidance |
| **OpenEvidence** | Evidence-backed clinical Q&A ("answer engine") | Clinician tier free (US, NPI-verified, ad-supported); **developer API = custom enterprise pricing** | **Gated** — enterprise order form; docs not public | Unknown (gated) | **Uncertain** — must send the clinical question; enterprise diligence needed; not self-serve |
| **Commercial DDI APIs** (e.g. DrugBank) | Curated drug-interaction datasets | Paid/commercial (many free tiers retired 2024–26) | Commercial contract | Per contract | Fact-only queries OK, but cost + contracts don't fit a privacy-first pilot |

---

## Plain-language read on each

- **PubMed / E-utilities** — The gold-standard free literature index. Great for "what does the
  evidence say" style lookups and for grounding Sarah's answers in real citations. No cost, no
  PII, generous limits. Downside: raw literature, not pre-digested guidance — needs summarising.

- **openFDA** — Excellent, free, no-PII source for **drug facts** (labels, side effects,
  warnings, recalls). Very easy to integrate. US-centric data, and "not validated for clinical
  use" disclaimer means it supports Sarah's *information* role, not diagnosis.

- **NICE Syndication** — The most directly useful for a **UK** product: it *is* the clinical
  guidance Sarah should reflect. Free in the UK, but requires a formal application/licence and
  international use has fees. Because content changes slowly, it's ideal to **syndicate and
  cache on-device**, which also makes it offline and maximally private.

- **RxNorm / RxNav** — Free, no-licence drug-name normalisation. Very useful as the "spine"
  that maps whatever a user types ("Nurofen", "ibuprofen 400") to a canonical drug so other
  lookups work. **But** the free structured **drug-interaction** API it used to offer was
  **discontinued in 2024** — a real gap.

- **UMLS** — Powerful terminology backbone but the per-individual licence + annual reporting is
  friction for a small team; only worth it if we need heavy concept mapping across vocabularies.

- **OpenPrescribing** — Interesting for population/NHS spend analytics, not for helping an
  individual user; low priority for Sarah.

- **OpenEvidence** — The closest thing to "Sarah in a box" (evidence-backed answers), but the
  developer API is **gated, enterprise-priced, and undocumented publicly**. Free access is only
  for NPI-verified US clinicians on an ad-supported product. Treat as a **future enterprise
  track**, not a build-now dependency.

- **Drug-interaction gap** — Since RxNav's free DDI API shut down and several free checkers
  retired (2024–2026), there is **no strong free structured DDI API** right now. Options are
  commercial (DrugBank etc.) or deriving interaction warnings from openFDA labels (coarser).

---

## Recommendation for Sarah

**Adopt a tiered, privacy-first reference layer:**

1. **Core (build now, free, no-PII):**
   - **openFDA** for drug facts/side-effects/warnings (free key).
   - **PubMed E-utilities** for evidence grounding + citations (free key).
   - **RxNorm/RxNav** for drug-name normalisation feeding the above.

   All three are free, need no patient data, and can be queried with generic terms — a clean
   Zero-Server fit. Only the minimal reference term (drug/topic) leaves the device.

2. **UK guidance (apply in parallel):**
   - **NICE Syndication** — apply for the free UK licence and **cache guideline content on the
     device**. This gives Sarah authoritative UK guidance offline, the strongest privacy posture.

3. **Drug interactions (mind the gap):**
   - No good free structured API today. Short-term: derive interaction cautions from **openFDA
     labels**. Medium-term: evaluate a **commercial DDI API** (e.g. DrugBank) if interaction
     checking becomes a core feature.

4. **Future / enterprise:**
   - **OpenEvidence** as an "evidence answer engine" upgrade — pursue via enterprise diligence
     once there's product/commercial justification.
   - **UMLS** only if we need cross-vocabulary concept mapping at scale.

**Privacy design rule:** Sarah's tool layer should send *only de-identified reference queries*
to these APIs (drug name, symptom, guideline topic) — never the user's records, name, or
history. Where possible (NICE especially), bundle/cache the reference data on-device so lookups
are offline and nothing leaves the phone at all.

---

*Sources: eesel AI OpenEvidence 2026 guide; NCBI E-utilities docs; openFDA API docs;
NICE syndication service guide; RxNav/RxNorm API docs (incl. DDI discontinuation notice);
NLM UMLS licensing page; OpenPrescribing FAQs; 2026 DDI API landscape reviews.*
