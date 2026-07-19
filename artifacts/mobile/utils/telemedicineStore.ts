import AsyncStorage from "@react-native-async-storage/async-storage";

/* ────────────────────────────────────────────────────────────────────────────
 * On-device telemedicine appointment store (pilot programme only).
 * Appointments, handover attachments, and reminders live entirely on-device
 * in AsyncStorage — no server-side storage in the pilot.
 * ──────────────────────────────────────────────────────────────────────────── */

export type ClinicianType = "gp" | "physio" | "ortho" | "neuro" | "geriatric";

export type AppointmentStatus = "upcoming" | "completed" | "cancelled";

export interface AppointmentAttachments {
  /** Snapshot of the patient's health card summary text at attach time. */
  healthCardSummary?: string;
  /** Snapshot of a structured symptom summary (questionnaire / intake). */
  symptomSummary?: string;
  /** IDs of documents (from documentsStore) attached for the clinician. */
  documentIds: string[];
}

export type AppointmentMode = "video" | "in_person";

export interface Appointment {
  id: string;
  clinicianType: ClinicianType;
  /** Video consultation (default) or an in-person visit at a partner clinic. */
  mode?: AppointmentMode;
  /** Chosen partner GP from the patient's "My GPs" list, if any. */
  gpId?: string;
  gpName?: string;
  reason: string;
  /** ISO date (yyyy-mm-dd) of the appointment day. */
  dateISO: string;
  /** Display time slot, e.g. "10:30". */
  time: string;
  status: AppointmentStatus;
  createdAt: string;
  attachments: AppointmentAttachments;
  interpreterRequested: boolean;
  /** Post-session summary note (also saved to Documents). */
  sessionNote?: string;
}

export const CLINICIAN_TYPES: {
  key: ClinicianType;
  label: string;
  subtitle: string;
  icon: string;
  color: string;
}[] = [
  { key: "gp", label: "General Practitioner", subtitle: "Primary care consultation", icon: "doctor", color: "#4F6EF7" },
  { key: "physio", label: "Physiotherapist", subtitle: "MSK & rehabilitation", icon: "human-handsup", color: "#22c55e" },
  { key: "ortho", label: "Orthopaedic Specialist", subtitle: "Bone, joint & spine", icon: "bone", color: "#f59e0b" },
  { key: "neuro", label: "Neurology", subtitle: "Cervical myelopathy & nerve pain", icon: "brain", color: "#a78bfa" },
  { key: "geriatric", label: "Geriatric Medicine", subtitle: "Elder care & memory support", icon: "human-cane", color: "#E5294E" },
];

export function clinicianMeta(type: ClinicianType) {
  return CLINICIAN_TYPES.find((c) => c.key === type) ?? CLINICIAN_TYPES[0];
}

const KEY = "hive_telemed_appointments";

function makeId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
}

export async function listAppointments(): Promise<Appointment[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return [];
    const items = JSON.parse(raw) as Appointment[];
    return Array.isArray(items) ? items : [];
  } catch {
    return [];
  }
}

async function saveAll(items: Appointment[]): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(items));
}

export async function getAppointment(id: string): Promise<Appointment | null> {
  const items = await listAppointments();
  return items.find((a) => a.id === id) ?? null;
}

export async function createAppointment(input: {
  clinicianType: ClinicianType;
  reason: string;
  dateISO: string;
  time: string;
  mode?: AppointmentMode;
  gpId?: string;
  gpName?: string;
}): Promise<Appointment> {
  const appt: Appointment = {
    id: makeId(),
    clinicianType: input.clinicianType,
    mode: input.mode ?? "video",
    ...(input.gpId ? { gpId: input.gpId } : {}),
    ...(input.gpName ? { gpName: input.gpName } : {}),
    reason: input.reason,
    dateISO: input.dateISO,
    time: input.time,
    status: "upcoming",
    createdAt: new Date().toISOString(),
    attachments: { documentIds: [] },
    interpreterRequested: false,
  };
  const items = await listAppointments();
  items.unshift(appt);
  await saveAll(items);
  return appt;
}

export async function updateAppointment(
  id: string,
  patch: Partial<Omit<Appointment, "id" | "createdAt">>
): Promise<Appointment | null> {
  const items = await listAppointments();
  const idx = items.findIndex((a) => a.id === id);
  if (idx === -1) return null;
  items[idx] = { ...items[idx], ...patch, attachments: { ...items[idx].attachments, ...(patch.attachments ?? {}) } };
  await saveAll(items);
  return items[idx];
}

export async function cancelAppointment(id: string): Promise<void> {
  await updateAppointment(id, { status: "cancelled" });
}

export async function deleteAllAppointments(): Promise<void> {
  await AsyncStorage.removeItem(KEY);
}

/** Human-friendly appointment date label. */
export function formatApptDate(dateISO: string): string {
  const d = new Date(dateISO + "T00:00:00");
  if (isNaN(d.getTime())) return dateISO;
  return d.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" });
}

/** Reminder line for an upcoming appointment, e.g. "Today at 10:30" or "In 3 days". */
export function reminderLabel(appt: Appointment): string {
  const now = new Date();
  const day = new Date(appt.dateISO + "T00:00:00");
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffDays = Math.round((day.getTime() - startOfToday.getTime()) / 86400000);
  if (diffDays < 0) return `Was ${formatApptDate(appt.dateISO)} at ${appt.time}`;
  if (diffDays === 0) return `Today at ${appt.time}`;
  if (diffDays === 1) return `Tomorrow at ${appt.time}`;
  return `In ${diffDays} days — ${formatApptDate(appt.dateISO)} at ${appt.time}`;
}
