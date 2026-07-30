/**
 * companionTools — Sarah's on-device intent/tool layer.
 *
 * Detects simple "show me my…" style requests locally (no AI call, Zero-Server
 * for personal data) and answers them from on-device stores, rendering a card
 * in the chat with an optional deep link into the relevant screen.
 */
import type { PatientData } from "@/context/PatientContext";
import {
  clinicianMeta,
  formatApptDate,
  listAppointments,
} from "@/utils/telemedicineStore";

export type ToolIntent =
  | "prescriptions"
  | "history"
  | "appointments"
  | "messages"
  | "book";

export interface ToolCard {
  title: string;
  icon: string;
  lines: string[];
  route?: string;
  routeLabel?: string;
}

export interface ToolResult {
  reply: string;
  card: ToolCard;
}

const INTENT_PATTERNS: { intent: ToolIntent; re: RegExp }[] = [
  {
    intent: "book",
    re: /\b(book|schedule|arrange|set up|make)\b.{0,40}\b(appointment|consult|consultation|session|gp|doctor|physio)\b|\bbook (an? )?(gp|doctor|physio)\b/i,
  },
  {
    intent: "appointments",
    re: /\b(my|show|view|list|see|any|next|upcoming|when.{0,15}(is|are))\b.{0,40}\b(appointment|appointments|consultation|consultations|booking|bookings)\b/i,
  },
  {
    intent: "prescriptions",
    re: /\b(my|show|view|list|see|what)\b.{0,40}\b(prescription|prescriptions|medication|medications|medicine|medicines|meds|kardex|tablets|pills)\b/i,
  },
  {
    intent: "history",
    re: /\b(my|show|view|list|see)\b.{0,40}\b(medical history|health history|conditions|diagnoses|allergies)\b/i,
  },
  {
    intent: "messages",
    re: /\b(my|show|view|list|see|any|check)\b.{0,40}\b(message|messages|notification|notifications|alerts|inbox)\b/i,
  },
];

/** Returns a matched intent, or null when the message should go to the AI. */
export function detectIntent(text: string): ToolIntent | null {
  const t = text.trim();
  if (t.length > 160) return null; // long messages are conversational, not commands
  for (const { intent, re } of INTENT_PATTERNS) {
    if (re.test(t)) return intent;
  }
  return null;
}

/** Runs a tool entirely on-device and returns a chat reply + card. */
export async function runTool(
  intent: ToolIntent,
  patient: PatientData
): Promise<ToolResult> {
  switch (intent) {
    case "prescriptions": {
      const active = patient.kardex.filter((k) => k.status === "active");
      return {
        reply: active.length
          ? `Here are your current medications — ${active.length} active on your kardex. Tap the card to see full details, and let me know if you'd like me to explain any of them.`
          : "I couldn't find any active medications on your kardex right now. Tap the card to open your full medication record.",
        card: {
          title: "Current Prescriptions",
          icon: "pill",
          lines: active.length
            ? active
                .slice(0, 6)
                .map((k) => `${k.medication} ${k.dose} — ${k.frequency}`)
            : ["No active medications recorded."],
          route: "/kardex",
          routeLabel: "Open Medication Kardex",
        },
      };
    }
    case "history": {
      const active = patient.medicalHistory.filter(
        (c) => c.status !== "resolved"
      );
      const allergyLine = patient.allergies.length
        ? `Allergies: ${patient.allergies.map((a) => a.drug).join(", ")}`
        : "Allergies: none recorded";
      return {
        reply:
          "Here's a summary of your medical history. Tap the card to read patient education about any condition — I'm happy to talk through anything on the list.",
        card: {
          title: "Medical History",
          icon: "clipboard-pulse",
          lines: [
            ...(active.length
              ? active.slice(0, 5).map((c) => `${c.name} (${c.status})`)
              : ["No active conditions recorded."]),
            allergyLine,
          ],
          route: "/medical-history",
          routeLabel: "Open Medical History",
        },
      };
    }
    case "appointments": {
      const appts = (await listAppointments())
        .filter((a) => a.status === "upcoming")
        .sort((a, b) => a.dateISO.localeCompare(b.dateISO));
      return {
        reply: appts.length
          ? `You have ${appts.length} upcoming appointment${appts.length === 1 ? "" : "s"}. Tap the card to manage them.`
          : "You don't have any upcoming appointments booked. Would you like to book one? Just say \"book an appointment\".",
        card: {
          title: "Upcoming Appointments",
          icon: "calendar-clock",
          lines: appts.length
            ? appts
                .slice(0, 4)
                .map(
                  (a) =>
                    `${clinicianMeta(a.clinicianType).label} — ${formatApptDate(a.dateISO)} at ${a.time}`
                )
            : ["No upcoming appointments."],
          route: "/telemedicine",
          routeLabel: "Open Telemedicine",
        },
      };
    }
    case "messages": {
      return {
        reply:
          "Your notifications and alerts live in the Notifications screen — tap the card to check for anything new.",
        card: {
          title: "Messages & Notifications",
          icon: "bell-ring",
          lines: ["Monitoring alerts, reminders and app notices."],
          route: "/notifications",
          routeLabel: "Open Notifications",
        },
      };
    }
    case "book": {
      return {
        reply:
          "Of course — I'll take you to the booking screen where you can choose a clinician, date and time. I've popped a shortcut below.",
        card: {
          title: "Book an Appointment",
          icon: "calendar-plus",
          lines: ["Choose a GP, physio or specialist and pick a time slot."],
          route: "/telemedicine/book",
          routeLabel: "Start Booking",
        },
      };
    }
  }
}

/**
 * Builds a compact app-context string sent alongside AI chat messages so
 * Sarah is aware of upcoming appointments etc. (No personal identifiers.)
 */
export async function buildAppContext(): Promise<string> {
  try {
    const appts = (await listAppointments())
      .filter((a) => a.status === "upcoming")
      .sort((a, b) => a.dateISO.localeCompare(b.dateISO))
      .slice(0, 3);
    if (!appts.length) return "Upcoming appointments: none booked.";
    return (
      "Upcoming appointments: " +
      appts
        .map(
          (a) =>
            `${clinicianMeta(a.clinicianType).label} on ${formatApptDate(a.dateISO)} at ${a.time} (reason: ${a.reason})`
        )
        .join("; ")
    );
  } catch {
    return "";
  }
}
