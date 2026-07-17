# Giving Sarah a Bigger Medical Brain — Options Compared

Sarah already knows a lot through her AI model, but if you want her answers grounded in live, authoritative medical sources, we can connect her to an external "data bank". This document compares the realistic options in plain language.

## What we'd use it for
When a patient asks Sarah something like "is it safe to take ibuprofen with my blood thinner?" or "what usually happens after a knee questionnaire like mine?", Sarah could quietly check a trusted source before answering — rather than relying on the AI model alone.

## The options

### 1. openFDA (US Food & Drug Administration) — medicines and side effects
- **What it is:** Free, official database of medicine labels, warnings, side effects and recalls.
- **Cost:** Free. No sign-up needed for light use; a free key raises the limits.
- **Strengths:** Excellent for drug questions — interactions, warnings, dosing wording straight from official labels. Very reliable and always up to date.
- **Weaknesses:** US-centric — brand names and some rules differ from Ireland/UK, so wording needs care ("in the US label…").
- **Fit for HIVE:** ⭐⭐⭐⭐ Best first choice for medication safety questions.

### 2. NHS Website Content API (UK) — plain-language health information
- **What it is:** The official NHS library of condition pages, symptoms and treatment explanations, written for patients.
- **Cost:** Free for reasonable use, but requires registration and acceptance of NHS terms (attribution required).
- **Strengths:** Already in plain patient-friendly English, UK healthcare context (very close to Irish practice), highly trusted brand.
- **Weaknesses:** Sign-up and approval process; content must be shown with attribution; not a drug-interaction engine.
- **Fit for HIVE:** ⭐⭐⭐⭐⭐ The best match for patient-facing explanations, if approved access is granted.

### 3. PubMed / NCBI (US National Library of Medicine) — research papers
- **What it is:** Free access to summaries of nearly all published medical research.
- **Cost:** Free.
- **Strengths:** The deepest source of evidence; great for "what does the research say" questions.
- **Weaknesses:** Written for clinicians, not patients — Sarah would need to translate heavily; abstracts can be contradictory and confusing without expert judgement.
- **Fit for HIVE:** ⭐⭐ Good for a future "clinician mode", less suitable for patient chat.

### 4. NICE Syndication API (UK guidelines)
- **What it is:** Machine-readable access to official UK clinical guidelines (the same ones GPs follow), including referral timeframes.
- **Cost:** Free for UK-facing non-commercial use, but requires a licence application; commercial use is negotiated.
- **Strengths:** Exactly the guideline knowledge Sarah references today, from the source; includes concrete timeframes for referrals.
- **Weaknesses:** Licensing paperwork; content is clinician-oriented; Ireland technically follows HSE guidance (which has no public API).
- **Fit for HIVE:** ⭐⭐⭐⭐ Strong option for the pilot's clinical-guidance side, pending licence.

### 5. RxNorm / NLM Drug Interaction sources
- **What it is:** US National Library of Medicine's medicine-naming system, useful for reliably matching medicine names patients type.
- **Cost:** Free.
- **Strengths:** Solves the "same drug, many names" problem; pairs well with openFDA.
- **Weaknesses:** The NLM's dedicated interaction API was retired — interactions now need openFDA labels or a commercial source.
- **Fit for HIVE:** ⭐⭐⭐ A helpful companion piece, not a standalone answer.

### 6. Commercial medical knowledge bases (UpToDate, BMJ Best Practice, First Databank)
- **What it is:** Paid, professionally curated clinical knowledge used by hospitals.
- **Cost:** Significant — typically negotiated licences (thousands per year and up).
- **Strengths:** Gold-standard accuracy, medico-legally defensible, includes true interaction checking.
- **Weaknesses:** Cost, contracts, and most don't allow feeding content through an AI chatbot without a special licence.
- **Fit for HIVE:** ⭐⭐ Right answer for a regulated medical device later — overkill for the pilot.

## Recommendation
1. **Start free:** openFDA (medicines) + NHS Content API (patient explanations). Both fit the Zero-Server rule — the app's server fetches only general knowledge; no patient data is ever sent to these services beyond the medicine or topic name.
2. **Apply for NICE syndication** in parallel for guideline timeframes in pilot mode.
3. **Revisit commercial sources** only if HIVE moves toward medical-device certification.

**Privacy note:** whichever source is chosen, only the *question topic* (e.g. a medicine name) would be looked up — never the patient's identity, records, or conversation. Any such lookup would also be disclosed in the app's privacy policy, consent screen and About page, as with the existing third-party lookups.
