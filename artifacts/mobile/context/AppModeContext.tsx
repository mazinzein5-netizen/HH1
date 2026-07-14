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

const CONSENT_KEY = "@hive_consent_v1";
const PILOT_KEY = "@hive_pilot_mode";
export const PILOT_ACTIVATION_CODE = "HIVE-PILOT-2026";

interface AppModeContextValue {
  /** null while loading from storage */
  consentAccepted: boolean | null;
  acceptConsent: () => Promise<void>;
  /** Hidden pilot-programme flag. Store builds default to false ("clean" mode). */
  pilotMode: boolean;
  activatePilot: (code: string) => Promise<boolean>;
  deactivatePilot: () => Promise<void>;
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

  useEffect(() => {
    (async () => {
      try {
        const [consent, pilot] = await Promise.all([
          AsyncStorage.getItem(CONSENT_KEY),
          AsyncStorage.getItem(PILOT_KEY),
        ]);
        setConsentAccepted(!!consent || isWebPreview());
        setPilotMode(pilot === "true");
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
    if (code.trim().toUpperCase() !== PILOT_ACTIVATION_CODE) return false;
    await AsyncStorage.setItem(PILOT_KEY, "true");
    setPilotMode(true);
    return true;
  }

  async function deactivatePilot() {
    await AsyncStorage.removeItem(PILOT_KEY);
    setPilotMode(false);
  }

  async function deleteAllData() {
    const { deleteAllDocuments } = await import("@/utils/documentsStore");
    await deleteAllDocuments();
    await AsyncStorage.clear();
    setPilotMode(false);
    setConsentAccepted(false);
  }

  return (
    <AppModeContext.Provider
      value={{ consentAccepted, acceptConsent, pilotMode, activatePilot, deactivatePilot, deleteAllData }}
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
