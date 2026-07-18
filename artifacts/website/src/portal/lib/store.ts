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
  /** Founder superuser — full read/test access across the portal. */
  superuser?: boolean;
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
): Promise<{
  loginToken: string;
  requiresSecondFactor: boolean;
  hasPasskey: boolean;
  /** Superuser first login: one-time token to enrol a passkey before 2FA. */
  needsPasskeySetup?: boolean;
  webauthnToken?: string;
}> {
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
    needsPasskeySetup?: boolean;
    webauthnToken?: string;
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

// ── Practitioner portal API ──────────────────────────────────────────────────

export const DOCTOR_ROLES: readonly string[] = [
  "GP",
  "Hospital doctor",
  "Outpatient clinic specialist doctor",
];

export function isDoctorRole(role?: string): boolean {
  return !!role && DOCTOR_ROLES.includes(role);
}

/** First responders have their own dedicated portal at /portal/responder. */
export const FIRST_RESPONDER_ROLE = "First responder";

export function isFirstResponderRole(role?: string): boolean {
  return role === FIRST_RESPONDER_ROLE;
}

/**
 * Supportive-care professional roles — healthcare roles that are neither
 * doctors nor first responders (who have their own portal).
 */
export const SUPPORTIVE_ROLES: readonly string[] = HEALTHCARE_ROLES.filter(
  (r) => !DOCTOR_ROLES.includes(r) && r !== FIRST_RESPONDER_ROLE,
);

export function isSupportiveRole(role?: string): boolean {
  return !!role && SUPPORTIVE_ROLES.includes(role);
}

// ── Founder superuser admin API (read/test capacity) ────────────────────────

export interface AdminAccount {
  id: string;
  fullName: string;
  workplace: string;
  email: string;
  accountType: AccountType;
  role: string | null;
  mode: VerificationMode;
  status: AccountStatus;
  hasPasskey: boolean;
  superuser: boolean;
  createdAt: number;
  patients: number;
  membershipActive: boolean;
}

export async function adminListAccounts(): Promise<{ accounts: AdminAccount[] }> {
  const res = await fetch(`${API_BASE}/portal/admin/accounts`, {
    headers: { "Content-Type": "application/json", ...authHeader() },
  });
  if (!res.ok) throw await parseError(res);
  return (await res.json()) as { accounts: AdminAccount[] };
}

export interface AdminStoreView {
  account: AdminAccount;
  store: {
    patients: PracPatientFile[];
    settings: PracSettings;
    bookings: PracBooking[];
    membership: ProMembership;
  } | null;
}

export async function adminGetAccountStore(accountId: string): Promise<AdminStoreView> {
  const res = await fetch(`${API_BASE}/portal/admin/accounts/${accountId}/store`, {
    headers: { "Content-Type": "application/json", ...authHeader() },
  });
  if (!res.ok) throw await parseError(res);
  return (await res.json()) as AdminStoreView;
}

export interface PracPatientSummary {
  id: string;
  fullName: string;
  dob: string;
  mrn: string;
  condition: string;
  demo: boolean;
  lastQuestionnaire: { name: string; score: string; date: string } | null;
}

export interface PracPatientFile {
  id: string;
  fullName: string;
  dob: string;
  mrn: string;
  condition: string;
  demo: boolean;
  history: string[];
  questionnaires: { id: string; name: string; score: string; date: string }[];
  prescriptions: { id: string; name: string; dose: string; frequency: string }[];
  notes: { id: string; ts: number; text: string }[];
  /** Items & documents added to this file (metadata + extracted text only). */
  attachments?: PatientAttachment[];
  /** Consented live medication share matched to this patient — null if none. */
  liveMedications?: LiveMedShare | null;
}

export interface PatientAttachment {
  id: string;
  ts: number;
  kind: "photo" | "document" | "audio" | "text";
  name: string;
  mimeType: string;
  size: number;
  /** Extracted / transcribed / typed text, ready for assimilation. */
  text?: string;
  textSource?: "typed" | "extracted" | "transcribed";
  /** Whether raw file content is available for viewing/download. */
  hasData: boolean;
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

export interface PracBooking {
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

async function pracFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}/portal/practitioner${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...authHeader(),
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) throw await parseError(res);
  return (await res.json()) as T;
}

export function listPracPatients(): Promise<{ patients: PracPatientSummary[] }> {
  return pracFetch("/patients");
}

export function createPracPatient(input: {
  fullName: string;
  dob?: string;
  condition?: string;
}): Promise<{ patient: PracPatientFile }> {
  return pracFetch("/patients", { method: "POST", body: JSON.stringify(input) });
}

export function getPracPatient(id: string): Promise<{ patient: PracPatientFile }> {
  return pracFetch(`/patients/${encodeURIComponent(id)}`);
}

export function addPracNote(patientId: string, text: string): Promise<{ note: PracPatientFile["notes"][number] }> {
  return pracFetch(`/patients/${encodeURIComponent(patientId)}/notes`, {
    method: "POST",
    body: JSON.stringify({ text }),
  });
}

export function addPracPrescription(
  patientId: string,
  input: { name: string; dose?: string; frequency?: string },
): Promise<{ prescription: PracPatientFile["prescriptions"][number] }> {
  return pracFetch(`/patients/${encodeURIComponent(patientId)}/prescriptions`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function addPracAttachment(
  patientId: string,
  input: {
    kind: PatientAttachment["kind"];
    name: string;
    mimeType?: string;
    dataBase64?: string;
    text?: string;
  },
): Promise<{ attachment: PatientAttachment }> {
  return pracFetch(`/patients/${encodeURIComponent(patientId)}/attachments`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function deletePracAttachment(patientId: string, attachmentId: string): Promise<{ ok: boolean }> {
  return pracFetch(
    `/patients/${encodeURIComponent(patientId)}/attachments/${encodeURIComponent(attachmentId)}`,
    { method: "DELETE" },
  );
}

/** Fetch raw attachment bytes (auth header required) and return an object URL. */
export async function fetchPracAttachmentUrl(patientId: string, attachmentId: string): Promise<string> {
  const res = await fetch(
    `${API_BASE}/portal/practitioner/patients/${encodeURIComponent(patientId)}/attachments/${encodeURIComponent(attachmentId)}/content`,
    { headers: { ...authHeader() } },
  );
  if (!res.ok) throw await parseError(res);
  return URL.createObjectURL(await res.blob());
}

export function getPracSettings(): Promise<{ settings: PracSettings }> {
  return pracFetch("/settings");
}

export function updatePracSettings(
  patch: Partial<Pick<PracSettings, "bookingEnabled" | "videoConsultations" | "audioConsultations">>,
): Promise<{ settings: PracSettings }> {
  return pracFetch("/settings", { method: "PUT", body: JSON.stringify(patch) });
}

export function addPracSlot(input: {
  day: string;
  start: string;
  end: string;
  kind: AvailabilitySlot["kind"];
}): Promise<{ slot: AvailabilitySlot }> {
  return pracFetch("/settings/slots", { method: "POST", body: JSON.stringify(input) });
}

export function deletePracSlot(slotId: string): Promise<{ ok: boolean }> {
  return pracFetch(`/settings/slots/${encodeURIComponent(slotId)}`, { method: "DELETE" });
}

export function listPracBookings(): Promise<{ bookings: PracBooking[] }> {
  return pracFetch("/bookings");
}

// ── HIVE HUB professional membership ─────────────────────────────────────────

export type MembershipBilling = "monthly" | "yearly";

export interface ProMembership {
  active: boolean;
  billing: MembershipBilling | null;
  activatedAt: number | null;
}

export interface ConsultSession {
  id: string;
  bookingId: string;
  kind: "video" | "audio";
  room: string;
  patientName: string;
  provider: string;
  startedAt: number;
  expiresAt: number;
}

export function getMembership(): Promise<{ membership: ProMembership }> {
  return pracFetch("/membership");
}

export function startMembershipCheckout(
  billing: MembershipBilling,
): Promise<{ url: string; sessionId: string }> {
  return pracFetch("/membership/checkout", { method: "POST", body: JSON.stringify({ billing }) });
}

export function confirmMembership(sessionId: string): Promise<{ membership: ProMembership }> {
  return pracFetch("/membership/confirm", { method: "POST", body: JSON.stringify({ sessionId }) });
}

/** DEV-ONLY: the server accepts a simulated activation only outside production. */
export function confirmMembershipDevSimulate(): Promise<{ membership: ProMembership }> {
  return pracFetch("/membership/confirm", { method: "POST", body: JSON.stringify({ devActivate: true }) });
}

export function startConsultSession(bookingId: string): Promise<{ session: ConsultSession }> {
  return pracFetch(`/bookings/${encodeURIComponent(bookingId)}/session`, { method: "POST" });
}

// ── Consent-based live medication exchange ─────────────────────────────────

export interface LiveMedShare {
  grantId: string;
  patientName: string;
  grantedAt: string;
  expiresAt: string;
  /** When the patient device last pushed a snapshot — null until first push. */
  updatedAt: string | null;
  payload: {
    patientName?: string;
    generatedAt: string;
    medications: { medication: string; dose: string; frequency: string; route: string; status?: string }[];
    notes?: string;
  } | null;
}

/**
 * Live medication snapshots patients have consented to share with THIS
 * provider account. Demo sessions receive canned demo data only.
 */
export async function listLiveMedShares(): Promise<{ demo?: boolean; shares: LiveMedShare[] }> {
  const res = await fetch(`${API_BASE}/med-exchange/live`, {
    headers: { ...authHeader() },
  });
  if (!res.ok) throw await parseError(res);
  return (await res.json()) as { demo?: boolean; shares: LiveMedShare[] };
}
