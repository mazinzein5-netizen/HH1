import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Founder superuser — server-verified only.
 *
 * The app never trusts a local boolean. Unlock (in AppModeContext) stores a
 * server-signed, expiring token; every grant of founder benefits goes through
 * verifySuperuser(), which asks the server to check the token's signature and
 * expiry. If the token is invalid/expired it is deleted; if the server is
 * unreachable we fail closed (no benefits) but keep the token for retry.
 */

export const SUPERUSER_TOKEN_KEY = "@hive_superuser_token_v1";

const API = () => `https://${process.env.EXPO_PUBLIC_DOMAIN}/api`;

let cache: { at: number; ok: boolean } | null = null;
let inflight: Promise<boolean> | null = null;
const CACHE_TTL_MS = 5 * 60 * 1000;

/** Server-verified superuser check, memoized for 5 minutes per app session. */
export async function verifySuperuser(force = false): Promise<boolean> {
  if (!force && cache && Date.now() - cache.at < CACHE_TTL_MS) return cache.ok;
  if (inflight) return inflight;
  inflight = (async () => {
    try {
      const token = await AsyncStorage.getItem(SUPERUSER_TOKEN_KEY);
      if (!token) {
        cache = { at: Date.now(), ok: false };
        return false;
      }
      const res = await fetch(`${API()}/app/superuser/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      if (res.status === 401) {
        // Signature/expiry rejected by the server — discard the token.
        await AsyncStorage.removeItem(SUPERUSER_TOKEN_KEY).catch(() => {});
        cache = { at: Date.now(), ok: false };
        return false;
      }
      if (!res.ok) {
        // Server error/unreachable: fail closed, keep token, short retry window.
        cache = { at: Date.now() - CACHE_TTL_MS + 30_000, ok: false };
        return false;
      }
      const data = (await res.json()) as { ok?: boolean };
      const ok = data.ok === true;
      cache = { at: Date.now(), ok };
      return ok;
    } catch {
      cache = { at: Date.now() - CACHE_TTL_MS + 30_000, ok: false };
      return false;
    } finally {
      inflight = null;
    }
  })();
  return inflight;
}

export async function storeSuperuserToken(token: string): Promise<void> {
  await AsyncStorage.setItem(SUPERUSER_TOKEN_KEY, token);
  cache = { at: Date.now(), ok: true };
}

export async function clearSuperuser(): Promise<void> {
  await AsyncStorage.removeItem(SUPERUSER_TOKEN_KEY).catch(() => {});
  cache = { at: Date.now(), ok: false };
}
