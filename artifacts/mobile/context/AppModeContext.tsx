import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";
import { Platform } from "react-native";

/** Web-only: dev preview frames pass ?preview=1 to skip the consent gate (never persisted). */
function isWebPreview(): boolean {
  return (
    __DEV__ &&
    Platform.OS === "web" &&
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("preview") === "1"
  );
}

/** Web-only: dev preview frames pass ?pilot=1 to preview pilot-gated screens (never persisted). */
function isWebPilotPreview(): boolean {
  return (
    __DEV__ &&
    Platform.OS === "web" &&
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("pilot") === "1"
  );
}

const CONSENT_KEY = "@hive_consent_v1";
const PILOT_KEY = "@hive_pilot_mode";
export const SUPERUSER_KEY = "@hive_superuser_v1";
export const PILOT_ACTIVATION_CODE = "HIVE-PILOT-2026";

const API = () => `https://${process.env.EXPO_PUBLIC_DOMAIN}/api`;

/**
 * Founder superuser unlock — the code is validated by the server against the
 * SUPERUSER_PASSWORD secret. Nothing is hardcoded client-side; a wrong code
 * or an unreachable server never unlocks anything.
 */
async function validateSuperuserCode(code: string): Promise<boolean> {
  try {
    const res = await fetch(`${API()}/app/superuser/unlock`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
    if (!res.ok) return false;
    const data = (await res.json()) as { ok?: boolean };
    return data.ok === true;
  } catch {
    return false;
  }
}

interface AppModeContextValue {
  /** null while loading from storage */
  consentAccepted: boolean | null;
  acceptConsent: () => Promise<void>;
  /** Hidden pilot-programme flag. Store builds default to false ("clean" mode). */
  pilotMode: boolean;
  activatePilot: (code: string) => Promise<boolean>;
  deactivatePilot: () => Promise<void>;
  /** Founder superuser (server-validated) — pilot mode + every card tier unlocked. */
  superuserMode: boolean;
  /** Wipes ALL locally stored app data and returns the app to first launch. */
  deleteAllData: () => Promise<void>;
}

const AppModeContext = createContext<AppModeContextValue | null>(null);

export function AppModeProvider({
  children,
  onReady,
}: {
  children: React.ReactNode;
  onReady?: () => void;
}) {
  const [consentAccepted, setConsentAccepted] = useState<boolean | null>(null);
  const [pilotMode, setPilotMode] = useState(false);
  const [superuserMode, setSuperuserMode] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [consent, pilot, superuser] = await Promise.all([
          AsyncStorage.getItem(CONSENT_KEY),
          AsyncStorage.getItem(PILOT_KEY),
          AsyncStorage.getItem(SUPERUSER_KEY),
        ]);
        setConsentAccepted(!!consent || isWebPreview());
        setPilotMode(pilot === "true" || isWebPilotPreview());
        setSuperuserMode(superuser === "true");
      } catch {
        setConsentAccepted(isWebPreview());
      } finally {
        onReady?.();
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function acceptConsent() {
    await AsyncStorage.setItem(CONSENT_KEY, new Date().toISOString());
    setConsentAccepted(true);
  }

  async function activatePilot(code: string) {
    if (code.trim().toUpperCase() === PILOT_ACTIVATION_CODE) {
      await AsyncStorage.setItem(PILOT_KEY, "true");
      setPilotMode(true);
      return true;
    }
    // Not the pilot code — check the founder superuser code with the server.
    if (await validateSuperuserCode(code.trim())) {
      await AsyncStorage.multiSet([
        [PILOT_KEY, "true"],
        [SUPERUSER_KEY, "true"],
      ]);
      setPilotMode(true);
      setSuperuserMode(true);
      return true;
    }
    return false;
  }

  async function deactivatePilot() {
    await AsyncStorage.multiRemove([PILOT_KEY, SUPERUSER_KEY]);
    setPilotMode(false);
    setSuperuserMode(false);
  }

  async function deleteAllData() {
    const { deleteAllDocuments } = await import("@/utils/documentsStore");
    const { deleteAllIdentityData } = await import("@/utils/identityStore");
    await deleteAllDocuments();
    await deleteAllIdentityData();
    await AsyncStorage.clear();
    setPilotMode(false);
    setSuperuserMode(false);
    setConsentAccepted(false);
  }

  return (
    <AppModeContext.Provider
      value={{ consentAccepted, acceptConsent, pilotMode, activatePilot, deactivatePilot, superuserMode, deleteAllData }}
    >
      {children}
    </AppModeContext.Provider>
  );
}

export function useAppMode() {
  const ctx = useContext(AppModeContext);
  if (!ctx) throw new Error("useAppMode must be used within AppModeProvider");
  return ctx;
}
