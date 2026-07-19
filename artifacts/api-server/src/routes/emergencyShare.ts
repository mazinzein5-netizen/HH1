import { Router, type IRouter, type Request } from "express";
import { randomBytes } from "crypto";
import { logger } from "../lib/logger";
import { requirePortalSession, type PortalSessionInfo } from "./portalAuth";

const router: IRouter = Router();

/* ────────────────────────────────────────────────────────────────────────────
 * Emergency share relay (Zero-Server framework).
 *
 * The patient generates a time-limited share on their device with explicit
 * consent. The payload is held ONLY in server memory as a transient relay —
 * never written to disk or a database — and is deleted automatically when it
 * expires, when the patient revokes it, or when the server restarts.
 *
 * Caretaker links work the same way: an opted-in patient (Red Geriatric Pack)
 * pushes their latest GPS position and vital signs; a linked caretaker portal
 * reads the latest snapshot. Only the most recent snapshot is kept.
 * ──────────────────────────────────────────────────────────────────────────── */

/** Unambiguous charset — no 0/O or 1/I, readable over the phone. */
const CODE_CHARS = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

function makeCode(prefix: string): string {
  const bytes = randomBytes(8);
  const block = (offset: number) =>
    Array.from({ length: 4 }, (_, i) => CODE_CHARS[bytes[offset + i]! % CODE_CHARS.length]).join("");
  return `${prefix}-${block(0)}-${block(4)}`;
}

// ── Demo data (the only thing demo sessions can ever see) ───────────────────

export const DEMO_SHARE_CODE = "HES-DEMO-2026";
export const DEMO_LINK_CODE = "HCL-DEMO-2026";

function demoSharePayload() {
  const now = Date.now();
  return {
    demo: true,
    payload: {
      patientName: "Demo Patient (fictional)",
      generatedAt: new Date(now - 10 * 60_000).toISOString(),
      allergies: [
        { drug: "Penicillin", reaction: "Anaphylaxis", severity: "life-threatening" },
        { drug: "Ibuprofen", reaction: "Urticaria", severity: "moderate" },
      ],
      redFlags: ["Atrial fibrillation — on anticoagulation", "Type 2 diabetes"],
      medications: [
        { medication: "Apixaban", dose: "5 mg", frequency: "Twice daily", route: "Oral" },
        { medication: "Metformin", dose: "1 g", frequency: "Twice daily", route: "Oral" },
        { medication: "Atorvastatin", dose: "40 mg", frequency: "At night", route: "Oral" },
      ],
      conditions: [
        { name: "Atrial fibrillation", status: "active" },
        { name: "Type 2 diabetes", status: "active" },
        { name: "Appendicectomy", status: "resolved", diagnosedDate: "2009" },
      ],
      notes: "FICTIONAL DEMO DATA for portal exploration — not a real patient.",
    },
    createdAt: new Date(now - 10 * 60_000).toISOString(),
    expiresAt: new Date(now + 50 * 60_000).toISOString(),
    accessCount: 1,
  };
}

function demoLinkSnapshot() {
  const now = Date.now();
  return {
    demo: true,
    patientLabel: "Demo resident (fictional)",
    createdAt: new Date(now - 3 * 60 * 60_000).toISOString(),
    lastSeenAt: new Date(now - 2 * 60_000).toISOString(),
    location: { lat: 53.3455, lng: -6.2622, accuracyM: 12, ts: new Date(now - 2 * 60_000).toISOString() },
    vitals: { hr: 72, spo2: 97, glucose: 6.1, ecg: "Normal sinus rhythm", ts: new Date(now - 2 * 60_000).toISOString() },
  };
}

// ── Emergency shares ─────────────────────────────────────────────────────────

const SHARE_MIN_TTL_MIN = 5;
const SHARE_MAX_TTL_MIN = 24 * 60;
const SHARE_DEFAULT_TTL_MIN = 60;
const MAX_SHARES = 5000;
const MAX_PAYLOAD_CHARS = 60_000;

interface EmergencyShare {
  code: string;
  /** Structured summary assembled on the patient's device. */
  payload: unknown;
  createdAt: number;
  expiresAt: number;
  accessCount: number;
  revokeToken: string;
}

const shares = new Map<string, EmergencyShare>();

function sweepShares() {
  const now = Date.now();
  for (const [code, s] of shares) {
    if (now >= s.expiresAt) shares.delete(code);
  }
}

/**
 * POST /emergency-share
 * Called from the patient's mobile app after explicit consent.
 * Body: { payload: object, ttlMinutes?: number }
 * Returns: { code, expiresAt, revokeToken }
 */
router.post("/emergency-share", (req, res) => {
  sweepShares();
  if (shares.size >= MAX_SHARES) {
    res.status(503).json({ error: "Share service is busy — please try again shortly." });
    return;
  }

  const { payload, ttlMinutes } = req.body as { payload?: unknown; ttlMinutes?: unknown };
  if (payload == null || typeof payload !== "object") {
    res.status(400).json({ error: "payload object is required" });
    return;
  }
  const serialized = JSON.stringify(payload);
  if (serialized.length > MAX_PAYLOAD_CHARS) {
    res.status(413).json({ error: "payload too large" });
    return;
  }

  const ttlRaw = typeof ttlMinutes === "number" ? ttlMinutes : SHARE_DEFAULT_TTL_MIN;
  const ttl = Math.min(SHARE_MAX_TTL_MIN, Math.max(SHARE_MIN_TTL_MIN, Math.round(ttlRaw)));

  let code = makeCode("HES");
  while (shares.has(code)) code = makeCode("HES");

  const now = Date.now();
  const share: EmergencyShare = {
    code,
    payload,
    createdAt: now,
    expiresAt: now + ttl * 60_000,
    accessCount: 0,
    revokeToken: randomBytes(16).toString("hex"),
  };
  shares.set(code, share);
  logger.info({ code, ttl }, "Emergency share created (transient, in-memory)");
  res.json({ code, expiresAt: new Date(share.expiresAt).toISOString(), revokeToken: share.revokeToken });
});

/**
 * POST /emergency-share/claim
 * Called from the portal by a healthcare worker with the patient-given code.
 * Body: { code }
 */
router.post("/emergency-share/claim", requirePortalSession, (req, res) => {
  sweepShares();
  const session = (req as Request & { portalSession: PortalSessionInfo }).portalSession;
  const { code } = req.body as { code?: unknown };
  if (typeof code !== "string" || !code.trim()) {
    res.status(400).json({ error: "code is required" });
    return;
  }
  const normalized = code.trim().toUpperCase();
  if (normalized === DEMO_SHARE_CODE) {
    res.json(demoSharePayload());
    return;
  }
  if (session.demo) {
    // Demo sessions may ONLY view canned demo data — never real patient shares.
    res.status(403).json({
      error: "DEMO_RESTRICTED",
      message: `Demo access can only open the demo code ${DEMO_SHARE_CODE}. Register and verify to access real shares.`,
    });
    return;
  }
  const share = shares.get(normalized);
  if (!share || Date.now() >= share.expiresAt) {
    res.status(404).json({ error: "SHARE_NOT_FOUND", message: "This code is invalid or has expired." });
    return;
  }
  share.accessCount += 1;
  res.json({
    payload: share.payload,
    createdAt: new Date(share.createdAt).toISOString(),
    expiresAt: new Date(share.expiresAt).toISOString(),
    accessCount: share.accessCount,
  });
});

/**
 * POST /emergency-share/revoke
 * Called from the patient's device. Body: { code, revokeToken }
 */
router.post("/emergency-share/revoke", (req, res) => {
  const { code, revokeToken } = req.body as { code?: unknown; revokeToken?: unknown };
  if (typeof code !== "string" || typeof revokeToken !== "string") {
    res.status(400).json({ error: "code and revokeToken are required" });
    return;
  }
  const share = shares.get(code.trim().toUpperCase());
  if (share && share.revokeToken === revokeToken) {
    shares.delete(share.code);
  }
  // Always 200 — revocation is idempotent and non-enumerable.
  res.json({ revoked: true });
});

// ── Caretaker links (Red Geriatric Pack opt-in) ─────────────────────────────

interface VitalSnapshot {
  hr?: number;
  spo2?: number;
  glucose?: number;
  ecg?: string;
  ts: string;
}

interface CaretakerLink {
  linkCode: string;
  /** Display label chosen by the patient, e.g. first name — no identifiers required. */
  patientLabel: string;
  createdAt: number;
  lastSeenAt: number | null;
  location: { lat: number; lng: number; accuracyM?: number; ts: string } | null;
  vitals: VitalSnapshot | null;
  updateToken: string;
}

const MAX_LINKS = 2000;
/** Links idle for 30 days are dropped. */
const LINK_IDLE_MS = 30 * 24 * 60 * 60 * 1000;
const links = new Map<string, CaretakerLink>();

function sweepLinks() {
  const now = Date.now();
  for (const [code, l] of links) {
    const lastActivity = l.lastSeenAt ?? l.createdAt;
    if (now - lastActivity > LINK_IDLE_MS) links.delete(code);
  }
}

/**
 * POST /caretaker-link
 * Created from the patient's device when they opt in to caretaker sharing.
 * Body: { patientLabel }
 */
router.post("/caretaker-link", (req, res) => {
  sweepLinks();
  if (links.size >= MAX_LINKS) {
    res.status(503).json({ error: "Caretaker link service is busy — please try again shortly." });
    return;
  }
  const { patientLabel } = req.body as { patientLabel?: unknown };
  const label = typeof patientLabel === "string" ? patientLabel.trim().slice(0, 60) : "";
  if (!label) {
    res.status(400).json({ error: "patientLabel is required" });
    return;
  }
  let linkCode = makeCode("HCL");
  while (links.has(linkCode)) linkCode = makeCode("HCL");
  const link: CaretakerLink = {
    linkCode,
    patientLabel: label,
    createdAt: Date.now(),
    lastSeenAt: null,
    location: null,
    vitals: null,
    updateToken: randomBytes(16).toString("hex"),
  };
  links.set(linkCode, link);
  res.json({ linkCode, updateToken: link.updateToken });
});

/**
 * POST /caretaker-link/update
 * Patient's device pushes the latest snapshot (only most recent is kept).
 * Body: { linkCode, updateToken, location?, vitals? }
 */
router.post("/caretaker-link/update", (req, res) => {
  const { linkCode, updateToken, location, vitals } = req.body as {
    linkCode?: unknown;
    updateToken?: unknown;
    location?: { lat?: unknown; lng?: unknown; accuracyM?: unknown };
    vitals?: { hr?: unknown; spo2?: unknown; glucose?: unknown; ecg?: unknown };
  };
  if (typeof linkCode !== "string" || typeof updateToken !== "string") {
    res.status(400).json({ error: "linkCode and updateToken are required" });
    return;
  }
  const link = links.get(linkCode.trim().toUpperCase());
  if (!link || link.updateToken !== updateToken) {
    res.status(404).json({ error: "LINK_NOT_FOUND" });
    return;
  }
  const nowIso = new Date().toISOString();
  if (location && typeof location.lat === "number" && typeof location.lng === "number") {
    link.location = {
      lat: location.lat,
      lng: location.lng,
      ...(typeof location.accuracyM === "number" ? { accuracyM: location.accuracyM } : {}),
      ts: nowIso,
    };
  }
  if (vitals && typeof vitals === "object") {
    const v: VitalSnapshot = { ts: nowIso };
    if (typeof vitals.hr === "number") v.hr = vitals.hr;
    if (typeof vitals.spo2 === "number") v.spo2 = vitals.spo2;
    if (typeof vitals.glucose === "number") v.glucose = vitals.glucose;
    if (typeof vitals.ecg === "string") v.ecg = vitals.ecg.slice(0, 60);
    if (Object.keys(v).length > 1) link.vitals = v;
  }
  link.lastSeenAt = Date.now();
  res.json({ ok: true });
});

/**
 * GET /caretaker-link/:code
 * Portal caretaker view — latest snapshot with freshness timestamps.
 */
router.get("/caretaker-link/:code", requirePortalSession, (req, res) => {
  sweepLinks();
  const session = (req as Request & { portalSession: PortalSessionInfo }).portalSession;
  const normalized = String(req.params.code ?? "").trim().toUpperCase();
  if (normalized === DEMO_LINK_CODE) {
    res.json(demoLinkSnapshot());
    return;
  }
  if (session.demo) {
    res.status(403).json({
      error: "DEMO_RESTRICTED",
      message: `Demo access can only open the demo link ${DEMO_LINK_CODE}. Register and verify to access real links.`,
    });
    return;
  }
  const link = links.get(normalized);
  if (!link) {
    res.status(404).json({ error: "LINK_NOT_FOUND", message: "This caretaker link is invalid or was revoked." });
    return;
  }
  res.json({
    patientLabel: link.patientLabel,
    createdAt: new Date(link.createdAt).toISOString(),
    lastSeenAt: link.lastSeenAt ? new Date(link.lastSeenAt).toISOString() : null,
    location: link.location,
    vitals: link.vitals,
  });
});

/**
 * POST /caretaker-link/revoke
 * Patient's device stops sharing. Body: { linkCode, updateToken }
 */
router.post("/caretaker-link/revoke", (req, res) => {
  const { linkCode, updateToken } = req.body as { linkCode?: unknown; updateToken?: unknown };
  if (typeof linkCode !== "string" || typeof updateToken !== "string") {
    res.status(400).json({ error: "linkCode and updateToken are required" });
    return;
  }
  const link = links.get(linkCode.trim().toUpperCase());
  if (link && link.updateToken === updateToken) {
    links.delete(link.linkCode);
  }
  res.json({ revoked: true });
});

export default router;
