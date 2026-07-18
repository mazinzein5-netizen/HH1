import { Router, type IRouter, type Request, type Response, type NextFunction } from "express";
import { createHash, randomBytes, scryptSync, timingSafeEqual } from "crypto";
import {
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
  type AuthenticationResponseJSON,
  type RegistrationResponseJSON,
  type WebAuthnCredential,
} from "@simplewebauthn/server";
import { logger } from "../lib/logger";

const router: IRouter = Router();

/* ────────────────────────────────────────────────────────────────────────────
 * Portal authentication (Emergency Portal for healthcare workers/caretakers).
 *
 * Accounts and sessions are held ONLY in server memory (Zero-Server framework:
 * this is a pilot relay, not a persistent registry). Password hashes use
 * scrypt. Login is two-step:
 *   1. password → short-lived login token
 *   2. WebAuthn biometric assertion, VERIFIED SERVER-SIDE against the
 *      credential public key registered at signup → session token.
 * Sensitive read endpoints require a session.
 *
 * Demo sessions exist so visitors can explore the portal, but they can ONLY
 * access canned demo data — never real patient shares.
 * ──────────────────────────────────────────────────────────────────────────── */

const HEALTHCARE_ROLES = [
  "GP",
  "Hospital doctor",
  "First responder",
  "Physiotherapist",
  "Outpatient clinic specialist doctor",
  "A&E follow-up",
  "Occupational health specialist",
];

interface PortalAccount {
  id: string;
  fullName: string;
  workplace: string;
  email: string;
  salt: string;
  hash: Buffer;
  accountType: "healthcare" | "caretaker";
  role?: string;
  mode: "demo" | "full";
  status: "demo" | "verification_ongoing" | "verified";
  createdAt: number;
  /** WebAuthn credential registered at signup (verified server-side). */
  credential?: WebAuthnCredential;
  /** Founder superuser — seeded from environment secrets, never registerable. */
  superuser?: boolean;
}

interface PortalSession {
  token: string;
  accountId: string | null; // null for anonymous demo sessions
  demo: boolean;
  expiresAt: number;
}

const MAX_ACCOUNTS = 5000;
const LOGIN_TOKEN_TTL_MS = 5 * 60_000;
const SESSION_TTL_MS = 8 * 60 * 60_000;

const accounts = new Map<string, PortalAccount>(); // keyed by lowercase email
const loginTokens = new Map<string, { accountId: string; expiresAt: number; challenge?: string }>();
/** Registration challenges keyed by one-time webauthnToken issued at register. */
const registrationChallenges = new Map<string, { accountId: string; challenge?: string; expiresAt: number }>();
const sessions = new Map<string, PortalSession>();

function sweep() {
  const now = Date.now();
  for (const [t, l] of loginTokens) if (now >= l.expiresAt) loginTokens.delete(t);
  for (const [t, r] of registrationChallenges) if (now >= r.expiresAt) registrationChallenges.delete(t);
  for (const [t, s] of sessions) if (now >= s.expiresAt) sessions.delete(t);
}

function hashPassword(password: string, salt: string): Buffer {
  return scryptSync(password, salt, 32);
}

function accountById(id: string): PortalAccount | undefined {
  for (const a of accounts.values()) if (a.id === id) return a;
  return undefined;
}

function publicAccount(a: PortalAccount) {
  return {
    id: a.id,
    fullName: a.fullName,
    workplace: a.workplace,
    email: a.email,
    accountType: a.accountType,
    role: a.role,
    mode: a.mode,
    status: a.status,
    hasPasskey: !!a.credential,
    superuser: !!a.superuser,
  };
}

/**
 * Seed (or refresh) the founder superuser account from environment secrets.
 * The credential is NEVER hardcoded: both the email and the password come
 * from SUPERUSER_EMAIL / SUPERUSER_PASSWORD, delivered privately as secrets.
 * The account is re-seeded lazily on login so a rotated secret takes effect
 * immediately and the account survives in-memory restarts.
 */
function ensureSuperuserAccount(): void {
  const email = process.env.SUPERUSER_EMAIL?.trim().toLowerCase();
  const password = process.env.SUPERUSER_PASSWORD;
  if (!email || !password || password.length < 12) return;
  const existing = accounts.get(email);
  const salt = existing?.salt ?? randomBytes(16).toString("hex");
  const hash = hashPassword(password, salt);
  if (existing) {
    // Never let a regular signup claim the superuser email.
    existing.superuser = true;
    existing.salt = salt;
    existing.hash = hash;
    existing.mode = "full";
    existing.status = "verified";
    // Normalize the founder profile so every role gate passes regardless of
    // how a pre-existing record with this email was originally created.
    existing.accountType = "healthcare";
    existing.role = "GP";
    return;
  }
  accounts.set(email, {
    id: randomBytes(12).toString("hex"),
    fullName: "HIVE Founder",
    workplace: "Health HIVE",
    email,
    salt,
    hash,
    accountType: "healthcare",
    role: "GP",
    mode: "full",
    status: "verified",
    createdAt: Date.now(),
    superuser: true,
  });
  logger.info("Superuser account seeded from environment secrets");
}

/** Derive the WebAuthn relying-party ID + origin from the request. */
function rpFromRequest(req: Request): { rpID: string; origin: string } {
  const originHeader = typeof req.headers.origin === "string" ? req.headers.origin : "";
  try {
    const url = new URL(originHeader);
    return { rpID: url.hostname, origin: originHeader };
  } catch {
    const domain = process.env.REPLIT_DEV_DOMAIN || "localhost";
    return { rpID: domain, origin: `https://${domain}` };
  }
}

const isProduction = process.env.NODE_ENV === "production";

/**
 * POST /portal/register
 * Body: { fullName, workplace, email, password, accountType, role?, mode }
 * Returns { account, webauthnToken } — the token authorizes passkey
 * registration for this new account (10 min).
 */
router.post("/portal/register", (req, res) => {
  sweep();
  if (accounts.size >= MAX_ACCOUNTS) {
    res.status(503).json({ error: "Registration is busy — please try again shortly." });
    return;
  }
  const { fullName, workplace, email, password, accountType, role, mode } = req.body as Record<string, unknown>;
  if (
    typeof fullName !== "string" || !fullName.trim() ||
    typeof email !== "string" || !email.trim() ||
    typeof password !== "string" || password.length < 8 ||
    (accountType !== "healthcare" && accountType !== "caretaker")
  ) {
    res.status(400).json({ error: "fullName, email, password (min 8 chars) and accountType are required." });
    return;
  }
  if (accountType === "healthcare" && (typeof role !== "string" || !HEALTHCARE_ROLES.includes(role))) {
    res.status(400).json({ error: "A valid healthcare role is required." });
    return;
  }
  const key = email.trim().toLowerCase();
  if (key === process.env.SUPERUSER_EMAIL?.trim().toLowerCase()) {
    // The founder credential is seeded from secrets — never via signup.
    res.status(409).json({ error: "An account with this email already exists." });
    return;
  }
  if (accounts.has(key)) {
    res.status(409).json({ error: "An account with this email already exists." });
    return;
  }
  const verificationMode = mode === "full" ? "full" : "demo";
  const salt = randomBytes(16).toString("hex");
  const account: PortalAccount = {
    id: randomBytes(12).toString("hex"),
    fullName: fullName.trim().slice(0, 120),
    workplace: typeof workplace === "string" ? workplace.trim().slice(0, 160) : "",
    email: key,
    salt,
    hash: hashPassword(password, salt),
    accountType,
    ...(accountType === "healthcare" ? { role: role as string } : {}),
    mode: verificationMode,
    status: verificationMode === "full" ? "verification_ongoing" : "demo",
    createdAt: Date.now(),
  };
  accounts.set(key, account);
  const webauthnToken = randomBytes(24).toString("hex");
  registrationChallenges.set(webauthnToken, { accountId: account.id, expiresAt: Date.now() + 10 * 60_000 });
  logger.info({ accountId: account.id, mode: account.mode }, "Portal account registered (in-memory)");
  res.json({ account: publicAccount(account), webauthnToken });
});

/**
 * POST /portal/webauthn/register-options
 * Body: { webauthnToken } → WebAuthn registration options.
 */
router.post("/portal/webauthn/register-options", async (req, res) => {
  sweep();
  const { webauthnToken } = req.body as Record<string, unknown>;
  const pending = typeof webauthnToken === "string" ? registrationChallenges.get(webauthnToken) : undefined;
  const account = pending ? accountById(pending.accountId) : undefined;
  if (!pending || !account) {
    res.status(401).json({ error: "Registration window expired — please sign up again." });
    return;
  }
  const { rpID } = rpFromRequest(req);
  const options = await generateRegistrationOptions({
    rpName: "HIVE Emergency Portal",
    rpID,
    userName: account.email,
    userDisplayName: account.fullName,
    attestationType: "none",
    authenticatorSelection: {
      authenticatorAttachment: "platform",
      userVerification: "required",
      residentKey: "preferred",
    },
  });
  pending.challenge = options.challenge;
  res.json({ options });
});

/**
 * POST /portal/webauthn/register-verify
 * Body: { webauthnToken, response } — verifies attestation and stores the
 * credential public key on the account.
 */
router.post("/portal/webauthn/register-verify", async (req, res) => {
  sweep();
  const { webauthnToken, response } = req.body as { webauthnToken?: unknown; response?: unknown };
  const pending = typeof webauthnToken === "string" ? registrationChallenges.get(webauthnToken) : undefined;
  const account = pending ? accountById(pending.accountId) : undefined;
  if (!pending || !pending.challenge || !account || response == null) {
    res.status(401).json({ error: "Registration window expired — please sign up again." });
    return;
  }
  const { rpID, origin } = rpFromRequest(req);
  try {
    const verification = await verifyRegistrationResponse({
      response: response as RegistrationResponseJSON,
      expectedChallenge: pending.challenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      requireUserVerification: true,
    });
    if (!verification.verified || !verification.registrationInfo) {
      res.status(400).json({ error: "Passkey registration could not be verified." });
      return;
    }
    account.credential = verification.registrationInfo.credential;
    registrationChallenges.delete(webauthnToken as string);
    res.json({ verified: true });
  } catch (err) {
    logger.warn({ err }, "WebAuthn registration verification failed");
    res.status(400).json({ error: "Passkey registration could not be verified." });
  }
});

/**
 * POST /portal/login — step 1 (password).
 * Body: { email, password } → { loginToken, hasPasskey }
 */
router.post("/portal/login", (req, res) => {
  sweep();
  ensureSuperuserAccount();
  const { email, password } = req.body as Record<string, unknown>;
  if (typeof email !== "string" || typeof password !== "string") {
    res.status(400).json({ error: "email and password are required." });
    return;
  }
  const account = accounts.get(email.trim().toLowerCase());
  const candidate = account ? hashPassword(password, account.salt) : hashPassword(password, "0000");
  if (!account || !timingSafeEqual(candidate, account.hash)) {
    res.status(401).json({ error: "Incorrect email or password." });
    return;
  }
  const loginToken = randomBytes(24).toString("hex");
  loginTokens.set(loginToken, { accountId: account.id, expiresAt: Date.now() + LOGIN_TOKEN_TTL_MS });
  // Superuser first login (or after a restart of the in-memory account store):
  // no passkey exists yet, so issue a one-time registration token. Biometric
  // 2FA remains mandatory — this only lets the founder enrol the passkey.
  let webauthnToken: string | undefined;
  if (account.superuser && !account.credential) {
    webauthnToken = randomBytes(24).toString("hex");
    registrationChallenges.set(webauthnToken, {
      accountId: account.id,
      expiresAt: Date.now() + 10 * 60_000,
    });
  }
  res.json({
    loginToken,
    requiresSecondFactor: true,
    hasPasskey: !!account.credential,
    ...(webauthnToken ? { needsPasskeySetup: true, webauthnToken } : {}),
  });
});

/**
 * POST /portal/2fa/options — step 2a. Body: { loginToken }
 * Returns server-generated WebAuthn authentication options.
 */
router.post("/portal/2fa/options", async (req, res) => {
  sweep();
  const { loginToken } = req.body as Record<string, unknown>;
  const pending = typeof loginToken === "string" ? loginTokens.get(loginToken) : undefined;
  const account = pending ? accountById(pending.accountId) : undefined;
  if (!pending || !account) {
    res.status(401).json({ error: "Login expired — please start again." });
    return;
  }
  if (!account.credential) {
    res.status(403).json({
      error: "NO_CREDENTIAL",
      message: "No passkey is registered for this account. Sign up again on a device with biometrics.",
    });
    return;
  }
  const { rpID } = rpFromRequest(req);
  const options = await generateAuthenticationOptions({
    rpID,
    userVerification: "required",
    allowCredentials: [{ id: account.credential.id, transports: account.credential.transports }],
  });
  pending.challenge = options.challenge;
  res.json({ options });
});

/**
 * POST /portal/2fa/verify — step 2b.
 * Body: { loginToken, response } — the WebAuthn assertion, verified against
 * the stored credential public key. Only then is a session minted.
 * DEV-ONLY: { loginToken, devSimulate: true } is accepted when not in
 * production, for environments without a platform authenticator.
 */
router.post("/portal/2fa/verify", async (req, res) => {
  sweep();
  const { loginToken, response, devSimulate } = req.body as {
    loginToken?: unknown;
    response?: unknown;
    devSimulate?: unknown;
  };
  const pending = typeof loginToken === "string" ? loginTokens.get(loginToken) : undefined;
  const account = pending ? accountById(pending.accountId) : undefined;
  if (!pending || !account) {
    res.status(401).json({ error: "Login expired — please start again." });
    return;
  }

  if (devSimulate === true) {
    if (isProduction) {
      res.status(403).json({ error: "Biometric verification is required." });
      return;
    }
    logger.warn({ accountId: account.id }, "DEV-ONLY simulated biometric pass used");
  } else {
    if (!account.credential || !pending.challenge || response == null) {
      res.status(400).json({ error: "Biometric verification is required." });
      return;
    }
    try {
      const verification = await verifyAuthenticationResponse({
        response: response as AuthenticationResponseJSON,
        expectedChallenge: pending.challenge,
        expectedOrigin: rpFromRequest(req).origin,
        expectedRPID: rpFromRequest(req).rpID,
        credential: account.credential,
        requireUserVerification: true,
      });
      if (!verification.verified) {
        res.status(401).json({ error: "Biometric verification failed." });
        return;
      }
      account.credential.counter = verification.authenticationInfo.newCounter;
    } catch (err) {
      logger.warn({ err }, "WebAuthn authentication verification failed");
      res.status(401).json({ error: "Biometric verification failed." });
      return;
    }
  }

  loginTokens.delete(loginToken as string);
  const sessionToken = randomBytes(24).toString("hex");
  sessions.set(sessionToken, {
    token: sessionToken,
    accountId: account.id,
    // Accounts registered in demo mode only ever see demo data.
    demo: account.mode === "demo",
    expiresAt: Date.now() + SESSION_TTL_MS,
  });
  res.json({ sessionToken, account: publicAccount(account) });
});

/**
 * POST /portal/demo-session
 * Anonymous demo exploration — session restricted to canned demo data.
 */
router.post("/portal/demo-session", (_req, res) => {
  sweep();
  const sessionToken = randomBytes(24).toString("hex");
  sessions.set(sessionToken, {
    token: sessionToken,
    accountId: null,
    demo: true,
    expiresAt: Date.now() + SESSION_TTL_MS,
  });
  res.json({ sessionToken, demo: true });
});

/** POST /portal/logout — uses Authorization header. */
router.post("/portal/logout", (req, res) => {
  const token = bearerToken(req);
  if (token) sessions.delete(token);
  res.json({ ok: true });
});

// ── Session helpers used by protected relay endpoints ───────────────────────

function bearerToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) return null;
  return header.slice(7).trim() || null;
}

export interface PortalSessionInfo {
  demo: boolean;
  accountId: string | null;
  accountType: "healthcare" | "caretaker" | null;
  role: string | null;
  /** Normalised (lowercase) account email — stable across restarts. */
  email: string | null;
  /** Founder superuser — passes every role/membership gate (read/test capacity). */
  superuser: boolean;
}

/** Normalised email for an account id (stable identity across restarts). */
export function portalAccountEmail(accountId: string): string | null {
  return accountById(accountId)?.email ?? null;
}

export function getPortalSession(req: Request): PortalSessionInfo | null {
  sweep();
  const token = bearerToken(req);
  if (!token) return null;
  const session = sessions.get(token);
  if (!session || Date.now() >= session.expiresAt) return null;
  const account = session.accountId ? accountById(session.accountId) : undefined;
  return {
    demo: session.demo,
    accountId: session.accountId,
    accountType: account?.accountType ?? null,
    role: account?.role ?? null,
    email: account?.email ?? null,
    superuser: !!account?.superuser,
  };
}

/** True when the account id belongs to the founder superuser. */
export function isSuperuserAccount(accountId: string): boolean {
  return !!accountById(accountId)?.superuser;
}

/** Admin-only listing of every registered portal account (read capacity). */
export interface AdminAccountEntry {
  id: string;
  fullName: string;
  workplace: string;
  email: string;
  accountType: "healthcare" | "caretaker";
  role: string | null;
  mode: "demo" | "full";
  status: string;
  hasPasskey: boolean;
  superuser: boolean;
  createdAt: number;
}

export function listPortalAccountsAdmin(): AdminAccountEntry[] {
  return [...accounts.values()]
    .map((a) => ({
      id: a.id,
      fullName: a.fullName,
      workplace: a.workplace,
      email: a.email,
      accountType: a.accountType,
      role: a.role ?? null,
      mode: a.mode,
      status: a.status,
      hasPasskey: !!a.credential,
      superuser: !!a.superuser,
      createdAt: a.createdAt,
    }))
    .sort((x, y) => y.createdAt - x.createdAt);
}

/**
 * POST /app/superuser/unlock — server-validated founder unlock for the
 * mobile app. Body: { code }. The code is the SUPERUSER_PASSWORD secret;
 * nothing is hardcoded client-side and no client boolean grants access
 * without this round-trip.
 */
router.post("/app/superuser/unlock", (req, res) => {
  const secret = process.env.SUPERUSER_PASSWORD;
  const { code } = req.body as Record<string, unknown>;
  if (!secret || secret.length < 12 || typeof code !== "string") {
    res.status(401).json({ error: "INVALID_CODE" });
    return;
  }
  const a = createHash("sha256").update(code).digest();
  const b = createHash("sha256").update(secret).digest();
  if (!timingSafeEqual(a, b)) {
    res.status(401).json({ error: "INVALID_CODE" });
    return;
  }
  logger.info("Mobile superuser unlock granted");
  res.json({ ok: true, grants: { pilotMode: true, tier: "red", allTiers: true } });
});

/** Minimal public directory info for a healthcare account (patient-facing booking). */
export interface PractitionerDirectoryEntry {
  id: string;
  fullName: string;
  role: string;
  workplace: string;
  verified: boolean;
}

export function listHealthcarePractitioners(): PractitionerDirectoryEntry[] {
  const out: PractitionerDirectoryEntry[] = [];
  for (const a of accounts.values()) {
    if (a.accountType !== "healthcare") continue;
    out.push({
      id: a.id,
      fullName: a.fullName,
      role: a.role ?? "Healthcare practitioner",
      workplace: a.workplace,
      verified: a.status === "verified",
    });
  }
  return out;
}

export function practitionerDirectoryEntry(accountId: string): PractitionerDirectoryEntry | null {
  const a = accountById(accountId);
  if (!a || a.accountType !== "healthcare") return null;
  return {
    id: a.id,
    fullName: a.fullName,
    role: a.role ?? "Healthcare practitioner",
    workplace: a.workplace,
    verified: a.status === "verified",
  };
}

/** Express middleware: requires any valid portal session (incl. demo). */
export function requirePortalSession(req: Request, res: Response, next: NextFunction): void {
  const session = getPortalSession(req);
  if (!session) {
    res.status(401).json({ error: "UNAUTHENTICATED", message: "Please log in to the portal first." });
    return;
  }
  (req as Request & { portalSession: PortalSessionInfo }).portalSession = session;
  next();
}

export default router;
