# Store Metadata Checklist — HIVE Intake : Patient Portal

Use this checklist when preparing the Apple App Store and Google Play submissions.
The store build ships in **clean mode only** (pilot mode is hidden and off by default).

## App identity

- [ ] **App name:** HIVE Intake : Patient Portal
- [ ] **Subtitle (Apple, 30 chars):** "Your health records, organised"
- [ ] **Short description (Google, 80 chars):** "Organise your health records, questionnaires and emergency card in one place."
- [ ] **Developer / company name:** IbnCeena Ltd.
- [ ] **Category:** Medical *or* Health & Fitness (prefer Health & Fitness if Medical category triggers extra review questions)

## Wording rules (applies to name, description, keywords, screenshots)

Never use these words anywhere in store metadata or screenshot captions:

- "Triage", "Diagnosis"/"Diagnose"/"Diagnostic", "Clinical assessment", "Clinical decision", "Symptom checker", "AI doctor", "Treatment recommendation", "Urgency", "Emergency detection"

Preferred vocabulary:

- "Health record organiser", "Standardised questionnaires", "GP visit preparation", "Guideline information viewer", "Emergency health card", "Medication list"

## Long description — approved framing

> HIVE Intake helps you keep your health information organised and ready to share with your GP.
> - Complete standardised, internationally recognised health questionnaires (ODI, mJOA, Oxford Hip & Knee) and bring the summary to your appointment.
> - Keep a private record of medications, conditions and allergies on your device.
> - Set up an emergency health card that first responders can access by QR code and PIN.
> - Look up plain-English information from public HSE and NICE health guidelines.
> HIVE Intake is not a medical device. It does not diagnose, treat, or provide medical advice. All personal data stays on your device.

## Keywords (Apple, 100 chars)

`health record,questionnaire,GP visit,medication list,emergency card,HSE,NICE,patient portal`

## Screenshots

- [ ] Only capture clean-mode screens (verify pilot mode is OFF before capturing).
- [ ] Captions use administrative wording only, e.g. "Organise your records", "Prepare for your GP visit", "Your emergency health card".
- [ ] Do not screenshot the red-flag screening step in a way that implies medical assessment; prefer dashboard, questionnaire list, summary, health card, settings.

## Apple medical-device / health questionnaire answers

- **Is the app a medical device?** No. It is an administrative organiser and public-guideline information viewer (MDCG 2019-11 non-device pathway: no diagnosis, no treatment recommendation, no individual risk calculation used for clinical decisions).
- **Does it provide diagnosis or treatment?** No. Questionnaire scores are shown with published score-band descriptions and a suggestion to discuss with a GP; no automated clinical sorting or urgency categories are produced.
- **Does it use HealthKit?** No (update if this changes).
- **Does it handle health data?** Yes, entered by the user and stored **only on the device**. No server-side storage of patient data.

## Privacy answers (both stores)

- [ ] Data collection: none transmitted to developer servers for storage; AI features send the text of the current request to the API for processing only.
- [ ] Privacy policy URL: host the in-app privacy policy text at a public URL before submission.
- [ ] Account deletion: in-app "Delete all my data" wipes all local data (Settings → Privacy & Data).
- [ ] GDPR: consent gate shown at first launch; consent recorded on-device.

## Pre-submission verification

- [ ] Fresh install shows consent gate + "Not a medical device" disclaimer before any content.
- [ ] Text search of the app bundle copy for "triage", "clinical", "diagnos" returns no user-visible strings in clean mode.
- [ ] HIVE Bot in clean mode refuses symptom assessment and shows the static "contact your GP or call 112" notice.
- [ ] Pilot activation (long-press version text + code) is undocumented in store metadata and off by default.
