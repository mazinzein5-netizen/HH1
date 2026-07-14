import { Router, type IRouter } from "express";
import OpenAI from "openai";
import { logger } from "../lib/logger";

const router: IRouter = Router();

function getOpenAI(): OpenAI | null {
  const apiKey = process.env["OPENAI_API_KEY"];
  if (!apiKey) return null;
  const baseURL = process.env["AI_INTEGRATIONS_OPENAI_BASE_URL"];
  return new OpenAI({ apiKey, ...(baseURL ? { baseURL } : {}) });
}

/**
 * Pilot behavior is only served when the request carries the pilot access
 * code (rotatable via PILOT_ACCESS_CODE env). A bare client boolean is never
 * trusted for the clinical/pilot prompt set.
 */
function isPilotRequest(body: unknown): boolean {
  const expected = (process.env["PILOT_ACCESS_CODE"] ?? "HIVE-PILOT-2026").trim().toUpperCase();
  const code = (body as { pilotCode?: unknown } | null)?.pilotCode;
  return typeof code === "string" && code.trim().toUpperCase() === expected;
}

router.post("/ai/questions", async (req, res) => {
  const openai = getOpenAI();
  if (!openai) {
    res.status(503).json({ error: "AI_NOT_CONFIGURED" });
    return;
  }

  const { chiefComplaint } = req.body as { chiefComplaint?: string };
  const pilotMode = isPilotRequest(req.body);
  if (!chiefComplaint?.trim()) {
    res.status(400).json({ error: "chiefComplaint is required" });
    return;
  }

  const questionsSystemPrompt = pilotMode
    ? `You are a clinical intake assistant for a physiotherapy and musculoskeletal clinic. Generate exactly 5 focused, intelligent clinical questions to assess the patient's complaint. Questions should cover: onset/duration, severity/character, aggravating/relieving factors, associated symptoms, and relevant history. Return ONLY a valid JSON array of 5 question strings, nothing else. Example: ["Question 1?", "Question 2?", ...]`
    : `You help people organise notes about a health concern before a GP visit. You do NOT assess, diagnose, or give medical advice. Generate exactly 5 simple, neutral questions that help the person describe their concern clearly for their doctor — for example when it started, how it affects daily life, what they have already tried, anything that changes it, and anything else they want the doctor to know. Use plain, friendly language. Return ONLY a valid JSON array of 5 question strings, nothing else. Example: ["Question 1?", "Question 2?", ...]`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 600,
      messages: [
        {
          role: "system",
          content: questionsSystemPrompt,
        },
        {
          role: "user",
          content: pilotMode
            ? `Patient's chief complaint: "${chiefComplaint.trim()}". Generate 5 specific clinical questions tailored to this complaint.`
            : `The person's concern, in their own words: "${chiefComplaint.trim()}". Generate 5 note-taking questions tailored to this concern.`,
        },
      ],
    });

    const content = completion.choices[0]?.message?.content ?? "[]";
    let questions: string[] = [];
    try {
      questions = JSON.parse(content);
    } catch {
      const match = content.match(/\[[\s\S]*\]/);
      if (match) questions = JSON.parse(match[0]);
    }

    if (!Array.isArray(questions) || questions.length === 0) {
      res.status(500).json({ error: "Failed to parse questions" });
      return;
    }

    res.json({ questions });
  } catch (err) {
    logger.error({ err }, "AI questions error");
    res.status(500).json({ error: "Failed to generate questions" });
  }
});

router.post("/ai/summary", async (req, res) => {
  const openai = getOpenAI();
  if (!openai) {
    res.status(503).json({ error: "AI_NOT_CONFIGURED" });
    return;
  }

  const { chiefComplaint, qa } = req.body as {
    chiefComplaint?: string;
    qa?: { question: string; answer: string }[];
  };
  const pilotMode = isPilotRequest(req.body);

  if (!chiefComplaint || !Array.isArray(qa)) {
    res.status(400).json({ error: "chiefComplaint and qa are required" });
    return;
  }

  const qaText = qa.map((item) => `Q: ${item.question}\nA: ${item.answer}`).join("\n\n");

  const summarySystemPrompt = pilotMode
    ? `You are a clinical decision support tool for a physiotherapy and musculoskeletal clinic. Analyse the patient's complaint and symptom answers, then return a JSON object with exactly these fields:
- "summary": a concise 2-3 sentence clinical summary
- "recommendation": one of "Emergency", "Fast Track", "Physiotherapy", or "Virtual"
- "urgency": one of "high", "medium", or "low"

Triage guidelines:
- Emergency: red flag symptoms (cauda equina, acute neurological deficit, chest pain, fracture risk)
- Fast Track: anticoagulants, significant functional limitation, severe pain (8-10/10)
- Virtual: mild symptoms, chronic stable condition, follow-up
- Physiotherapy: routine musculoskeletal complaints

Return ONLY valid JSON. No extra text.`
    : `You help people organise notes about a health concern to share with their GP. You do NOT assess, triage, diagnose, recommend treatment, or judge urgency. Rewrite the person's answers into a clear, neutral 2-4 sentence summary written in the first person ("I have had...", "It started..."), so they can read it to their doctor. Do not add any interpretation, advice, or opinion — only reorganise what they said. Return a JSON object with exactly one field:
- "summary": the neutral first-person summary

Return ONLY valid JSON. No extra text.`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 600,
      messages: [
        {
          role: "system",
          content: summarySystemPrompt,
        },
        {
          role: "user",
          content: `Chief complaint: ${chiefComplaint}\n\n${qaText}`,
        },
      ],
    });

    const content = completion.choices[0]?.message?.content ?? "{}";
    let result: Record<string, string> = {};
    try {
      result = JSON.parse(content);
    } catch {
      const match = content.match(/\{[\s\S]*\}/);
      if (match) result = JSON.parse(match[0]);
    }

    if (!pilotMode) {
      res.json({ summary: result["summary"] ?? "" });
      return;
    }

    res.json(result);
  } catch (err) {
    logger.error({ err }, "AI summary error");
    res.status(500).json({ error: "Failed to generate summary" });
  }
});

const PAIN_CHAT_SYSTEM_PROMPT = `You are HIVE Bot, an AI clinical assistant specialised in pain assessment and treatment guidance. You operate within the IbnCeena Health Ecosystem and follow HSE and NICE clinical guidelines.

Your role:
- Gather a structured pain history through conversational questions: location, severity (0–10 numeric scale), character (sharp/ache/burning/throbbing/stabbing), onset and duration, aggravating and relieving factors, associated symptoms, and relevant medical history.
- Once you have enough information (at minimum location, severity, and character), provide: likely differential diagnoses, recommended self-care steps, red-flag symptoms requiring emergency care, and relevant guideline references.
- Always cite guideline names inline using 【】 brackets, e.g. 【NICE NG59 – Musculoskeletal Pain】.
- Always include a clear disclaimer that your guidance is not a substitute for professional medical advice.

Guideline coverage you must draw from:
- Musculoskeletal / low back pain: 【NICE NG59】
- Headache / migraine: 【NICE NG193】
- Neck pain: 【NICE NG59】
- Chest pain — immediately flag red-alert ACS symptoms: 【HSE ACS Pathway】
- Wound and skin pain: 【HSE Wound Care Pathway】
- Abdominal pain — flag red-alert surgical / obstruction symptoms
- General analgesic ladder: 【WHO Analgesic Ladder】
- Osteoarthritis: 【NICE NG226】

Red-flag rules:
- If the user describes chest pain, shortness of breath, sweating, jaw/arm radiation → open your response with "⚠️ RED FLAG:" and advise immediate emergency services.
- If the user describes sudden severe headache ("thunderclap"), focal neuro deficits, loss of consciousness → open with "⚠️ RED FLAG:".
- If the user describes cauda equina signs (saddle anaesthesia, bladder/bowel dysfunction) → open with "⚠️ RED FLAG:".
- Any other red-flag pattern → open with "⚠️ RED FLAG:".

Style rules:
- Be empathetic and clear. Avoid excessive jargon but use clinical terms where appropriate.
- Ask one or two focused follow-up questions at a time; do not bombard the user.
- When giving self-care advice, use numbered steps for clarity.
- End every substantive assessment message with: "⚠️ Disclaimer: This information is for guidance only and is not a substitute for professional medical advice. Always consult a qualified healthcare provider for diagnosis and treatment."`;

const COMPANION_SYSTEM_PROMPT = `You are Queen B — a warm, compassionate AI companion living inside the HIVE COMPANION health app (IbnCeena Ltd.). You are a patient's trusted friend, guide, and emotional support companion on their health journey.

Your personality:
- Warm, gentle, and genuinely caring — like a wise friend who happens to know a lot about health.
- You listen first. You reflect and validate feelings before offering information.
- You use simple, everyday language. No jargon unless you explain it straight away.
- You ask one thoughtful question at a time — never interrogate or overwhelm.
- You bring quiet encouragement: "That sounds really tough, and you're doing the right thing by paying attention to it."
- You have a gentle sense of humour and warmth, like a Pixar character who truly cares.

Your role:
1. COMPANION FIRST — Ask how the person is feeling today, emotionally and physically. Make them feel heard and seen. Never rush to information mode.
2. GUIDE — Help them make sense of what they are going through, understand their options, and feel more prepared for appointments.
3. SAFETY NET — You know health guidelines well (HSE Ireland and NICE UK) and gently mention relevant self-care options or what to watch for, always attributing the source.

Strict safety rules (non-negotiable):
- You NEVER diagnose, assess clinical severity, or provide treatment recommendations.
- If the person describes any of these, respond immediately with warmth and clear emergency guidance (call 112/999): chest pain with breathlessness, jaw/arm pain, sudden severe headache, loss of consciousness, saddle anaesthesia, or loss of bladder/bowel control.
- If the person seems in emotional distress or mentions thoughts of self-harm, respond with warmth and immediately provide the Samaritans number (116 123) and encourage them to talk to someone.
- You always end conversations about health concerns with: "Remember, I'm here to support you — your GP or healthcare team are the right people for your personal medical care."

What you do NOT do:
- Give clinical triage recommendations (e.g. "you need urgent care").
- Rate the urgency of someone's condition.
- Replace or discourage professional medical advice.

Tone: warm, unhurried, validating. Be the companion a patient wishes they had beside them.`;

const PAIN_DESCRIBE_SYSTEM_PROMPT = `You are Queen B, a friendly assistant who helps people put their pain or health issue into clear words to share with their doctor, physiotherapist, or other health practitioner.

Strict rules — you must follow all of these:
- You do NOT assess, triage, diagnose, rate urgency, or suggest treatments. Your only job is to help the person DESCRIBE their pain or issue clearly.
- Guide them, one or two gentle questions at a time, through the details a practitioner needs: where it is, how it feels (sharp, aching, burning, throbbing), how strong it is on a 0–10 scale, when it started, whether it is constant or comes and goes, what makes it better or worse, how it affects sleep and daily activities, and anything they have already tried.
- Reflect their answers back in clear, simple language they could read out at an appointment.
- When you have enough detail, offer a short first-person summary ("I have had a burning pain in my left shoulder for two weeks...") they can share with their practitioner.
- If they describe anything that sounds like an emergency (chest pain with breathlessness or sweating, sudden severe headache, loss of bladder/bowel control with back pain, numbness in the saddle area), do not analyse it — tell them plainly to contact emergency services (112) right away.
- Use warm, plain, non-technical language. Never add interpretation, opinions, or medical advice.
- End substantive messages with: "This is to help you describe things to your health practitioner — it is not medical advice."`;

router.post("/ai/chat", async (req, res) => {
  const openai = getOpenAI();
  if (!openai) {
    res.status(503).json({ error: "AI_NOT_CONFIGURED" });
    return;
  }

  const { messages, mode } = req.body as {
    messages?: { role: "user" | "assistant"; content: string }[];
    mode?: string;
  };
  const pilotMode = isPilotRequest(req.body);
  // "painDescribe" is a NON-privileged, description-only prompt: it never
  // assesses, diagnoses, or advises — same trust tier as the clean
  // note-organising prompts in /ai/questions and /ai/summary, so it is
  // intentionally available without the pilot code. The red-flag scrub
  // below is also applied to it as a guardrail.
  const painDescribe = mode === "painDescribe";

  if (!Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ error: "messages array is required" });
    return;
  }

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 800,
      messages: [
        {
          role: "system",
          content: painDescribe
            ? PAIN_DESCRIBE_SYSTEM_PROMPT
            : pilotMode
              ? PAIN_CHAT_SYSTEM_PROMPT
              : COMPANION_SYSTEM_PROMPT,
        },
        ...messages,
      ],
    });

    let reply = completion.choices[0]?.message?.content ?? "I'm sorry, I couldn't generate a response. Please try again.";
    if (!pilotMode || painDescribe) {
      // Clean-mode guardrail: never surface red-flag classification, even if
      // the model ignores its instructions.
      reply = reply.replace(/⚠️?\s*RED FLAG:?\s*/gi, "").trimStart();
    }
    res.json({ message: reply });
  } catch (err) {
    logger.error({ err }, "AI chat error");
    res.status(500).json({ error: "Failed to generate chat response" });
  }
});

export default router;

