import AsyncStorage from "@react-native-async-storage/async-storage";

/* ────────────────────────────────────────────────────────────────────────────
 * On-device membership & payment store (Zero-Server framework).
 *
 * The patient chooses a plan and how they want to pay. Nothing is charged
 * from inside the app — every choice generates a human-readable payment
 * reference (HIVE-XXXX-XXXX) that is settled online (pilot programme),
 * through the patient's insurer, or in cash at a partner HIVE node.
 * All details stay on this device.
 * ──────────────────────────────────────────────────────────────────────────── */

export type MembershipPlan = "essential" | "plus" | "family";
export type PaymentMethod = "online" | "insurance" | "cash";

export interface InsuranceDetails {
  provider: string;
  policyNumber: string;
  memberId?: string;
}

export interface MembershipRecord {
  userId: string;
  plan: MembershipPlan;
  method: PaymentMethod;
  /** Human-readable payment reference, e.g. HIVE-4KT9-XE2M */
  reference: string;
  insurance?: InsuranceDetails;
  /** "pending" until settled at a HIVE node / by the insurer / online */
  status: "pending" | "active";
  chosenAt: string; // ISO date
}

export const PLAN_META: Record<
  MembershipPlan,
  { label: string; price: string; blurb: string; icon: string }
> = {
  essential: {
    label: "HIVE Essential",
    price: "€9.99 / month",
    blurb: "Health records, reminders and triage for one person.",
    icon: "hexagon-outline",
  },
  plus: {
    label: "HIVE Plus",
    price: "€19.99 / month",
    blurb: "Adds consultations, smart-device monitoring and priority support.",
    icon: "hexagon-slice-4",
  },
  family: {
    label: "HIVE Family",
    price: "€29.99 / month",
    blurb: "Everything in Plus for up to four family members.",
    icon: "hexagon-multiple",
  },
};

export const METHOD_META: Record<
  PaymentMethod,
  { label: string; icon: string; blurb: string }
> = {
  online: {
    label: "Pay online",
    icon: "credit-card-outline",
    blurb: "Card payment using your reference — activates with the pilot programme.",
  },
  insurance: {
    label: "Use my health insurance",
    icon: "shield-account-outline",
    blurb: "Enter your insurer and policy details — confirmed at your HIVE node.",
  },
  cash: {
    label: "Cash at a HIVE node",
    icon: "cash",
    blurb: "Show your reference at any partner HIVE node and pay in person.",
  },
};

const KEY_PREFIX = "hive_membership_v1_";

/** Every new account starts with a free trial — no payment at registration. */
export const TRIAL_DAYS = 30;

export interface TrialInfo {
  endsAt: Date;
  daysLeft: number;
  expired: boolean;
}

/** Trial window computed from the account creation date. */
export function getTrialInfo(createdAtIso: string): TrialInfo {
  const created = new Date(createdAtIso);
  const endsAt = new Date(created.getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000);
  const msLeft = endsAt.getTime() - Date.now();
  const daysLeft = Math.max(0, Math.ceil(msLeft / (24 * 60 * 60 * 1000)));
  return { endsAt, daysLeft, expired: msLeft <= 0 };
}

/** Unambiguous charset — no 0/O or 1/I, easy to read out at a HIVE node. */
const REF_CHARS = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

export function makeReference(): string {
  const block = () =>
    Array.from({ length: 4 }, () => REF_CHARS[Math.floor(Math.random() * REF_CHARS.length)]).join("");
  return `HIVE-${block()}-${block()}`;
}

export async function getMembership(userId: string): Promise<MembershipRecord | null> {
  try {
    const raw = await AsyncStorage.getItem(`${KEY_PREFIX}${userId}`);
    return raw ? (JSON.parse(raw) as MembershipRecord) : null;
  } catch {
    return null;
  }
}

export async function saveMembership(rec: MembershipRecord): Promise<void> {
  await AsyncStorage.setItem(`${KEY_PREFIX}${rec.userId}`, JSON.stringify(rec));
}

export async function deleteMembership(userId: string): Promise<void> {
  await AsyncStorage.removeItem(`${KEY_PREFIX}${userId}`);
}
