import AsyncStorage from "@react-native-async-storage/async-storage";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import { Platform } from "react-native";

/* ────────────────────────────────────────────────────────────────────────────
 * On-device medical document store (Zero-Server framework).
 * Imported reports (PDFs / images) are copied into the app's private document
 * directory; metadata is indexed in AsyncStorage. Nothing leaves the device.
 * ──────────────────────────────────────────────────────────────────────────── */

export interface StoredDocument {
  id: string;
  name: string;
  uri: string;
  mimeType?: string;
  sizeBytes?: number;
  addedAt: string; // ISO date
}

const INDEX_KEY = "hive_documents_index";
const DOCS_DIR = `${FileSystem.documentDirectory ?? ""}medical-documents/`;

function makeId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
}

export async function listDocuments(): Promise<StoredDocument[]> {
  try {
    const raw = await AsyncStorage.getItem(INDEX_KEY);
    if (!raw) return [];
    const docs = JSON.parse(raw) as StoredDocument[];
    return Array.isArray(docs) ? docs : [];
  } catch {
    return [];
  }
}

async function saveIndex(docs: StoredDocument[]): Promise<void> {
  await AsyncStorage.setItem(INDEX_KEY, JSON.stringify(docs));
}

/**
 * Open the system document picker and import the chosen PDF/image into
 * on-device storage. Returns the stored document, or null if cancelled.
 */
export async function importDocument(): Promise<StoredDocument | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: ["application/pdf", "image/*"],
    copyToCacheDirectory: true,
    multiple: false,
  });
  if (result.canceled || !result.assets?.length) return null;

  const asset = result.assets[0];
  const id = makeId();
  let storedUri = asset.uri;

  if (Platform.OS !== "web" && FileSystem.documentDirectory) {
    const dirInfo = await FileSystem.getInfoAsync(DOCS_DIR);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(DOCS_DIR, { intermediates: true });
    }
    const safeName = (asset.name ?? "document").replace(/[^\w.\- ]+/g, "_");
    storedUri = `${DOCS_DIR}${id}-${safeName}`;
    await FileSystem.copyAsync({ from: asset.uri, to: storedUri });
  }

  const doc: StoredDocument = {
    id,
    name: asset.name ?? "Document",
    uri: storedUri,
    mimeType: asset.mimeType,
    sizeBytes: asset.size ?? undefined,
    addedAt: new Date().toISOString(),
  };

  const docs = await listDocuments();
  docs.unshift(doc);
  await saveIndex(docs);
  return doc;
}

/** Remove a document from the index and delete its local file. */
export async function deleteDocument(id: string): Promise<void> {
  const docs = await listDocuments();
  const doc = docs.find((d) => d.id === id);
  await saveIndex(docs.filter((d) => d.id !== id));
  if (doc && Platform.OS !== "web" && doc.uri.startsWith(DOCS_DIR)) {
    try {
      await FileSystem.deleteAsync(doc.uri, { idempotent: true });
    } catch {
      // file already gone — index is the source of truth
    }
  }
}

/** Delete all imported documents (used by "Delete All My Data"). */
export async function deleteAllDocuments(): Promise<void> {
  await AsyncStorage.removeItem(INDEX_KEY);
  if (Platform.OS !== "web") {
    try {
      await FileSystem.deleteAsync(DOCS_DIR, { idempotent: true });
    } catch {
      // directory may not exist
    }
  }
}

export function formatFileSize(bytes?: number): string {
  if (!bytes || bytes <= 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
