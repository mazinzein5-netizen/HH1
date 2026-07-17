/**
 * Biometric sign-in (Face ID / fingerprint) — Zero-Server.
 *
 * A user enables biometric sign-in from Settings after signing in with their
 * password. We store ONLY a pointer to the local account (user id + display
 * name) under one device-level key — never the password. On the next visit,
 * a successful device biometric check re-opens that account. All checks run
 * on-device via the OS; nothing leaves the phone.
 *
 * Web preview has no biometric hardware, so the feature is native-only and
 * the UI explains that honestly.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants, { ExecutionEnvironment } from "expo-constants";
import * as LocalAuthentication from "expo-local-authentication";
import { Platform } from "react-native";

/** True when running inside the shared Expo Go testing app (not an installed build). */
export function isExpoGo(): boolean {
  return Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
}

const BIOMETRIC_KEY = "hive_biometric_login_v1";

export interface BiometricLoginRecord {
  userId: string;
  /** Shown on the login screen ("Sign in as Mary"). */
  displayName: string;
  enabledAt: string;
}

export interface BiometricSupport {
  available: boolean;
  /** Friendly name for what the device offers: "Face ID", "fingerprint", … */
  label: string;
  /** MDI icon that matches the label. */
  icon: "face-recognition" | "fingerprint";
  /** Why it is unavailable, for honest UI copy. */
  reason?: "web" | "no-hardware" | "not-enrolled" | "expo-go";
}

/** What the device can do right now. */
export async function getBiometricSupport(): Promise<BiometricSupport> {
  if (Platform.OS === "web") {
    return { available: false, label: "biometrics", icon: "fingerprint", reason: "web" };
  }
  if (isExpoGo()) {
    const label = Platform.OS === "ios" ? "Face ID" : "fingerprint";
    const icon = Platform.OS === "ios" ? ("face-recognition" as const) : ("fingerprint" as const);
    return { available: false, label, icon, reason: "expo-go" };
  }
  try {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    if (!hasHardware) {
      return { available: false, label: "biometrics", icon: "fingerprint", reason: "no-hardware" };
    }
    const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
    const facial = types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION);
    const label = facial ? (Platform.OS === "ios" ? "Face ID" : "face unlock") : "fingerprint";
    const icon = facial ? ("face-recognition" as const) : ("fingerprint" as const);
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    if (!enrolled) {
      return { available: false, label, icon, reason: "not-enrolled" };
    }
    return { available: true, label, icon };
  } catch {
    return { available: false, label: "biometrics", icon: "fingerprint", reason: "no-hardware" };
  }
}

export interface BiometricPromptResult {
  success: boolean;
  /** Why the prompt did not pass, for honest UI copy. */
  reason?: "cancel" | "lockout" | "not-available" | "error";
  /** Human-friendly explanation to show the user (empty on cancel). */
  message?: string;
}

/** Run the OS biometric prompt. `success` is true only on a real pass. */
export async function promptBiometric(
  promptMessage: string,
  cancelLabel = "Use password instead"
): Promise<BiometricPromptResult> {
  try {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage,
      cancelLabel,
      disableDeviceFallback: false,
    });
    if (result.success) return { success: true };
    const code: string = result.error ?? "";
    if (code === "user_cancel" || code === "system_cancel" || code === "app_cancel") {
      return { success: false, reason: "cancel" };
    }
    if (code === "lockout" || code === "lockout_permanent") {
      return {
        success: false,
        reason: "lockout",
        message:
          "Too many attempts — biometrics are temporarily locked. Unlock your phone with its passcode first, then try again, or sign in with your password.",
      };
    }
    if (code === "not_available" || code === "not_enrolled" || code === "passcode_not_set") {
      return {
        success: false,
        reason: "not-available",
        message: "Biometric sign-in isn't available right now. Please sign in with your password.",
      };
    }
    return {
      success: false,
      reason: "error",
      message: "The biometric check didn't complete. Please sign in with your password.",
    };
  } catch {
    return {
      success: false,
      reason: "error",
      message: "The biometric check didn't complete. Please sign in with your password.",
    };
  }
}

export async function getBiometricLogin(): Promise<BiometricLoginRecord | null> {
  try {
    const raw = await AsyncStorage.getItem(BIOMETRIC_KEY);
    return raw ? (JSON.parse(raw) as BiometricLoginRecord) : null;
  } catch {
    return null;
  }
}

export async function enableBiometricLogin(userId: string, displayName: string): Promise<void> {
  const rec: BiometricLoginRecord = {
    userId,
    displayName,
    enabledAt: new Date().toISOString(),
  };
  await AsyncStorage.setItem(BIOMETRIC_KEY, JSON.stringify(rec));
}

export async function disableBiometricLogin(): Promise<void> {
  try {
    await AsyncStorage.removeItem(BIOMETRIC_KEY);
  } catch {}
}
