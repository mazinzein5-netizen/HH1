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

export default router;
