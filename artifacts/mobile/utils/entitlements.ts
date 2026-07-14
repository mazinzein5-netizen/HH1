import AsyncStorage from "@react-native-async-storage/async-storage";
import { getMembership, PlanTier } from "@/utils/membershipStore";

/* ────────────────────────────────────────────────────────────────────────────
 * On-device monthly usage tracking (Zero-Server framework).
 *
 * Each card includes a monthly allowance for metered services:
 *
 *                     Blue Card        Gold Card
 *   Pain complaints   2 / month        30 / month
 *   Consultations     standard rate    3 free / month, then standard rate
 *   Interpreter       standard rate    3 free / month, then standard rate
 *
 * Usage counters live in AsyncStorage under a per-user, per-calendar-month
 * key, so they reset automatically on the 1st of every month. Nothing leaves
 * the device.
 * ──────────────────────────────────────────────────────────────────────────── */

export type MeteredFeature = "painComplaints" | "consultations" | "interpreter";

export const PLAN_LIMITS: Record<PlanTier, Record<MeteredFeature, number>> = {
  blue: { painComplaints: 2, consultations: 0, interpreter: 0 },
  gold: { painComplaints: 30, consultations: 3, interpreter: 3 },
};

export interface Allowance {
  tier: PlanTier;
  feature: MeteredFeature;
  used: number;
  limit: number;
  remaining: number;
}

const USAGE_PREFIX = "hive_usage_v1_";

/** e.g. "2026-07" — counters reset when the calendar month changes. */
function monthKey(date: Date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function storageKey(userId: string): string {
  return `${USAGE_PREFIX}${userId}_${monthKey()}`;
}

type UsageMap = Partial<Record<MeteredFeature, number>>;

/**
 * The patient's current card. Gold benefits start as soon as the Gold Card is
 * chosen in the app (pilot programme) — payment is settled out-of-band at a
 * HIVE node, online or through the insurer.
 */
export async function getPlanTier(userId: string): Promise<PlanTier> {
  const membership = await getMembership(userId);
  return membership ? "gold" : "blue";
}

export async function getMonthlyUsage(userId: string): Promise<Record<MeteredFeature, number>> {
  let usage: UsageMap = {};
  try {
    const raw = await AsyncStorage.getItem(storageKey(userId));
    if (raw) usage = JSON.parse(raw) as UsageMap;
  } catch {
    usage = {};
  }
  return {
    painComplaints: usage.painComplaints ?? 0,
    consultations: usage.consultations ?? 0,
    interpreter: usage.interpreter ?? 0,
  };
}

/** Count one use of a metered service for the current month. */
export async function recordUsage(userId: string, feature: MeteredFeature): Promise<void> {
  const usage = await getMonthlyUsage(userId);
  usage[feature] += 1;
  await AsyncStorage.setItem(storageKey(userId), JSON.stringify(usage));
}

export async function getAllowance(userId: string, feature: MeteredFeature): Promise<Allowance> {
  const [tier, usage] = await Promise.all([getPlanTier(userId), getMonthlyUsage(userId)]);
  const limit = PLAN_LIMITS[tier][feature];
  const used = usage[feature];
  return { tier, feature, used, limit, remaining: Math.max(0, limit - used) };
}

export interface AllowanceSummary {
  tier: PlanTier;
  painComplaints: Allowance;
  consultations: Allowance;
  interpreter: Allowance;
}

export async function getAllowanceSummary(userId: string): Promise<AllowanceSummary> {
  const [tier, usage] = await Promise.all([getPlanTier(userId), getMonthlyUsage(userId)]);
  const make = (feature: MeteredFeature): Allowance => {
    const limit = PLAN_LIMITS[tier][feature];
    const used = usage[feature];
    return { tier, feature, used, limit, remaining: Math.max(0, limit - used) };
  };
  return {
    tier,
    painComplaints: make("painComplaints"),
    consultations: make("consultations"),
    interpreter: make("interpreter"),
  };
}
