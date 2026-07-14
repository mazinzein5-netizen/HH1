import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Per-user membership QR code. Every account gets its own unique member code,
 * generated on this device (Zero-Server) and stored locally. The code can be
 * regenerated at any time — the old code simply stops being shown, and staff
 * at a HIVE node always match the code against the person's verified identity.
 */

const KEY_PREFIX = "hive_member_code_v1_";

/** Unambiguous charset — no 0/O or 1/I, easy to read out at a HIVE node. */
const CODE_CHARS = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

export interface MemberCode {
  /** Human-readable unique code, e.g. HHC-7WM2-K4QX */
  code: string;
  /** ISO date the code was generated on this device. */
  issuedAt: string;
}

function makeCode(): string {
  const block = () =>
    Array.from({ length: 4 }, () => CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]).join("");
  return `HHC-${block()}-${block()}`;
}

/** Returns the user's member code, generating one on first use. */
export async function getMemberCode(userId: string): Promise<MemberCode> {
  const key = `${KEY_PREFIX}${userId}`;
  try {
    const raw = await AsyncStorage.getItem(key);
    if (raw) return JSON.parse(raw) as MemberCode;
  } catch {
    // fall through and issue a fresh code
  }
  const fresh: MemberCode = { code: makeCode(), issuedAt: new Date().toISOString() };
  await AsyncStorage.setItem(key, JSON.stringify(fresh));
  return fresh;
}

/** Issues a brand-new code, replacing the old one. */
export async function regenerateMemberCode(userId: string): Promise<MemberCode> {
  const fresh: MemberCode = { code: makeCode(), issuedAt: new Date().toISOString() };
  await AsyncStorage.setItem(`${KEY_PREFIX}${userId}`, JSON.stringify(fresh));
  return fresh;
}

/** Payload encoded into the QR image — no medical data, just membership identity. */
export function memberQrPayload(params: {
  memberCode: MemberCode;
  tier: "blue" | "gold" | "red";
  fullName?: string;
}): string {
  return JSON.stringify({
    type: "HiveMember",
    code: params.memberCode.code,
    tier: params.tier,
    name: params.fullName ?? "",
    issued: params.memberCode.issuedAt.slice(0, 10),
  });
}
