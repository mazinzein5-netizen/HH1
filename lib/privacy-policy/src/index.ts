export const PRIVACY_POLICY_APP_NAME = "HIVE Companion™ : Patient Portal";
export const PRIVACY_POLICY_COMPANY = "HIVE HEALTH ECOSYSTEM Ltd";
export const PRIVACY_POLICY_LAST_UPDATED = "July 2026";

export interface PrivacyPolicySection {
  heading: string;
  body: string;
}

export const PRIVACY_POLICY_SECTIONS: PrivacyPolicySection[] = [
  {
    heading: "Who we are",
    body:
      "HIVE Companion™ : Patient Portal is developed by HIVE HEALTH ECOSYSTEM Ltd This app is a personal health record organiser and health guideline information viewer.",
  },
  {
    heading: "Not a medical device",
    body:
      "This app is not a medical device. It is for information and administrative use only. It does not diagnose, treat, or make clinical decisions about any condition. Always consult a qualified healthcare professional about your health. If you are worried about your health, contact your GP or call 112 in an emergency.",
  },
  {
    heading: "Your data stays on your device",
    body:
      "All personal and health information you enter in this app — your profile, medication records, questionnaire responses, notes, and health card details — is stored only on this device. We do not upload, collect, or store your personal health data on any server.",
  },
  {
    heading: "What leaves your device",
    body:
      "If you use the HIVE Bot guideline assistant or the guided intake organiser, the text of your questions is sent to an AI service to generate a response. This text is not linked to your identity and is not stored by the app's servers. If you use the pharmacy finder or the GP practice finder, your coordinates or the search text you type (such as a practice name and town) are sent only to the OpenStreetMap lookup service to run the search — never to HIVE servers, and never any of your health information. If you ask the app to draft an appointment-request email to a GP practice, only the practice name and the short reason you typed are sent to the AI service to write the draft; the email is never sent for you — you review it and send it yourself from your own email app. Everything else stays on your device.",
  },
  {
    heading: "Sharing is always your choice",
    body:
      "The app only shares your information when you explicitly choose to — for example, when you use a Share button to send your health card or a questionnaire summary to your GP. Sharing uses your device's own share sheet, and you control the recipient.",
  },
  {
    heading: "Emergency & caretaker sharing",
    body:
      "If you generate an emergency share code, a snapshot of your allergies, conditions and current medications is held in the HIVE relay's memory only — never written to a database — and is deleted automatically when the time window you chose runs out, or immediately when you revoke it. If you opt into caretaker sharing (Red Geriatric Pack), your phone sends your latest location and vital-sign readings to the relay about once a minute; only the most recent update is kept, and everything is deleted the moment you stop sharing. Both features are strictly opt-in and start only after your explicit consent in the app.",
  },
  {
    heading: "Your rights (GDPR)",
    body:
      "Because your data lives on your device, you are always in control. You can view, edit, or delete your information at any time. The \"Delete all my data\" option in Settings permanently erases everything the app has stored on this device. There is no server copy to request or erase.",
  },
  {
    heading: "No tracking, no advertising",
    body:
      "This app does not use advertising, does not sell data, and does not track you across other apps or websites.",
  },
  {
    heading: "Contact",
    body:
      "For privacy questions, contact HIVE HEALTH ECOSYSTEM Ltd through the Help & Support section in Settings.",
  },
];
