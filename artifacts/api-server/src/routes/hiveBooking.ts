import { Router, type IRouter } from "express";
import {
  isSuperuserAccount,
  listHealthcarePractitioners,
  practitionerDirectoryEntry,
} from "./portalAuth";
import {
  getPracStoreById,
  membershipOf,
  newEntityId,
  persistPracStore,
  reconcileMembership,
  type AvailabilitySlot,
  type Booking,
  type PracStore,
} from "./practitioner";

/**
 * Practitioners appear in the patient-facing directory only while their HIVE
 * HUB professional membership is active AND automated booking is switched on.
 * Membership status is lazily re-verified against the backing Stripe
 * subscription (with a short cache), so a lapsed subscription drops the
 * practitioner out of patient booking within the re-verification window.
 */
async function acceptingBookings(store: PracStore, accountId: string): Promise<boolean> {
  // Founder superuser can test the booking flow without a paid membership.
  if (isSuperuserAccount(accountId)) return store.settings.bookingEnabled;
  await reconcileMembership(store, accountId);
  return membershipOf(store).active && store.settings.bookingEnabled;
}

const router: IRouter = Router();

/* ────────────────────────────────────────────────────────────────────────────
 * Patient-facing HIVE booking (pilot, in-memory).
 *
 * Public endpoints that let patients browse practitioners who have enabled
 * automated HIVE booking and book a video/audio consultation into one of
 * their published availability slots. No portal session is required — the
 * pilot patient app is local-first and has no server accounts. Only the
 * practitioner's public directory info (name, role, workplace) and their
 * published slots are exposed; existing bookings are never listed publicly,
 * a slot simply shows as taken.
 * ──────────────────────────────────────────────────────────────────────────── */

const str = (v: unknown, max = 200): string =>
  typeof v === "string" ? v.trim().slice(0, max) : "";

/** A slot is bookable by patients if it is video/audio and the matching consultation type is on. */
function patientSlots(settings: {
  videoConsultations: boolean;
  audioConsultations: boolean;
  slots: AvailabilitySlot[];
}): AvailabilitySlot[] {
  return settings.slots.filter(
    (s) =>
      (s.kind === "video" && settings.videoConsultations) ||
      (s.kind === "audio" && settings.audioConsultations),
  );
}

/**
 * ISO date (yyyy-mm-dd) of the next occurrence of a weekday name, e.g. "Monday".
 * Mirrors nextDateForDay in the mobile app (artifacts/mobile/utils/hiveBookingApi.ts)
 * so the server-stored date matches what the patient app computes locally.
 */
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

/** Human-readable date, e.g. "20 Jul 2026", from an ISO yyyy-mm-dd string. */
function formatDate(iso: string): string {
  const [y, m, day] = iso.split("-").map((n) => parseInt(n, 10));
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${day} ${months[(m ?? 1) - 1]} ${y}`;
}

/**
 * A slot is taken only if a booking exists for its upcoming occurrence date.
 * Bookings from previous weeks (earlier dates) no longer block the slot.
 */
function slotTaken(bookings: Booking[], slotId: string, date: string): boolean {
  return bookings.some((b) => b.slotId === slotId && b.date === date);
}

/**
 * GET /hive/practitioners
 * Public directory of practitioners with automated HIVE booking enabled.
 */
router.get("/hive/practitioners", async (_req, res) => {
  const entries = await Promise.all(
    listHealthcarePractitioners().map(async (p) => {
      const store = getPracStoreById(p.id);
      if (!store || !(await acceptingBookings(store, p.id))) return null;
      const slots = patientSlots(store.settings);
      if (slots.length === 0) return null;
      const openCount = slots.filter((s) => !slotTaken(store.bookings, s.id, nextDateForDay(s.day))).length;
      return {
        id: p.id,
        fullName: p.fullName,
        role: p.role,
        workplace: p.workplace,
        verified: p.verified,
        videoConsultations: store.settings.videoConsultations,
        audioConsultations: store.settings.audioConsultations,
        openSlots: openCount,
      };
    }),
  );
  res.json({ practitioners: entries.filter((p) => p !== null) });
});

/**
 * GET /hive/practitioners/:id/slots
 * Published video/audio availability slots for one practitioner, with a
 * `taken` flag for slots that already hold a booking.
 */
router.get("/hive/practitioners/:id/slots", async (req, res) => {
  const entry = practitionerDirectoryEntry(req.params.id);
  const store = entry ? getPracStoreById(entry.id) : null;
  if (!entry || !store || !(await acceptingBookings(store, entry.id))) {
    res.status(404).json({ error: "This practitioner is not accepting HIVE bookings." });
    return;
  }
  const slots = patientSlots(store.settings).map((s) => {
    const date = nextDateForDay(s.day);
    return {
      id: s.id,
      day: s.day,
      start: s.start,
      end: s.end,
      kind: s.kind,
      date,
      taken: slotTaken(store.bookings, s.id, date),
    };
  });
  res.json({
    practitioner: {
      id: entry.id,
      fullName: entry.fullName,
      role: entry.role,
      workplace: entry.workplace,
      verified: entry.verified,
    },
    slots,
  });
});

/**
 * POST /hive/practitioners/:id/book
 * Body: { slotId, patientName, reason? }
 * Books the given open slot. The booking appears in the practitioner's
 * "Upcoming consultations" list as confirmed.
 */
router.post("/hive/practitioners/:id/book", async (req, res) => {
  const entry = practitionerDirectoryEntry(req.params.id);
  const store = entry ? getPracStoreById(entry.id) : null;
  if (!entry || !store || !(await acceptingBookings(store, entry.id))) {
    res.status(404).json({ error: "This practitioner is not accepting HIVE bookings." });
    return;
  }
  const body = req.body as Record<string, unknown>;
  const slotId = str(body.slotId, 40);
  const patientName = str(body.patientName, 120);
  const reason = str(body.reason, 300);
  if (!slotId || !patientName) {
    res.status(400).json({ error: "slotId and patientName are required." });
    return;
  }
  const slot = patientSlots(store.settings).find((s) => s.id === slotId);
  if (!slot) {
    res.status(404).json({ error: "This slot is no longer published." });
    return;
  }
  const date = nextDateForDay(slot.day);
  if (slotTaken(store.bookings, slot.id, date)) {
    res.status(409).json({ error: "SLOT_TAKEN", message: "This slot has just been booked — please pick another." });
    return;
  }
  if (store.bookings.length >= 500) {
    res.status(400).json({ error: "Booking limit reached for this pilot account." });
    return;
  }
  const booking: Booking = {
    id: newEntityId(),
    patientName,
    kind: slot.kind === "audio" ? "audio" : "video",
    when: `${slot.day} ${formatDate(date)} ${slot.start}–${slot.end}`,
    status: "confirmed",
    demo: false,
    slotId: slot.id,
    date,
    ...(reason ? { reason } : {}),
  };
  store.bookings.unshift(booking);
  persistPracStore(entry.id);
  res.json({
    booking: {
      id: booking.id,
      kind: booking.kind,
      when: booking.when,
      date: booking.date,
      status: booking.status,
      practitioner: { id: entry.id, fullName: entry.fullName, role: entry.role },
      slot: { id: slot.id, day: slot.day, start: slot.start, end: slot.end, date },
    },
  });
});

export default router;
