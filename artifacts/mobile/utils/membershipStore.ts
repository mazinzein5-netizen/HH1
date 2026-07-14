import AsyncStorage from "@react-native-async-storage/async-storage";

/* ────────────────────────────────────────────────────────────────────────────
 * On-device membership & payment store (Zero-Server framework).
 *
 * Three cards:
 *   • Blue Card — the free trial card every account starts on.
 *   • Gold Card — €90 / month or €700 / year, chosen in the app.
 *   • Red Geriatric Safety Pack — the elder-care card, physical card posted.
 *
 * Nothing is charged from inside the app — upgrading generates a
 * human-readable payment reference (HIVE-XXXX-XXXX) that is settled online
 * (pilot programme), through the patient's insurer, or in cash at a partner
 * HIVE node. All details stay on this device.
 * ──────────────────────────────────────────────────────────────────────────── */

/** The three cards. "blue" is the default — a saved membership record is only
 *  created when the patient upgrades to a paid card. */
export type PlanTier = "blue" | "gold" | "red";
export type PaidTier = "gold" | "red";
export type BillingCycle = "monthly" | "yearly";
export type PaymentMethod = "online" | "insurance" | "cash";

export interface InsuranceDetails {
  provider: string;
  policyNumber: string;
  memberId?: string;
}

export interface MembershipRecord {
  userId: string;
  /** Paid card. */
  plan: PaidTier;
  billing: BillingCycle;
  method: PaymentMethod;
  /** Human-readable payment reference, e.g. HIVE-4KT9-XE2M */
  reference: string;
  insurance?: InsuranceDetails;
  /** "pending" until settled at a HIVE node / by the insurer / online */
  status: "pending" | "active";
  chosenAt: string; // ISO date
}

export const PLAN_META: Record<
  PlanTier,
  { label: string; tagline: string; icon: string; accent: string; features: string[] }
> = {
  blue: {
    label: "Blue Card",
    tagline: "Free trial — every account starts here",
    icon: "card-account-details-star-outline",
    accent: "#2563EB",
    features: [
      "2 pain complaints per month",
      "Prescription services included",
      "Medical history included",
      "Bee chat bot included",
    ],
  },
  gold: {
    label: "Gold Card",
    tagline: "Full HIVE membership",
    icon: "crown-outline",
    accent: "#D4A017",
    features: [
      "30 pain complaints per month",
      "Prescription services & medical history included",
      "Bee chat bot included",
      "3 free video consultations per month — more at standard rates",
      "3 free interpreter sessions per month — more at standard rates",
    ],
  },
  red: {
    label: "Red Geriatric Safety Pack",
    tagline: "Complete elder-care membership",
    icon: "shield-star",
    accent: "#E5294E",
    features: [
      "Unlimited pain complaints",
      "Everything in the Gold Card included",
      "10 free HIVE Doc consultations per month — more at partner price",
      "Geriatric screening & cognitive care",
      "Smart device & falls monitoring",
    ],
  },
};

export const TIER_PRICING: Record<
  PaidTier,
  Record<BillingCycle, { label: string; price: string; note?: string }>
> = {
  gold: {
    monthly: { label: "Monthly", price: "€90 / month" },
    yearly: { label: "Yearly", price: "€700 / year", note: "Save €380 a year" },
  },
  red: {
    monthly: { label: "Monthly", price: "€150 / month" },
    yearly: { label: "Yearly", price: "€1,200 / year", note: "Save €600 a year" },
  },
};

export const METHOD_META: Record<
  PaymentMethod,
  { label: string; icon: string; blurb: string }
> = {
  online: {
    label: "Pay online",
    icon: "credit-card-outline",
    blurb: "Buy your monthly or yearly membership online by card, using your reference.",
  },
  insurance: {
    label: "Link my health insurance",
    icon: "shield-account-outline",
    blurb: "Link your insurer and policy details — your insurer settles it, confirmed at your HIVE node.",
  },
  cash: {
    label: "Cash at a HIVE node",
    icon: "cash",
    blurb: "Pay in person at any HIVE node — partner GPs, pharmacies and clinics take cash.",
  },
};

const KEY_PREFIX = "hive_membership_v1_";

/** Every new account starts on the Blue Card free trial — no payment at registration. */
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
    if (!raw) return null;
    const rec = JSON.parse(raw) as MembershipRecord & { plan: string };
    // Records saved before the Blue/Gold/Red pricing (essential/plus/family)
    // are treated as Gold monthly memberships.
    if (rec.plan !== "gold" && rec.plan !== "red") rec.plan = "gold";
    if (rec.billing !== "monthly" && rec.billing !== "yearly") rec.billing = "monthly";
    return rec as MembershipRecord;
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
