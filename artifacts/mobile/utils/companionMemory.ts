/**
 * HIVE Companion on-device patient memory (pilot mode).
 * Zero-server rule: everything here lives only in AsyncStorage on the
 * patient's device. It is sent to the AI per-request as context and is
 * never persisted server-side. Fully viewable and erasable by the patient.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY_MEMORY = "hive_companion_memory_v1";

const MAX_LIST = 20;
const MAX_TOPICS = 30;

export interface CompanionMemory {
  name?: string;
  conditions: string[];
  medications: string[];
  preferences: string[];
  topics: string[];
  /** ISO date of last update */
  updated?: string;
}

export interface CompanionMemoryUpdates {
  name?: string;
  conditions?: string[];
  medications?: string[];
  preferences?: string[];
  topics?: string[];
}

const EMPTY: CompanionMemory = {
  conditions: [],
  medications: [],
  preferences: [],
  topics: [],
};

export async function getCompanionMemory(): Promise<CompanionMemory> {
  try {
    const raw = await AsyncStorage.getItem(KEY_MEMORY);
    if (!raw) return { ...EMPTY };
    const parsed = JSON.parse(raw) as Partial<CompanionMemory>;
    return {
      name: typeof parsed.name === "string" ? parsed.name : undefined,
      conditions: Array.isArray(parsed.conditions) ? parsed.conditions : [],
      medications: Array.isArray(parsed.medications) ? parsed.medications : [],
      preferences: Array.isArray(parsed.preferences) ? parsed.preferences : [],
      topics: Array.isArray(parsed.topics) ? parsed.topics : [],
      updated: typeof parsed.updated === "string" ? parsed.updated : undefined,
    };
  } catch {
    return { ...EMPTY };
  }
}

function mergeList(existing: string[], additions: string[] | undefined, cap: number): string[] {
  if (!additions?.length) return existing;
  const seen = new Set(existing.map((s) => s.toLowerCase().trim()));
  const merged = [...existing];
  for (const item of additions) {
    const clean = item.trim();
    if (!clean) continue;
    if (!seen.has(clean.toLowerCase())) {
      merged.push(clean);
      seen.add(clean.toLowerCase());
    }
  }
  return merged.slice(-cap);
}

/** Merge conversation-derived facts into the stored memory. */
export async function mergeCompanionMemory(updates: CompanionMemoryUpdates): Promise<CompanionMemory> {
  const current = await getCompanionMemory();
  const next: CompanionMemory = {
    name: updates.name?.trim() || current.name,
    conditions: mergeList(current.conditions, updates.conditions, MAX_LIST),
    medications: mergeList(current.medications, updates.medications, MAX_LIST),
    preferences: mergeList(current.preferences, updates.preferences, MAX_LIST),
    topics: mergeList(current.topics, updates.topics, MAX_TOPICS),
    updated: new Date().toISOString(),
  };
  try {
    await AsyncStorage.setItem(KEY_MEMORY, JSON.stringify(next));
  } catch {}
  return next;
}

/** Remove a single item from one of the memory lists. */
export async function removeMemoryItem(
  field: "conditions" | "medications" | "preferences" | "topics",
  value: string
): Promise<CompanionMemory> {
  const current = await getCompanionMemory();
  const next: CompanionMemory = {
    ...current,
    [field]: current[field].filter((v) => v !== value),
    updated: new Date().toISOString(),
  };
  try {
    await AsyncStorage.setItem(KEY_MEMORY, JSON.stringify(next));
  } catch {}
  return next;
}

/** Clear the remembered name only. */
export async function clearMemoryName(): Promise<CompanionMemory> {
  const current = await getCompanionMemory();
  const next: CompanionMemory = { ...current, name: undefined, updated: new Date().toISOString() };
  try {
    await AsyncStorage.setItem(KEY_MEMORY, JSON.stringify(next));
  } catch {}
  return next;
}

/** Erase everything the companion remembers. */
export async function eraseCompanionMemory(): Promise<void> {
  try {
    await AsyncStorage.removeItem(KEY_MEMORY);
  } catch {}
}

export function memoryIsEmpty(m: CompanionMemory): boolean {
  return (
    !m.name &&
    m.conditions.length === 0 &&
    m.medications.length === 0 &&
    m.preferences.length === 0 &&
    m.topics.length === 0
  );
}
