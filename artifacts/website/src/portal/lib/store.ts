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

/** POST /portal/register → PublicAccount. Throws ApiError on failure. */
export async function registerAccount(input: RegisterInput): Promise<PublicAccount> {
  const res = await fetch(`${API_BASE}/portal/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw await parseError(res);
  const data = (await res.json()) as { account: PublicAccount };
  return data.account;
}

/** POST /portal/login → loginToken. Throws ApiError on failure. */
export async function loginPassword(
  email: string,
  password: string,
): Promise<{ loginToken: string; requiresSecondFactor: boolean }> {
  const res = await fetch(`${API_BASE}/portal/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw await parseError(res);
  return (await res.json()) as { loginToken: string; requiresSecondFactor: boolean };
}

/** POST /portal/2fa → { sessionToken, account }. Throws ApiError on failure. */
export async function complete2fa(
  loginToken: string,
): Promise<{ sessionToken: string; account: PublicAccount }> {
  const res = await fetch(`${API_BASE}/portal/2fa`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ loginToken }),
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

// ── WebAuthn helpers ────────────────────────────────────────────────────────

export function isWebAuthnAvailable(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.PublicKeyCredential !== "undefined" &&
    !!navigator.credentials
  );
}

function randomChallenge(): BufferSource {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return bytes as BufferSource;
}

/** Register a platform passkey during signup. Returns a base64url credential id. */
export async function registerPasskey(account: {
  id: string;
  email: string;
  fullName: string;
}): Promise<string> {
  const userId = new TextEncoder().encode(account.id);
  const credential = (await navigator.credentials.create({
    publicKey: {
      challenge: randomChallenge(),
      rp: { name: "HIVE Emergency Portal", id: window.location.hostname },
      user: {
        id: userId,
        name: account.email,
        displayName: account.fullName,
      },
      pubKeyCredParams: [
        { type: "public-key", alg: -7 },
        { type: "public-key", alg: -257 },
      ],
      authenticatorSelection: {
        authenticatorAttachment: "platform",
        userVerification: "required",
        residentKey: "preferred",
      },
      timeout: 60_000,
      attestation: "none",
    },
  })) as PublicKeyCredential | null;
  if (!credential) throw new Error("Passkey registration was cancelled.");
  return bufferToBase64Url(credential.rawId);
}

/** Perform the biometric 2nd factor at each login. */
export async function verifyPasskey(credentialId?: string): Promise<boolean> {
  const allowCredentials: PublicKeyCredentialDescriptor[] = credentialId
    ? [{ type: "public-key", id: base64UrlToBuffer(credentialId) }]
    : [];
  const assertion = (await navigator.credentials.get({
    publicKey: {
      challenge: randomChallenge(),
      rpId: window.location.hostname,
      allowCredentials,
      userVerification: "required",
      timeout: 60_000,
    },
  })) as PublicKeyCredential | null;
  return !!assertion;
}

function bufferToBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let str = "";
  for (const b of bytes) str += String.fromCharCode(b);
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlToBuffer(value: string): ArrayBuffer {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}
