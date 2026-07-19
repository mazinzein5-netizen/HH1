import { Platform } from "react-native";

/* ────────────────────────────────────────────────────────────────────────────
 * Social sign-in bridge (Zero-Server framework).
 *
 * Mirrors the utils/healthBridges.ts pattern: native sign-in modules
 * (Sign in with Apple / Google Sign-In) ship only in the pilot dev build.
 * At runtime we probe for them; in Expo Go and on web they are absent, so
 * availability() reports "needs-pilot-build" and the registration screen
 * falls back to a "confirm your details" flow that creates a local account
 * tagged with the chosen provider. No account data ever leaves the device.
 * ──────────────────────────────────────────────────────────────────────────── */

export type SocialProvider = "apple" | "google";

export type SocialAvailability =
  | "available"          // native module present, real sign-in possible
  | "needs-pilot-build"; // module not bundled in this build (Expo Go / web)

export interface SocialProfile {
  fullName?: string;
  email?: string;
}

export const PROVIDER_META: Record<
  SocialProvider,
  { label: string; icon: string; hex: string }
> = {
  apple:  { label: "Apple",  icon: "apple",  hex: "#111111" },
  google: { label: "Google", icon: "google", hex: "#4285F4" },
};

function nativeModules(): Record<string, any> | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require("react-native").NativeModules ?? null;
  } catch {
    return null;
  }
}

function optionalExpoModule(name: string): any | null {
  // Expo SDK 50+ native modules live behind expo-modules-core, not
  // react-native's NativeModules registry.
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const core = require("expo-modules-core");
    return core?.requireOptionalNativeModule?.(name) ?? null;
  } catch {
    return null;
  }
}

function appleModule(): any | null {
  // The pilot dev build bundles expo-apple-authentication. Expo Go / web do
  // not, so module presence is the capability signal.
  if (Platform.OS !== "ios") return null;
  return optionalExpoModule("ExpoAppleAuthentication") ?? nativeModules()?.ExpoAppleAuthentication ?? null;
}

function googleModule(): any | null {
  const mods = nativeModules();
  return mods?.RNGoogleSignin ?? optionalExpoModule("ExpoGoogleSignIn") ?? null;
}

export function socialAvailability(provider: SocialProvider): SocialAvailability {
  const mod = provider === "apple" ? appleModule() : googleModule();
  return mod ? "available" : "needs-pilot-build";
}

export function socialUnavailableReason(provider: SocialProvider): string {
  const name = PROVIDER_META[provider].label;
  return `Full ${name} sign-in activates in the HIVE pilot programme build. For now, confirm your details below — your account will be created on this device and linked to ${name}.`;
}

/**
 * Attempt a real native sign-in. Only callable when availability() is
 * "available" (pilot build); otherwise rejects with a human-readable reason.
 */
export async function socialSignIn(provider: SocialProvider): Promise<SocialProfile> {
  if (socialAvailability(provider) !== "available") {
    throw new Error(socialUnavailableReason(provider));
  }
  if (provider === "apple") {
    const mod = appleModule();
    const credential = await mod.requestAsync({ requestedScopes: [0, 1] }); // FULL_NAME, EMAIL
    return {
      fullName: [credential?.fullName?.givenName, credential?.fullName?.familyName]
        .filter(Boolean)
        .join(" ") || undefined,
      email: credential?.email ?? undefined,
    };
  }
  const mod = googleModule();
  await mod.configure?.({});
  const result = await mod.signIn?.();
  return {
    fullName: result?.user?.name ?? undefined,
    email: result?.user?.email ?? undefined,
  };
}
