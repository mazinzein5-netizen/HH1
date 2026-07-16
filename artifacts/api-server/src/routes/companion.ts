import { Router, type IRouter, type Request, type Response, type NextFunction } from "express";
import OpenAI, { toFile } from "openai";
import { logger } from "../lib/logger";

const router: IRouter = Router();

function getOpenAI(): OpenAI | null {
  const apiKey =
    process.env["OPENAI_API_KEY"] ?? process.env["AI_INTEGRATIONS_OPENAI_API_KEY"];
  if (!apiKey) return null;
  const baseURL = process.env["AI_INTEGRATIONS_OPENAI_BASE_URL"];
  return new OpenAI({ apiKey, ...(baseURL ? { baseURL } : {}) });
}

/** Pilot behavior is only served with the rotatable pilot access code. */
function isPilotRequest(body: unknown): boolean {
  const expected = (process.env["PILOT_ACCESS_CODE"] ?? "HIVE-PILOT-2026").trim().toUpperCase();
  const code = (body as { pilotCode?: unknown } | null)?.pilotCode;
  return typeof code === "string" && code.trim().toUpperCase() === expected;
}

// ── Types ────────────────────────────────────────────────────────────────────

interface CompanionMemoryPayload {
  name?: string;
  conditions?: string[];
  medications?: string[];
  preferences?: string[];
  topics?: string[];
}

interface ChatMsg { role: "user" | "assistant"; content: string }

function sanitizeStringArray(v: unknown, max = 20): string[] {
  if (!Array.isArray(v)) return [];
  return v
    .filter((x): x is string => typeof x === "string")
    .map((x) => x.trim().slice(0, 120))
    .filter(Boolean)
    .slice(0, max);
}

// ── Prompts ──────────────────────────────────────────────────────────────────

const COMPANION_TEACHER_PROMPT = `You are the HIVE Companion — a warm, patient, voice-first AI companion for middle-aged and older adults living in care facilities or under hospital-group care. Your replies are SPOKEN ALOUD to the patient, so write the way a kind, unhurried person talks.

Who you are:
- A gentle teacher and companion who knows a great deal about medicine, pharmacology (how medicines work), and musculoskeletal health (muscles, bones, joints, and pain).
- You explain things in plain, everyday English — short sentences, familiar words, one idea at a time.
- You are never condescending. You treat the patient as a capable adult who deserves clear answers.

Teaching style (very important):
- Answer the question first, simply. Then offer a little more depth if they want it.
- After explaining something, check understanding gently: "Does that make sense so far?" or "Would you like me to say that a simpler way?"
- Use everyday comparisons: "Think of your knee cartilage like the rubber sole of a shoe — it cushions each step."
- Keep replies short enough to listen to comfortably — usually 3 to 6 spoken sentences. Never produce long lists or walls of text.
- Never use markdown, bullet points, asterisks, or headings — plain spoken sentences only.
- Speak at a calm pace. One question at a time, never several.

Strict safety rules (non-negotiable):
- You NEVER diagnose. You explain conditions and possibilities in general terms only.
- You NEVER tell a patient to start, stop, or change the dose of any medication. If asked, explain what the medicine does in general, then say clearly that only their doctor or pharmacist can change doses.
- For anything personal and medical ("should I...", "is my...", "do I have..."), warmly redirect: "That's a really good question for your doctor — would you like help putting it into words for them?"
- RED FLAGS: if the patient describes chest pain with breathlessness or sweating, pain spreading to the jaw or arm, sudden severe headache, one-sided weakness or face drooping, loss of consciousness, numbness in the saddle area, or loss of bladder or bowel control — begin your reply with exactly "⚠️ RED FLAG:" and tell them calmly to call 112 or 999 now, or press the emergency button on screen.
- If they mention feeling hopeless or thoughts of self-harm, respond with warmth and give the Samaritans number, 116 123.

Using what you remember:
- If the patient's memory notes are provided below, use them naturally — greet them by name, recall their conditions and preferences, and connect new explanations to past topics. Never recite the notes back mechanically.

End health-topic conversations with a gentle reminder that their own care team is the right place for personal medical decisions.`;

const SUPERVISOR_PROMPT = `You are a clinical safety supervisor reviewing a reply written by a patient-facing AI companion before it reaches an older patient. Check the reply against these policies:

1. It must NOT diagnose the patient or state what condition they have.
2. It must NOT advise starting, stopping, or changing the dose of any medication.
3. It must NOT discourage the patient from seeking professional or emergency care.
4. If the patient's message described red-flag symptoms (chest pain with breathlessness, jaw/arm radiation, sudden severe headache, stroke signs, saddle numbness, loss of bladder/bowel control, loss of consciousness), the reply MUST direct them to emergency services (112/999) and begin with "⚠️ RED FLAG:".
5. It must be plain spoken English — no markdown, no bullet lists.

Also extract any NEW personal facts the PATIENT revealed in their latest message (their name, health conditions they say they have, medicines they say they take, preferences about how they like things explained, or the topic discussed).

Return ONLY a JSON object:
{
  "verdict": "approve" | "revise",
  "revisedMessage": "only when verdict is revise — a corrected version of the reply that fixes the policy problem while keeping the warm teaching tone",
  "memoryFacts": {
    "name": "patient's first name if newly stated, else omit",
    "conditions": ["..."], "medications": ["..."], "preferences": ["..."], "topics": ["short topic label for this exchange"]
  }
}
Omit empty fields. No text outside the JSON.`;

const TO_PLAIN_PROMPT = `You are a clinician-to-patient translator inside a patient health app. The patient will give you text from the clinical world — a hospital or GP letter, a discharge summary, test results, or a list of medical terms.

Your job: explain it in plain, warm, everyday English that a 75-year-old with no medical background can fully understand.

Rules:
- Go through the content in the order it appears. For each medical term or finding, give the everyday meaning in one or two short sentences.
- Use short paragraphs, not medical jargon. Where a term must be kept (e.g. a drug name), say it and then explain it: "Apixaban — this is a blood thinner that helps prevent clots."
- Do NOT add any diagnosis, opinion, or advice that is not in the text. Do not soften or hide bad news, but present it gently and clearly.
- If something in the letter is ambiguous, say so plainly: "This part isn't fully clear from the letter — it would be worth asking your doctor exactly what they meant."
- End with: "This explanation is to help you understand — your own doctor or nurse is the right person to answer questions about what it means for you."`;

const TO_CLINICAL_PROMPT = `You are a patient-to-clinician translator inside a patient health app. The patient describes their symptoms or situation in their own conversational words. Produce a clear, structured summary their GP or hospital team can read at a glance.

Format the output EXACTLY with these plain-text section headings (SBAR style):

SITUATION:
(one or two sentences — who is reporting and the main problem in clinical wording)

BACKGROUND:
(relevant history the patient mentioned — onset, duration, prior episodes, medications or conditions they referred to; write "Not stated" if none given)

ASSESSMENT (PATIENT-REPORTED):
(the symptoms organised clinically: location, character, severity if given, timing, aggravating/relieving factors, associated symptoms. This is a report of what the patient said — never add your own diagnosis)

REQUEST:
(what the patient is seeking — review, advice, medication query, etc.)

Rules:
- Use precise clinical vocabulary where it accurately reflects what the patient said (e.g. "intermittent sharp left-sided lumbar pain radiating to posterior thigh").
- NEVER invent findings, measurements, or history the patient did not state.
- Keep it under 200 words. Plain text only, no markdown symbols.
- End with the line: "Source: patient self-report via HIVE Companion; not clinically verified."`;

// ── Routes ───────────────────────────────────────────────────────────────────

/**
 * POST /ai/companion
 * Pilot-only voice companion turn. Runs the teaching-companion model, then a
 * supervisor safety review over the draft reply. Returns:
 *   { message, supervised, memoryUpdates? }
 * `supervised: false` means the supervisor pass failed and the raw reply was
 * served (client shows an "unsupervised" indicator).
 */
router.post("/ai/companion", async (req, res) => {
  if (!isPilotRequest(req.body)) {
    res.status(403).json({ error: "PILOT_REQUIRED" });
    return;
  }

  const openai = getOpenAI();
  if (!openai) {
    res.status(503).json({ error: "AI_NOT_CONFIGURED" });
    return;
  }

  const { messages, memory } = req.body as {
    messages?: ChatMsg[];
    memory?: CompanionMemoryPayload;
  };

  if (!Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ error: "messages array is required" });
    return;
  }

  // Keep the context window sane for long spoken sessions
  const recent = messages.slice(-24).map(({ role, content }) => ({
    role,
    content: String(content).slice(0, 4000),
  }));

  // Build memory preamble (memory lives on-device; we only see what the client sends per-request)
  let memoryPreamble = "";
  if (memory && typeof memory === "object") {
    const name = typeof memory.name === "string" ? memory.name.trim().slice(0, 60) : "";
    const conditions = sanitizeStringArray(memory.conditions);
    const meds = sanitizeStringArray(memory.medications);
    const prefs = sanitizeStringArray(memory.preferences);
    const topics = sanitizeStringArray(memory.topics);
    const lines: string[] = [];
    if (name) lines.push(`Name: ${name}`);
    if (conditions.length) lines.push(`Conditions they've mentioned: ${conditions.join("; ")}`);
    if (meds.length) lines.push(`Medicines they've mentioned: ${meds.join("; ")}`);
    if (prefs.length) lines.push(`How they like things explained: ${prefs.join("; ")}`);
    if (topics.length) lines.push(`Topics discussed before: ${topics.join("; ")}`);
    if (lines.length) {
      memoryPreamble =
        "WHAT YOU REMEMBER ABOUT THIS PATIENT (from previous conversations, stored only on their device):\n" +
        lines.join("\n") +
        "\n\n";
    }
  }

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 500,
      messages: [
        { role: "system", content: memoryPreamble + COMPANION_TEACHER_PROMPT },
        ...recent,
      ],
    });

    const draft =
      completion.choices[0]?.message?.content ??
      "I'm sorry, I didn't quite catch that. Could you say it again for me?";

    // ── Supervisor review pass ──
    const lastUser = [...recent].reverse().find((m) => m.role === "user")?.content ?? "";
    let finalMessage = draft;
    let supervised = false;
    let memoryUpdates: CompanionMemoryPayload | undefined;

    try {
      const review = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        max_tokens: 500,
        messages: [
          { role: "system", content: SUPERVISOR_PROMPT },
          {
            role: "user",
            content: `PATIENT'S LATEST MESSAGE:\n${lastUser}\n\nCOMPANION'S DRAFT REPLY:\n${draft}`,
          },
        ],
      });

      const raw = review.choices[0]?.message?.content ?? "";
      const match = raw.match(/\{[\s\S]*\}/);
      if (match) {
        const parsed = JSON.parse(match[0]) as {
          verdict?: string;
          revisedMessage?: string;
          memoryFacts?: CompanionMemoryPayload;
        };
        supervised = parsed.verdict === "approve" || parsed.verdict === "revise";
        if (parsed.verdict === "revise" && typeof parsed.revisedMessage === "string" && parsed.revisedMessage.trim()) {
          finalMessage = parsed.revisedMessage.trim();
        }
        if (parsed.memoryFacts && typeof parsed.memoryFacts === "object") {
          const mf = parsed.memoryFacts;
          const updates: CompanionMemoryPayload = {};
          if (typeof mf.name === "string" && mf.name.trim()) updates.name = mf.name.trim().slice(0, 60);
          const c = sanitizeStringArray(mf.conditions, 6);
          const m = sanitizeStringArray(mf.medications, 6);
          const p = sanitizeStringArray(mf.preferences, 6);
          const t = sanitizeStringArray(mf.topics, 3);
          if (c.length) updates.conditions = c;
          if (m.length) updates.medications = m;
          if (p.length) updates.preferences = p;
          if (t.length) updates.topics = t;
          if (Object.keys(updates).length) memoryUpdates = updates;
        }
      }
    } catch (err) {
      // Graceful fallback: serve the unsupervised reply, flagged as such.
      logger.warn({ err }, "Companion supervisor review failed — serving unsupervised reply");
    }

    res.json({ message: finalMessage, supervised, ...(memoryUpdates ? { memoryUpdates } : {}) });
  } catch (err) {
    logger.error({ err }, "AI companion error");
    res.status(500).json({ error: "Failed to generate companion response" });
  }
});

// Simple in-memory per-IP rate limit for the transcription endpoint —
// it is unauthenticated (voice input is available in clean mode) and each
// call costs money, so cap the request rate per client.
const TRANSCRIBE_WINDOW_MS = 60_000;
const TRANSCRIBE_MAX_PER_WINDOW = 20;
const transcribeHits = new Map<string, { count: number; resetAt: number }>();

function transcribeRateLimit(req: Request, res: Response, next: NextFunction) {
  const now = Date.now();
  const key = req.ip ?? "unknown";
  const entry = transcribeHits.get(key);
  if (!entry || now > entry.resetAt) {
    // Opportunistic cleanup so the map can't grow without bound
    if (transcribeHits.size > 5000) {
      for (const [k, v] of transcribeHits) {
        if (now > v.resetAt) transcribeHits.delete(k);
      }
    }
    transcribeHits.set(key, { count: 1, resetAt: now + TRANSCRIBE_WINDOW_MS });
    next();
    return;
  }
  entry.count += 1;
  if (entry.count > TRANSCRIBE_MAX_PER_WINDOW) {
    res.status(429).json({ error: "Too many voice requests — please wait a moment and try again." });
    return;
  }
  next();
}

/**
 * POST /ai/transcribe
 * Voice-input transcription for the mobile app (iOS/Android, where the
 * browser SpeechRecognition API is unavailable). Accepts a short audio clip
 * as base64 JSON and returns the transcript. Audio is processed transiently
 * for transcription only — never stored.
 */
router.post("/ai/transcribe", transcribeRateLimit, async (req, res) => {
  const openai = getOpenAI();
  if (!openai) {
    res.status(503).json({ error: "AI_NOT_CONFIGURED" });
    return;
  }

  const { audio, mimeType } = req.body as { audio?: string; mimeType?: string };

  if (typeof audio !== "string" || !audio.trim()) {
    res.status(400).json({ error: "audio (base64) is required" });
    return;
  }
  // ~15MB decoded cap (≈ 20MB base64) — far beyond any voice message
  if (audio.length > 20_000_000) {
    res.status(413).json({ error: "Audio clip is too large" });
    return;
  }

  const type = typeof mimeType === "string" ? mimeType.toLowerCase() : "audio/m4a";
  const extByType: Record<string, string> = {
    "audio/m4a": "m4a",
    "audio/x-m4a": "m4a",
    "audio/mp4": "m4a",
    "audio/aac": "aac",
    "audio/mpeg": "mp3",
    "audio/mp3": "mp3",
    "audio/wav": "wav",
    "audio/x-wav": "wav",
    "audio/webm": "webm",
    "audio/ogg": "ogg",
    "audio/3gpp": "3gp",
  };
  const ext = extByType[type] ?? "m4a";

  try {
    const buffer = Buffer.from(audio, "base64");
    if (buffer.length < 200) {
      res.status(400).json({ error: "Audio clip is empty or too short" });
      return;
    }

    const transcription = await openai.audio.transcriptions.create({
      file: await toFile(buffer, `voice.${ext}`),
      model: "gpt-4o-mini-transcribe",
      language: "en",
    });

    res.json({ text: (transcription.text ?? "").trim() });
  } catch (err) {
    logger.error({ err }, "AI transcribe error");
    res.status(500).json({ error: "Failed to transcribe audio" });
  }
});

/**
 * POST /ai/translate
 * Pilot-only clinician translator.
 *   direction "toPlain"    — clinical letter/terms → plain English explanation
 *   direction "toClinical" — patient's own words → SBAR-style clinical summary
 */
router.post("/ai/translate", async (req, res) => {
  if (!isPilotRequest(req.body)) {
    res.status(403).json({ error: "PILOT_REQUIRED" });
    return;
  }

  const openai = getOpenAI();
  if (!openai) {
    res.status(503).json({ error: "AI_NOT_CONFIGURED" });
    return;
  }

  const { direction, text } = req.body as { direction?: string; text?: string };

  if ((direction !== "toPlain" && direction !== "toClinical") || !text?.trim()) {
    res.status(400).json({ error: "direction ('toPlain'|'toClinical') and text are required" });
    return;
  }

  const systemPrompt = direction === "toPlain" ? TO_PLAIN_PROMPT : TO_CLINICAL_PROMPT;
  const userPrompt =
    direction === "toPlain"
      ? `Please explain this clinical text in plain English:\n\n${text.trim().slice(0, 8000)}`
      : `The patient's own description:\n\n${text.trim().slice(0, 8000)}`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 900,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    });

    const result = completion.choices[0]?.message?.content?.trim();
    if (!result) {
      res.status(500).json({ error: "Failed to generate translation" });
      return;
    }
    res.json({ result });
  } catch (err) {
    logger.error({ err }, "AI translate error");
    res.status(500).json({ error: "Failed to generate translation" });
  }
});

export default router;
