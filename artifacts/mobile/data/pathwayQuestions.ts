export type PathwayKey =
  | "lumbar"
  | "cervical"
  | "hip"
  | "knee"
  | "shoulder"
  | "elbow"
  | "wristHand"
  | "ankleFoot"
  | "thoracic";

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

const OSS_QUESTIONS: ClinicalQuestion[] = [
  {
    text: "1. How would you describe the worst pain you had from your shoulder?",
    options: ["None", "Mild ache", "Moderate ache", "Severe pain", "Unbearable"],
    scores: [4, 3, 2, 1, 0],
  },
  {
    text: "2. Have you had any trouble dressing yourself because of your shoulder?",
    options: ["No trouble at all", "A little trouble", "Moderate trouble", "Extreme difficulty", "Impossible to do"],
    scores: [4, 3, 2, 1, 0],
  },
  {
    text: "3. Have you had any trouble getting in and out of a car or using public transport because of your shoulder?",
    options: ["No trouble at all", "A little trouble", "Moderate trouble", "Extreme difficulty", "Impossible to do"],
    scores: [4, 3, 2, 1, 0],
  },
  {
    text: "4. Have you been able to use a knife and fork at the same time?",
    options: ["Yes, easily", "With little difficulty", "With moderate difficulty", "With extreme difficulty", "No — impossible"],
    scores: [4, 3, 2, 1, 0],
  },
  {
    text: "5. Could you do the household shopping on your own?",
    options: ["Yes, easily", "With little difficulty", "With moderate difficulty", "With extreme difficulty", "No — impossible"],
    scores: [4, 3, 2, 1, 0],
  },
  {
    text: "6. Could you carry a tray containing a plate of food across a room?",
    options: ["Yes, easily", "With little difficulty", "With moderate difficulty", "With extreme difficulty", "No — impossible"],
    scores: [4, 3, 2, 1, 0],
  },
  {
    text: "7. Could you brush or comb your hair with the affected arm?",
    options: ["Yes, easily", "With little difficulty", "With moderate difficulty", "With extreme difficulty", "No — impossible"],
    scores: [4, 3, 2, 1, 0],
  },
  {
    text: "8. How would you describe the pain you usually had from your shoulder?",
    options: ["None", "Very mild", "Mild", "Moderate", "Severe"],
    scores: [4, 3, 2, 1, 0],
  },
  {
    text: "9. Could you hang your clothes up in a wardrobe using the affected arm?",
    options: ["Yes, easily", "With little difficulty", "With moderate difficulty", "With extreme difficulty", "No — impossible"],
    scores: [4, 3, 2, 1, 0],
  },
  {
    text: "10. Have you been able to wash and dry yourself under both arms?",
    options: ["Yes, easily", "With little difficulty", "With moderate difficulty", "With extreme difficulty", "No — impossible"],
    scores: [4, 3, 2, 1, 0],
  },
  {
    text: "11. How much has pain from your shoulder interfered with your usual work (including housework)?",
    options: ["Not at all", "A little bit", "Moderately", "Greatly", "Totally"],
    scores: [4, 3, 2, 1, 0],
  },
  {
    text: "12. Have you been troubled by pain from your shoulder in bed at night?",
    options: ["No nights at all", "Only 1 or 2 nights", "Some nights", "Most nights", "Every night"],
    scores: [4, 3, 2, 1, 0],
  },
];

const OES_QUESTIONS: ClinicalQuestion[] = [
  {
    text: "1. Have you had difficulty lifting things in your home, such as putting out the rubbish, because of your elbow?",
    options: ["No difficulty", "A little difficulty", "Moderate difficulty", "Extreme difficulty", "Impossible to do"],
    scores: [4, 3, 2, 1, 0],
  },
  {
    text: "2. Have you had difficulty carrying bags of shopping because of your elbow?",
    options: ["No difficulty", "A little difficulty", "Moderate difficulty", "Extreme difficulty", "Impossible to do"],
    scores: [4, 3, 2, 1, 0],
  },
  {
    text: "3. Have you had difficulty washing yourself all over because of your elbow?",
    options: ["No difficulty", "A little difficulty", "Moderate difficulty", "Extreme difficulty", "Impossible to do"],
    scores: [4, 3, 2, 1, 0],
  },
  {
    text: "4. Have you had difficulty dressing yourself because of your elbow?",
    options: ["No difficulty", "A little difficulty", "Moderate difficulty", "Extreme difficulty", "Impossible to do"],
    scores: [4, 3, 2, 1, 0],
  },
  {
    text: "5. How would you describe the pain you usually have from your elbow?",
    options: ["None", "Very mild", "Mild", "Moderate", "Severe"],
    scores: [4, 3, 2, 1, 0],
  },
  {
    text: "6. Have you been troubled by pain from your elbow in bed at night?",
    options: ["No nights at all", "Only 1 or 2 nights", "Some nights", "Most nights", "Every night"],
    scores: [4, 3, 2, 1, 0],
  },
  {
    text: "7. How much has pain from your elbow interfered with your usual work (including housework)?",
    options: ["Not at all", "A little bit", "Moderately", "Greatly", "Totally"],
    scores: [4, 3, 2, 1, 0],
  },
  {
    text: "8. Have you felt that your elbow problem is 'controlling your life'?",
    options: ["No, not at all", "Occasionally", "Some days", "Most days", "Every day"],
    scores: [4, 3, 2, 1, 0],
  },
  {
    text: "9. How much has your elbow problem been 'on your mind'?",
    options: ["Not at all", "A little of the time", "Some of the time", "Most of the time", "All of the time"],
    scores: [4, 3, 2, 1, 0],
  },
  {
    text: "10. Have you been troubled by your elbow problem when doing your usual leisure activities?",
    options: ["Not at all", "A little bit", "Moderately", "Greatly", "Totally"],
    scores: [4, 3, 2, 1, 0],
  },
  {
    text: "11. Have you had difficulty using cutlery or holding a cup because of your elbow?",
    options: ["No difficulty", "A little difficulty", "Moderate difficulty", "Extreme difficulty", "Impossible to do"],
    scores: [4, 3, 2, 1, 0],
  },
  {
    text: "12. Have you had difficulty opening doors or turning keys because of your elbow?",
    options: ["No difficulty", "A little difficulty", "Moderate difficulty", "Extreme difficulty", "Impossible to do"],
    scores: [4, 3, 2, 1, 0],
  },
];

const QUICKDASH_QUESTIONS: ClinicalQuestion[] = [
  {
    text: "1. Open a tight or new jar.",
    options: ["No difficulty", "Mild difficulty", "Moderate difficulty", "Severe difficulty", "Unable"],
    scores: [1, 2, 3, 4, 5],
  },
  {
    text: "2. Do heavy household chores (e.g. wash walls, wash floors).",
    options: ["No difficulty", "Mild difficulty", "Moderate difficulty", "Severe difficulty", "Unable"],
    scores: [1, 2, 3, 4, 5],
  },
  {
    text: "3. Carry a shopping bag or briefcase.",
    options: ["No difficulty", "Mild difficulty", "Moderate difficulty", "Severe difficulty", "Unable"],
    scores: [1, 2, 3, 4, 5],
  },
  {
    text: "4. Wash your back.",
    options: ["No difficulty", "Mild difficulty", "Moderate difficulty", "Severe difficulty", "Unable"],
    scores: [1, 2, 3, 4, 5],
  },
  {
    text: "5. Use a knife to cut food.",
    options: ["No difficulty", "Mild difficulty", "Moderate difficulty", "Severe difficulty", "Unable"],
    scores: [1, 2, 3, 4, 5],
  },
  {
    text: "6. Recreational activities in which you take some force or impact through your arm, shoulder or hand (e.g. golf, hammering, tennis).",
    options: ["No difficulty", "Mild difficulty", "Moderate difficulty", "Severe difficulty", "Unable"],
    scores: [1, 2, 3, 4, 5],
  },
  {
    text: "7. During the past week, to what extent has your arm, shoulder or hand problem interfered with your normal social activities with family, friends, neighbours or groups?",
    options: ["Not at all", "Slightly", "Moderately", "Quite a bit", "Extremely"],
    scores: [1, 2, 3, 4, 5],
  },
  {
    text: "8. During the past week, were you limited in your work or other regular daily activities as a result of your arm, shoulder or hand problem?",
    options: ["Not limited at all", "Slightly limited", "Moderately limited", "Very limited", "Unable"],
    scores: [1, 2, 3, 4, 5],
  },
  {
    text: "9. Arm, shoulder or hand pain over the past week.",
    options: ["None", "Mild", "Moderate", "Severe", "Extreme"],
    scores: [1, 2, 3, 4, 5],
  },
  {
    text: "10. Tingling (pins and needles) in your arm, shoulder or hand over the past week.",
    options: ["None", "Mild", "Moderate", "Severe", "Extreme"],
    scores: [1, 2, 3, 4, 5],
  },
  {
    text: "11. During the past week, how much difficulty have you had sleeping because of the pain in your arm, shoulder or hand?",
    options: ["No difficulty", "Mild difficulty", "Moderate difficulty", "Severe difficulty", "So much I can't sleep"],
    scores: [1, 2, 3, 4, 5],
  },
];

const MOXFQ_QUESTIONS: ClinicalQuestion[] = [
  {
    text: "1. How would you describe the pain you usually have in your foot or ankle?",
    options: ["None", "Very mild", "Mild", "Moderate", "Severe"],
    scores: [0, 1, 2, 3, 4],
  },
  {
    text: "2. How often does your foot or ankle pain occur?",
    options: ["Never / rarely", "Occasionally", "Some days", "Most days", "Every day"],
    scores: [0, 1, 2, 3, 4],
  },
  {
    text: "3. Have you avoided walking long distances because of pain in your foot or ankle?",
    options: ["Never", "Rarely", "Sometimes", "Often", "All of the time"],
    scores: [0, 1, 2, 3, 4],
  },
  {
    text: "4. Have you changed the way you walk because of pain in your foot or ankle?",
    options: ["Never", "Rarely", "Sometimes", "Often", "All of the time"],
    scores: [0, 1, 2, 3, 4],
  },
  {
    text: "5. Have you avoided standing for a long time because of pain in your foot or ankle?",
    options: ["Never", "Rarely", "Sometimes", "Often", "All of the time"],
    scores: [0, 1, 2, 3, 4],
  },
  {
    text: "6. Have you been troubled by pain from your foot or ankle in bed at night?",
    options: ["No nights", "Only 1 or 2 nights", "Some nights", "Most nights", "Every night"],
    scores: [0, 1, 2, 3, 4],
  },
  {
    text: "7. Has foot or ankle pain limited your ability to do work or everyday activities?",
    options: ["Not at all", "A little bit", "Moderately", "Greatly", "Totally"],
    scores: [0, 1, 2, 3, 4],
  },
  {
    text: "8. Has your foot or ankle felt unstable, or 'given way', when walking on uneven ground or stairs?",
    options: ["Never", "Rarely", "Sometimes", "Often", "All of the time"],
    scores: [0, 1, 2, 3, 4],
  },
];

const THORACIC_QUESTIONS: ClinicalQuestion[] = [
  {
    text: "1. How would you describe the pain in your mid-back (between your shoulder blades and below)?",
    options: ["No pain", "Very mild", "Mild", "Moderate", "Severe"],
    scores: [0, 1, 2, 3, 4],
  },
  {
    text: "2. How long have you had this mid-back pain?",
    options: ["Less than 2 weeks", "2–6 weeks", "6 weeks – 3 months", "3–12 months", "Over a year"],
    scores: [0, 1, 2, 3, 4],
  },
  {
    text: "3. Does the pain wrap around your chest or ribs like a band?",
    options: ["Never", "Rarely", "Sometimes", "Often", "Constantly"],
    scores: [0, 1, 2, 3, 4],
  },
  {
    text: "4. Is the pain worse when you take a deep breath, cough, or sneeze?",
    options: ["Not at all", "Slightly", "Moderately", "Quite a bit", "Severely"],
    scores: [0, 1, 2, 3, 4],
  },
  {
    text: "5. Does the pain wake you or stop you sleeping at night?",
    options: ["Never", "Only 1 or 2 nights", "Some nights", "Most nights", "Every night"],
    scores: [0, 1, 2, 3, 4],
  },
  {
    text: "6. How much has mid-back pain limited your everyday activities (housework, hobbies, walking)?",
    options: ["Not at all", "A little bit", "Moderately", "Greatly", "Totally"],
    scores: [0, 1, 2, 3, 4],
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
  {
    key: "shoulder",
    name: "Shoulder",
    subtitle: "Shoulder Pain & Function",
    scoreTool: "Oxford Shoulder Score (OSS)",
    toolDescription: "12-item validated patient-reported outcome for shoulder conditions (max 48)",
    maxScore: 48,
    higherIsBetter: true,
    questions: OSS_QUESTIONS,
    formatScore: (total) => `${total}/48 OSS`,
    getResult: (total) => {
      if (total >= 40) return { label: "Satisfactory Shoulder Function", color: "#22c55e", recommendation: "Conservative management. Home exercise programme, activity modification, simple analgesia as needed.", referral: "Self-management / Physiotherapy (optional)" };
      if (total >= 30) return { label: "Mild-Moderate Dysfunction", color: "#f59e0b", recommendation: "GP review and physiotherapy referral. Consider rotator cuff or frozen shoulder pathway. Review in 6 weeks.", referral: "Physiotherapy + GP" };
      if (total >= 20) return { label: "Moderate-Severe Dysfunction", color: "#f97316", recommendation: "GP referral with shoulder X-ray/ultrasound. Consider steroid injection or structured physiotherapy programme.", referral: "GP + Imaging (routine orthopaedic review)" };
      return { label: "Severe Shoulder Dysfunction", color: "#ef4444", recommendation: "Orthopaedic shoulder clinic referral. Imaging required; consider surgical opinion (cuff repair or arthroplasty pathways).", referral: "Orthopaedics — Shoulder Clinic (urgent)" };
    },
  },
  {
    key: "elbow",
    name: "Elbow",
    subtitle: "Elbow Pain & Function",
    scoreTool: "Oxford Elbow Score (OES)",
    toolDescription: "12-item validated patient-reported outcome for elbow conditions (max 48)",
    maxScore: 48,
    higherIsBetter: true,
    questions: OES_QUESTIONS,
    formatScore: (total) => `${total}/48 OES`,
    getResult: (total) => {
      if (total >= 40) return { label: "Satisfactory Elbow Function", color: "#22c55e", recommendation: "Conservative management. Activity modification, eccentric loading exercises for tendinopathy, simple analgesia.", referral: "Self-management / Physiotherapy (optional)" };
      if (total >= 30) return { label: "Mild-Moderate Dysfunction", color: "#f59e0b", recommendation: "GP review and physiotherapy referral. Consider tennis/golfer's elbow pathway with load management advice.", referral: "Physiotherapy + GP" };
      if (total >= 20) return { label: "Moderate-Severe Dysfunction", color: "#f97316", recommendation: "GP referral with elbow X-ray. Consider steroid injection, brace, or structured rehabilitation programme.", referral: "GP + Imaging (routine orthopaedic review)" };
      return { label: "Severe Elbow Dysfunction", color: "#ef4444", recommendation: "Orthopaedic upper-limb clinic referral. Imaging required; consider surgical opinion.", referral: "Orthopaedics — Upper Limb Clinic (urgent)" };
    },
  },
  {
    key: "wristHand",
    name: "Wrist & Hand",
    subtitle: "Wrist & Hand Pain",
    scoreTool: "QuickDASH",
    toolDescription: "11-item validated arm, shoulder and hand disability measure (scored 0–100, higher = more disability)",
    maxScore: 55,
    higherIsBetter: false,
    questions: QUICKDASH_QUESTIONS,
    formatScore: (total) => `${Math.round(((total / 11) - 1) * 25)}/100 QuickDASH`,
    getResult: (total) => {
      const score = Math.round(((total / 11) - 1) * 25);
      if (score <= 25) return { label: "Mild Disability", color: "#22c55e", recommendation: "Conservative management. Splinting for suspected carpal tunnel, activity modification, simple analgesia.", referral: "Self-management / Physiotherapy (optional)" };
      if (score <= 50) return { label: "Moderate Disability", color: "#f59e0b", recommendation: "GP review and hand therapy referral. Consider nerve conduction studies if numbness or tingling is prominent.", referral: "Hand Therapy + GP" };
      if (score <= 75) return { label: "Severe Disability", color: "#f97316", recommendation: "GP referral with imaging. Consider steroid injection, splinting, or surgical opinion (e.g. carpal tunnel release).", referral: "GP + Imaging (routine hand clinic review)" };
      return { label: "Very Severe Disability", color: "#ef4444", recommendation: "Urgent hand clinic referral. Marked functional loss — imaging and specialist assessment required.", referral: "Orthopaedics — Hand Clinic (urgent)" };
    },
  },
  {
    key: "ankleFoot",
    name: "Ankle & Foot",
    subtitle: "Ankle & Foot Pain",
    scoreTool: "Foot & Ankle Screening (MOXFQ-based)",
    toolDescription: "8-item screening measure based on the Manchester-Oxford Foot Questionnaire domains (pain, walking, function)",
    maxScore: 32,
    higherIsBetter: false,
    questions: MOXFQ_QUESTIONS,
    formatScore: (total) => `${total}/32`,
    getResult: (total) => {
      if (total <= 8) return { label: "Mild Symptoms", color: "#22c55e", recommendation: "Conservative management. Supportive footwear, calf and ankle strengthening, weight management if indicated.", referral: "Self-management / Podiatry (optional)" };
      if (total <= 16) return { label: "Moderate Symptoms", color: "#f59e0b", recommendation: "GP review and podiatry or physiotherapy referral. Consider orthotics and structured loading programme.", referral: "Podiatry / Physiotherapy + GP" };
      if (total <= 24) return { label: "Severe Symptoms", color: "#f97316", recommendation: "GP referral with weight-bearing X-ray. Consider immobilisation, injection, or orthopaedic foot & ankle review.", referral: "GP + Imaging (routine orthopaedic review)" };
      return { label: "Very Severe Symptoms", color: "#ef4444", recommendation: "Orthopaedic foot & ankle clinic referral. Marked pain and instability — imaging and specialist assessment required.", referral: "Orthopaedics — Foot & Ankle Clinic (urgent)" };
    },
  },
  {
    key: "thoracic",
    name: "Thoracic Spine",
    subtitle: "Mid-Back Pain",
    scoreTool: "Thoracic Spine Screening",
    toolDescription: "6-item screening proforma — thoracic pain carries a higher index of suspicion and usually merits GP review (NICE-aligned)",
    maxScore: 24,
    higherIsBetter: false,
    questions: THORACIC_QUESTIONS,
    formatScore: (total) => `${total}/24`,
    getResult: (total) => {
      if (total <= 6) return { label: "Mild Mechanical Pattern", color: "#22c55e", recommendation: "Likely mechanical mid-back pain. Posture and mobility exercises, simple analgesia. See your GP if not settling within 4–6 weeks — thoracic pain should always be mentioned at your next GP visit.", referral: "Self-management + GP mention" };
      if (total <= 12) return { label: "Moderate Symptoms", color: "#f59e0b", recommendation: "Book a routine GP appointment. Thoracic spine pain merits clinical review; physiotherapy referral likely.", referral: "GP (routine) + Physiotherapy" };
      if (total <= 18) return { label: "Significant Symptoms", color: "#f97316", recommendation: "See your GP soon. Band-like, breath-related, or night-time thoracic pain needs examination and possibly imaging.", referral: "GP (prompt) + consider imaging" };
      return { label: "Severe Symptoms — Review Needed", color: "#ef4444", recommendation: "Arrange an urgent GP review. Severe or constant thoracic pain, especially at night, requires clinical assessment to exclude serious causes.", referral: "GP (urgent)" };
    },
  },
];
