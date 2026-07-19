import AsyncStorage from "@react-native-async-storage/async-storage";
import { gcm } from "@noble/ciphers/aes.js";
import { utf8ToBytes } from "@noble/ciphers/utils.js";
import * as Crypto from "expo-crypto";
import type { PatientData } from "@/context/PatientContext";

/* ────────────────────────────────────────────────────────────────────────────
 * Consent-based live medication exchange (Zero-Server framework).
 *
 * The patient grants a NAMED GP / treating physician (chosen from the HIVE
 * portal directory) live access to their medication list. This device then
 * pushes an AES-256-GCM-encrypted snapshot to the HIVE relay whenever the
 * kardex changes. The relay holds only the encrypted blob in memory; the
 * consented doctor's portal session is the only place it can be read.
 * Revoking here purges the snapshot from the relay immediately.
 * ──────────────────────────────────────────────────────────────────────────── */

const API = () => `https://${process.env.EXPO_PUBLIC_DOMAIN}/api`;

export const MED_CONSENT_WORDING =
  "I consent to sharing my current medication list, live from this device, with the named doctor below. " +
  "The data is encrypted, passes through the HIVE relay only in memory, and I can withdraw this consent at any time. " +
  "Consent expires automatically after 30 days.";

export interface MedProvider {
  id: string;
  fullName: string;
  role: string;
  workplace: string;
  verified: boolean;
}

export interface MedGrant {
  grantId: string;
  patientToken: string;
  keyHex: string;
  provider: { id: string; fullName: string; role: string; workplace: string };
  grantedAt: string;
  expiresAt: string;
  lastPushedAt?: string;
}

const GRANT_KEY = "hive_med_exchange_grant_v1";

export async function listMedProviders(): Promise<MedProvider[]> {
  const res = await fetch(`${API()}/med-exchange/providers`);
  if (!res.ok) throw new Error(`Providers failed (${res.status})`);
  const data = (await res.json()) as { providers: MedProvider[] };
  return data.providers;
}

export async function getMedGrant(): Promise<MedGrant | null> {
  try {
    const raw = await AsyncStorage.getItem(GRANT_KEY);
    if (!raw) return null;
    const grant = JSON.parse(raw) as MedGrant;
    if (new Date(grant.expiresAt).getTime() <= Date.now()) {
      await AsyncStorage.removeItem(GRANT_KEY);
      return null;
    }
    return grant;
  } catch {
    return null;
  }
}

export async function grantMedAccess(providerId: string, patientName: string): Promise<MedGrant> {
  const res = await fetch(`${API()}/med-exchange/grants`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ providerId, patientName, consentWording: MED_CONSENT_WORDING }),
  });
  if (!res.ok) throw new Error(`Grant failed (${res.status})`);
  const grant = (await res.json()) as MedGrant;
  await AsyncStorage.setItem(GRANT_KEY, JSON.stringify(grant));
  return grant;
}

export interface MedSnapshot {
  patientName?: string;
  generatedAt: string;
  medications: { medication: string; dose: string; frequency: string; route: string; status: string }[];
  notes: string;
}

export function buildMedSnapshot(data: PatientData, patientName?: string): MedSnapshot {
  return {
    ...(patientName ? { patientName } : {}),
    generatedAt: new Date().toISOString(),
    medications: data.kardex
      .filter((k) => k.status === "active")
      .map((m) => ({ medication: m.medication, dose: m.dose, frequency: m.frequency, route: m.route, status: m.status })),
    notes:
      "Live from the patient's device via HIVE COMPANION, shared with explicit patient consent. Not clinically verified.",
  };
}

function hexToBytes(hex: string): Uint8Array {
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return out;
}

const B64_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

/** Dependency-free base64 encoder — works on Hermes and web alike. */
function bytesToBase64(bytes: Uint8Array): string {
  let out = "";
  for (let i = 0; i < bytes.length; i += 3) {
    const b0 = bytes[i]!;
    const b1 = i + 1 < bytes.length ? bytes[i + 1]! : 0;
    const b2 = i + 2 < bytes.length ? bytes[i + 2]! : 0;
    out += B64_CHARS[b0 >> 2]! + B64_CHARS[((b0 & 3) << 4) | (b1 >> 4)]!;
    out += i + 1 < bytes.length ? B64_CHARS[((b1 & 15) << 2) | (b2 >> 6)]! : "=";
    out += i + 2 < bytes.length ? B64_CHARS[b2 & 63]! : "=";
  }
  return out;
}

/** AES-256-GCM encrypt the snapshot; ciphertext base64 includes the GCM tag. */
function encryptSnapshot(keyHex: string, snapshot: MedSnapshot): { ciphertext: string; iv: string } {
  const key = hexToBytes(keyHex);
  const iv = Crypto.getRandomBytes(12);
  const plain = utf8ToBytes(JSON.stringify(snapshot));
  const ciphertext = gcm(key, iv).encrypt(plain);
  return { ciphertext: bytesToBase64(ciphertext), iv: bytesToBase64(iv) };
}

/**
 * Push the current (encrypted) medication snapshot for an active grant.
 * Returns false when the grant no longer exists on the relay (revoked,
 * expired or the relay restarted) — the caller should clear the local grant.
 */
export async function pushMedSnapshot(grant: MedGrant, data: PatientData, patientName?: string): Promise<boolean> {
  const { ciphertext, iv } = encryptSnapshot(grant.keyHex, buildMedSnapshot(data, patientName));
  const res = await fetch(`${API()}/med-exchange/push`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ grantId: grant.grantId, patientToken: grant.patientToken, ciphertext, iv }),
  });
  if (res.status === 404) {
    await AsyncStorage.removeItem(GRANT_KEY);
    return false;
  }
  if (!res.ok) throw new Error(`Push failed (${res.status})`);
  const updated: MedGrant = { ...grant, lastPushedAt: new Date().toISOString() };
  await AsyncStorage.setItem(GRANT_KEY, JSON.stringify(updated));
  return true;
}

export async function revokeMedAccess(grant: MedGrant): Promise<void> {
  try {
    await fetch(`${API()}/med-exchange/revoke`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ grantId: grant.grantId, patientToken: grant.patientToken }),
    });
  } finally {
    await AsyncStorage.removeItem(GRANT_KEY);
  }
}
