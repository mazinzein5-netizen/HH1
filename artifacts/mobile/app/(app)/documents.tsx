import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import * as Sharing from "expo-sharing";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { useAuth } from "@/context/AuthContext";
import { usePatient } from "@/context/PatientContext";
import { useColors } from "@/hooks/useColors";
import {
  deleteDocument,
  formatFileSize,
  importDocument,
  listDocuments,
  StoredDocument,
} from "@/utils/documentsStore";
import {
  emailPrescriptionToPharmacy,
  printPrescription,
  PrescriptionPatientInfo,
  sharePrescriptionPdf,
} from "@/utils/pharmacyShare";

export default function DocumentsScreen() {
  const colors = useColors();
  const { user } = useAuth();
  const { data } = usePatient();

  const [docs, setDocs] = useState<StoredDocument[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [busy, setBusy] = useState<"email" | "share" | "print" | "import" | null>(null);
  const [emailModal, setEmailModal] = useState(false);
  const [pharmacyEmail, setPharmacyEmail] = useState("");

  const patient: PrescriptionPatientInfo = {
    fullName: user?.fullName ?? "",
    dateOfBirth: user?.dateOfBirth,
    bloodType: user?.bloodType,
  };

  const activeMeds = data.kardex.filter((k) => k.status === "active");

  const refreshDocs = useCallback(async () => {
    const list = await listDocuments();
    setDocs(list);
    setLoadingDocs(false);
  }, []);

  useEffect(() => {
    refreshDocs();
  }, [refreshDocs]);

  async function handleImport() {
    try {
      setBusy("import");
      Haptics.selectionAsync();
      const doc = await importDocument();
      if (doc) {
        await refreshDocs();
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch {
      Alert.alert("Import failed", "Could not import that file. Please try again.");
    } finally {
      setBusy(null);
    }
  }

  async function handleViewDoc(doc: StoredDocument) {
    try {
      const available = await Sharing.isAvailableAsync();
      if (!available) {
        Alert.alert("Not supported", "Viewing files is not supported on this device.");
        return;
      }
      await Sharing.shareAsync(doc.uri, {
        mimeType: doc.mimeType,
        dialogTitle: doc.name,
      });
    } catch {
      Alert.alert("Unable to open", "Could not open this document.");
    }
  }

  function handleDeleteDoc(doc: StoredDocument) {
    Alert.alert("Delete document?", `"${doc.name}" will be removed from this device.`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await deleteDocument(doc.id);
          await refreshDocs();
        },
      },
    ]);
  }

  async function handleSendEmail() {
    setEmailModal(false);
    try {
      setBusy("email");
      await emailPrescriptionToPharmacy(patient, data, pharmacyEmail.trim() || undefined);
    } catch {
      Alert.alert("Unable to send", "Could not open the mail composer. Try the Share option instead.");
    } finally {
      setBusy(null);
    }
  }

  async function handleShare() {
    try {
      setBusy("share");
      Haptics.selectionAsync();
      await sharePrescriptionPdf(patient, data);
    } catch {
      Alert.alert("Unable to share", "Could not generate the prescription PDF. Please try again.");
    } finally {
      setBusy(null);
    }
  }

  async function handlePrint() {
    if (Platform.OS === "web") {
      Alert.alert("Not available on web", "Printing is available on your phone via AirPrint or Android print services.");
      return;
    }
    try {
      setBusy("print");
      Haptics.selectionAsync();
      await printPrescription(patient, data);
    } catch {
      // user cancelled the print dialog — not an error
    } finally {
      setBusy(null);
    }
  }

  function docIcon(doc: StoredDocument): "file-pdf-box" | "file-image" | "file-document" {
    if (doc.mimeType?.includes("pdf") || doc.name.toLowerCase().endsWith(".pdf")) return "file-pdf-box";
    if (doc.mimeType?.startsWith("image/")) return "file-image";
    return "file-document";
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Pharmacy email modal */}
      <Modal visible={emailModal} transparent animationType="fade" onRequestClose={() => setEmailModal(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.modalOverlay}
        >
          <TouchableOpacity style={StyleSheet.absoluteFillObject} activeOpacity={1} onPress={() => setEmailModal(false)} />
          <View style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
              Send to Pharmacy
            </Text>
            <Text style={[styles.modalBody, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              Enter the pharmacy's email address, or leave it blank to fill it in inside your mail app.
            </Text>
            <TextInput
              value={pharmacyEmail}
              onChangeText={setPharmacyEmail}
              placeholder="pharmacy@example.ie"
              placeholderTextColor={colors.mutedForeground}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              style={[styles.modalInput, {
                color: colors.foreground,
                borderColor: colors.border,
                backgroundColor: colors.cardElevated,
                fontFamily: "Inter_400Regular",
              }]}
            />
            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: colors.cardElevated, borderColor: colors.border }]}
                onPress={() => setEmailModal(false)}
              >
                <Text style={[styles.modalBtnText, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: colors.gold, borderColor: colors.gold }]}
                onPress={handleSendEmail}
              >
                <Text style={[styles.modalBtnText, { color: "#1a1200", fontFamily: "Inter_700Bold" }]}>Open Mail</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Current Prescription card */}
        <LinearGradient colors={["#102060", "#1a3a9e", "#102060"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.rxCard}>
          <View style={styles.rxHeader}>
            <View style={[styles.rxIcon, { backgroundColor: "rgba(201,134,10,0.2)", borderColor: "rgba(201,134,10,0.45)" }]}>
              <MaterialCommunityIcons name="prescription" size={24} color={colors.gold} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.rxTitle, { fontFamily: "Inter_700Bold" }]}>Current Prescription</Text>
              <Text style={[styles.rxSub, { fontFamily: "Inter_400Regular" }]}>
                {activeMeds.length} active medication{activeMeds.length === 1 ? "" : "s"} · generated from your health card
              </Text>
            </View>
          </View>

          {activeMeds.slice(0, 4).map((m) => (
            <View key={m.id} style={styles.rxMedRow}>
              <MaterialCommunityIcons name="pill" size={13} color={colors.goldLight} />
              <Text style={[styles.rxMedText, { fontFamily: "Inter_500Medium" }]} numberOfLines={1}>
                {m.medication} {m.dose} — {m.frequency}
              </Text>
            </View>
          ))}
          {activeMeds.length > 4 && (
            <Text style={[styles.rxMore, { fontFamily: "Inter_400Regular" }]}>
              +{activeMeds.length - 4} more in the PDF
            </Text>
          )}

          <View style={styles.rxActions}>
            <TouchableOpacity
              style={[styles.rxActionBtn, { backgroundColor: colors.gold }]}
              activeOpacity={0.85}
              disabled={busy !== null}
              onPress={() => { setPharmacyEmail(""); setEmailModal(true); }}
            >
              {busy === "email" ? (
                <ActivityIndicator size="small" color="#1a1200" />
              ) : (
                <MaterialCommunityIcons name="email" size={17} color="#1a1200" />
              )}
              <Text style={[styles.rxActionText, { color: "#1a1200", fontFamily: "Inter_700Bold" }]}>Send to Pharmacy</Text>
            </TouchableOpacity>
            <View style={styles.rxActionRow2}>
              <TouchableOpacity
                style={[styles.rxSecondaryBtn, { borderColor: "rgba(255,255,255,0.25)" }]}
                activeOpacity={0.85}
                disabled={busy !== null}
                onPress={handleShare}
              >
                {busy === "share" ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <MaterialCommunityIcons name="share-variant" size={16} color="#fff" />
                )}
                <Text style={[styles.rxSecondaryText, { fontFamily: "Inter_600SemiBold" }]}>Share PDF</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.rxSecondaryBtn, { borderColor: "rgba(255,255,255,0.25)" }]}
                activeOpacity={0.85}
                disabled={busy !== null}
                onPress={handlePrint}
              >
                {busy === "print" ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <MaterialCommunityIcons name="printer" size={16} color="#fff" />
                )}
                <Text style={[styles.rxSecondaryText, { fontFamily: "Inter_600SemiBold" }]}>Print</Text>
              </TouchableOpacity>
            </View>
          </View>

          <Text style={[styles.rxDisclaimer, { fontFamily: "Inter_400Regular" }]}>
            For pharmacy information — not a legal prescription unless signed by a prescriber.
          </Text>
        </LinearGradient>

        {/* Pharmacy finder shortcut */}
        <TouchableOpacity
          activeOpacity={0.88}
          onPress={() => router.push("/(app)/pharmacies")}
          style={[styles.finderCard, { backgroundColor: colors.card, borderColor: "#22c55e33" }]}
        >
          <View style={[styles.finderIcon, { backgroundColor: "rgba(34,197,94,0.12)", borderColor: "rgba(34,197,94,0.3)" }]}>
            <MaterialCommunityIcons name="map-marker-radius" size={22} color="#22c55e" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.finderTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>Find a Pharmacy</Text>
            <Text style={[styles.finderSub, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              Nearby pharmacies, opening status, and one-tap call
            </Text>
          </View>
          <Feather name="chevron-right" size={18} color="#22c55e" />
        </TouchableOpacity>

        {/* Medical reports */}
        <View style={styles.reportsHeader}>
          <Text style={[styles.reportsTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>Medical Reports</Text>
          <TouchableOpacity
            style={[styles.importBtn, { backgroundColor: colors.glassPrimary, borderColor: colors.glassPrimaryBorder }]}
            activeOpacity={0.85}
            disabled={busy !== null}
            onPress={handleImport}
          >
            {busy === "import" ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Feather name="plus" size={15} color={colors.primary} />
            )}
            <Text style={[styles.importBtnText, { color: colors.primary, fontFamily: "Inter_600SemiBold" }]}>Import</Text>
          </TouchableOpacity>
        </View>

        {loadingDocs ? (
          <ActivityIndicator size="small" color={colors.mutedForeground} style={{ marginTop: 20 }} />
        ) : docs.length === 0 ? (
          <View style={[styles.emptyBox, { borderColor: colors.border }]}>
            <MaterialCommunityIcons name="file-document-outline" size={30} color={colors.mutedForeground} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              No reports yet. Import PDFs or photos of your medical reports to keep them with your prescription — all stored only on this device.
            </Text>
          </View>
        ) : (
          docs.map((doc) => (
            <View key={doc.id} style={[styles.docRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <MaterialCommunityIcons
                name={docIcon(doc)}
                size={26}
                color={docIcon(doc) === "file-pdf-box" ? "#e5484d" : colors.primary}
              />
              <View style={{ flex: 1 }}>
                <Text style={[styles.docName, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]} numberOfLines={1}>
                  {doc.name}
                </Text>
                <Text style={[styles.docMeta, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                  {new Date(doc.addedAt).toLocaleDateString()} {formatFileSize(doc.sizeBytes) ? `· ${formatFileSize(doc.sizeBytes)}` : ""}
                </Text>
              </View>
              <TouchableOpacity style={styles.docActionBtn} onPress={() => handleViewDoc(doc)} hitSlop={8}>
                <MaterialCommunityIcons name="eye-outline" size={19} color={colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.docActionBtn} onPress={() => handleDeleteDoc(doc)} hitSlop={8}>
                <MaterialCommunityIcons name="trash-can-outline" size={19} color={colors.accent} />
              </TouchableOpacity>
            </View>
          ))
        )}

        <Text style={[styles.privacyNote, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
          Documents are stored only on this device. Sending uses your own mail app or share sheet — nothing is uploaded by HIVE Intake.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { padding: 16, paddingBottom: 40, gap: 14 },

  rxCard: { borderRadius: 18, padding: 20, gap: 8, overflow: "hidden" },
  rxHeader: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 6 },
  rxIcon: { width: 46, height: 46, borderRadius: 13, alignItems: "center", justifyContent: "center", borderWidth: 1 },
  rxTitle: { color: "#fff", fontSize: 18, letterSpacing: -0.3 },
  rxSub: { color: "rgba(255,255,255,0.6)", fontSize: 12, marginTop: 2 },
  rxMedRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  rxMedText: { color: "rgba(255,255,255,0.85)", fontSize: 13, flex: 1 },
  rxMore: { color: "rgba(255,255,255,0.5)", fontSize: 12 },
  rxActions: { gap: 10, marginTop: 10 },
  rxActionBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 12, paddingVertical: 13 },
  rxActionText: { fontSize: 14.5 },
  rxActionRow2: { flexDirection: "row", gap: 10 },
  rxSecondaryBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, borderRadius: 12, borderWidth: 1, paddingVertical: 11 },
  rxSecondaryText: { color: "#fff", fontSize: 13.5 },
  rxDisclaimer: { color: "rgba(255,255,255,0.45)", fontSize: 10.5, marginTop: 6, lineHeight: 15 },

  finderCard: { flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 16, borderWidth: 1, padding: 16 },
  finderIcon: { width: 42, height: 42, borderRadius: 12, alignItems: "center", justifyContent: "center", borderWidth: 1 },
  finderTitle: { fontSize: 15.5 },
  finderSub: { fontSize: 12, marginTop: 2 },

  reportsHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 6 },
  reportsTitle: { fontSize: 17, letterSpacing: -0.3 },
  importBtn: { flexDirection: "row", alignItems: "center", gap: 6, borderRadius: 10, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 8 },
  importBtnText: { fontSize: 13 },

  emptyBox: { alignItems: "center", gap: 10, borderRadius: 14, borderWidth: 1, borderStyle: "dashed", padding: 24 },
  emptyText: { fontSize: 12.5, lineHeight: 19, textAlign: "center" },

  docRow: { flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 14, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12 },
  docName: { fontSize: 14 },
  docMeta: { fontSize: 11.5, marginTop: 2 },
  docActionBtn: { padding: 4 },

  privacyNote: { fontSize: 11, lineHeight: 17, textAlign: "center", marginTop: 6, paddingHorizontal: 8 },

  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", padding: 24 },
  modalCard: { borderRadius: 18, borderWidth: 1, padding: 20, gap: 12 },
  modalTitle: { fontSize: 17 },
  modalBody: { fontSize: 13, lineHeight: 19 },
  modalInput: { borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14 },
  modalBtnRow: { flexDirection: "row", gap: 10, marginTop: 4 },
  modalBtn: { flex: 1, alignItems: "center", borderRadius: 12, borderWidth: 1, paddingVertical: 12 },
  modalBtnText: { fontSize: 14 },
});
