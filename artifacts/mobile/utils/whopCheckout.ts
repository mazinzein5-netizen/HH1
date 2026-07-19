/* ────────────────────────────────────────────────────────────────────────────
 * Whop checkout client (the accepted server exception to Zero-Server:
 * payments go through the HIVE api-server, which talks to Whop).
 * No card details ever touch the app — Whop hosts the payment page.
 * ──────────────────────────────────────────────────────────────────────────── */

import AsyncStorage from "@react-native-async-storage/async-storage";
import type { BillingCycle, PaidTier } from "@/utils/membershipStore";

const API = () => `https://${process.env.EXPO_PUBLIC_DOMAIN}/api`;

export interface CheckoutSession {
  url: string;
  sessionId: string;
}

export interface CheckoutStatus {
  status: "open" | "complete" | "expired" | string;
  paid: boolean;
}

async function parseOrThrow<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) {
    const message =
      (typeof data.error === "string" && data.error) || `Request failed (${res.status})`;
    throw new Error(message);
  }
  return data as T;
}

export async function startWhopCheckout(args: {
  tier: PaidTier;
  billing: BillingCycle;
  reference: string;
  userId: string;
}): Promise<CheckoutSession> {
  const res = await fetch(`${API()}/whop/checkout`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(args),
  });
  return parseOrThrow<CheckoutSession>(res);
}

export async function getCheckoutStatus(sessionId: string): Promise<CheckoutStatus> {
  const res = await fetch(`${API()}/whop/checkout-status/${encodeURIComponent(sessionId)}`);
  return parseOrThrow<CheckoutStatus>(res);
}

/**
 * Polls the checkout until it is paid, expired, or the timeout elapses.
 * Returns the final state ("timeout" when we gave up waiting).
 */
export async function waitForCheckoutResult(
  sessionId: string,
  opts: { intervalMs?: number; timeoutMs?: number; shouldStop?: () => boolean } = {},
): Promise<"paid" | "expired" | "timeout"> {
  const intervalMs = opts.intervalMs ?? 3000;
  const timeoutMs = opts.timeoutMs ?? 5 * 60 * 1000;
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (opts.shouldStop?.()) return "timeout";
    try {
      const s = await getCheckoutStatus(sessionId);
      if (s.paid) return "paid";
      if (s.status === "expired") return "expired";
    } catch {
      // transient network error — keep polling
    }
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  return "timeout";
}

/* ── Pending checkout persistence ───────────────────────────────────────────
 * If polling times out (e.g. the app was closed mid-payment) we remember the
 * checkout so a retry resumes the SAME one instead of creating a new one,
 * which prevents any chance of a double charge. */

export interface PendingCheckout {
  sessionId: string;
  url: string;
  tier: PaidTier;
  billing: BillingCycle;
  reference: string;
  createdAt: string;
}

const PENDING_KEY = (userId: string) => `hive.whop.pendingCheckout.${userId}`;
const PENDING_MAX_AGE_MS = 23 * 60 * 60 * 1000; // matches the server's 24h reuse window

export async function savePendingCheckout(userId: string, p: PendingCheckout): Promise<void> {
  try {
    await AsyncStorage.setItem(PENDING_KEY(userId), JSON.stringify(p));
  } catch {}
}

/**
 * Returns the stored pending checkout for this user if it is still fresh and
 * matches the chosen tier + billing. The reference is deliberately NOT part of
 * the match: for a first-time purchase the client generates the reference, so
 * a retry would otherwise produce a new one and orphan the pending checkout
 * (risking a second charge). Callers must reuse `pending.reference`.
 */
export async function getPendingCheckout(
  userId: string,
  match: { tier: PaidTier; billing: BillingCycle },
): Promise<PendingCheckout | null> {
  try {
    const raw = await AsyncStorage.getItem(PENDING_KEY(userId));
    if (!raw) return null;
    const p = JSON.parse(raw) as PendingCheckout;
    const fresh = Date.now() - new Date(p.createdAt).getTime() < PENDING_MAX_AGE_MS;
    if (!fresh || p.tier !== match.tier || p.billing !== match.billing) {
      await AsyncStorage.removeItem(PENDING_KEY(userId));
      return null;
    }
    return p;
  } catch {
    return null;
  }
}

export async function clearPendingCheckout(userId: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(PENDING_KEY(userId));
  } catch {}
}
