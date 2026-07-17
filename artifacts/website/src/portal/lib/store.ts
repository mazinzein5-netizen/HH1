export const HEALTHCARE_ROLES = [
  "GP",
  "Hospital doctor",
  "First responder",
  "Physiotherapist",
  "Outpatient clinic specialist doctor",
  "A&E follow-up",
  "Occupational health specialist",
] as const;

export type HealthcareRole = (typeof HEALTHCARE_ROLES)[number];

export type AccountType = "healthcare" | "caretaker";
export type VerificationMode = "demo" | "full";
export type AccountStatus = "demo" | "verification_ongoing" | "verified";

/** Public account shape as returned by the server. */
export interface PublicAccount {
  id: string;
  fullName: string;
  workplace: string;
  email: string;
  accountType: AccountType;
  role?: HealthcareRole | string;
  mode: VerificationMode;
  status: AccountStatus;
}

/** On-device profile / verification images. Never leaves this device. */
export interface LocalProfile {
  accountId?: string;
  email: string;
  /** Whether a WebAuthn passkey was registered at signup on this device. */
  hasPasskey: boolean;
  passkeyId?: string;
  /** Verification images stay on THIS device only (data URLs). */
  verification?: {
    selfie?: string;
    photoIdName?: string;
    photoId?: string;
    certificationName?: string;
    certification?: string;
  };
}

import { startAuthentication, startRegistration } from "@simplewebauthn/browser";

const PROFILES_KEY = "hive_portal_profiles";
const SESSION_KEY = "hive_portal_session";

const API_BASE = `${import.meta.env.BASE_URL}api`;

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

// ── Session (sessionStorage, server-issued) ─────────────────────────────────

export interface SessionState {
  sessionToken: string | null;
  account: PublicAccount | null;
  demo: boolean;
}

const EMPTY_SESSION: SessionState = {
  sessionToken: null,
  account: null,
  demo: false,
};

export function getSession(): SessionState {
  return safeParse<SessionState>(sessionStorage.getItem(SESSION_KEY), EMPTY_SESSION);
}

export function setSession(session: SessionState): void {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  window.dispatchEvent(new Event("hive-portal-session"));
}

export function clearSession(): void {
  sessionStorage.removeItem(SESSION_KEY);
  window.dispatchEvent(new Event("hive-portal-session"));
}

export function authHeader(): Record<string, string> {
  const { sessionToken } = getSession();
  return sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {};
}

// ── On-device profiles (localStorage, for display / passkey / images) ────────

export function getProfiles(): LocalProfile[] {
  return safeParse<LocalProfile[]>(localStorage.getItem(PROFILES_KEY), []);
}

export function saveProfiles(profiles: LocalProfile[]): void {
  localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
}

export function findProfileByEmail(email: string): LocalProfile | undefined {
  const normalized = email.trim().toLowerCase();
  return getProfiles().find((p) => p.email.toLowerCase() === normalized);
}

export function upsertProfile(profile: LocalProfile): void {
  const profiles = getProfiles().filter(
    (p) => p.email.toLowerCase() !== profile.email.toLowerCase(),
  );
  profiles.push(profile);
  saveProfiles(profiles);
}

// ── Server API helpers ───────────────────────────────────────────────────────

export interface ApiError {
  status: number;
  error?: string;
  message?: string;
}

async function parseError(res: Response): Promise<ApiError> {
  let body: { error?: string; message?: string } = {};
  try {
    body = (await res.json()) as { error?: string; message?: string };
  } catch {
    /* ignore */
  }
  return { status: res.status, error: body.error, message: body.message };
}

export interface RegisterInput {
  fullName: string;
  workplace: string;
  email: string;
  password: string;
  accountType: AccountType;
  role?: HealthcareRole;
  mode: VerificationMode;
}

/**
 * POST /portal/register → { account, webauthnToken }.
 * The webauthnToken authorizes server-verified passkey registration.
 */
export async function registerAccount(
  input: RegisterInput,
): Promise<{ account: PublicAccount; webauthnToken: string }> {
  const res = await fetch(`${API_BASE}/portal/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw await parseError(res);
  return (await res.json()) as { account: PublicAccount; webauthnToken: string };
}

/** POST /portal/login → loginToken. Throws ApiError on failure. */
export async function loginPassword(
  email: string,
  password: string,
): Promise<{ loginToken: string; requiresSecondFactor: boolean; hasPasskey: boolean }> {
  const res = await fetch(`${API_BASE}/portal/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw await parseError(res);
  return (await res.json()) as {
    loginToken: string;
    requiresSecondFactor: boolean;
    hasPasskey: boolean;
  };
}

/**
 * Server-verified biometric second factor: fetches a server challenge,
 * runs the platform authenticator, and submits the assertion for
 * cryptographic verification. Only the server can mint a session.
 */
export async function complete2faWithPasskey(
  loginToken: string,
): Promise<{ sessionToken: string; account: PublicAccount }> {
  const optRes = await fetch(`${API_BASE}/portal/2fa/options`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ loginToken }),
  });
  if (!optRes.ok) throw await parseError(optRes);
  const { options } = (await optRes.json()) as { options: Parameters<typeof startAuthentication>[0]["optionsJSON"] };
  const assertion = await startAuthentication({ optionsJSON: options });
  const res = await fetch(`${API_BASE}/portal/2fa/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ loginToken, response: assertion }),
  });
  if (!res.ok) throw await parseError(res);
  return (await res.json()) as { sessionToken: string; account: PublicAccount };
}

/** DEV-ONLY: the server accepts a simulated pass only outside production. */
export async function complete2faDevSimulate(
  loginToken: string,
): Promise<{ sessionToken: string; account: PublicAccount }> {
  const res = await fetch(`${API_BASE}/portal/2fa/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ loginToken, devSimulate: true }),
  });
  if (!res.ok) throw await parseError(res);
  return (await res.json()) as { sessionToken: string; account: PublicAccount };
}

/** POST /portal/demo-session → { sessionToken, demo }. Throws ApiError on failure. */
export async function startDemoSession(): Promise<{ sessionToken: string; demo: boolean }> {
  const res = await fetch(`${API_BASE}/portal/demo-session`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) throw await parseError(res);
  return (await res.json()) as { sessionToken: string; demo: boolean };
}

/** POST /portal/logout using the current session token. Best-effort. */
export async function logoutServer(): Promise<void> {
  const headers = authHeader();
  if (!headers.Authorization) return;
  try {
    await fetch(`${API_BASE}/portal/logout`, {
      method: "POST",
      headers,
    });
  } catch {
    /* best-effort */
  }
}

export function statusLabel(status: AccountStatus): string {
  switch (status) {
    case "demo":
      return "DEMO";
    case "verification_ongoing":
      return "VERIFICATION ONGOING";
    case "verified":
      return "VERIFIED";
    default:
      return String(status).toUpperCase();
  }
}

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export function randomId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

// ── WebAuthn helpers (server-verified via SimpleWebAuthn) ───────────────────

export function isWebAuthnAvailable(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.PublicKeyCredential !== "undefined" &&
    !!navigator.credentials
  );
}

/**
 * Register a platform passkey during signup, verified and stored server-side.
 * Returns true when the server verified and stored the credential.
 */
export async function registerPasskeyServer(webauthnToken: string): Promise<boolean> {
  const optRes = await fetch(`${API_BASE}/portal/webauthn/register-options`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ webauthnToken }),
  });
  if (!optRes.ok) throw await parseError(optRes);
  const { options } = (await optRes.json()) as { options: Parameters<typeof startRegistration>[0]["optionsJSON"] };
  const attestation = await startRegistration({ optionsJSON: options });
  const res = await fetch(`${API_BASE}/portal/webauthn/register-verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ webauthnToken, response: attestation }),
  });
  if (!res.ok) throw await parseError(res);
  return true;
}
