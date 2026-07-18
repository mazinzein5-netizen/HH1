import { Router, type IRouter, type Request } from "express";
import { randomBytes, createDecipheriv, timingSafeEqual } from "crypto";
import { logger } from "../lib/logger";
import {
  requirePortalSession,
  listHealthcarePractitioners,
  practitionerDirectoryEntry,
  portalAccountEmail,
  type PortalSessionInfo,
} from "./portalAuth";

function providerEmailById(accountId: string): string | null {
  return portalAccountEmail(accountId);
}
import { accountKeyForEmail } from "./practitioner";

const router: IRouter = Router();

/* ────────────────────────────────────────────────────────────────────────────
 * Consent-based live medication exchange (Zero-Server framework).
 *
 * The patient grants a NAMED doctor (GP / treating physician, chosen from the
 * portal directory) live access to their medication list. The patient device
 * then pushes an AES-256-GCM-encrypted snapshot of the current medications,
 * keyed to that grant. The server acts as a relay: it holds ONLY the
 * encrypted blob plus the consent metadata (who / what / when / expiry),
 * entirely in memory — never on disk. The decryption key is generated at
 * grant time; the blob is decrypted only inside the consented provider's
 * authenticated portal session. Revocation or expiry purges the snapshot
 * immediately, and a server restart wipes everything.
 * ──────────────────────────────────────────────────────────────────────────── */

/** Roles a patient can grant live medication access to (doctors only). */
const GRANTABLE_ROLES = ["GP", "Hospital doctor", "Outpatient clinic specialist doctor"];

const GRANT_TTL_MS = 30 * 24 * 60 * 60 * 1000; // consent auto-expires after 30 days
const MAX_GRANTS = 5000;
const MAX_BLOB_CHARS = 120_000;

interface MedGrant {
  grantId: string;
  /** Stable provider identity — SHA-256 of the provider's normalised email. */
  providerKey: string;
  providerName: string;
  providerRole: string;
  providerWorkplace: string;
  /** Display name the patient chose to share. */
  patientName: string;
  /** Secret held by the patient device — authorises push + revoke. */
  patientToken: string;
  /** AES-256-GCM key (hex). Returned once to the patient device at grant time. */
  keyHex: string;
  /** GDPR consent record: who granted what, to whom, and when. */
  consent: {
    scope: "medications";
    grantedAt: string;
    wording: string;
  };
  createdAt: number;
  expiresAt: number;
  /** Latest encrypted snapshot (base64 ciphertext incl. GCM tag) + IV. */
  blob: { ciphertext: string; iv: string; updatedAt: number } | null;
  accessCount: number;
}

const grants = new Map<string, MedGrant>();

/** Max ACTIVE grants a single provider can have — bounds inbox spam. */
const MAX_GRANTS_PER_PROVIDER = 50;

/* ── Lightweight per-IP rate limiting for the unauthenticated patient side.
 * The mobile app has no server accounts (Zero-Server), so the trust boundary
 * for grant creation is the patient device itself. These limits bound abuse:
 * an attacker cannot flood provider inboxes or hammer the relay. ── */
interface RateBucket {
  count: number;
  resetAt: number;
}
const rateBuckets = new Map<string, RateBucket>();

function rateLimited(req: Request, bucket: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  if (rateBuckets.size > 10_000) {
    for (const [k, b] of rateBuckets) if (now >= b.resetAt) rateBuckets.delete(k);
  }
  const ip = (req.headers["x-forwarded-for"] as string | undefined)?.split(",")[0]?.trim() || req.ip || "unknown";
  const key = `${bucket}:${ip}`;
  const b = rateBuckets.get(key);
  if (!b || now >= b.resetAt) {
    rateBuckets.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }
  b.count += 1;
  return b.count > max;
}

function sweepGrants() {
  const now = Date.now();
  for (const [id, g] of grants) {
    if (now >= g.expiresAt) grants.delete(id);
  }
}

function makeGrantId(): string {
  return `HMX-${randomBytes(6).toString("hex").toUpperCase()}`;
}

function tokensMatch(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}

function sessionOf(req: Request): PortalSessionInfo {
  return (req as Request & { portalSession: PortalSessionInfo }).portalSession;
}

// ── Patient-side endpoints (called from the mobile app) ─────────────────────

/**
 * GET /med-exchange/providers
 * Doctor-role practitioners the patient can grant live medication access to.
 */
router.get("/med-exchange/providers", (_req, res) => {
  const providers = listHealthcarePractitioners().filter((p) => GRANTABLE_ROLES.includes(p.role));
  res.json({ providers });
});

/**
 * POST /med-exchange/grants
 * Patient grants a named doctor live medication access.
 * Body: { providerId, patientName, consentWording }
 * Returns: { grantId, patientToken, keyHex, provider, expiresAt }
 */
router.post("/med-exchange/grants", (req, res) => {
  sweepGrants();
  if (rateLimited(req, "grant", 10, 60 * 60_000)) {
    res.status(429).json({ error: "TOO_MANY_REQUESTS", message: "Too many grant requests — try again later." });
    return;
  }
  if (grants.size >= MAX_GRANTS) {
    res.status(503).json({ error: "Exchange service is busy — please try again shortly." });
    return;
  }
  const { providerId, patientName, consentWording } = req.body as {
    providerId?: unknown;
    patientName?: unknown;
    consentWording?: unknown;
  };
  if (typeof providerId !== "string" || !providerId.trim()) {
    res.status(400).json({ error: "providerId is required" });
    return;
  }
  const provider = practitionerDirectoryEntry(providerId.trim());
  if (!provider || !GRANTABLE_ROLES.includes(provider.role)) {
    res.status(404).json({
      error: "PROVIDER_NOT_FOUND",
      message: "Live medication access can only be granted to a GP or treating physician on the HIVE portal.",
    });
    return;
  }
  const providerEmail = providerEmailById(providerId.trim());
  if (!providerEmail) {
    res.status(404).json({ error: "PROVIDER_NOT_FOUND" });
    return;
  }
  const name = typeof patientName === "string" ? patientName.trim().slice(0, 80) : "";
  if (!name) {
    res.status(400).json({ error: "patientName is required" });
    return;
  }
  const providerKey = accountKeyForEmail(providerEmail);
  let activeForProvider = 0;
  for (const g of grants.values()) if (g.providerKey === providerKey) activeForProvider += 1;
  if (activeForProvider >= MAX_GRANTS_PER_PROVIDER) {
    res.status(503).json({
      error: "PROVIDER_AT_CAPACITY",
      message: "This provider cannot accept more live medication shares right now.",
    });
    return;
  }
  const now = Date.now();
  const grant: MedGrant = {
    grantId: makeGrantId(),
    providerKey,
    providerName: provider.fullName,
    providerRole: provider.role,
    providerWorkplace: provider.workplace,
    patientName: name,
    patientToken: randomBytes(24).toString("hex"),
    keyHex: randomBytes(32).toString("hex"),
    consent: {
      scope: "medications",
      grantedAt: new Date(now).toISOString(),
      wording:
        typeof consentWording === "string" && consentWording.trim()
          ? consentWording.trim().slice(0, 600)
          : "Patient consented in HIVE COMPANION to share their live medication list with this provider.",
    },
    createdAt: now,
    expiresAt: now + GRANT_TTL_MS,
    blob: null,
    accessCount: 0,
  };
  grants.set(grant.grantId, grant);
  logger.info(
    { grantId: grant.grantId, provider: provider.fullName },
    "Live medication grant created (transient, in-memory)",
  );
  res.json({
    grantId: grant.grantId,
    patientToken: grant.patientToken,
    keyHex: grant.keyHex,
    provider: { id: provider.id, fullName: provider.fullName, role: provider.role, workplace: provider.workplace },
    grantedAt: grant.consent.grantedAt,
    expiresAt: new Date(grant.expiresAt).toISOString(),
  });
});

/**
 * POST /med-exchange/push
 * Patient device pushes the latest ENCRYPTED medication snapshot.
 * Body: { grantId, patientToken, ciphertext (b64, incl. GCM tag), iv (b64) }
 */
router.post("/med-exchange/push", (req, res) => {
  sweepGrants();
  if (rateLimited(req, "push", 60, 10 * 60_000)) {
    res.status(429).json({ error: "TOO_MANY_REQUESTS", message: "Too many pushes — try again shortly." });
    return;
  }
  const { grantId, patientToken, ciphertext, iv } = req.body as {
    grantId?: unknown;
    patientToken?: unknown;
    ciphertext?: unknown;
    iv?: unknown;
  };
  if (
    typeof grantId !== "string" ||
    typeof patientToken !== "string" ||
    typeof ciphertext !== "string" ||
    typeof iv !== "string"
  ) {
    res.status(400).json({ error: "grantId, patientToken, ciphertext and iv are required" });
    return;
  }
  if (ciphertext.length > MAX_BLOB_CHARS || iv.length > 64) {
    res.status(413).json({ error: "snapshot too large" });
    return;
  }
  const grant = grants.get(grantId.trim());
  if (!grant || !tokensMatch(grant.patientToken, patientToken)) {
    res.status(404).json({ error: "GRANT_NOT_FOUND", message: "This consent grant no longer exists." });
    return;
  }
  grant.blob = { ciphertext, iv, updatedAt: Date.now() };
  res.json({ ok: true, updatedAt: new Date(grant.blob.updatedAt).toISOString() });
});

/**
 * POST /med-exchange/revoke
 * Patient revokes consent — grant AND encrypted snapshot are purged.
 * Body: { grantId, patientToken }
 */
router.post("/med-exchange/revoke", (req, res) => {
  const { grantId, patientToken } = req.body as { grantId?: unknown; patientToken?: unknown };
  if (typeof grantId !== "string" || typeof patientToken !== "string") {
    res.status(400).json({ error: "grantId and patientToken are required" });
    return;
  }
  const grant = grants.get(grantId.trim());
  if (grant && tokensMatch(grant.patientToken, patientToken)) {
    grants.delete(grant.grantId);
    logger.info({ grantId: grant.grantId }, "Live medication grant revoked — snapshot purged");
  }
  // Always 200 — revocation is idempotent and non-enumerable.
  res.json({ revoked: true });
});

// ── Provider-side endpoint (portal) ─────────────────────────────────────────

function demoLiveShares() {
  const now = Date.now();
  return {
    demo: true,
    shares: [
      {
        grantId: "HMX-DEMO",
        patientName: "Demo Patient (fictional)",
        grantedAt: new Date(now - 4 * 24 * 60 * 60_000).toISOString(),
        expiresAt: new Date(now + 26 * 24 * 60 * 60_000).toISOString(),
        updatedAt: new Date(now - 6 * 60_000).toISOString(),
        payload: {
          generatedAt: new Date(now - 6 * 60_000).toISOString(),
          medications: [
            { medication: "Apixaban", dose: "5 mg", frequency: "Twice daily", route: "Oral" },
            { medication: "Metformin", dose: "1 g", frequency: "Twice daily", route: "Oral" },
            { medication: "Atorvastatin", dose: "40 mg", frequency: "At night", route: "Oral" },
          ],
          notes: "FICTIONAL DEMO DATA for portal exploration — not a real patient.",
        },
      },
    ],
  };
}

/**
 * GET /med-exchange/live
 * Live medication snapshots shared with THIS logged-in provider by patient
 * consent. Only the consented provider's session can read a snapshot —
 * consent is matched on the provider's stable account key, so other roles
 * (including supportive-care accounts) and other doctors see nothing.
 */
router.get("/med-exchange/live", requirePortalSession, (req, res) => {
  sweepGrants();
  const session = sessionOf(req);
  if (session.demo) {
    // Demo sessions may ONLY view canned demo data — never real patient shares.
    res.json(demoLiveShares());
    return;
  }
  if (!session.email || !session.role || !GRANTABLE_ROLES.includes(session.role)) {
    res.status(403).json({
      error: "DOCTOR_ROLE_REQUIRED",
      message: "Live medication data is available to consented GP / treating physician accounts only.",
    });
    return;
  }
  const myKey = accountKeyForEmail(session.email);
  const shares: unknown[] = [];
  for (const g of grants.values()) {
    if (g.providerKey !== myKey) continue;
    let payload: unknown = null;
    if (g.blob) {
      try {
        payload = decryptBlob(g.keyHex, g.blob.iv, g.blob.ciphertext);
        g.accessCount += 1;
      } catch (err) {
        logger.warn({ err, grantId: g.grantId }, "Could not decrypt live medication snapshot");
        continue;
      }
    }
    shares.push({
      grantId: g.grantId,
      patientName: g.patientName,
      grantedAt: g.consent.grantedAt,
      expiresAt: new Date(g.expiresAt).toISOString(),
      updatedAt: g.blob ? new Date(g.blob.updatedAt).toISOString() : null,
      payload,
    });
  }
  res.json({ shares });
});

/** AES-256-GCM decrypt: ciphertext is base64 of (encrypted bytes ‖ 16-byte tag). */
function decryptBlob(keyHex: string, ivB64: string, ciphertextB64: string): unknown {
  const key = Buffer.from(keyHex, "hex");
  const iv = Buffer.from(ivB64, "base64");
  const data = Buffer.from(ciphertextB64, "base64");
  if (data.length <= 16) throw new Error("ciphertext too short");
  const tag = data.subarray(data.length - 16);
  const enc = data.subarray(0, data.length - 16);
  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  const plain = Buffer.concat([decipher.update(enc), decipher.final()]);
  return JSON.parse(plain.toString("utf8"));
}

export default router;
