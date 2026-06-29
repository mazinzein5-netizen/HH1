export type PathwayKey = "lumbar" | "cervical" | "hip" | "knee";

export interface ClinicalQuestion {
  text: string;
  options: string[];
  scores: number[];
}

export interface ScoreResult {
  label: string;
  color: string;
  recommendation: string;
  referral: string;
}

export interface PathwayConfig {
  key: PathwayKey;
  name: string;
  subtitle: string;
  scoreTool: string;
  toolDescription: string;
  maxScore: number;
  higherIsBetter: boolean;
  questions: ClinicalQuestion[];
  getResult: (total: number) => ScoreResult;
  formatScore: (total: number) => string;
}

export const RED_FLAG_QUESTIONS = [
  "Severe unremitting night pain not relieved by position change?",
  "Fever, night sweats, or unexplained weight loss?",
  "History of cancer (any type)?",
  "Progressive neurological weakness in arms or legs?",
  "Bladder or bowel dysfunction (incontinence or retention)?",
  "Recent significant trauma or injury?",
  "Long-term oral corticosteroid or IV drug use?",
  "Pain onset before age 20 or new-onset pain after age 55?",
];

const ODI_QUESTIONS: ClinicalQuestion[] = [
  {
    text: "1. Pain Intensity — How would you describe your back pain right now?",
    options: ["No pain at the moment", "Very mild pain", "Moderate pain", "Fairly severe pain", "Very severe pain", "Worst imaginable pain"],
    scores: [0, 1, 2, 3, 4, 5],
  },
  {
    text: "2. Personal Care — Can you manage washing, dressing, etc. without extra pain?",
    options: ["Normal, no extra pain", "Normal but very painful", "Slow and careful — painful", "Need some help with self-care", "Need daily help with most aspects", "Unable to dress — remain in bed"],
    scores: [0, 1, 2, 3, 4, 5],
  },
  {
    text: "3. Lifting — How does lifting affect your back pain?",
    options: ["Lift heavy weights without extra pain", "Lift heavy weights — causes extra pain", "Lift heavy from table but not floor", "Lift light to medium weights from table", "Can only lift very light weights", "Cannot lift or carry anything"],
    scores: [0, 1, 2, 3, 4, 5],
  },
  {
    text: "4. Walking — How far can you walk before back pain stops you?",
    options: ["Any distance — pain does not limit me", "More than 1 mile", "½ to 1 mile", "Less than 100 yards", "Only with stick or crutches", "Mostly bed-bound, crawl to toilet"],
    scores: [0, 1, 2, 3, 4, 5],
  },
  {
    text: "5. Sitting — How long can you sit in a chair because of back pain?",
    options: ["Any chair as long as I like", "Favourite chair only, as long as I like", "Sitting limited to less than 1 hour", "Sitting limited to less than 30 minutes", "Sitting limited to less than 10 minutes", "Pain prevents me sitting at all"],
    scores: [0, 1, 2, 3, 4, 5],
  },
  {
    text: "6. Standing — How long can you stand because of back pain?",
    options: ["Stand as long as I want without extra pain", "Stand as long as I want — causes extra pain", "Limited to standing less than 1 hour", "Limited to standing less than 30 minutes", "Limited to standing less than 10 minutes", "Pain prevents me from standing at all"],
    scores: [0, 1, 2, 3, 4, 5],
  },
  {
    text: "7. Sleeping — Is your sleep disturbed by back pain?",
    options: ["Sleep never disturbed by pain", "Sleep occasionally disturbed", "Less than 6 hours due to pain", "Less than 4 hours due to pain", "Less than 2 hours due to pain", "Pain prevents all sleep"],
    scores: [0, 1, 2, 3, 4, 5],
  },
  {
    text: "8. Social Life — Has back pain affected your social life?",
    options: ["Normal social life, no extra pain", "Normal social life but pain increases", "Limits energetic activities (e.g. sport)", "Pain restricts social life — go out less", "Pain restricts me to home", "No social life due to pain"],
    scores: [0, 1, 2, 3, 4, 5],
  },
  {
    text: "9. Travelling — How does back pain affect travelling?",
    options: ["Can travel anywhere without pain", "Can travel anywhere — causes extra pain", "Manage journeys over 2 hours despite pain", "Restricted to journeys under 1 hour", "Restricted to short journeys under 30 min", "Pain prevents all travel except for treatment"],
    scores: [0, 1, 2, 3, 4, 5],
  },
  {
    text: "10. Changing Degree of Pain — How would you describe the change in your back pain over the past month?",
    options: ["Rapidly improving", "Slowly improving", "No change", "Slowly worsening", "Rapidly worsening", "Worst it has ever been"],
    scores: [0, 1, 2, 3, 4, 5],
  },
];

const MJOA_QUESTIONS: ClinicalQuestion[] = [
  {
    text: "1. Upper Extremity Motor Function — Rate your hand and arm movement ability.",
    options: [
      "Normal — full dexterity (score 4)",
      "Mild clumsiness but independent with all tasks (score 3)",
      "Difficulty with fine finger tasks (writing, buttons) (score 2)",
      "Grip present but unable to use utensils normally (score 1)",
      "Cannot move hands at all (score 0)",
    ],
    scores: [4, 3, 2, 1, 0],
  },
  {
    text: "2. Lower Extremity Motor Function — Rate your walking and leg function.",
    options: [
      "Normal walking and stair climbing (score 4)",
      "Walks independently but difficulty on stairs (score 3)",
      "Needs support/stick for flat walking (score 2)",
      "Can stand, unable to walk without full assistance (score 1)",
      "Complete motor and sensory loss in legs (score 0)",
    ],
    scores: [4, 3, 2, 1, 0],
  },
  {
    text: "3. Upper Extremity Sensory — Describe sensation in your hands and arms.",
    options: [
      "Normal sensation (score 3)",
      "Mild numbness or tingling (score 2)",
      "Severe numbness, burning, or significant pain (score 1)",
      "Complete loss of sensation (score 0)",
    ],
    scores: [3, 2, 1, 0],
  },
  {
    text: "4. Lower Extremity & Trunk Sensory — Describe sensation in your legs and body.",
    options: [
      "Normal sensation (score 3)",
      "Mild numbness or tingling in legs (score 2)",
      "Severe sensory loss in legs (score 1)",
      "Complete loss of sensation in legs (score 0)",
    ],
    scores: [3, 2, 1, 0],
  },
  {
    text: "5. Bladder Function — Rate your urinary control.",
    options: [
      "Normal bladder function (score 3)",
      "Mild hesitancy, urgency, or frequency (score 2)",
      "Severe difficulty — dribbling or retention episodes (score 1)",
      "Complete urinary retention — catheter required (score 0)",
    ],
    scores: [3, 2, 1, 0],
  },
];

const OHS_QUESTIONS: ClinicalQuestion[] = [
  {
    text: "1. How would you describe the pain you usually have from your hip?",
    options: ["None", "Very mild", "Mild", "Moderate", "Severe"],
    scores: [4, 3, 2, 1, 0],
  },
  {
    text: "2. Have you had any trouble washing and drying yourself because of your hip?",
    options: ["No trouble at all", "Very little trouble", "Moderate trouble", "Extreme difficulty", "Impossible to do"],
    scores: [4, 3, 2, 1, 0],
  },
  {
    text: "3. Have you had any difficulty getting in and out of a car or public transport because of your hip?",
    options: ["No difficulty at all", "Very little difficulty", "Moderate difficulty", "Extreme difficulty", "Impossible / Not attempted"],
    scores: [4, 3, 2, 1, 0],
  },
  {
    text: "4. For how long are you able to walk before pain from your hip becomes severe?",
    options: ["No pain / >30 minutes", "16–30 minutes", "5–15 minutes", "Around the house only", "Not at all — pain too severe"],
    scores: [4, 3, 2, 1, 0],
  },
  {
    text: "5. After a meal, how painful has it been for you to stand up from a chair because of your hip?",
    options: ["Not at all painful", "Slightly painful", "Moderately painful", "Very painful", "Unbearable"],
    scores: [4, 3, 2, 1, 0],
  },
  {
    text: "6. Have you been limping when walking because of your hip?",
    options: ["Rarely or never", "Sometimes or just at first", "Often — not just at first", "Most of the time", "All of the time"],
    scores: [4, 3, 2, 1, 0],
  },
  {
    text: "7. Could you kneel down and get back up again afterwards because of your hip?",
    options: ["Yes, easily", "With little difficulty", "With moderate difficulty", "With extreme difficulty", "No — impossible"],
    scores: [4, 3, 2, 1, 0],
  },
  {
    text: "8. Have you been troubled by pain from your hip in bed at night?",
    options: ["No nights at all", "Only 1 or 2 nights", "Some nights", "Most nights", "Every night"],
    scores: [4, 3, 2, 1, 0],
  },
  {
    text: "9. How much has pain from your hip interfered with your usual work (including housework)?",
    options: ["Not at all", "A little bit", "Moderately", "Greatly", "Totally"],
    scores: [4, 3, 2, 1, 0],
  },
  {
    text: "10. Have you felt that your hip might suddenly 'give way' or let you down?",
    options: ["Rarely or never", "Sometimes", "Often", "Most of the time", "All of the time"],
    scores: [4, 3, 2, 1, 0],
  },
  {
    text: "11. Are you able to do the household shopping on your own because of your hip?",
    options: ["Yes, easily", "With little difficulty", "With moderate difficulty", "With extreme difficulty", "No — impossible"],
    scores: [4, 3, 2, 1, 0],
  },
  {
    text: "12. Could you walk down one or two flights of stairs?",
    options: ["Yes, easily", "With little difficulty", "With moderate difficulty", "With extreme difficulty", "No — impossible"],
    scores: [4, 3, 2, 1, 0],
  },
];

const OKS_QUESTIONS: ClinicalQuestion[] = [
  {
    text: "1. How would you describe the pain you usually have from your knee?",
    options: ["None", "Very mild", "Mild", "Moderate", "Severe"],
    scores: [4, 3, 2, 1, 0],
  },
  {
    text: "2. Have you had any trouble washing and drying yourself because of your knee?",
    options: ["No trouble at all", "Very little trouble", "Moderate trouble", "Extreme difficulty", "Impossible to do"],
    scores: [4, 3, 2, 1, 0],
  },
  {
    text: "3. Have you had any difficulty getting in and out of a car or public transport because of your knee?",
    options: ["No difficulty at all", "Very little difficulty", "Moderate difficulty", "Extreme difficulty", "Impossible / Not attempted"],
    scores: [4, 3, 2, 1, 0],
  },
  {
    text: "4. For how long are you able to walk before pain from your knee becomes severe?",
    options: ["No pain / >30 minutes", "16–30 minutes", "5–15 minutes", "Around the house only", "Not at all — pain too severe"],
    scores: [4, 3, 2, 1, 0],
  },
  {
    text: "5. After a meal, how painful has it been for you to stand up from a chair because of your knee?",
    options: ["Not at all painful", "Slightly painful", "Moderately painful", "Very painful", "Unbearable"],
    scores: [4, 3, 2, 1, 0],
  },
  {
    text: "6. Have you been limping when walking because of your knee?",
    options: ["Rarely or never", "Sometimes or just at first", "Often — not just at first", "Most of the time", "All of the time"],
    scores: [4, 3, 2, 1, 0],
  },
  {
    text: "7. Could you kneel down and get back up again afterwards because of your knee?",
    options: ["Yes, easily", "With little difficulty", "With moderate difficulty", "With extreme difficulty", "No — impossible"],
    scores: [4, 3, 2, 1, 0],
  },
  {
    text: "8. Have you been troubled by pain from your knee in bed at night?",
    options: ["No nights at all", "Only 1 or 2 nights", "Some nights", "Most nights", "Every night"],
    scores: [4, 3, 2, 1, 0],
  },
  {
    text: "9. How much has pain from your knee interfered with your usual work (including housework)?",
    options: ["Not at all", "A little bit", "Moderately", "Greatly", "Totally"],
    scores: [4, 3, 2, 1, 0],
  },
  {
    text: "10. Have you felt that your knee might suddenly 'give way' or let you down?",
    options: ["Rarely or never", "Sometimes", "Often", "Most of the time", "All of the time"],
    scores: [4, 3, 2, 1, 0],
  },
  {
    text: "11. Could you do the household shopping on your own because of your knee?",
    options: ["Yes, easily", "With little difficulty", "With moderate difficulty", "With extreme difficulty", "No — impossible"],
    scores: [4, 3, 2, 1, 0],
  },
  {
    text: "12. Could you walk down one or two flights of stairs?",
    options: ["Yes, easily", "With little difficulty", "With moderate difficulty", "With extreme difficulty", "No — impossible"],
    scores: [4, 3, 2, 1, 0],
  },
];

export const PATHWAYS: PathwayConfig[] = [
  {
    key: "lumbar",
    name: "Lumbar Spine",
    subtitle: "Low Back Pain",
    scoreTool: "Oswestry Disability Index (ODI)",
    toolDescription: "10-section NICE-validated outcome measure for lumbar spine disorders",
    maxScore: 50,
    higherIsBetter: false,
    questions: ODI_QUESTIONS,
    formatScore: (total) => `${Math.round((total / 50) * 100)}% disability`,
    getResult: (total) => {
      const pct = Math.round((total / 50) * 100);
      if (pct <= 20) return { label: "Minimal Disability", color: "#22c55e", recommendation: "Self-management with exercise programme. GP review if no improvement in 6 weeks. Physiotherapy referral optional.", referral: "Physiotherapy (optional)" };
      if (pct <= 40) return { label: "Moderate Disability", color: "#f59e0b", recommendation: "GP referral for physiotherapy. Consider NSAIDs, activity modification. Review in 4–6 weeks.", referral: "Physiotherapy (urgent)" };
      if (pct <= 60) return { label: "Severe Disability", color: "#f97316", recommendation: "Urgent GP referral. Physiotherapy plus consider investigation (MRI if red flags). Pain specialist review.", referral: "GP + Physiotherapy (urgent)" };
      if (pct <= 80) return { label: "Crippling Back Pain", color: "#ef4444", recommendation: "Urgent orthopaedic or spinal surgery referral. MRI spine required. Multidisciplinary pain team input.", referral: "Orthopaedic/Spinal Clinic (urgent)" };
      return { label: "Bed-Bound / Severe", color: "#dc2626", recommendation: "IMMEDIATE emergency or urgent hospital assessment. Rule out cauda equina syndrome.", referral: "Emergency Department (immediate)" };
    },
  },
  {
    key: "cervical",
    name: "Cervical Spine",
    subtitle: "Neck & Upper Limb Pain",
    scoreTool: "Modified Japanese Orthopaedic Association (mJOA)",
    toolDescription: "5-domain grading scale for cervical myelopathy severity (max 17)",
    maxScore: 17,
    higherIsBetter: true,
    questions: MJOA_QUESTIONS,
    formatScore: (total) => `${total}/17 mJOA`,
    getResult: (total) => {
      if (total >= 15) return { label: "Mild Myelopathy", color: "#22c55e", recommendation: "Conservative management. Physiotherapy, cervical collar if indicated. MRI cervical spine. Review in 3 months.", referral: "Neurology / Physiotherapy" };
      if (total >= 12) return { label: "Moderate Myelopathy", color: "#f59e0b", recommendation: "Urgent neurosurgical assessment. MRI spine required. High risk of progression — early intervention may prevent deterioration.", referral: "Neurosurgery (urgent)" };
      return { label: "Severe Myelopathy", color: "#ef4444", recommendation: "URGENT neurosurgical referral. MRI spine immediately. Surgical decompression likely required to prevent permanent disability.", referral: "Neurosurgery (emergency)" };
    },
  },
  {
    key: "hip",
    name: "Hip Joint",
    subtitle: "Hip & Groin Pain",
    scoreTool: "Oxford Hip Score (OHS)",
    toolDescription: "12-item NICE-validated patient-reported outcome for hip arthroplasty (max 48)",
    maxScore: 48,
    higherIsBetter: true,
    questions: OHS_QUESTIONS,
    formatScore: (total) => `${total}/48 OHS`,
    getResult: (total) => {
      if (total >= 40) return { label: "Satisfactory — Minimal Arthritis", color: "#22c55e", recommendation: "Conservative management. Weight management, physiotherapy, NSAIDs as needed. Annual review.", referral: "Physiotherapy" };
      if (total >= 30) return { label: "Moderate Dysfunction", color: "#f59e0b", recommendation: "GP referral. Physiotherapy programme, analgesia optimisation. Consider X-ray hip. Review in 3 months.", referral: "Physiotherapy + GP" };
      if (total >= 20) return { label: "Moderate-Severe Arthritis", color: "#f97316", recommendation: "Orthopaedic outpatient referral. Weight-bearing X-ray. Joint injection or physiotherapy as bridge to surgery assessment.", referral: "Orthopaedics (routine)" };
      return { label: "Severe Arthritis — Surgery Threshold", color: "#ef4444", recommendation: "Orthopaedic referral for consideration of total hip replacement. Anaesthetic assessment, pre-op bloods, bone density.", referral: "Orthopaedics (urgent) — THR assessment" };
    },
  },
  {
    key: "knee",
    name: "Knee Joint",
    subtitle: "Knee Pain & Function",
    scoreTool: "Oxford Knee Score (OKS)",
    toolDescription: "12-item NICE-validated patient-reported outcome for knee arthroplasty (max 48)",
    maxScore: 48,
    higherIsBetter: true,
    questions: OKS_QUESTIONS,
    formatScore: (total) => `${total}/48 OKS`,
    getResult: (total) => {
      if (total >= 40) return { label: "Satisfactory — Minimal Arthritis", color: "#22c55e", recommendation: "Conservative management. Exercise programme, weight loss if indicated, NSAIDs as needed.", referral: "Physiotherapy" };
      if (total >= 30) return { label: "Moderate Dysfunction", color: "#f59e0b", recommendation: "GP referral. Physiotherapy, analgesia optimisation, consider X-ray knee (weight-bearing AP + lateral).", referral: "Physiotherapy + GP" };
      if (total >= 20) return { label: "Moderate-Severe Arthritis", color: "#f97316", recommendation: "Orthopaedic outpatient referral. Consider intra-articular steroid injection, brace, or physiotherapy as bridge.", referral: "Orthopaedics (routine)" };
      return { label: "Severe Arthritis — Surgery Threshold", color: "#ef4444", recommendation: "Urgent orthopaedic referral for consideration of total knee replacement. Functional assessment required.", referral: "Orthopaedics (urgent) — TKR assessment" };
    },
  },
];
