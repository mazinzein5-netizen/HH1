import OpenAI from "openai";

/** Model used for all chat-based AI features (via OpenRouter). */
export const CHAT_MODEL = "z-ai/glm-5.2";

/**
 * Chat-completions client backed by the Replit OpenRouter AI integration.
 * Used for every chat.completions call (companion, supervisor, translate,
 * triage, summaries, etc.).
 */
export function getChatAI(): OpenAI | null {
  const apiKey = process.env["AI_INTEGRATIONS_OPENROUTER_API_KEY"];
  const baseURL = process.env["AI_INTEGRATIONS_OPENROUTER_BASE_URL"];
  if (!apiKey || !baseURL) return null;
  return new OpenAI({ apiKey, baseURL });
}

/**
 * OpenAI-proxy client, kept ONLY for audio transcription — OpenRouter does
 * not support audio APIs.
 */
export function getOpenAI(): OpenAI | null {
  const apiKey =
    process.env["OPENAI_API_KEY"] ?? process.env["AI_INTEGRATIONS_OPENAI_API_KEY"];
  if (!apiKey) return null;
  const baseURL = process.env["AI_INTEGRATIONS_OPENAI_BASE_URL"];
  return new OpenAI({ apiKey, ...(baseURL ? { baseURL } : {}) });
}
