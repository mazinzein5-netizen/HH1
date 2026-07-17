import AsyncStorage from "@react-native-async-storage/async-storage";
import type { PatientData } from "@/context/PatientContext";

/* ────────────────────────────────────────────────────────────────────────────
 * Patient-controlled emergency share (Zero-Server framework).
 *
 * With the patient's explicit consent, a snapshot of the emergency-relevant
 * data (allergies first, red-flag conditions, ordered medication list,
 * history) is sent to the HIVE relay, which keeps it ONLY in memory for a
 * time window the patient chooses. A short code / QR lets a healthcare
 * worker at the Emergency Portal read it until it expires or is revoked.
 * ──────────────────────────────────────────────────────────────────────────── */

const API = () => `https://${process.env.EXPO_PUBLIC_DOMAIN}/api`;

/** Conditions we surface as red flags in an emergency handover. */
const RED_FLAG_HINTS = [
  "atrial fibrillation",
  "anticoagul",
  "diabetes",
  "epilep",
  "heart failure",
  "copd",
  "asthma",
  "pacemaker",
  "stroke",
  "transplant",
  "immunosuppress",
  "adrenal insufficiency",
  "haemophilia",
  "hemophilia",
];

export interface EmergencySharePayload {
  patientName?: string;
  generatedAt: string;
  allergies: { drug: string; reaction: string; severity: string }[];
  redFlags: string[];
  medications: { medication: string; dose: string; frequency: string; route: string }[];
  conditions: { name: string; icd10?: string; status: string; diagnosedDate?: string }[];
  notes?: string;
}

/** Build the ordered emergency payload: allergies & red flags first. */
export function buildEmergencyPayload(data: PatientData, patientName?: string): EmergencySharePayload {
  // Severity order: life-threatening → severe → moderate → mild
  const sevRank: Record<string, number> = { "life-threatening": 0, severe: 1, moderate: 2, mild: 3 };
  const allergies = [...data.allergies]
    .sort((a, b) => (sevRank[a.severity] ?? 9) - (sevRank[b.severity] ?? 9))
    .map((a) => ({ drug: a.drug, reaction: a.reaction, severity: a.severity }));

  const activeConditions = data.medicalHistory.filter((c) => c.status !== "resolved");
  const redFlags: string[] = [];
  for (const c of activeConditions) {
    const hay = `${c.name} ${c.notes ?? ""}`.toLowerCase();
    if (RED_FLAG_HINTS.some((h) => hay.includes(h))) {
      redFlags.push(c.notes ? `${c.name} — ${c.notes}` : c.name);
    }
  }

  const medications = data.kardex
    .filter((k) => k.status === "active")
    .map((m) => ({ medication: m.medication, dose: m.dose, frequency: m.frequency, route: m.route }));

  const conditions = data.medicalHistory.map((c) => ({
    name: c.name,
    ...(c.icd10 ? { icd10: c.icd10 } : {}),
    status: c.status,
    ...(c.diagnosedDate ? { diagnosedDate: c.diagnosedDate } : {}),
  }));

  return {
    ...(patientName ? { patientName } : {}),
    generatedAt: new Date().toISOString(),
    allergies,
    redFlags,
    medications,
    conditions,
    notes:
      "Patient self-reported data shared via HIVE COMPANION with explicit patient consent. Not clinically verified.",
  };
}

// ── Active share persistence (so the patient can see/revoke it) ─────────────

export interface ActiveShare {
  code: string;
  expiresAt: string;
  revokeToken: string;
}

const SHARE_KEY = "hive_emergency_share_v1";

export async function getActiveShare(): Promise<ActiveShare | null> {
  try {
    const raw = await AsyncStorage.getItem(SHARE_KEY);
    if (!raw) return null;
    const share = JSON.parse(raw) as ActiveShare;
    if (new Date(share.expiresAt).getTime() <= Date.now()) {
      await AsyncStorage.removeItem(SHARE_KEY);
      return null;
    }
    return share;
  } catch {
    return null;
  }
}

export async function createEmergencyShare(
  payload: EmergencySharePayload,
  ttlMinutes: number
): Promise<ActiveShare> {
  const res = await fetch(`${API()}/emergency-share`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ payload, ttlMinutes }),
  });
  if (!res.ok) throw new Error(`Share failed (${res.status})`);
  const data = (await res.json()) as ActiveShare;
  await AsyncStorage.setItem(SHARE_KEY, JSON.stringify(data));
  return data;
}

export async function revokeEmergencyShare(share: ActiveShare): Promise<void> {
  try {
    await fetch(`${API()}/emergency-share/revoke`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: share.code, revokeToken: share.revokeToken }),
    });
  } finally {
    await AsyncStorage.removeItem(SHARE_KEY);
  }
}

/** Payload encoded into the emergency QR — the code only, no medical data. */
export function emergencyQrPayload(share: ActiveShare): string {
  return JSON.stringify({ type: "HiveEmergencyShare", code: share.code, expiresAt: share.expiresAt });
}

// ── Caretaker link (Red Geriatric Pack opt-in) ──────────────────────────────

export interface CaretakerLink {
  linkCode: string;
  updateToken: string;
  patientLabel: string;
  startedAt: string;
}

const LINK_KEY = "hive_caretaker_link_v1";

export async function getCaretakerLink(): Promise<CaretakerLink | null> {
  try {
    const raw = await AsyncStorage.getItem(LINK_KEY);
    return raw ? (JSON.parse(raw) as CaretakerLink) : null;
  } catch {
    return null;
  }
}

export async function startCaretakerSharing(patientLabel: string): Promise<CaretakerLink> {
  const res = await fetch(`${API()}/caretaker-link`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ patientLabel }),
  });
  if (!res.ok) throw new Error(`Link failed (${res.status})`);
  const data = (await res.json()) as { linkCode: string; updateToken: string };
  const link: CaretakerLink = { ...data, patientLabel, startedAt: new Date().toISOString() };
  await AsyncStorage.setItem(LINK_KEY, JSON.stringify(link));
  return link;
}

export interface CaretakerSnapshot {
  location?: { lat: number; lng: number; accuracyM?: number };
  vitals?: { hr?: number; spo2?: number; glucose?: number; ecg?: string };
}

export async function pushCaretakerSnapshot(link: CaretakerLink, snap: CaretakerSnapshot): Promise<void> {
  await fetch(`${API()}/caretaker-link/update`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ linkCode: link.linkCode, updateToken: link.updateToken, ...snap }),
  });
}

export async function stopCaretakerSharing(link: CaretakerLink): Promise<void> {
  try {
    await fetch(`${API()}/caretaker-link/revoke`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ linkCode: link.linkCode, updateToken: link.updateToken }),
    });
  } finally {
    await AsyncStorage.removeItem(LINK_KEY);
  }
}
