import AsyncStorage from "@react-native-async-storage/async-storage";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import * as ImagePicker from "expo-image-picker";
import { Platform } from "react-native";

/* ────────────────────────────────────────────────────────────────────────────
 * On-device identity verification store (Zero-Server framework).
 *
 * A selfie and a photo ID are captured to finish registration. Both stay on
 * the device — files live in the app's private identity/<userId>/ folder and
 * the record is indexed in AsyncStorage per user. Verification is completed
 * in person at a partner HIVE node (Zero-Server means no remote KYC).
 * ──────────────────────────────────────────────────────────────────────────── */

export type VerificationStatus = "not_started" | "in_progress" | "pending_review";

export interface IdentityRecord {
  userId: string;
  selfieUri?: string;
  idDocUri?: string;
  idDocName?: string;
  submittedAt?: string; // ISO date when both items were provided
}

const KEY_PREFIX = "hive_identity_v1_";
const IDENTITY_ROOT = `${FileSystem.documentDirectory ?? ""}identity/`;

/**
 * Web preview: picker URIs are transient blob: URLs that die on reload, so
 * persisting them would fake a "verified" state with no underlying files.
 * Identity state is therefore session-only in the browser.
 */
const webSession = new Map<string, IdentityRecord>();

function keyFor(userId: string): string {
  return `${KEY_PREFIX}${userId}`;
}

function dirFor(userId: string): string {
  return `${IDENTITY_ROOT}${userId.replace(/[^\w-]+/g, "_")}/`;
}

export function verificationStatus(rec: IdentityRecord | null): VerificationStatus {
  if (!rec || (!rec.selfieUri && !rec.idDocUri)) return "not_started";
  if (rec.selfieUri && rec.idDocUri) return "pending_review";
  return "in_progress";
}

export const STATUS_META: Record<VerificationStatus, { label: string; icon: string; hex: string }> = {
  not_started:    { label: "Not started",                    icon: "account-question-outline", hex: "#B45309" },
  in_progress:    { label: "One step left",                  icon: "progress-clock",           hex: "#B45309" },
  pending_review: { label: "Ready — verify at a HIVE node",  icon: "clock-check-outline",      hex: "#047857" },
};

export async function getIdentity(userId: string): Promise<IdentityRecord | null> {
  if (Platform.OS === "web") return webSession.get(userId) ?? null;
  try {
    const raw = await AsyncStorage.getItem(keyFor(userId));
    return raw ? (JSON.parse(raw) as IdentityRecord) : null;
  } catch {
    return null;
  }
}

async function saveIdentity(rec: IdentityRecord): Promise<void> {
  const complete = !!rec.selfieUri && !!rec.idDocUri;
  const next: IdentityRecord = {
    ...rec,
    submittedAt: complete ? rec.submittedAt ?? new Date().toISOString() : undefined,
  };
  if (Platform.OS === "web") {
    webSession.set(rec.userId, next);
    return;
  }
  await AsyncStorage.setItem(keyFor(rec.userId), JSON.stringify(next));
}

/** Copy a picked asset into the user's private identity folder (native only). */
async function persistAsset(userId: string, uri: string, fileName: string): Promise<string> {
  if (Platform.OS === "web" || !FileSystem.documentDirectory) return uri;
  const dir = dirFor(userId);
  const info = await FileSystem.getInfoAsync(dir);
  if (!info.exists) await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
  const target = `${dir}${fileName}`;
  await FileSystem.copyAsync({ from: uri, to: target });
  return target;
}

/**
 * Capture a selfie: camera on native, photo-library upload on web (browsers
 * in the preview frame cannot reliably open the camera).
 * Returns the updated record, or null if the user cancelled.
 */
export async function captureSelfie(userId: string): Promise<IdentityRecord | null> {
  let result: ImagePicker.ImagePickerResult;
  if (Platform.OS === "web") {
    result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      allowsEditing: false,
      quality: 0.7,
    });
  } else {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      throw new Error("Camera permission is needed to take your selfie. You can also add it later from Settings.");
    }
    result = await ImagePicker.launchCameraAsync({
      mediaTypes: "images",
      cameraType: ImagePicker.CameraType.front,
      allowsEditing: false,
      quality: 0.7,
    });
  }
  if (result.canceled || !result.assets?.length) return null;

  const uri = await persistAsset(userId, result.assets[0].uri, `selfie-${Date.now()}.jpg`);
  const rec: IdentityRecord = { ...(await getIdentity(userId)), userId, selfieUri: uri };
  await saveIdentity(rec);
  return rec;
}

/**
 * Attach a photo ID (passport, driving licence, public services card) as an
 * image or PDF. Returns the updated record, or null if cancelled.
 */
export async function attachIdDocument(userId: string): Promise<IdentityRecord | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: ["application/pdf", "image/*"],
    copyToCacheDirectory: true,
    multiple: false,
  });
  if (result.canceled || !result.assets?.length) return null;

  const asset = result.assets[0];
  const safeName = (asset.name ?? "photo-id").replace(/[^\w.\- ]+/g, "_");
  const uri = await persistAsset(userId, asset.uri, `id-${Date.now()}-${safeName}`);
  const rec: IdentityRecord = {
    ...(await getIdentity(userId)),
    userId,
    idDocUri: uri,
    idDocName: asset.name ?? "Photo ID",
  };
  await saveIdentity(rec);
  return rec;
}

/** Remove one user's identity data (files + record). */
export async function deleteIdentity(userId: string): Promise<void> {
  webSession.delete(userId);
  await AsyncStorage.removeItem(keyFor(userId));
  if (Platform.OS !== "web") {
    try {
      await FileSystem.deleteAsync(dirFor(userId), { idempotent: true });
    } catch {
      // directory may not exist
    }
  }
}

/** Wipe ALL identity data — wired into "Delete All My Data". */
export async function deleteAllIdentityData(): Promise<void> {
  webSession.clear();
  try {
    const keys = await AsyncStorage.getAllKeys();
    const mine = keys.filter((k) => k.startsWith(KEY_PREFIX));
    if (mine.length) await AsyncStorage.multiRemove(mine);
  } catch {
    // AsyncStorage.clear() in deleteAllData covers the records regardless
  }
  if (Platform.OS !== "web") {
    try {
      await FileSystem.deleteAsync(IDENTITY_ROOT, { idempotent: true });
    } catch {
      // directory may not exist
    }
  }
}
