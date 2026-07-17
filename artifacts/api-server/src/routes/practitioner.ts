import { Router, type IRouter, type Request, type Response, type NextFunction } from "express";
import { createHash, randomBytes } from "crypto";
import { db, practitionerStoresTable } from "@workspace/db";
import { requirePortalSession, portalAccountEmail, type PortalSessionInfo } from "./portalAuth";
import { logger } from "../lib/logger";

const router: IRouter = Router();

/** Roles allowed to access the patient-file system ("My HIVE Patients"). */
const DOCTOR_ROLES = ["GP", "Hospital doctor", "Outpatient clinic specialist doctor"];

function sessionOf(req: Request): PortalSessionInfo {
  return (req as Request & { portalSession: PortalSessionInfo }).portalSession;
}

/** Requires a logged-in healthcare practitioner account (not anon demo, not caretaker). */
function requirePractitioner(req: Request, res: Response, next: NextFunction): void {
  const session = sessionOf(req);
  if (!session.accountId || session.accountType !== "healthcare") {
    res.status(403).json({
      error: "PRACTITIONER_REQUIRED",
      message: "A healthcare practitioner account is required for this area.",
    });
    return;
  }
  next();
}

/** Requires a doctor-role practitioner for patient-file endpoints. */
function requireDoctor(req: Request, res: Response, next: NextFunction): void {
  const session = sessionOf(req);
  if (!session.role || !DOCTOR_ROLES.includes(session.role)) {
    res.status(403).json({
      error: "DOCTOR_ROLE_REQUIRED",
      message: "Patient files are available to doctor roles only.",
    });
    return;
  }
  next();
}

/* ────────────────────────────────────────────────────────────────────────────
 * Practitioner portal data (pilot, in-memory).
 *
 * Each practitioner account gets its own isolated store of patient files,
 * booking settings and upcoming consultations. Data is held only in server
 * memory for the pilot — no persistent patient registry. New stores are
 * seeded with clearly-labelled demo patients so doctors can explore the
 * "My HIVE Patients" file system immediately.
 * ──────────────────────────────────────────────────────────────────────────── */

interface PatientNote {
  id: string;
  ts: number;
  text: string;
}

interface Prescription {
  id: string;
  name: string;
  dose: string;
  frequency: string;
}

interface QuestionnaireResult {
  id: string;
  name: string;
  score: string;
  date: string;
}

interface PracPatient {
  id: string;
  fullName: string;
  dob: string;
  mrn: string;
  condition: string;
  demo: boolean;
  history: string[];
  questionnaires: QuestionnaireResult[];
  prescriptions: Prescription[];
  notes: PatientNote[];
}

export interface AvailabilitySlot {
  id: string;
  day: string;
  start: string;
  end: string;
  kind: "video" | "audio" | "clinic";
}

export interface PracSettings {
  bookingEnabled: boolean;
  videoConsultations: boolean;
  audioConsultations: boolean;
  slots: AvailabilitySlot[];
}

export interface Booking {
  id: string;
  patientName: string;
  kind: "video" | "audio";
  when: string;
  status: "confirmed" | "pending";
  demo: boolean;
  /** Availability slot this booking occupies (patient bookings via HIVE). */
  slotId?: string;
  /** Patient-provided reason for the consultation. */
  reason?: string;
}

export interface PracStore {
  patients: PracPatient[];
  settings: PracSettings;
  bookings: Booking[];
}

/**
 * Stores are keyed by a stable "account key" — the SHA-256 of the account's
 * normalised email. Pilot portal accounts get fresh random ids at every
 * registration, so the email hash is the identity that survives restarts:
 * a practitioner who registers or logs in again with the same email is
 * reattached to their persisted patient files and booking settings.
 */
const stores = new Map<string, PracStore>(); // keyed by accountKey

export function accountKeyForEmail(email: string): string {
  return createHash("sha256").update(email.trim().toLowerCase()).digest("hex");
}

function accountKeyForId(accountId: string): string | null {
  const email = portalAccountEmail(accountId);
  return email ? accountKeyForEmail(email) : null;
}

/**
 * Load all persisted practitioner stores from the database into memory.
 * Must be awaited before the server starts accepting requests so that
 * patient files, availability slots and booking settings survive restarts.
 */
export async function hydratePracStores(): Promise<void> {
  const rows = await db.select().from(practitionerStoresTable);
  for (const row of rows) {
    stores.set(row.accountKey, row.data as PracStore);
  }
  logger.info({ count: rows.length }, "Practitioner stores hydrated from database");
}

/**
 * Per-account write queues. Writes for the same account are chained so an
 * older snapshot can never overwrite a newer one, and `flushPracStores()`
 * can await everything in flight during graceful shutdown.
 */
const writeQueues = new Map<string, Promise<void>>();

function persistByKey(accountKey: string): void {
  const store = stores.get(accountKey);
  if (!store) return;
  // Snapshot now so later in-memory mutations don't leak into this write.
  const data = JSON.parse(JSON.stringify(store)) as PracStore;
  const updatedAt = Date.now();
  const prev = writeQueues.get(accountKey) ?? Promise.resolve();
  const next = prev.then(() =>
    db
      .insert(practitionerStoresTable)
      .values({ accountKey, data, updatedAt })
      .onConflictDoUpdate({
        target: practitionerStoresTable.accountKey,
        set: { data, updatedAt },
      })
      .then(() => undefined)
      .catch((err: unknown) => {
        logger.error({ err, accountKey }, "Failed to persist practitioner store");
      }),
  );
  writeQueues.set(accountKey, next);
  void next.finally(() => {
    if (writeQueues.get(accountKey) === next) writeQueues.delete(accountKey);
  });
}

/** Persist the store belonging to a (current, in-memory) account id. */
export function persistPracStore(accountId: string): void {
  const key = accountKeyForId(accountId);
  if (!key) {
    logger.error({ accountId }, "Cannot persist practitioner store — unknown account");
    return;
  }
  persistByKey(key);
}

/** Await all in-flight practitioner store writes (graceful shutdown). */
export async function flushPracStores(): Promise<void> {
  await Promise.allSettled([...writeQueues.values()]);
}

function id(): string {
  return randomBytes(8).toString("hex");
}

/** Read-only access for the patient-facing HIVE booking directory. */
export function getPracStoreById(accountId: string): PracStore | null {
  const key = accountKeyForId(accountId);
  return key ? stores.get(key) ?? null : null;
}

/** Generate an id for entities created outside this router (e.g. patient bookings). */
export function newEntityId(): string {
  return id();
}

function seedStore(): PracStore {
  return {
    patients: [
      {
        id: id(),
        fullName: "Aoife Byrne (Demo)",
        dob: "1954-03-12",
        mrn: "HH-2201",
        condition: "Osteoarthritis — right knee",
        demo: true,
        history: [
          "2025-11: Oxford Knee Score completed via HIVE Companion",
          "2025-09: GP review — paracetamol stepped up to co-codamol",
          "2025-04: X-ray right knee — moderate joint-space narrowing",
        ],
        questionnaires: [
          { id: id(), name: "Oxford Knee Score", score: "21 / 48", date: "2025-11-04" },
          { id: id(), name: "Oxford Knee Score", score: "26 / 48", date: "2025-05-16" },
        ],
        prescriptions: [
          { id: id(), name: "Co-codamol 8/500", dose: "2 tablets", frequency: "QDS PRN" },
          { id: id(), name: "Naproxen", dose: "250 mg", frequency: "BD with food" },
        ],
        notes: [
          {
            id: id(),
            ts: Date.now() - 6 * 24 * 60 * 60_000,
            text: "Pain worse on stairs. Discussed weight-bearing exercise programme; physio referral sent via HIVE.",
          },
        ],
      },
      {
        id: id(),
        fullName: "Seán Murphy (Demo)",
        dob: "1948-08-29",
        mrn: "HH-2202",
        condition: "Chronic lower back pain (ODI monitored)",
        demo: true,
        history: [
          "2025-12: ODI questionnaire completed via HIVE Companion",
          "2025-10: MRI lumbar spine — L4/L5 degenerative change, no cord compromise",
        ],
        questionnaires: [
          { id: id(), name: "Oswestry Disability Index", score: "34 %", date: "2025-12-02" },
        ],
        prescriptions: [
          { id: id(), name: "Amitriptyline", dose: "10 mg", frequency: "Nocte" },
        ],
        notes: [],
      },
      {
        id: id(),
        fullName: "Mary O'Connell (Demo)",
        dob: "1961-01-07",
        mrn: "HH-2203",
        condition: "Osteoarthritis — left hip, awaiting review",
        demo: true,
        history: [
          "2026-01: Oxford Hip Score completed via HIVE Companion",
          "2025-08: Intra-articular steroid injection — good short-term relief",
        ],
        questionnaires: [
          { id: id(), name: "Oxford Hip Score", score: "18 / 48", date: "2026-01-11" },
        ],
        prescriptions: [],
        notes: [],
      },
    ],
    settings: {
      bookingEnabled: false,
      videoConsultations: false,
      audioConsultations: false,
      slots: [],
    },
    bookings: [
      {
        id: id(),
        patientName: "Aoife Byrne (Demo)",
        kind: "video",
        when: "Tomorrow 10:30",
        status: "confirmed",
        demo: true,
      },
      {
        id: id(),
        patientName: "Seán Murphy (Demo)",
        kind: "audio",
        when: "Friday 14:00",
        status: "pending",
        demo: true,
      },
    ],
  };
}

function getStore(req: Request, res: Response): PracStore | null {
  const session = (req as Request & { portalSession: PortalSessionInfo }).portalSession;
  if (!session.accountId) {
    res.status(403).json({
      error: "ACCOUNT_REQUIRED",
      message: "A practitioner account is required — anonymous demo sessions cannot access patient files.",
    });
    return null;
  }
  const key = session.email ? accountKeyForEmail(session.email) : null;
  if (!key) {
    res.status(403).json({
      error: "ACCOUNT_REQUIRED",
      message: "A practitioner account is required — anonymous demo sessions cannot access patient files.",
    });
    return null;
  }
  let store = stores.get(key);
  if (!store) {
    store = seedStore();
    stores.set(key, store);
    persistByKey(key);
  }
  return store;
}

const str = (v: unknown, max = 200): string =>
  typeof v === "string" ? v.trim().slice(0, max) : "";

// ── Patients ────────────────────────────────────────────────────────────────

router.get("/portal/practitioner/patients", requirePortalSession, requirePractitioner, requireDoctor, (req, res) => {
  const store = getStore(req, res);
  if (!store) return;
  res.json({
    patients: store.patients.map((p) => ({
      id: p.id,
      fullName: p.fullName,
      dob: p.dob,
      mrn: p.mrn,
      condition: p.condition,
      demo: p.demo,
      lastQuestionnaire: p.questionnaires[0] ?? null,
    })),
  });
});

router.post("/portal/practitioner/patients", requirePortalSession, requirePractitioner, requireDoctor, (req, res) => {
  const store = getStore(req, res);
  if (!store) return;
  const { fullName, dob, condition } = req.body as Record<string, unknown>;
  const name = str(fullName, 120);
  if (!name) {
    res.status(400).json({ error: "fullName is required." });
    return;
  }
  if (store.patients.length >= 200) {
    res.status(400).json({ error: "Patient limit reached for this pilot account." });
    return;
  }
  const patient: PracPatient = {
    id: id(),
    fullName: name,
    dob: str(dob, 20) || "—",
    mrn: `HH-${Math.floor(1000 + Math.random() * 9000)}`,
    condition: str(condition, 160) || "—",
    demo: false,
    history: [],
    questionnaires: [],
    prescriptions: [],
    notes: [],
  };
  store.patients.unshift(patient);
  persistPracStore(sessionOf(req).accountId!);
  res.json({ patient });
});

router.get("/portal/practitioner/patients/:id", requirePortalSession, requirePractitioner, requireDoctor, (req, res) => {
  const store = getStore(req, res);
  if (!store) return;
  const patient = store.patients.find((p) => p.id === req.params.id);
  if (!patient) {
    res.status(404).json({ error: "Patient not found." });
    return;
  }
  res.json({ patient });
});

router.post("/portal/practitioner/patients/:id/notes", requirePortalSession, requirePractitioner, requireDoctor, (req, res) => {
  const store = getStore(req, res);
  if (!store) return;
  const patient = store.patients.find((p) => p.id === req.params.id);
  if (!patient) {
    res.status(404).json({ error: "Patient not found." });
    return;
  }
  const text = str((req.body as Record<string, unknown>).text, 2000);
  if (!text) {
    res.status(400).json({ error: "Note text is required." });
    return;
  }
  const note: PatientNote = { id: id(), ts: Date.now(), text };
  patient.notes.unshift(note);
  persistPracStore(sessionOf(req).accountId!);
  res.json({ note });
});

router.post("/portal/practitioner/patients/:id/prescriptions", requirePortalSession, requirePractitioner, requireDoctor, (req, res) => {
  const store = getStore(req, res);
  if (!store) return;
  const patient = store.patients.find((p) => p.id === req.params.id);
  if (!patient) {
    res.status(404).json({ error: "Patient not found." });
    return;
  }
  const body = req.body as Record<string, unknown>;
  const name = str(body.name, 120);
  if (!name) {
    res.status(400).json({ error: "Medication name is required." });
    return;
  }
  const rx: Prescription = {
    id: id(),
    name,
    dose: str(body.dose, 60) || "—",
    frequency: str(body.frequency, 60) || "—",
  };
  patient.prescriptions.unshift(rx);
  persistPracStore(sessionOf(req).accountId!);
  res.json({ prescription: rx });
});

// ── Settings (booking & consultations) ──────────────────────────────────────

router.get("/portal/practitioner/settings", requirePortalSession, requirePractitioner, (req, res) => {
  const store = getStore(req, res);
  if (!store) return;
  res.json({ settings: store.settings });
});

router.put("/portal/practitioner/settings", requirePortalSession, requirePractitioner, (req, res) => {
  const store = getStore(req, res);
  if (!store) return;
  const body = req.body as Record<string, unknown>;
  if (typeof body.bookingEnabled === "boolean") store.settings.bookingEnabled = body.bookingEnabled;
  if (typeof body.videoConsultations === "boolean") store.settings.videoConsultations = body.videoConsultations;
  if (typeof body.audioConsultations === "boolean") store.settings.audioConsultations = body.audioConsultations;
  persistPracStore(sessionOf(req).accountId!);
  res.json({ settings: store.settings });
});

router.post("/portal/practitioner/settings/slots", requirePortalSession, requirePractitioner, (req, res) => {
  const store = getStore(req, res);
  if (!store) return;
  const body = req.body as Record<string, unknown>;
  const day = str(body.day, 20);
  const start = str(body.start, 10);
  const end = str(body.end, 10);
  const kind = body.kind === "audio" || body.kind === "clinic" ? body.kind : "video";
  if (!day || !start || !end) {
    res.status(400).json({ error: "day, start and end are required." });
    return;
  }
  if (store.settings.slots.length >= 50) {
    res.status(400).json({ error: "Slot limit reached." });
    return;
  }
  const slot: AvailabilitySlot = { id: id(), day, start, end, kind };
  store.settings.slots.push(slot);
  persistPracStore(sessionOf(req).accountId!);
  res.json({ slot });
});

router.delete("/portal/practitioner/settings/slots/:slotId", requirePortalSession, requirePractitioner, (req, res) => {
  const store = getStore(req, res);
  if (!store) return;
  store.settings.slots = store.settings.slots.filter((s) => s.id !== req.params.slotId);
  persistPracStore(sessionOf(req).accountId!);
  res.json({ ok: true });
});

// ── Bookings ─────────────────────────────────────────────────────────────────

router.get("/portal/practitioner/bookings", requirePortalSession, requirePractitioner, (req, res) => {
  const store = getStore(req, res);
  if (!store) return;
  res.json({ bookings: store.settings.bookingEnabled ? store.bookings : [] });
});

export default router;
