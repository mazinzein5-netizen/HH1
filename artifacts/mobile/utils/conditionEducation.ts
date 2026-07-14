/**
 * Patient education content for known medical conditions.
 * Content is evidence-based (HSE Ireland / NICE UK guidelines).
 * Matched by normalising condition name to lowercase.
 */

export interface ConditionEdu {
  icon: string;                // MaterialCommunityIcons name
  accentColor: string;
  whatIsIt: string;
  howItFeels: string;
  watchFor: string[];
  lifestyleTips: string[];
  keyFacts: { label: string; value: string }[];
  queenBSeed: string;
}

const DB: { keywords: string[]; edu: ConditionEdu }[] = [
  {
    keywords: ["hypertension", "high blood pressure", "htn", "i10"],
    edu: {
      icon: "heart-pulse",
      accentColor: "#e11d48",
      whatIsIt:
        "High blood pressure (hypertension) means the force of blood pushing against your artery walls is consistently too high. Most people have no symptoms — it is often called the 'silent killer'. Keeping it under control greatly reduces the risk of heart attack and stroke.",
      howItFeels:
        "The majority of people with hypertension feel completely normal. Occasionally people notice headaches at the back of the head, mild dizziness, or a flushed face — but these are not reliable signs. The only way to know is to measure it regularly.",
      watchFor: [
        "Sudden severe headache — especially at the back of the head",
        "Blurred or double vision",
        "Chest pain, tightness, or shortness of breath",
        "Nosebleeds that are frequent or very difficult to stop",
        "A reading above 180/120 mmHg (hypertensive crisis) — seek help immediately",
        "One-sided weakness, numbness, or speech difficulty (stroke signs — call 999)",
      ],
      lifestyleTips: [
        "Reduce salt to less than 6 g (1 teaspoon) per day — check food labels",
        "Eat more fruit, vegetables, low-fat dairy, and whole grains (DASH diet)",
        "Exercise at least 150 minutes per week — even brisk walking counts",
        "Limit alcohol to no more than 14 units per week, spread across the week",
        "Stop smoking — risk drops significantly within weeks",
        "Manage stress: deep breathing, mindfulness, and adequate sleep all help",
        "Monitor your blood pressure at home — keep a log to share with your GP",
      ],
      keyFacts: [
        { label: "Target BP (most adults)", value: "Below 140/90 mmHg" },
        { label: "Guideline", value: "HSE / NICE NG136" },
        { label: "Self-monitoring", value: "Morning & evening, 7 days before GP visit" },
        { label: "Medication check", value: "At least every 6 months" },
      ],
      queenBSeed:
        "I have hypertension and I'd love to understand it better. Can you help me understand what's happening in my blood vessels and what I can do day-to-day to keep my blood pressure well controlled?",
    },
  },
  {
    keywords: ["type 2 diabetes", "diabetes mellitus", "t2dm", "e11", "diabetes type 2"],
    edu: {
      icon: "water-percent",
      accentColor: "#0284c7",
      whatIsIt:
        "Type 2 diabetes means your body does not use insulin properly, causing blood sugar (glucose) to build up. Over time, high blood sugar damages blood vessels and nerves. It is manageable with lifestyle changes and, if needed, medication.",
      howItFeels:
        "Early diabetes often has no symptoms. As blood sugar rises you may notice increased thirst, needing to urinate more often, tiredness, blurred vision, and slow-healing cuts. Low blood sugar (hypoglycaemia) can cause shakiness, sweating, and confusion.",
      watchFor: [
        "Feeling very thirsty all the time",
        "Passing urine much more than usual, especially at night",
        "Cuts or sores that heal slowly",
        "Tingling, numbness, or pain in hands or feet",
        "Recurrent infections (skin, urinary, gum)",
        "Signs of hypoglycaemia: shaking, sweating, confusion, or palpitations",
        "Vision changes — see your optician and GP promptly",
      ],
      lifestyleTips: [
        "Aim for a healthy weight — even 5–10% loss improves blood sugar control",
        "Eat regular, balanced meals — avoid large portions of high-sugar or refined carbohydrates",
        "Choose wholegrain bread, rice, and pasta over white versions",
        "Exercise for 150+ minutes per week — this helps cells use insulin better",
        "Check your feet daily for cuts, blisters, or redness",
        "Attend all your annual diabetes review appointments (eyes, kidneys, feet, HbA1c)",
        "Know how to manage a hypo: keep glucose tablets or juice nearby",
      ],
      keyFacts: [
        { label: "HbA1c target", value: "48–58 mmol/mol (6.5–7.5%)" },
        { label: "Guideline", value: "HSE / NICE NG28" },
        { label: "Annual checks", value: "HbA1c, BP, kidney, eyes, feet" },
        { label: "Medication (demo)", value: "Metformin 500 mg BD" },
      ],
      queenBSeed:
        "I have Type 2 Diabetes and want to understand it better. Can you explain how blood sugar works, what my HbA1c means, and give me practical tips for managing my diabetes day to day?",
    },
  },
  {
    keywords: ["atrial fibrillation", "afib", "af", "i48", "a-fib"],
    edu: {
      icon: "heart-flash",
      accentColor: "#7c3aed",
      whatIsIt:
        "Atrial fibrillation (AF) is an irregular, often fast heart rhythm. The upper chambers of the heart (atria) beat chaotically instead of steadily. AF increases the risk of blood clots, stroke, and heart failure — which is why anticoagulation (blood thinners like Apixaban) is so important.",
      howItFeels:
        "Many people with AF feel palpitations — the heart fluttering, racing, or 'flopping'. Others notice breathlessness, tiredness, dizziness, or chest discomfort. Some people have no symptoms at all and AF is found incidentally.",
      watchFor: [
        "Sudden rapid or irregular heartbeat",
        "Severe shortness of breath or chest pain — call 999 immediately",
        "Fainting or near-fainting",
        "One-sided weakness, face drooping, or slurred speech (stroke signs — call 999 NOW)",
        "Signs of bleeding while on anticoagulants: blood in urine, black stools, unusual bruising",
        "Feeling very unwell with a racing heart — go to A&E",
      ],
      lifestyleTips: [
        "Take your anticoagulant (Apixaban) every day — NEVER stop without talking to your cardiologist",
        "Limit caffeine — coffee, energy drinks, and tea can trigger episodes in some people",
        "Limit alcohol — even moderate amounts can provoke AF episodes",
        "Manage stress — anxiety and poor sleep are common triggers",
        "Avoid ibuprofen and aspirin unless specifically prescribed — they interact with blood thinners",
        "Keep a symptom diary to help your cardiologist spot patterns",
        "Wear a medical alert bracelet noting you are on anticoagulants",
      ],
      keyFacts: [
        { label: "Stroke risk", value: "5× higher than general population — managed with anticoagulation" },
        { label: "Guideline", value: "HSE / NICE NG196" },
        { label: "Anticoagulant", value: "Apixaban 5 mg BD" },
        { label: "Review", value: "Cardiology every 3 months" },
      ],
      queenBSeed:
        "I have Atrial Fibrillation and I'm on Apixaban. Can you help me understand what's happening in my heart, why I need a blood thinner, and what signs should make me seek help urgently?",
    },
  },
];

/** Look up education content for a condition by name/ICD code. Returns fallback for unknown conditions. */
export function getConditionEdu(conditionName: string, icd10?: string): ConditionEdu {
  const search = `${conditionName} ${icd10 ?? ""}`.toLowerCase();
  for (const entry of DB) {
    if (entry.keywords.some((k) => search.includes(k))) {
      return entry.edu;
    }
  }
  // Generic fallback
  return {
    icon: "clipboard-pulse-outline",
    accentColor: "#4f46e5",
    whatIsIt: `${conditionName} is a condition in your medical record. Your GP or specialist can explain exactly how it affects you and what management is needed.`,
    howItFeels:
      "Symptoms vary depending on the condition and how well it is being managed. Your healthcare team is the best source of information about what to expect.",
    watchFor: [
      "Any new or worsening symptoms — contact your GP",
      "Severe or sudden symptoms — call 999 or go to A&E",
    ],
    lifestyleTips: [
      "Attend all scheduled follow-up appointments",
      "Take medications as prescribed — never stop without talking to your doctor",
      "Maintain a healthy lifestyle: balanced diet, regular exercise, and good sleep",
      "Keep a symptom diary to share with your healthcare team",
    ],
    keyFacts: [],
    queenBSeed: `I'd like to learn more about my condition called ${conditionName}. Can you help me understand what it means for my health and what I should watch out for?`,
  };
}
