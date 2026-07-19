/**
 * Queen B conversation memory — stored only on-device with explicit user permission.
 * Zero-server rule: nothing is uploaded or sent anywhere.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY_PERMISSION = "queenb_memory_permission";
const KEY_SESSIONS   = "queenb_sessions";
const MAX_SESSIONS   = 10;

export interface MemorySession {
  id: string;
  date: string;                             // ISO string
  preview: string;                          // snippet of first user message
  topic?: string;                           // e.g. condition name if seeded
  messages: { role: "user" | "assistant"; content: string }[];
}

// ── Permission ────────────────────────────────────────────────────────────────

/** Returns true if allowed, false if denied, null if never asked. */
export async function getMemoryPermission(): Promise<boolean | null> {
  try {
    const v = await AsyncStorage.getItem(KEY_PERMISSION);
    if (v === null) return null;
    return v === "true";
  } catch { return null; }
}

export async function setMemoryPermission(allow: boolean): Promise<void> {
  try { await AsyncStorage.setItem(KEY_PERMISSION, String(allow)); } catch {}
}

// ── Sessions ──────────────────────────────────────────────────────────────────

export async function saveSession(
  messages: { role: "user" | "assistant"; content: string }[],
  topic?: string
): Promise<void> {
  try {
    const permitted = await getMemoryPermission();
    if (!permitted) return;

    const userMessages = messages.filter((m) => m.role === "user");
    if (userMessages.length === 0) return;

    const session: MemorySession = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      preview: (userMessages[0].content ?? "").slice(0, 90),
      topic,
      messages,
    };

    const raw  = await AsyncStorage.getItem(KEY_SESSIONS);
    const prev: MemorySession[] = raw ? JSON.parse(raw) : [];
    const next = [session, ...prev].slice(0, MAX_SESSIONS);
    await AsyncStorage.setItem(KEY_SESSIONS, JSON.stringify(next));
  } catch {}
}

export async function getLastSession(): Promise<MemorySession | null> {
  try {
    const permitted = await getMemoryPermission();
    if (!permitted) return null;
    const raw = await AsyncStorage.getItem(KEY_SESSIONS);
    if (!raw) return null;
    const sessions: MemorySession[] = JSON.parse(raw);
    return sessions[0] ?? null;
  } catch { return null; }
}

export async function getAllSessions(): Promise<MemorySession[]> {
  try {
    const permitted = await getMemoryPermission();
    if (!permitted) return [];
    const raw = await AsyncStorage.getItem(KEY_SESSIONS);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export async function clearSessions(): Promise<void> {
  try { await AsyncStorage.removeItem(KEY_SESSIONS); } catch {}
}

export function relativeDate(iso: string): string {
  try {
    const diff = Date.now() - new Date(iso).getTime();
    const mins  = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days  = Math.floor(diff / 86400000);
    if (mins  < 2)   return "just now";
    if (mins  < 60)  return `${mins} min ago`;
    if (hours < 24)  return `${hours}h ago`;
    if (days  === 1) return "yesterday";
    return `${days} days ago`;
  } catch { return "recently"; }
}
