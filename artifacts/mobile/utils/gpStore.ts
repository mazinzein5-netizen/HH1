import AsyncStorage from "@react-native-async-storage/async-storage";

/* ────────────────────────────────────────────────────────────────────────────
 * On-device "My GPs & practices" store (Zero-Server framework).
 * The patient keeps a personal list of GPs / practices — partner clinicians
 * (IbnCeena network, bookable in-app) and non-partner practices they can
 * reach by email or phone. Everything lives only in AsyncStorage.
 * ──────────────────────────────────────────────────────────────────────────── */

export interface GPRecord {
  id: string;
  /** Doctor's name, if known (e.g. "Dr. Mary O'Brien"). */
  name: string;
  /** Practice / surgery name. */
  practice: string;
  /** Partner GPs are part of the IbnCeena network — bookable in-app. */
  isPartner: boolean;
  phone?: string;
  email?: string;
  address?: string;
  /** "manual" = typed in by the patient, "osm" = saved from a map search. */
  source: "manual" | "osm";
  createdAt: string;
}

const KEY = "hive_my_gps_v1";

function makeId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
}

export async function listGps(): Promise<GPRecord[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return [];
    const items = JSON.parse(raw) as GPRecord[];
    return Array.isArray(items) ? items : [];
  } catch {
    return [];
  }
}

async function saveAll(items: GPRecord[]): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(items));
}

export async function getGp(id: string): Promise<GPRecord | null> {
  const items = await listGps();
  return items.find((g) => g.id === id) ?? null;
}

export async function addGp(
  input: Omit<GPRecord, "id" | "createdAt">
): Promise<GPRecord> {
  const rec: GPRecord = { ...input, id: makeId(), createdAt: new Date().toISOString() };
  const items = await listGps();
  items.unshift(rec);
  await saveAll(items);
  return rec;
}

export async function updateGp(
  id: string,
  patch: Partial<Omit<GPRecord, "id" | "createdAt">>
): Promise<GPRecord | null> {
  const items = await listGps();
  const idx = items.findIndex((g) => g.id === id);
  if (idx === -1) return null;
  items[idx] = { ...items[idx], ...patch };
  await saveAll(items);
  return items[idx];
}

export async function removeGp(id: string): Promise<void> {
  const items = await listGps();
  await saveAll(items.filter((g) => g.id !== id));
}

export async function deleteAllGps(): Promise<void> {
  await AsyncStorage.removeItem(KEY);
}

/* ────────────────────────────────────────────────────────────────────────────
 * Practice lookup — OpenStreetMap Nominatim, no API key.
 * Only the search text the patient types is sent (never any patient data).
 * ──────────────────────────────────────────────────────────────────────────── */

export interface PracticeSearchResult {
  id: string;
  name: string;
  address: string;
  lat: number;
  lon: number;
}

interface NominatimHit {
  place_id: number;
  lat: string;
  lon: string;
  display_name: string;
  name?: string;
  type?: string;
  class?: string;
}

/**
 * Search for a GP practice / surgery by name and area via Nominatim.
 * The query text is the only thing sent — no coordinates unless the patient
 * typed them, and never any patient identifiers.
 */
export async function searchPractices(queryText: string): Promise<PracticeSearchResult[]> {
  const q = queryText.trim();
  if (!q) return [];
  const url =
    `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=8&q=${encodeURIComponent(q)}`;
  const res = await fetch(url, {
    headers: { "User-Agent": "HIVE-Intake-App/1.0 (GP practice finder)" },
  });
  if (!res.ok) throw new Error(`Practice search failed (${res.status})`);
  const json = (await res.json()) as NominatimHit[];
  return json.map((h) => {
    const display = h.display_name ?? "";
    const name = h.name?.trim() || display.split(",")[0].trim();
    const address = display.startsWith(name)
      ? display.slice(name.length).replace(/^,\s*/, "")
      : display;
    return {
      id: String(h.place_id),
      name,
      address,
      lat: parseFloat(h.lat),
      lon: parseFloat(h.lon),
    };
  });
}

/* ────────────────────────────────────────────────────────────────────────────
 * Outreach email template (local, no AI) — used in clean mode or as a
 * fallback. Simple formal register with an explicit response timeframe.
 * ──────────────────────────────────────────────────────────────────────────── */

export type OutreachUrgency = "routine" | "urgent";

export const OUTREACH_TIMEFRAME: Record<OutreachUrgency, string> = {
  routine: "within the next two weeks",
  urgent: "within the next 48 hours",
};

export function buildOutreachTemplate(input: {
  practice: string;
  gpName?: string;
  reason: string;
  urgency: OutreachUrgency;
  appointmentType: "video" | "in_person";
}): { subject: string; body: string } {
  const salutation = input.gpName?.trim() ? `Dear ${input.gpName.trim()},` : "Dear Doctor,";
  const typeText = input.appointmentType === "video" ? "a video appointment" : "an appointment";
  const timeframe = OUTREACH_TIMEFRAME[input.urgency];
  const subject = `Appointment request — ${input.practice}`;
  const body = [
    salutation,
    "",
    `I am writing to request ${typeText} at ${input.practice}.`,
    "",
    `The reason for my request is: ${input.reason.trim() || "a health concern I would like to discuss"}.`,
    "",
    `I would be grateful if the practice could offer me an appointment ${timeframe}, or let me know the earliest available time. Please contact me by reply or by phone to confirm.`,
    "",
    "Thank you for your time.",
    "",
    "Yours sincerely,",
    "[Your name]",
    "[Your phone number]",
  ].join("\n");
  return { subject, body };
}
