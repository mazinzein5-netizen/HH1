import { Router, type IRouter, type Request, type Response, type NextFunction } from "express";
import { randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { logger } from "../lib/logger";

const router: IRouter = Router();

/* ────────────────────────────────────────────────────────────────────────────
 * Portal authentication (Emergency Portal for healthcare workers/caretakers).
 *
 * Accounts and sessions are held ONLY in server memory (Zero-Server framework:
 * this is a pilot relay, not a persistent registry). Password hashes use
 * scrypt. Login is two-step: password → short-lived login token → the client
 * completes WebAuthn biometric verification locally → exchanges the login
 * token for a session token. Sensitive read endpoints require a session.
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
const loginTokens = new Map<string, { accountId: string; expiresAt: number }>();
const sessions = new Map<string, PortalSession>();

function sweep() {
  const now = Date.now();
  for (const [t, l] of loginTokens) if (now >= l.expiresAt) loginTokens.delete(t);
  for (const [t, s] of sessions) if (now >= s.expiresAt) sessions.delete(t);
}

function hashPassword(password: string, salt: string): Buffer {
  return scryptSync(password, salt, 32);
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
  };
}

/**
 * POST /portal/register
 * Body: { fullName, workplace, email, password, accountType, role?, mode }
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
  logger.info({ accountId: account.id, mode: account.mode }, "Portal account registered (in-memory)");
  res.json({ account: publicAccount(account) });
});

/**
 * POST /portal/login — step 1 (password).
 * Body: { email, password } → { loginToken }
 */
router.post("/portal/login", (req, res) => {
  sweep();
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
  res.json({ loginToken, requiresSecondFactor: true });
});

/**
 * POST /portal/2fa — step 2, after the client completes WebAuthn biometric
 * verification. Body: { loginToken } → { sessionToken, account }
 */
router.post("/portal/2fa", (req, res) => {
  sweep();
  const { loginToken } = req.body as Record<string, unknown>;
  if (typeof loginToken !== "string") {
    res.status(400).json({ error: "loginToken is required." });
    return;
  }
  const pending = loginTokens.get(loginToken);
  if (!pending || Date.now() >= pending.expiresAt) {
    res.status(401).json({ error: "Login expired — please start again." });
    return;
  }
  loginTokens.delete(loginToken);
  const account = [...accounts.values()].find((a) => a.id === pending.accountId);
  if (!account) {
    res.status(401).json({ error: "Account not found." });
    return;
  }
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

/** POST /portal/logout — Body: none; uses Authorization header. */
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
}

export function getPortalSession(req: Request): PortalSessionInfo | null {
  sweep();
  const token = bearerToken(req);
  if (!token) return null;
  const session = sessions.get(token);
  if (!session || Date.now() >= session.expiresAt) return null;
  return { demo: session.demo, accountId: session.accountId };
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
