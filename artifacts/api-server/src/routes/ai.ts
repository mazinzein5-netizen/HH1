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

router.post("/ai/questions", async (req, res) => {
  const openai = getOpenAI();
  if (!openai) {
    res.status(503).json({ error: "AI_NOT_CONFIGURED" });
    return;
  }

  const { chiefComplaint } = req.body as { chiefComplaint?: string };
  if (!chiefComplaint?.trim()) {
    res.status(400).json({ error: "chiefComplaint is required" });
    return;
  }

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 600,
      messages: [
        {
          role: "system",
          content: `You are a clinical intake assistant for a physiotherapy and musculoskeletal clinic. Generate exactly 5 focused, intelligent clinical questions to assess the patient's complaint. Questions should cover: onset/duration, severity/character, aggravating/relieving factors, associated symptoms, and relevant history. Return ONLY a valid JSON array of 5 question strings, nothing else. Example: ["Question 1?", "Question 2?", ...]`,
        },
        {
          role: "user",
          content: `Patient's chief complaint: "${chiefComplaint.trim()}". Generate 5 specific clinical questions tailored to this complaint.`,
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

  if (!chiefComplaint || !Array.isArray(qa)) {
    res.status(400).json({ error: "chiefComplaint and qa are required" });
    return;
  }

  const qaText = qa.map((item) => `Q: ${item.question}\nA: ${item.answer}`).join("\n\n");

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 600,
      messages: [
        {
          role: "system",
          content: `You are a clinical decision support tool for a physiotherapy and musculoskeletal clinic. Analyse the patient's complaint and symptom answers, then return a JSON object with exactly these fields:
- "summary": a concise 2-3 sentence clinical summary
- "recommendation": one of "Emergency", "Fast Track", "Physiotherapy", or "Virtual"
- "urgency": one of "high", "medium", or "low"

Triage guidelines:
- Emergency: red flag symptoms (cauda equina, acute neurological deficit, chest pain, fracture risk)
- Fast Track: anticoagulants, significant functional limitation, severe pain (8-10/10)
- Virtual: mild symptoms, chronic stable condition, follow-up
- Physiotherapy: routine musculoskeletal complaints

Return ONLY valid JSON. No extra text.`,
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

router.post("/ai/chat", async (req, res) => {
  const openai = getOpenAI();
  if (!openai) {
    res.status(503).json({ error: "AI_NOT_CONFIGURED" });
    return;
  }

  const { messages } = req.body as {
    messages?: { role: "user" | "assistant"; content: string }[];
  };

  if (!Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ error: "messages array is required" });
    return;
  }

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 800,
      messages: [
        { role: "system", content: PAIN_CHAT_SYSTEM_PROMPT },
        ...messages,
      ],
    });

    const reply = completion.choices[0]?.message?.content ?? "I'm sorry, I couldn't generate a response. Please try again.";
    res.json({ message: reply });
  } catch (err) {
    logger.error({ err }, "AI chat error");
    res.status(500).json({ error: "Failed to generate chat response" });
  }
});

export default router;

