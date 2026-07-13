import AsyncStorage from "@react-native-async-storage/async-storage";
import * as MailComposer from "expo-mail-composer";
import { Alert, Linking, Platform } from "react-native";

/* ────────────────────────────────────────────────────────────────────────────
 * On-device interpreter booking store (Zero-Server framework).
 * Booking requests are kept in AsyncStorage only; the actual request is sent
 * from the patient's own mail app. Nothing is stored on any server.
 * ──────────────────────────────────────────────────────────────────────────── */

export type InterpreterService = "medical" | "legal" | "accompaniment";
export type InterpreterMode = "in-person" | "remote";
export type BookingStatus = "pending" | "confirmed" | "cancelled";

export interface InterpreterBooking {
  id: string;
  language: string;
  service: InterpreterService;
  /** ISO date-time of the requested appointment */
  dateTime: string;
  mode: InterpreterMode;
  notes?: string;
  status: BookingStatus;
  createdAt: string; // ISO
}

export const INTERPRETER_LANGUAGES = [
  "Irish (Gaeilge)",
  "Irish Sign Language (ISL)",
  "Polish",
  "Ukrainian",
  "Romanian",
  "Lithuanian",
  "Portuguese",
  "Spanish",
  "French",
  "Arabic",
  "Mandarin Chinese",
  "Hindi / Urdu",
] as const;

export const SERVICE_TYPES: {
  key: InterpreterService;
  label: string;
  sub: string;
}[] = [
  { key: "medical", label: "Medical Consultation", sub: "GP, hospital or clinic visits" },
  { key: "legal", label: "Legal Consultation", sub: "Solicitor meetings and legal matters" },
  { key: "accompaniment", label: "Appointment Accompaniment", sub: "An interpreter joins you at your appointment" },
];

export function serviceLabel(service: InterpreterService): string {
  return SERVICE_TYPES.find((s) => s.key === service)?.label ?? service;
}

const BOOKINGS_KEY = "hive_interpreter_bookings";

function makeId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
}

export async function listBookings(): Promise<InterpreterBooking[]> {
  try {
    const raw = await AsyncStorage.getItem(BOOKINGS_KEY);
    if (!raw) return [];
    const bookings = JSON.parse(raw) as InterpreterBooking[];
    return Array.isArray(bookings) ? bookings : [];
  } catch {
    return [];
  }
}

async function saveBookings(bookings: InterpreterBooking[]): Promise<void> {
  await AsyncStorage.setItem(BOOKINGS_KEY, JSON.stringify(bookings));
}

export async function addBooking(
  input: Omit<InterpreterBooking, "id" | "status" | "createdAt">
): Promise<InterpreterBooking> {
  const booking: InterpreterBooking = {
    ...input,
    id: makeId(),
    status: "pending",
    createdAt: new Date().toISOString(),
  };
  const bookings = await listBookings();
  bookings.unshift(booking);
  await saveBookings(bookings);
  return booking;
}

export async function cancelBooking(id: string): Promise<InterpreterBooking[]> {
  const bookings = await listBookings();
  const updated = bookings.map((b) =>
    b.id === id ? { ...b, status: "cancelled" as BookingStatus } : b
  );
  await saveBookings(updated);
  return updated;
}

/** Patient marks a request confirmed once the interpreter service replies. */
export async function confirmBooking(id: string): Promise<InterpreterBooking[]> {
  const bookings = await listBookings();
  const updated = bookings.map((b) =>
    b.id === id ? { ...b, status: "confirmed" as BookingStatus } : b
  );
  await saveBookings(updated);
  return updated;
}

export async function removeBooking(id: string): Promise<InterpreterBooking[]> {
  const bookings = await listBookings();
  const updated = bookings.filter((b) => b.id !== id);
  await saveBookings(updated);
  return updated;
}

export function formatBookingDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export function formatBookingTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

/**
 * Open the patient's own mail app pre-filled with the booking request so they
 * can send it to their interpreter service. Zero-Server: the app never sends
 * anything itself.
 */
export async function sendBookingRequestEmail(
  booking: InterpreterBooking,
  patientName?: string
): Promise<void> {
  const subject = `Interpreter booking request — ${serviceLabel(booking.service)}`;
  const body = [
    "Dear Interpreter Service,",
    "",
    "I would like to request a qualified interpreter for the following appointment:",
    "",
    `• Language: ${booking.language}`,
    `• Service: ${serviceLabel(booking.service)}`,
    `• Date: ${formatBookingDate(booking.dateTime)} at ${formatBookingTime(booking.dateTime)}`,
    `• Format: ${booking.mode === "in-person" ? "In person" : "Remote (phone or video)"}`,
    ...(booking.notes?.trim() ? ["", `Additional notes: ${booking.notes.trim()}`] : []),
    "",
    "Please confirm availability and any details you need from me.",
    "",
    "Kind regards,",
    ...(patientName?.trim() ? [patientName.trim()] : []),
  ].join("\n");

  if (Platform.OS === "web") {
    const mailto = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    Linking.openURL(mailto).catch(() => {
      Alert.alert("Unable to open mail", "Please contact your interpreter service directly with your booking details.");
    });
    return;
  }

  const available = await MailComposer.isAvailableAsync();
  if (!available) {
    Alert.alert(
      "No mail account found",
      "Your request has been saved in My Bookings. Set up a mail account on this device to send it, or contact your interpreter service directly."
    );
    return;
  }

  await MailComposer.composeAsync({ recipients: [], subject, body });
}
