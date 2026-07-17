import { Router, type IRouter } from "express";
import {
  listHealthcarePractitioners,
  practitionerDirectoryEntry,
} from "./portalAuth";
import {
  getPracStoreById,
  newEntityId,
  type AvailabilitySlot,
  type Booking,
} from "./practitioner";

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

function slotTaken(bookings: Booking[], slotId: string): boolean {
  return bookings.some((b) => b.slotId === slotId);
}

/**
 * GET /hive/practitioners
 * Public directory of practitioners with automated HIVE booking enabled.
 */
router.get("/hive/practitioners", (_req, res) => {
  const practitioners = listHealthcarePractitioners()
    .map((p) => {
      const store = getPracStoreById(p.id);
      if (!store || !store.settings.bookingEnabled) return null;
      const slots = patientSlots(store.settings);
      if (slots.length === 0) return null;
      const openCount = slots.filter((s) => !slotTaken(store.bookings, s.id)).length;
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
    })
    .filter((p) => p !== null);
  res.json({ practitioners });
});

/**
 * GET /hive/practitioners/:id/slots
 * Published video/audio availability slots for one practitioner, with a
 * `taken` flag for slots that already hold a booking.
 */
router.get("/hive/practitioners/:id/slots", (req, res) => {
  const entry = practitionerDirectoryEntry(req.params.id);
  const store = entry ? getPracStoreById(entry.id) : null;
  if (!entry || !store || !store.settings.bookingEnabled) {
    res.status(404).json({ error: "This practitioner is not accepting HIVE bookings." });
    return;
  }
  const slots = patientSlots(store.settings).map((s) => ({
    id: s.id,
    day: s.day,
    start: s.start,
    end: s.end,
    kind: s.kind,
    taken: slotTaken(store.bookings, s.id),
  }));
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
router.post("/hive/practitioners/:id/book", (req, res) => {
  const entry = practitionerDirectoryEntry(req.params.id);
  const store = entry ? getPracStoreById(entry.id) : null;
  if (!entry || !store || !store.settings.bookingEnabled) {
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
  if (slotTaken(store.bookings, slot.id)) {
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
    when: `${slot.day} ${slot.start}–${slot.end}`,
    status: "confirmed",
    demo: false,
    slotId: slot.id,
    ...(reason ? { reason } : {}),
  };
  store.bookings.unshift(booking);
  res.json({
    booking: {
      id: booking.id,
      kind: booking.kind,
      when: booking.when,
      status: booking.status,
      practitioner: { id: entry.id, fullName: entry.fullName, role: entry.role },
      slot: { id: slot.id, day: slot.day, start: slot.start, end: slot.end },
    },
  });
});

export default router;
