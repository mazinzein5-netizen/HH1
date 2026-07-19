/**
 * Sarah's on-device tool layer.
 *
 * Zero-Server rule: everything here reads only local device stores
 * (PatientContext data + AsyncStorage stores). When Sarah "fetches your
 * prescriptions", the data never leaves the phone — the app shows it locally,
 * and only a compact plain-text summary is included in the AI request so
 * Sarah can talk about what the patient is looking at.
 */
import type { PatientData } from "@/context/PatientContext";
import type { GPRecord } from "@/utils/gpStore";
import {
  type Appointment,
  clinicianMeta,
  formatApptDate,
} from "@/utils/telemedicineStore";

export type SarahIntent =
  | "prescriptions"
  | "history"
  | "appointments"
  | "booking"
  | "gps"
  | "communications";

export interface SarahCard {
  intent: SarahIntent;
  title: string;
  icon: string;
  lines: string[];
  route: string;
  routeLabel: string;
}

/** Detect what the patient is asking Sarah to fetch or do in the app. */
export function detectSarahIntent(text: string): SarahIntent | null {
  const t = text.toLowerCase();

  // Booking first — "book an appointment" must not match plain "appointments".
  if (/\b(book|schedule|arrange|set up|make)\b[\s\S]{0,40}\b(appointment|consultation|video call|doctor|gp|nurse|physio)\b/.test(t)) {
    return "booking";
  }
  // GP list / practice outreach — before generic appointment matching.
  if (/\b(my|our|a|the|find|add|save|contact|email|write to|reach)\b[\s\S]{0,30}\b(gp|gps|doctor|doctors|practice|practices|surgery|surgeries)\b/.test(t) &&
      /\b(gp|gps|practice|practices|surgery|surgeries|doctor list|my doctors?)\b/.test(t) &&
      !/\b(book|schedule|arrange|set up|make)\b/.test(t)) {
    return "gps";
  }
  if (/\b(appointment|appointments|consultation|consultations)\b/.test(t) &&
      /\b(my|next|upcoming|when|what|show|see|check|list|have|any)\b/.test(t)) {
    return "appointments";
  }
  if (/\b(prescription|prescriptions|kardex)\b/.test(t) ||
      (/\b(medication|medications|medicine|medicines|meds|tablets|pills)\b/.test(t) &&
        /\b(my|show|see|check|list|what|which|taking|remind)\b/.test(t))) {
    return "prescriptions";
  }
  if (/\b(medical|health|my)\b[\s\S]{0,15}\bhistory\b/.test(t) ||
      /\b(my|what)\b[\s\S]{0,20}\b(conditions|diagnoses|allergies)\b/.test(t)) {
    return "history";
  }
  if (/\b(message|messages|inbox|notification|notifications|letter|letters|communication|communications)\b/.test(t) &&
      /\b(my|show|see|check|read|any|new|open)\b/.test(t)) {
    return "communications";
  }
  return null;
}

/** Build the on-screen card Sarah shows for a detected intent. */
export function buildSarahCard(
  intent: SarahIntent,
  patient: PatientData,
  appointments: Appointment[],
  gps: GPRecord[] = []
): SarahCard {
  switch (intent) {
    case "prescriptions": {
      const active = patient.kardex.filter((k) => k.status === "active");
      return {
        intent,
        title: "Your current medications",
        icon: "pill",
        lines: active.length
          ? active.map((k) => `${k.medication} ${k.dose} — ${k.frequency}`)
          : ["No active medications on file."],
        route: "/(app)/kardex",
        routeLabel: "Open my prescriptions",
      };
    }
    case "history": {
      const active = patient.medicalHistory.filter((c) => c.status !== "resolved");
      const allergyLine = patient.allergies.length
        ? [`Allergies: ${patient.allergies.map((a) => a.drug).join(", ")}`]
        : [];
      return {
        intent,
        title: "Your medical history",
        icon: "clipboard-pulse",
        lines: active.length
          ? [...active.map((c) => `${c.name} — since ${c.diagnosedDate.slice(0, 4)}`), ...allergyLine]
          : ["No conditions on file.", ...allergyLine],
        route: "/(app)/medical-history",
        routeLabel: "Open my medical history",
      };
    }
    case "appointments": {
      const upcoming = appointments
        .filter((a) => a.status !== "cancelled" && new Date(a.dateISO).getTime() >= Date.now() - 3600_000)
        .sort((a, b) => a.dateISO.localeCompare(b.dateISO))
        .slice(0, 3);
      return {
        intent,
        title: "Your upcoming appointments",
        icon: "calendar-clock",
        lines: upcoming.length
          ? upcoming.map((a) => `${clinicianMeta(a.clinicianType).label} — ${formatApptDate(a.dateISO)} at ${a.time}`)
          : ["You have no upcoming appointments booked."],
        route: "/(app)/telemedicine",
        routeLabel: "Open appointments",
      };
    }
    case "booking":
      return {
        intent,
        title: "Book an appointment",
        icon: "calendar-plus",
        lines: ["I can take you straight to booking — video or in-person, you choose the clinician, day and time."],
        route: "/(app)/telemedicine/book",
        routeLabel: "Start booking",
      };
    case "gps": {
      const partners = gps.filter((g) => g.isPartner);
      const others = gps.filter((g) => !g.isPartner);
      const lines = gps.length
        ? [
            ...partners.map((g) => `${g.name || g.practice} — partner, bookable in the app`),
            ...others.map((g) => `${g.name || g.practice} — reachable by email or phone`),
          ].slice(0, 5)
        : ["No GPs saved yet — you can add your own GP or find a practice on the map."];
      return {
        intent,
        title: "Your GPs & practices",
        icon: "doctor",
        lines,
        route: "/(app)/my-gps",
        routeLabel: "Open my GPs",
      };
    }
    case "communications":
      return {
        intent,
        title: "Your messages & notifications",
        icon: "bell-ring",
        lines: ["Your care messages and notifications are kept in one place."],
        route: "/(app)/notifications",
        routeLabel: "Open messages",
      };
  }
}

/** Compact plain-text context for the AI request (no identifiers, on-device data only). */
export function buildSarahAppContext(
  patient: PatientData,
  appointments: Appointment[],
  card?: SarahCard | null,
  triageSummary?: string | null,
  gps: GPRecord[] = []
): string {
  const parts: string[] = [];

  const activeMeds = patient.kardex.filter((k) => k.status === "active");
  if (activeMeds.length) {
    parts.push(`Active medications: ${activeMeds.map((k) => `${k.medication} ${k.dose} (${k.frequency})`).join("; ")}.`);
  }
  const conditions = patient.medicalHistory.filter((c) => c.status !== "resolved");
  if (conditions.length) {
    parts.push(`Known conditions: ${conditions.map((c) => c.name).join("; ")}.`);
  }
  if (patient.allergies.length) {
    parts.push(`Drug allergies: ${patient.allergies.map((a) => `${a.drug} (${a.severity})`).join("; ")}.`);
  }
  const upcoming = appointments
    .filter((a) => a.status !== "cancelled" && new Date(a.dateISO).getTime() >= Date.now() - 3600_000)
    .sort((a, b) => a.dateISO.localeCompare(b.dateISO))
    .slice(0, 2);
  if (upcoming.length) {
    parts.push(`Upcoming appointments: ${upcoming.map((a) => `${clinicianMeta(a.clinicianType).label} on ${formatApptDate(a.dateISO)} at ${a.time}`).join("; ")}.`);
  }
  if (gps.length) {
    parts.push(`Saved GPs & practices (on-device list): ${gps.slice(0, 5).map((g) => `${g.name || g.practice}${g.isPartner ? " (partner — bookable in app)" : " (not a partner — reachable via an email the patient reviews and sends themselves)"}`).join("; ")}.`);
  }
  if (triageSummary) {
    parts.push(`The patient just completed a symptom questionnaire. Result: ${triageSummary}`);
  }
  if (card) {
    parts.push(`The app is right now showing the patient a card titled "${card.title}" with: ${card.lines.join("; ")}. Acknowledge it naturally and talk them through it.`);
  }
  return parts.join("\n");
}
