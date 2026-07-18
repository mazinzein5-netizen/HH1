import { Router, type IRouter, type Request, type Response, type NextFunction } from "express";
import { createHash, randomBytes } from "crypto";
import { db, practitionerStoresTable } from "@workspace/db";
import {
  requirePortalSession,
  portalAccountEmail,
  listPortalAccountsAdmin,
  type PortalSessionInfo,
} from "./portalAuth";
import { getUncachableStripeClient } from "../stripeClient";
import { liveMedShareForPatient } from "./medExchange";
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
  // Founder superuser passes every role gate for read/test purposes.
  if (session.superuser) {
    next();
    return;
  }
  if (!session.role || !DOCTOR_ROLES.includes(session.role)) {
    res.status(403).json({
      error: "DOCTOR_ROLE_REQUIRED",
      message: "Patient files are available to doctor roles only.",
    });
    return;
  }
  next();
}

/**
 * Requires an ACTIVE HIVE HUB professional membership (validated server-side).
 * The bookings workspace and video appointments are membership features.
 */
async function requireMembership(req: Request, res: Response, next: NextFunction): Promise<void> {
  const store = getStore(req, res);
  if (!store) return;
  const session = sessionOf(req);
  if (session.superuser) {
    // Founder superuser has every membership feature in read/test capacity.
    next();
    return;
  }
  if (session.accountId) await reconcileMembership(store, session.accountId);
  if (!membershipOf(store).active) {
    res.status(403).json({
      error: "MEMBERSHIP_REQUIRED",
      message:
        "The bookings workspace and video appointments are part of the HIVE HUB professional membership.",
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
  /** Concrete ISO date (yyyy-mm-dd) this booking occupies, so weekly slots reopen next week. */
  date?: string;
  /** Patient-provided reason for the consultation. */
  reason?: string;
}

export type MembershipBilling = "monthly" | "yearly";

export interface ProMembership {
  active: boolean;
  billing: MembershipBilling | null;
  activatedAt: number | null;
  /** Stripe Checkout session that paid for the membership (audit trail). */
  sessionId: string | null;
  /** Stripe subscription backing this membership — used to revoke on lapse. */
  subscriptionId?: string | null;
  /** Stripe customer for the subscription (audit trail / support lookups). */
  customerId?: string | null;
  /** Last time the subscription status was re-verified against Stripe (ms). */
  lastVerifiedAt?: number | null;
}

export interface PracStore {
  patients: PracPatient[];
  settings: PracSettings;
  bookings: Booking[];
  /** HIVE HUB professional membership — optional for legacy stores. */
  membership?: ProMembership;
}

const INACTIVE_MEMBERSHIP: ProMembership = {
  active: false,
  billing: null,
  activatedAt: null,
  sessionId: null,
};

export function membershipOf(store: PracStore): ProMembership {
  return store.membership ?? INACTIVE_MEMBERSHIP;
}

/** Stripe subscription statuses that keep the membership entitlement alive. */
const LIVE_SUBSCRIPTION_STATUSES = new Set(["active", "trialing", "past_due"]);

/** Re-verify against Stripe at most this often (per store). */
const MEMBERSHIP_VERIFY_TTL_MS = 15 * 60 * 1000;

/**
 * Reconcile an active membership against the Stripe subscription that backs
 * it, revoking the entitlement when the subscription has lapsed (canceled,
 * unpaid, incomplete_expired, …). Called lazily on membership-gated access —
 * results are cached for MEMBERSHIP_VERIFY_TTL_MS so patient-facing directory
 * scans stay cheap. Stripe outages fail open (entitlement unchanged) and are
 * retried on the next access.
 */
export async function reconcileMembership(store: PracStore, accountId: string): Promise<void> {
  const m = store.membership;
  if (!m?.active) return;
  if (!m.subscriptionId) {
    // Dev-simulated activation (non-production only) has no subscription.
    if (m.sessionId === "dev-simulated") {
      if (isProduction) {
        // A dev-simulated record must never grant paid access in production.
        m.active = false;
        persistPracStore(accountId);
        logger.warn({ accountId }, "Revoked dev-simulated membership in production");
      }
      return;
    }
    // Legacy/incomplete records without a subscription id: backfill from the
    // stored checkout session once, so revocation can work for them too.
    if (!m.sessionId || !m.sessionId.startsWith("cs_")) return;
    const now = Date.now();
    if (m.lastVerifiedAt && now - m.lastVerifiedAt < MEMBERSHIP_VERIFY_TTL_MS) return;
    try {
      const stripe = await getUncachableStripeClient();
      const checkout = await stripe.checkout.sessions.retrieve(m.sessionId);
      m.subscriptionId = typeof checkout.subscription === "string" ? checkout.subscription : checkout.subscription?.id ?? null;
      m.customerId = typeof checkout.customer === "string" ? checkout.customer : checkout.customer?.id ?? null;
      m.lastVerifiedAt = now;
      persistPracStore(accountId);
    } catch (err) {
      logger.warn({ err, accountId }, "Could not backfill membership subscription id");
      return;
    }
    if (!m.subscriptionId) return;
  }
  const now = Date.now();
  if (m.lastVerifiedAt && now - m.lastVerifiedAt < MEMBERSHIP_VERIFY_TTL_MS) return;
  try {
    const stripe = await getUncachableStripeClient();
    const sub = await stripe.subscriptions.retrieve(m.subscriptionId);
    m.lastVerifiedAt = now;
    if (!LIVE_SUBSCRIPTION_STATUSES.has(sub.status)) {
      m.active = false;
      logger.info(
        { accountId, subscriptionId: m.subscriptionId, status: sub.status },
        "Professional membership revoked — subscription no longer live",
      );
    }
    persistPracStore(accountId);
  } catch (err) {
    // Fail open on transient Stripe errors; retry on next access.
    logger.warn({ err, accountId }, "Could not re-verify membership subscription");
  }
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

// ── Founder superuser admin (read/test capacity) ────────────────────────────

/** Requires the founder superuser session (seeded from environment secrets). */
function requireSuperuser(req: Request, res: Response, next: NextFunction): void {
  if (!sessionOf(req).superuser) {
    res.status(403).json({ error: "SUPERUSER_REQUIRED", message: "Founder access only." });
    return;
  }
  next();
}

/** GET /portal/admin/accounts — every registered portal account. */
router.get("/portal/admin/accounts", requirePortalSession, requireSuperuser, (_req, res) => {
  const accounts = listPortalAccountsAdmin();
  res.json({
    accounts: accounts.map((a) => ({
      ...a,
      patients: stores.get(accountKeyForEmail(a.email))?.patients.length ?? 0,
      membershipActive: membershipOf(
        stores.get(accountKeyForEmail(a.email)) ?? { patients: [], settings: { bookingEnabled: false, videoConsultations: false, audioConsultations: false, slots: [] }, bookings: [] },
      ).active,
    })),
  });
});

/**
 * GET /portal/admin/accounts/:id/store — read-only view of a practitioner's
 * workspace (patient files, bookings, settings, membership). Founder only.
 */
router.get("/portal/admin/accounts/:id/store", requirePortalSession, requireSuperuser, (req, res) => {
  const entry = listPortalAccountsAdmin().find((a) => a.id === req.params.id);
  if (!entry) {
    res.status(404).json({ error: "Account not found." });
    return;
  }
  const store = stores.get(accountKeyForEmail(entry.email));
  if (!store) {
    res.json({ account: entry, store: null });
    return;
  }
  const m = membershipOf(store);
  res.json({
    account: entry,
    store: {
      patients: store.patients,
      settings: store.settings,
      bookings: store.bookings,
      membership: { active: m.active, billing: m.billing, activatedAt: m.activatedAt },
    },
  });
});

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
  // Attach any consented live medication share for this patient (matched on
  // the logged-in doctor's account key + patient display name) so live meds
  // appear inside the patient file itself, with freshness.
  const session = sessionOf(req);
  let liveMedications = null;
  if (session.email && !session.demo) {
    liveMedications = liveMedShareForPatient(accountKeyForEmail(session.email), patient.fullName);
  }
  res.json({ patient: { ...patient, liveMedications } });
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

router.put("/portal/practitioner/settings", requirePortalSession, requirePractitioner, requireMembership, (req, res) => {
  const store = getStore(req, res);
  if (!store) return;
  const body = req.body as Record<string, unknown>;
  if (typeof body.bookingEnabled === "boolean") store.settings.bookingEnabled = body.bookingEnabled;
  if (typeof body.videoConsultations === "boolean") store.settings.videoConsultations = body.videoConsultations;
  if (typeof body.audioConsultations === "boolean") store.settings.audioConsultations = body.audioConsultations;
  persistPracStore(sessionOf(req).accountId!);
  res.json({ settings: store.settings });
});

router.post("/portal/practitioner/settings/slots", requirePortalSession, requirePractitioner, requireMembership, (req, res) => {
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

router.delete("/portal/practitioner/settings/slots/:slotId", requirePortalSession, requirePractitioner, requireMembership, (req, res) => {
  const store = getStore(req, res);
  if (!store) return;
  store.settings.slots = store.settings.slots.filter((s) => s.id !== req.params.slotId);
  persistPracStore(sessionOf(req).accountId!);
  res.json({ ok: true });
});

// ── Bookings (membership workspace) ─────────────────────────────────────────

router.get("/portal/practitioner/bookings", requirePortalSession, requirePractitioner, requireMembership, (req, res) => {
  const store = getStore(req, res);
  if (!store) return;
  res.json({ bookings: store.settings.bookingEnabled ? store.bookings : [] });
});

/**
 * POST /portal/practitioner/bookings/:id/session — start a video/audio
 * appointment session for a booking. Membership-only. Uses the same
 * provider-agnostic session seam as the HIVE COMPANION telemedicine flow:
 * the server issues a session descriptor; the pilot provider simulates the
 * media transport, and a real provider (Daily/Twilio) can be plugged in
 * without changing this contract.
 */
router.post("/portal/practitioner/bookings/:id/session", requirePortalSession, requirePractitioner, requireMembership, (req, res) => {
  const store = getStore(req, res);
  if (!store) return;
  const booking = store.bookings.find((b) => b.id === req.params.id);
  if (!booking) {
    res.status(404).json({ error: "Booking not found." });
    return;
  }
  if (booking.kind === "video" && !store.settings.videoConsultations) {
    res.status(400).json({ error: "Enable video consultations to join video appointments." });
    return;
  }
  if (booking.kind === "audio" && !store.settings.audioConsultations) {
    res.status(400).json({ error: "Enable audio consultations to join audio appointments." });
    return;
  }
  res.json({
    session: {
      id: id(),
      bookingId: booking.id,
      kind: booking.kind,
      room: `hive-${booking.id}`,
      patientName: booking.patientName,
      provider: "simulated",
      startedAt: Date.now(),
      expiresAt: Date.now() + 60 * 60_000,
    },
  });
});

/* ────────────────────────────────────────────────────────────────────────────
 * HIVE HUB professional membership (server-validated entitlement).
 *
 * Membership is purchased through Stripe Checkout and only ever activated
 * after the server itself confirms with Stripe that the session was paid and
 * belongs to this account. The client can never flip the entitlement.
 * ──────────────────────────────────────────────────────────────────────────── */

const PRO_PRICES: Record<MembershipBilling, { lookupKey: string; unitAmount: number; interval: "month" | "year" }> = {
  monthly: { lookupKey: "hive_pro_monthly", unitAmount: 4900, interval: "month" }, // €49.00
  yearly: { lookupKey: "hive_pro_yearly", unitAmount: 49000, interval: "year" }, // €490.00
};

const isProduction = process.env.NODE_ENV === "production";

function parseBilling(v: unknown): MembershipBilling | null {
  return v === "monthly" || v === "yearly" ? v : null;
}

/** Find (or lazily seed) the Stripe price for a professional membership plan. */
async function proPriceId(billing: MembershipBilling): Promise<string> {
  const stripe = await getUncachableStripeClient();
  const spec = PRO_PRICES[billing];
  const prices = await stripe.prices.list({ lookup_keys: [spec.lookupKey], active: true, limit: 1 });
  if (prices.data[0]) return prices.data[0].id;

  const search = await stripe.products.search({
    query: `name:'HIVE HUB Professional Membership' AND active:'true'`,
  });
  const product =
    search.data[0] ??
    (await stripe.products.create({
      name: "HIVE HUB Professional Membership",
      description:
        "Professional membership for the HIVE HUB — bookings workspace and video appointments.",
      metadata: { tier: "pro" },
    }));
  const price = await stripe.prices.create({
    product: product.id,
    unit_amount: spec.unitAmount,
    currency: "eur",
    recurring: { interval: spec.interval },
    lookup_key: spec.lookupKey,
    metadata: { tier: "pro", billing },
  });
  logger.info({ lookupKey: spec.lookupKey, priceId: price.id }, "Seeded professional membership price");
  return price.id;
}

router.get("/portal/practitioner/membership", requirePortalSession, requirePractitioner, async (req, res) => {
  const store = getStore(req, res);
  if (!store) return;
  const session = sessionOf(req);
  if (session.superuser) {
    // Founder superuser: all membership features unlocked, no billing record.
    res.json({ membership: { active: true, billing: null, activatedAt: null, superuser: true } });
    return;
  }
  if (session.accountId) await reconcileMembership(store, session.accountId);
  const m = membershipOf(store);
  res.json({ membership: { active: m.active, billing: m.billing, activatedAt: m.activatedAt } });
});

router.post("/portal/practitioner/membership/checkout", requirePortalSession, requirePractitioner, async (req, res) => {
  const store = getStore(req, res);
  if (!store) return;
  if (membershipOf(store).active) {
    res.status(400).json({ error: "Your membership is already active." });
    return;
  }
  const billing = parseBilling((req.body as Record<string, unknown>).billing);
  if (!billing) {
    res.status(400).json({ error: "billing must be 'monthly' or 'yearly'." });
    return;
  }
  const session = sessionOf(req);
  const accountKey = session.email ? accountKeyForEmail(session.email) : null;
  if (!accountKey) {
    res.status(403).json({ error: "ACCOUNT_REQUIRED", message: "A practitioner account is required." });
    return;
  }
  try {
    const stripe = await getUncachableStripeClient();
    const priceId = await proPriceId(billing);
    const baseUrl = `https://${process.env["REPLIT_DOMAINS"]?.split(",")[0]}`;
    // Idempotency: retries for the same account + plan reuse one Checkout
    // Session for 24h, so a timeout + retry can never double-charge.
    const idempotencyKey = `hive_pro_${accountKey}_${billing}_${priceId}`;
    const checkout = await stripe.checkout.sessions.create(
      {
        mode: "subscription",
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: `${baseUrl}/portal/practitioner?membership_session={CHECKOUT_SESSION_ID}`,
        cancel_url: `${baseUrl}/portal/practitioner?membership_cancelled=1`,
        metadata: { purpose: "pro_membership", accountKey, billing },
      },
      { idempotencyKey },
    );
    res.json({ url: checkout.url, sessionId: checkout.id });
  } catch (err) {
    logger.error({ err }, "Failed to create professional membership checkout");
    res.status(502).json({ error: "Could not start the membership payment. Please try again." });
  }
});

/**
 * POST /portal/practitioner/membership/confirm — Body: { sessionId } or, in
 * non-production only, { devActivate: true } (mirrors the portal's dev-only
 * biometric simulation for environments without Stripe test checkout).
 * Membership activates ONLY after Stripe confirms payment for this account.
 */
router.post("/portal/practitioner/membership/confirm", requirePortalSession, requirePractitioner, async (req, res) => {
  const store = getStore(req, res);
  if (!store) return;
  const session = sessionOf(req);
  const accountKey = session.email ? accountKeyForEmail(session.email) : null;
  if (!accountKey) {
    res.status(403).json({ error: "ACCOUNT_REQUIRED", message: "A practitioner account is required." });
    return;
  }
  const { sessionId, devActivate } = req.body as { sessionId?: unknown; devActivate?: unknown };

  if (devActivate === true) {
    if (isProduction) {
      res.status(403).json({ error: "A completed payment is required." });
      return;
    }
    logger.warn({ accountKey }, "DEV-ONLY simulated membership activation used");
    store.membership = { active: true, billing: "monthly", activatedAt: Date.now(), sessionId: "dev-simulated" };
    persistPracStore(session.accountId!);
    const m = membershipOf(store);
    res.json({ membership: { active: m.active, billing: m.billing, activatedAt: m.activatedAt } });
    return;
  }

  if (typeof sessionId !== "string" || !sessionId.startsWith("cs_")) {
    res.status(400).json({ error: "A valid checkout session id is required." });
    return;
  }
  try {
    const stripe = await getUncachableStripeClient();
    const checkout = await stripe.checkout.sessions.retrieve(sessionId);
    if (checkout.metadata?.["purpose"] !== "pro_membership" || checkout.metadata?.["accountKey"] !== accountKey) {
      res.status(403).json({ error: "This payment does not belong to your account." });
      return;
    }
    if (checkout.payment_status !== "paid") {
      res.status(402).json({ error: "Payment not completed yet.", status: checkout.status });
      return;
    }
    const billing = parseBilling(checkout.metadata?.["billing"]) ?? "monthly";
    const subscriptionId =
      typeof checkout.subscription === "string" ? checkout.subscription : checkout.subscription?.id ?? null;
    const customerId = typeof checkout.customer === "string" ? checkout.customer : checkout.customer?.id ?? null;
    store.membership = {
      active: true,
      billing,
      activatedAt: Date.now(),
      sessionId,
      subscriptionId,
      customerId,
      lastVerifiedAt: Date.now(),
    };
    persistPracStore(session.accountId!);
    const m = membershipOf(store);
    res.json({ membership: { active: m.active, billing: m.billing, activatedAt: m.activatedAt } });
  } catch (err) {
    logger.error({ err }, "Failed to confirm membership payment");
    res.status(502).json({ error: "Could not verify the payment. Please try again." });
  }
});

export default router;
