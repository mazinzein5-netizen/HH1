/* ────────────────────────────────────────────────────────────────────────────
 * Patient-facing HIVE booking API client (pilot programme).
 * Lets the app browse practitioners who enabled automated HIVE booking and
 * book one of their published video/audio slots. Public endpoints — no
 * patient server account exists in the pilot.
 * ──────────────────────────────────────────────────────────────────────────── */

const API = () => `https://${process.env.EXPO_PUBLIC_DOMAIN}/api`;

export interface HivePractitioner {
  id: string;
  fullName: string;
  role: string;
  workplace: string;
  verified: boolean;
  videoConsultations: boolean;
  audioConsultations: boolean;
  openSlots: number;
}

export interface HiveSlot {
  id: string;
  day: string;
  start: string;
  end: string;
  kind: "video" | "audio";
  /** ISO date (yyyy-mm-dd) of the upcoming occurrence, resolved by the server. */
  date?: string;
  taken: boolean;
}

export interface HiveBookingResult {
  id: string;
  kind: "video" | "audio";
  when: string;
  date?: string;
  status: string;
  practitioner: { id: string; fullName: string; role: string };
  slot: { id: string; day: string; start: string; end: string; date?: string };
}

async function parseOrThrow<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) {
    const message =
      (typeof data.message === "string" && data.message) ||
      (typeof data.error === "string" && data.error) ||
      `Request failed (${res.status})`;
    throw new Error(message);
  }
  return data as T;
}

export async function listHivePractitioners(): Promise<HivePractitioner[]> {
  const res = await fetch(`${API()}/hive/practitioners`);
  const data = await parseOrThrow<{ practitioners: HivePractitioner[] }>(res);
  return data.practitioners ?? [];
}

export async function listHiveSlots(
  practitionerId: string,
): Promise<{ practitioner: HivePractitioner; slots: HiveSlot[] }> {
  const res = await fetch(`${API()}/hive/practitioners/${practitionerId}/slots`);
  return parseOrThrow(res);
}

export async function bookHiveSlot(input: {
  practitionerId: string;
  slotId: string;
  patientName: string;
  reason?: string;
}): Promise<HiveBookingResult> {
  const res = await fetch(`${API()}/hive/practitioners/${input.practitionerId}/book`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      slotId: input.slotId,
      patientName: input.patientName,
      ...(input.reason ? { reason: input.reason } : {}),
    }),
  });
  const data = await parseOrThrow<{ booking: HiveBookingResult }>(res);
  return data.booking;
}

/** ISO date (yyyy-mm-dd) of the next occurrence of a weekday name, e.g. "Monday". */
export function nextDateForDay(dayName: string): string {
  const names = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const target = names.findIndex((n) => n.toLowerCase() === dayName.trim().toLowerCase());
  const now = new Date();
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (target >= 0) {
    const diff = (target - d.getDay() + 7) % 7 || 7;
    d.setDate(d.getDate() + diff);
  } else {
    d.setDate(d.getDate() + 1);
  }
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
