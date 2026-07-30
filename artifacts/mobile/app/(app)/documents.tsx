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
import { usePatient, type KardexEntry } from "@/context/PatientContext";
import { useColors } from "@/hooks/useColors";
import {
  CATEGORY_META,
  deleteDocument,
  type DocCategory,
  type DocSource,
  formatFileSize,
  importDocument,
  listDocuments,
  SOURCE_META,
  StoredDocument,
} from "@/utils/documentsStore";
import {
  emailPrescriptionToPharmacy,
  printPrescription,
  PrescriptionPatientInfo,
  sharePrescriptionPdf,
} from "@/utils/pharmacyShare";

// ─── Time-band helpers ────────────────────────────────────────────────────────

type TimeBand = "morning" | "midday" | "evening" | "night" | "asNeeded";

const TIME_META: Record<TimeBand, { label: string; emoji: string; hex: string; bg: string }> = {
  morning:  { label: "Morning",  emoji: "🌅", hex: "#D97706", bg: "rgba(217,119,6,0.15)"  },
  midday:   { label: "Midday",   emoji: "☀️",  hex: "#B45309", bg: "rgba(180,83,9,0.13)"   },
  evening:  { label: "Evening",  emoji: "🌆", hex: "#7C3AED", bg: "rgba(124,58,237,0.14)" },
  night:    { label: "Night",    emoji: "🌙", hex: "#1D4ED8", bg: "rgba(29,78,216,0.14)"  },
  asNeeded: { label: "As needed",emoji: "💊", hex: "#4B5563", bg: "rgba(75,85,99,0.13)"   },
};

function parseTimeBands(frequency: string): TimeBand[] {
  const f = frequency.toLowerCase();
  if (f.includes("prn") || f.includes("as needed") || f.includes("when required")) return ["asNeeded"];
  if (f.includes("qds") || f.includes("four times") || f.includes("qid")) return ["morning","midday","evening","night"];
  if (f.includes("tds") || f.includes("three times") || f.includes("tid")) return ["morning","midday","evening"];
  if (f.includes("bd") || f.includes("twice") || f.includes("bid")) return ["morning","evening"];
  if (f === "on" || f.startsWith("on ") || f.endsWith(" on") || f.includes("nocte") || f.includes("night")) return ["night"];
  if (f.includes("od") || f.includes("once daily") || f.includes("daily") || f.includes(" am")) return ["morning"];
  return ["morning"];
}

function getMedColor(bands: TimeBand[]): string {
  if (bands.length === 0) return TIME_META.morning.hex;
  return TIME_META[bands[0]].hex;
}

// ─── Anticoagulant helpers ────────────────────────────────────────────────────

const ANTICOAG_NAMES = [
  "apixaban","warfarin","rivaroxaban","dabigatran","edoxaban",
  "heparin","tinzaparin","enoxaparin","fondaparinux","acenocoumarol",
];

function isAnticoagulant(medication: string): boolean {
  const m = medication.toLowerCase();
  return ANTICOAG_NAMES.some((n) => m.includes(n));
}

function getAnticoagInstructions(med: KardexEntry): {
  whatItDoes: string;
  howToTake: string;
  missedDose: string;
  warningSign: string[];
  avoid: string[];
  tellYourTeam: string;
} {
  const name = med.medication;
  return {
    whatItDoes: `${name} is a blood thinner (anticoagulant). It prevents blood clots from forming in your blood vessels, reducing your risk of stroke and other serious clot-related events.`,
    howToTake: `Take ${name} ${med.dose} exactly as prescribed (${med.frequency}). Do NOT stop taking it without speaking to your doctor first — stopping suddenly greatly increases your risk of stroke or clot.`,
    missedDose: `If you miss a dose, take it as soon as you remember — unless it is almost time for your next dose. In that case, skip the missed dose. Never take two doses at once to make up for a missed one.`,
    warningSign: [
      "Unusual or prolonged bruising",
      "Pink, red, or dark brown urine",
      "Red or black, tarry stools",
      "Coughing up blood or vomit that looks like coffee grounds",
      "Severe headache, dizziness or weakness",
      "Heavy or unusual menstrual bleeding",
      "Cuts that will not stop bleeding after 10 minutes of pressure",
    ],
    avoid: [
      "Ibuprofen, aspirin, naproxen (unless prescribed by your doctor)",
      "St John's Wort (herbal supplement)",
      "Excessive alcohol (more than 1–2 units per day)",
      "Grapefruit juice (for some blood thinners)",
      "Starting any new medication without telling your doctor",
    ],
    tellYourTeam: `Always tell every doctor, dentist, nurse, or pharmacist that you take ${name} before any procedure, injection, or new medicine. Wear a medical alert bracelet if advised.`,
  };
}

function getMedUsageNote(entry: KardexEntry): string {
  const parts: string[] = [];
  const f = entry.frequency.toLowerCase();

  if (f.includes("meal") || entry.notes?.toLowerCase().includes("meal")) {
    parts.push("Take with food.");
  } else if (isAnticoagulant(entry.medication)) {
    parts.push("Can be taken with or without food.");
  } else if (entry.route === "Oral") {
    parts.push("Take with a full glass of water.");
  }

  if (entry.notes && !entry.notes.toLowerCase().includes("meal")) {
    parts.push(entry.notes);
  }

  return parts.join("  ");
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function TimeBandChip({ band }: { band: TimeBand }) {
  const m = TIME_META[band];
  return (
    <View style={[chip.wrap, { backgroundColor: m.bg, borderColor: m.hex + "55" }]}>
      <Text style={chip.emoji}>{m.emoji}</Text>
      <Text style={[chip.label, { color: m.hex }]}>{m.label}</Text>
    </View>
  );
}

const chip = StyleSheet.create({
  wrap: { flexDirection: "row", alignItems: "center", gap: 4, borderRadius: 20, borderWidth: 1, paddingHorizontal: 9, paddingVertical: 4 },
  emoji: { fontSize: 11 },
  label: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
});

// ─── Anticoagulant Detail Modal ───────────────────────────────────────────────

function AnticoagModal({ med, visible, onClose, colors }: {
  med: KardexEntry | null;
  visible: boolean;
  onClose: () => void;
  colors: any;
}) {
  if (!med) return null;
  const info = getAnticoagInstructions(med);
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={ac.overlay}>
        <TouchableOpacity style={StyleSheet.absoluteFillObject} activeOpacity={1} onPress={onClose} />
        <View style={[ac.sheet, { backgroundColor: colors.background }]}>
          {/* Handle */}
          <View style={[ac.handle, { backgroundColor: colors.border }]} />

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={ac.scroll}>
            {/* Header */}
            <LinearGradient colors={["#7f0000","#c62828","#b71c1c"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={ac.header}>
              <View style={ac.headerIcon}>
                <MaterialCommunityIcons name="shield-alert" size={26} color="#fff" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={ac.headerTitle}>{med.medication} {med.dose}</Text>
                <Text style={ac.headerSub}>Blood Thinner (Anticoagulant) — Patient Safety Guide</Text>
              </View>
            </LinearGradient>

            {/* What it does */}
            <Section title="What this medicine does" icon="information-outline" color="#1D4ED8" colors={colors}>
              <Text style={[ac.bodyText, { color: colors.foreground }]}>{info.whatItDoes}</Text>
            </Section>

            {/* How to take */}
            <Section title="How to take it" icon="pill" color="#047857" colors={colors}>
              <Text style={[ac.bodyText, { color: colors.foreground }]}>{info.howToTake}</Text>
              <View style={[ac.doseBadge, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <MaterialCommunityIcons name="clock-check-outline" size={15} color="#047857" />
                <Text style={[ac.doseText, { color: colors.foreground }]}>{med.dose} · {med.frequency}</Text>
              </View>
            </Section>

            {/* Missed dose */}
            <Section title="If you miss a dose" icon="calendar-clock" color="#B45309" colors={colors}>
              <Text style={[ac.bodyText, { color: colors.foreground }]}>{info.missedDose}</Text>
            </Section>

            {/* Bleeding warning signs — most prominent */}
            <View style={[ac.warnBox, { borderColor: "#ef4444" }]}>
              <View style={ac.warnHeader}>
                <MaterialCommunityIcons name="alert-circle" size={18} color="#ef4444" />
                <Text style={ac.warnTitle}>⚠️ Seek Emergency Help Immediately If You Notice:</Text>
              </View>
              {info.warningSign.map((s, i) => (
                <View key={i} style={ac.warnRow}>
                  <View style={ac.bullet} />
                  <Text style={[ac.warnItem, { color: colors.foreground }]}>{s}</Text>
                </View>
              ))}
              <View style={[ac.emergencyBtn]}>
                <MaterialCommunityIcons name="phone-alert" size={16} color="#fff" />
                <Text style={ac.emergencyText}>Call 999 or go to A&E immediately</Text>
              </View>
            </View>

            {/* What to avoid */}
            <Section title="Things to avoid" icon="cancel" color="#7C3AED" colors={colors}>
              {info.avoid.map((a, i) => (
                <View key={i} style={ac.avoidRow}>
                  <MaterialCommunityIcons name="close-circle-outline" size={14} color="#7C3AED" />
                  <Text style={[ac.avoidText, { color: colors.foreground }]}>{a}</Text>
                </View>
              ))}
            </Section>

            {/* Tell your team */}
            <Section title="Always tell your healthcare team" icon="account-heart-outline" color="#0369A1" colors={colors}>
              <Text style={[ac.bodyText, { color: colors.foreground }]}>{info.tellYourTeam}</Text>
            </Section>

            {/* Prescribed by */}
            <View style={[ac.prescriberBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <MaterialCommunityIcons name="doctor" size={14} color={colors.mutedForeground} />
              <Text style={[ac.prescriberText, { color: colors.mutedForeground }]}>
                Prescribed by {med.prescribedBy}{med.prescriberTitle ? ` · ${med.prescriberTitle}` : ""}
              </Text>
            </View>

            <TouchableOpacity style={[ac.closeBtn, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={onClose}>
              <Text style={[ac.closeBtnText, { color: colors.foreground }]}>Close</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function Section({ title, icon, color, colors, children }: {
  title: string; icon: string; color: string; colors: any; children: React.ReactNode;
}) {
  return (
    <View style={[ac.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={ac.sectionHeader}>
        <MaterialCommunityIcons name={icon as any} size={16} color={color} />
        <Text style={[ac.sectionTitle, { color }]}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

const ac = StyleSheet.create({
  overlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.55)" },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: "92%", paddingBottom: 40 },
  handle: { width: 40, height: 4, borderRadius: 2, alignSelf: "center", marginTop: 10, marginBottom: 4 },
  scroll: { padding: 16, gap: 12 },

  header: { borderRadius: 16, padding: 16, flexDirection: "row", alignItems: "center", gap: 14 },
  headerIcon: { width: 46, height: 46, borderRadius: 13, backgroundColor: "rgba(255,255,255,0.18)", alignItems: "center", justifyContent: "center" },
  headerTitle: { color: "#fff", fontSize: 17, fontFamily: "Inter_700Bold" },
  headerSub: { color: "rgba(255,255,255,0.75)", fontSize: 11.5, fontFamily: "Inter_400Regular", marginTop: 2 },

  section: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 8 },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 7 },
  sectionTitle: { fontSize: 13, fontFamily: "Inter_700Bold" },

  bodyText: { fontSize: 13.5, lineHeight: 21, fontFamily: "Inter_400Regular" },

  doseBadge: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 8, marginTop: 4 },
  doseText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },

  warnBox: { borderRadius: 14, borderWidth: 2, padding: 14, gap: 8, backgroundColor: "rgba(239,68,68,0.07)" },
  warnHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  warnTitle: { fontSize: 13, fontFamily: "Inter_700Bold", color: "#ef4444", flex: 1 },
  warnRow: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  bullet: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#ef4444", marginTop: 6 },
  warnItem: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 20, flex: 1 },
  emergencyBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: "#ef4444", borderRadius: 10, paddingVertical: 10, marginTop: 4 },
  emergencyText: { color: "#fff", fontSize: 13.5, fontFamily: "Inter_700Bold" },

  avoidRow: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  avoidText: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 20, flex: 1 },

  prescriberBox: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 12, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10 },
  prescriberText: { fontSize: 12, fontFamily: "Inter_400Regular" },

  closeBtn: { borderRadius: 12, borderWidth: 1, paddingVertical: 13, alignItems: "center", marginTop: 4 },
  closeBtnText: { fontSize: 14.5, fontFamily: "Inter_600SemiBold" },
});

// ─── Medication Guide Card ────────────────────────────────────────────────────

function MedGuideCard({ entry, colors, onAnticoagPress }: {
  entry: KardexEntry;
  colors: any;
  onAnticoagPress: (e: KardexEntry) => void;
}) {
  const bands = parseTimeBands(entry.frequency);
  const accent = getMedColor(bands);
  const anticoag = isAnticoagulant(entry.medication);
  const usageNote = getMedUsageNote(entry);

  return (
    <TouchableOpacity
      activeOpacity={anticoag ? 0.78 : 1}
      onPress={anticoag ? () => onAnticoagPress(entry) : undefined}
      style={[mg.card, { backgroundColor: colors.card, borderColor: colors.border }]}
    >
      {/* Colour accent bar */}
      <View style={[mg.accentBar, { backgroundColor: accent }]} />

      <View style={mg.inner}>
        {/* Title row */}
        <View style={mg.titleRow}>
          <View style={{ flex: 1 }}>
            <Text style={[mg.medName, { color: colors.foreground }]}>{entry.medication}</Text>
            <Text style={[mg.doseFreq, { color: colors.mutedForeground }]}>{entry.dose} · {entry.frequency}</Text>
          </View>
          {anticoag && (
            <View style={mg.anticoagBadge}>
              <MaterialCommunityIcons name="shield-alert" size={12} color="#fff" />
              <Text style={mg.anticoagText}>BLOOD THINNER</Text>
            </View>
          )}
        </View>

        {/* Time chips */}
        <View style={mg.chipRow}>
          {bands.map((b) => <TimeBandChip key={b} band={b} />)}
        </View>

        {/* Usage note */}
        {usageNote ? (
          <View style={[mg.noteBox, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
            <MaterialCommunityIcons name="information-outline" size={13} color={colors.mutedForeground} />
            <Text style={[mg.noteText, { color: colors.mutedForeground }]}>{usageNote}</Text>
          </View>
        ) : null}

        {/* Route pill */}
        <View style={mg.footer}>
          <View style={[mg.routePill, { backgroundColor: accent + "18", borderColor: accent + "44" }]}>
            <MaterialCommunityIcons name="road-variant" size={11} color={accent} />
            <Text style={[mg.routeText, { color: accent }]}>{entry.route}</Text>
          </View>
          {anticoag && (
            <View style={mg.tapHint}>
              <Text style={[mg.tapHintText, { color: colors.mutedForeground }]}>Tap for patient safety guide</Text>
              <Feather name="chevron-right" size={12} color={colors.mutedForeground} />
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const mg = StyleSheet.create({
  card: { borderRadius: 16, borderWidth: 1, flexDirection: "row", overflow: "hidden" },
  accentBar: { width: 5, borderTopLeftRadius: 16, borderBottomLeftRadius: 16 },
  inner: { flex: 1, padding: 14, gap: 8 },
  titleRow: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  medName: { fontSize: 15.5, fontFamily: "Inter_700Bold" },
  doseFreq: { fontSize: 12.5, fontFamily: "Inter_400Regular", marginTop: 2 },
  anticoagBadge: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#c62828", borderRadius: 8, paddingHorizontal: 7, paddingVertical: 3 },
  anticoagText: { color: "#fff", fontSize: 9.5, fontFamily: "Inter_700Bold", letterSpacing: 0.5 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  noteBox: { flexDirection: "row", alignItems: "flex-start", gap: 7, borderRadius: 10, borderWidth: 1, padding: 9 },
  noteText: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 18, flex: 1 },
  footer: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  routePill: { flexDirection: "row", alignItems: "center", gap: 4, borderRadius: 20, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 3 },
  routeText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  tapHint: { flexDirection: "row", alignItems: "center", gap: 3 },
  tapHintText: { fontSize: 11, fontFamily: "Inter_400Regular" },
});

// ─── Legend ───────────────────────────────────────────────────────────────────

function TimeLegend({ colors }: { colors: any }) {
  const bands: TimeBand[] = ["morning", "midday", "evening", "night", "asNeeded"];
  return (
    <View style={[lg.wrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[lg.title, { color: colors.mutedForeground }]}>WHEN TO TAKE — COLOUR GUIDE</Text>
      <View style={lg.row}>
        {bands.map((b) => {
          const m = TIME_META[b];
          return (
            <View key={b} style={lg.item}>
              <View style={[lg.dot, { backgroundColor: m.hex }]} />
              <Text style={[lg.label, { color: colors.mutedForeground }]}>{m.emoji} {m.label}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const lg = StyleSheet.create({
  wrap: { borderRadius: 14, borderWidth: 1, padding: 12, gap: 8 },
  title: { fontSize: 10, fontFamily: "Inter_600SemiBold", letterSpacing: 1 },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  item: { flexDirection: "row", alignItems: "center", gap: 5 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  label: { fontSize: 11, fontFamily: "Inter_400Regular" },
});

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function DocumentsScreen() {
  const colors = useColors();
  const { user } = useAuth();
  const { data } = usePatient();

  const [docs, setDocs] = useState<StoredDocument[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [busy, setBusy] = useState<"email" | "share" | "print" | "import" | null>(null);
  const [emailModal, setEmailModal] = useState(false);
  const [pharmacyEmail, setPharmacyEmail] = useState("");
  const [anticoagMed, setAnticoagMed] = useState<KardexEntry | null>(null);
  const [importModal, setImportModal] = useState(false);
  const [importCategory, setImportCategory] = useState<DocCategory>("report");
  const [importSource, setImportSource] = useState<DocSource>("gp");
  const [docFilter, setDocFilter] = useState<DocCategory | "all">("all");

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

  useEffect(() => { refreshDocs(); }, [refreshDocs]);

  function handleImport() {
    Haptics.selectionAsync();
    setImportCategory("report");
    setImportSource("gp");
    setImportModal(true);
  }

  async function handleConfirmImport() {
    setImportModal(false);
    try {
      setBusy("import");
      if (Platform.OS !== "web") {
        // Let the modal finish dismissing before presenting the system picker (iOS quirk)
        await new Promise((resolve) => setTimeout(resolve, 400));
      }
      const doc = await importDocument({ category: importCategory, source: importSource });
      if (doc) { await refreshDocs(); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); }
    } catch {
      Alert.alert("Import failed", "Could not import that file. Please try again.");
    } finally { setBusy(null); }
  }

  async function handleViewDoc(doc: StoredDocument) {
    try {
      const available = await Sharing.isAvailableAsync();
      if (!available) { Alert.alert("Not supported", "Viewing files is not supported on this device."); return; }
      await Sharing.shareAsync(doc.uri, { mimeType: doc.mimeType, dialogTitle: doc.name });
    } catch { Alert.alert("Unable to open", "Could not open this document."); }
  }

  function handleDeleteDoc(doc: StoredDocument) {
    Alert.alert("Delete document?", `"${doc.name}" will be removed from this device.`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => { await deleteDocument(doc.id); await refreshDocs(); } },
    ]);
  }

  async function handleSendEmail() {
    setEmailModal(false);
    try {
      setBusy("email");
      await emailPrescriptionToPharmacy(patient, data, pharmacyEmail.trim() || undefined);
    } catch { Alert.alert("Unable to send", "Could not open the mail composer. Try the Share option instead.");
    } finally { setBusy(null); }
  }

  async function handleShare() {
    try { setBusy("share"); Haptics.selectionAsync(); await sharePrescriptionPdf(patient, data); }
    catch { Alert.alert("Unable to share", "Could not generate the prescription PDF. Please try again."); }
    finally { setBusy(null); }
  }

  async function handlePrint() {
    if (Platform.OS === "web") { Alert.alert("Not available on web", "Printing is available on your phone."); return; }
    try { setBusy("print"); Haptics.selectionAsync(); await printPrescription(patient, data); }
    catch {} finally { setBusy(null); }
  }

  function handleMedCard(entry: KardexEntry) {
    Haptics.selectionAsync();
    setAnticoagMed(entry);
  }

  return (
    <View style={[s.root, { backgroundColor: colors.background }]}>
      {/* ── Pharmacy email modal ── */}
      <Modal visible={emailModal} transparent animationType="fade" onRequestClose={() => setEmailModal(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={s.modalOverlay}>
          <TouchableOpacity style={StyleSheet.absoluteFillObject} activeOpacity={1} onPress={() => setEmailModal(false)} />
          <View style={[s.modalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[s.modalTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>Send to Pharmacy</Text>
            <Text style={[s.modalBody, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              Enter the pharmacy's email address, or leave blank to fill it in your mail app.
            </Text>
            <TextInput
              value={pharmacyEmail}
              onChangeText={setPharmacyEmail}
              placeholder="pharmacy@example.ie"
              placeholderTextColor={colors.mutedForeground}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              style={[s.modalInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.cardElevated, fontFamily: "Inter_400Regular" }]}
            />
            <View style={s.modalBtnRow}>
              <TouchableOpacity style={[s.modalBtn, { backgroundColor: colors.cardElevated, borderColor: colors.border }]} onPress={() => setEmailModal(false)}>
                <Text style={[s.modalBtnText, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.modalBtn, { backgroundColor: colors.gold, borderColor: colors.gold }]} onPress={handleSendEmail}>
                <Text style={[s.modalBtnText, { color: "#1a1200", fontFamily: "Inter_700Bold" }]}>Open Mail</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Add document modal ── */}
      <Modal visible={importModal} transparent animationType="fade" onRequestClose={() => setImportModal(false)}>
        <View style={s.modalOverlay}>
          <TouchableOpacity style={StyleSheet.absoluteFillObject} activeOpacity={1} onPress={() => setImportModal(false)} />
          <View style={[s.modalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[s.modalTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>Add a Document</Text>
            <Text style={[s.modalBody, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              Tell us what you are adding and where it came from, then choose the file.
            </Text>

            <Text style={[s.pickLabel, { color: colors.mutedForeground, fontFamily: "Inter_600SemiBold" }]}>DOCUMENT TYPE</Text>
            {(Object.keys(CATEGORY_META) as DocCategory[]).map((c) => {
              const meta = CATEGORY_META[c];
              const selected = importCategory === c;
              return (
                <TouchableOpacity
                  key={c}
                  activeOpacity={0.8}
                  onPress={() => { Haptics.selectionAsync(); setImportCategory(c); }}
                  style={[s.typeRow, {
                    backgroundColor: selected ? meta.hex + "16" : colors.cardElevated,
                    borderColor: selected ? meta.hex : colors.border,
                  }]}
                >
                  <MaterialCommunityIcons name={meta.icon as any} size={20} color={meta.hex} />
                  <Text style={[s.typeRowText, { color: colors.foreground, fontFamily: selected ? "Inter_700Bold" : "Inter_500Medium" }]}>
                    {meta.label}
                  </Text>
                  <MaterialCommunityIcons
                    name={selected ? "radiobox-marked" : "radiobox-blank"}
                    size={20}
                    color={selected ? meta.hex : colors.mutedForeground}
                  />
                </TouchableOpacity>
              );
            })}

            <Text style={[s.pickLabel, { color: colors.mutedForeground, fontFamily: "Inter_600SemiBold" }]}>RECEIVED FROM</Text>
            <View style={s.sourceWrap}>
              {(Object.keys(SOURCE_META) as DocSource[]).map((src) => {
                const meta = SOURCE_META[src];
                const selected = importSource === src;
                return (
                  <TouchableOpacity
                    key={src}
                    activeOpacity={0.8}
                    onPress={() => { Haptics.selectionAsync(); setImportSource(src); }}
                    style={[s.sourceChip, {
                      backgroundColor: selected ? colors.glassPrimary : colors.cardElevated,
                      borderColor: selected ? colors.primary : colors.border,
                    }]}
                  >
                    <MaterialCommunityIcons name={meta.icon as any} size={15} color={selected ? colors.primary : colors.mutedForeground} />
                    <Text style={[s.sourceChipText, {
                      color: selected ? colors.primary : colors.mutedForeground,
                      fontFamily: selected ? "Inter_700Bold" : "Inter_500Medium",
                    }]}>
                      {meta.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={s.modalBtnRow}>
              <TouchableOpacity style={[s.modalBtn, { backgroundColor: colors.cardElevated, borderColor: colors.border }]} onPress={() => setImportModal(false)}>
                <Text style={[s.modalBtnText, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.modalBtn, { backgroundColor: colors.gold, borderColor: colors.gold }]} onPress={handleConfirmImport}>
                <Text style={[s.modalBtnText, { color: "#1a1200", fontFamily: "Inter_700Bold" }]}>Choose File</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Anticoagulant safety modal ── */}
      <AnticoagModal
        med={anticoagMed}
        visible={anticoagMed !== null}
        onClose={() => setAnticoagMed(null)}
        colors={colors}
      />

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {/* Current Prescription summary card */}
        <LinearGradient colors={["#102060","#1a3a9e","#102060"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.rxCard}>
          <View style={s.rxHeader}>
            <View style={[s.rxIcon, { backgroundColor: "rgba(201,134,10,0.2)", borderColor: "rgba(201,134,10,0.45)" }]}>
              <MaterialCommunityIcons name="prescription" size={24} color={colors.gold} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[s.rxTitle, { fontFamily: "Inter_700Bold" }]}>Current Prescription</Text>
              <Text style={[s.rxSub, { fontFamily: "Inter_400Regular" }]}>
                {activeMeds.length} active medication{activeMeds.length === 1 ? "" : "s"} · from your health card
              </Text>
            </View>
          </View>

          {activeMeds.slice(0, 4).map((m) => (
            <View key={m.id} style={s.rxMedRow}>
              <MaterialCommunityIcons name="pill" size={13} color={colors.goldLight} />
              <Text style={[s.rxMedText, { fontFamily: "Inter_500Medium" }]} numberOfLines={1}>
                {m.medication} {m.dose} — {m.frequency}
              </Text>
              {isAnticoagulant(m.medication) && (
                <MaterialCommunityIcons name="shield-alert" size={14} color="#ff8a80" />
              )}
            </View>
          ))}
          {activeMeds.length > 4 && (
            <Text style={[s.rxMore, { fontFamily: "Inter_400Regular" }]}>+{activeMeds.length - 4} more in the PDF</Text>
          )}

          <View style={s.rxActions}>
            <TouchableOpacity
              style={[s.rxActionBtn, { backgroundColor: colors.gold }]}
              activeOpacity={0.85}
              disabled={busy !== null}
              onPress={() => { setPharmacyEmail(""); setEmailModal(true); }}
            >
              {busy === "email" ? <ActivityIndicator size="small" color="#1a1200" /> : <MaterialCommunityIcons name="email" size={17} color="#1a1200" />}
              <Text style={[s.rxActionText, { color: "#1a1200", fontFamily: "Inter_700Bold" }]}>Send to Pharmacy</Text>
            </TouchableOpacity>
            <View style={s.rxActionRow2}>
              <TouchableOpacity style={[s.rxSecondaryBtn, { borderColor: "rgba(255,255,255,0.25)" }]} activeOpacity={0.85} disabled={busy !== null} onPress={handleShare}>
                {busy === "share" ? <ActivityIndicator size="small" color="#fff" /> : <MaterialCommunityIcons name="share-variant" size={16} color="#fff" />}
                <Text style={[s.rxSecondaryText, { fontFamily: "Inter_600SemiBold" }]}>Share PDF</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.rxSecondaryBtn, { borderColor: "rgba(255,255,255,0.25)" }]} activeOpacity={0.85} disabled={busy !== null} onPress={handlePrint}>
                {busy === "print" ? <ActivityIndicator size="small" color="#fff" /> : <MaterialCommunityIcons name="printer" size={16} color="#fff" />}
                <Text style={[s.rxSecondaryText, { fontFamily: "Inter_600SemiBold" }]}>Print</Text>
              </TouchableOpacity>
            </View>
          </View>
          <Text style={[s.rxDisclaimer, { fontFamily: "Inter_400Regular" }]}>
            For pharmacy information — not a legal prescription unless signed by a prescriber.
          </Text>
        </LinearGradient>

        {/* Pharmacy finder */}
        <TouchableOpacity activeOpacity={0.88} onPress={() => router.push("/(app)/pharmacies")} style={[s.finderCard, { backgroundColor: colors.card, borderColor: "#22c55e33" }]}>
          <View style={[s.finderIcon, { backgroundColor: "rgba(34,197,94,0.12)", borderColor: "rgba(34,197,94,0.3)" }]}>
            <MaterialCommunityIcons name="map-marker-radius" size={22} color="#22c55e" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[s.finderTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>Find a Pharmacy</Text>
            <Text style={[s.finderSub, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              Nearby pharmacies, opening status, and one-tap call
            </Text>
          </View>
          <Feather name="chevron-right" size={18} color="#22c55e" />
        </TouchableOpacity>

        {/* ── Medication Guide ── */}
        {activeMeds.length > 0 && (
          <>
            <View style={s.sectionHeader}>
              <MaterialCommunityIcons name="clock-time-four-outline" size={17} color={colors.primary} />
              <Text style={[s.sectionTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>Medication Guide</Text>
            </View>
            <Text style={[s.sectionSub, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              Colour-coded by time of day. Tap any blood thinner for a full safety guide.
            </Text>

            <TimeLegend colors={colors} />

            {activeMeds.map((m) => (
              <MedGuideCard
                key={m.id}
                entry={m}
                colors={colors}
                onAnticoagPress={handleMedCard}
              />
            ))}
          </>
        )}

        {/* Medical Reports */}
        <View style={[s.reportsHeader, { marginTop: activeMeds.length > 0 ? 4 : 0 }]}>
          <Text style={[s.reportsTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>Medical Reports</Text>
          <TouchableOpacity
            style={[s.importBtn, { backgroundColor: colors.glassPrimary, borderColor: colors.glassPrimaryBorder }]}
            activeOpacity={0.85}
            disabled={busy !== null}
            onPress={handleImport}
          >
            {busy === "import" ? <ActivityIndicator size="small" color={colors.primary} /> : <Feather name="plus" size={15} color={colors.primary} />}
            <Text style={[s.importBtnText, { color: colors.primary, fontFamily: "Inter_600SemiBold" }]}>Import</Text>
          </TouchableOpacity>
        </View>

        {/* Category filter */}
        {docs.length > 0 && (
          <View style={s.filterRow}>
            {([["all", "All"], ["report", "Reports"], ["imaging", "Imaging"], ["prescription", "Prescriptions"]] as [DocCategory | "all", string][]).map(([key, label]) => {
              const selected = docFilter === key;
              return (
                <TouchableOpacity
                  key={key}
                  activeOpacity={0.8}
                  onPress={() => { Haptics.selectionAsync(); setDocFilter(key); }}
                  style={[s.filterChip, {
                    backgroundColor: selected ? colors.glassPrimary : colors.card,
                    borderColor: selected ? colors.primary : colors.border,
                  }]}
                >
                  <Text style={[s.filterChipText, {
                    color: selected ? colors.primary : colors.mutedForeground,
                    fontFamily: selected ? "Inter_700Bold" : "Inter_500Medium",
                  }]}>
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {loadingDocs ? (
          <ActivityIndicator size="small" color={colors.mutedForeground} style={{ marginTop: 20 }} />
        ) : docs.length === 0 ? (
          <View style={[s.emptyBox, { borderColor: colors.border }]}>
            <MaterialCommunityIcons name="file-document-outline" size={30} color={colors.mutedForeground} />
            <Text style={[s.emptyText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              No documents yet. Import medical reports, imaging reports (X-ray, MRI, CT), or prescriptions as PDFs or photos — all stored only on this device.
            </Text>
          </View>
        ) : (
          (() => {
            const filtered = docs.filter((d) => docFilter === "all" || (d.category ?? "report") === docFilter);
            if (filtered.length === 0) {
              return (
                <View style={[s.emptyBox, { borderColor: colors.border }]}>
                  <MaterialCommunityIcons name="filter-off-outline" size={26} color={colors.mutedForeground} />
                  <Text style={[s.emptyText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                    No documents in this category yet. Tap Import to add one.
                  </Text>
                </View>
              );
            }
            return filtered.map((doc) => {
              const cat = (doc.category ?? "report") as DocCategory;
              const cm = CATEGORY_META[cat];
              return (
                <View key={doc.id} style={[s.docRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={[s.docIconWrap, { backgroundColor: cm.hex + "16", borderColor: cm.hex + "44" }]}>
                    <MaterialCommunityIcons name={cm.icon as any} size={20} color={cm.hex} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[s.docName, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]} numberOfLines={1}>{doc.name}</Text>
                    <Text style={[s.docMeta, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]} numberOfLines={1}>
                      {cm.shortLabel}
                      {doc.source ? ` · ${SOURCE_META[doc.source].label}` : ""}
                      {` · ${new Date(doc.addedAt).toLocaleDateString()}`}
                      {formatFileSize(doc.sizeBytes) ? ` · ${formatFileSize(doc.sizeBytes)}` : ""}
                    </Text>
                  </View>
                  <TouchableOpacity style={s.docActionBtn} onPress={() => handleViewDoc(doc)} hitSlop={8}>
                    <MaterialCommunityIcons name="eye-outline" size={19} color={colors.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity style={s.docActionBtn} onPress={() => handleDeleteDoc(doc)} hitSlop={8}>
                    <MaterialCommunityIcons name="trash-can-outline" size={19} color={colors.accent} />
                  </TouchableOpacity>
                </View>
              );
            });
          })()
        )}

        {/* How to receive documents */}
        <View style={[s.channelCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={s.channelHeader}>
            <MaterialCommunityIcons name="email-lock" size={17} color={colors.primary} />
            <Text style={[s.channelTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
              How to receive your reports
            </Text>
          </View>

          <View style={s.channelRow}>
            <MaterialCommunityIcons name="email-lock" size={15} color={colors.mutedForeground} style={s.channelRowIcon} />
            <Text style={[s.channelRowText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              <Text style={{ color: colors.foreground, fontFamily: "Inter_600SemiBold" }}>Healthmail:</Text> Ask your GP or consultant to send your reports to you by secure email. Save the attachment to your phone, then tap Import above.
            </Text>
          </View>

          <View style={s.channelRow}>
            <MaterialCommunityIcons name="hospital-building" size={15} color={colors.mutedForeground} style={s.channelRowIcon} />
            <Text style={[s.channelRowText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              <Text style={{ color: colors.foreground, fontFamily: "Inter_600SemiBold" }}>GP surgery or hospital:</Text> Request copies of letters, imaging reports, and prescriptions at reception — they can email or print them for you.
            </Text>
          </View>

          <View style={s.channelRow}>
            <MaterialCommunityIcons name="office-building" size={15} color={colors.mutedForeground} style={s.channelRowIcon} />
            <Text style={[s.channelRowText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              <Text style={{ color: colors.foreground, fontFamily: "Inter_600SemiBold" }}>Private practice:</Text> Private clinics can send results by email or through their patient portal — download the file, then import it here.
            </Text>
          </View>
        </View>

        <Text style={[s.privacyNote, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
          Documents are stored only on this device. Nothing is uploaded by HIVE COMPANION.
        </Text>
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root: { flex: 1 },
  scroll: { padding: 16, paddingBottom: 48, gap: 14 },

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

  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: -4 },
  sectionTitle: { fontSize: 17, letterSpacing: -0.3 },
  sectionSub: { fontSize: 12.5, lineHeight: 18, marginBottom: 2 },

  reportsHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  reportsTitle: { fontSize: 17, letterSpacing: -0.3 },
  importBtn: { flexDirection: "row", alignItems: "center", gap: 6, borderRadius: 10, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 8 },
  importBtnText: { fontSize: 13 },

  emptyBox: { alignItems: "center", gap: 10, borderRadius: 14, borderWidth: 1, borderStyle: "dashed", padding: 24 },
  emptyText: { fontSize: 12.5, lineHeight: 19, textAlign: "center" },

  docRow: { flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 14, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12 },
  docIconWrap: { width: 38, height: 38, borderRadius: 11, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  docName: { fontSize: 14 },
  docMeta: { fontSize: 11.5, marginTop: 2 },
  docActionBtn: { padding: 4 },

  filterRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  filterChip: { borderRadius: 20, borderWidth: 1, paddingHorizontal: 13, paddingVertical: 7 },
  filterChipText: { fontSize: 12.5 },

  pickLabel: { fontSize: 10.5, letterSpacing: 1, marginTop: 6 },
  typeRow: { flexDirection: "row", alignItems: "center", gap: 10, borderRadius: 12, borderWidth: 1.5, paddingHorizontal: 14, paddingVertical: 13 },
  typeRowText: { fontSize: 14.5, flex: 1 },
  sourceWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  sourceChip: { flexDirection: "row", alignItems: "center", gap: 5, borderRadius: 20, borderWidth: 1, paddingHorizontal: 11, paddingVertical: 8 },
  sourceChipText: { fontSize: 12.5 },

  channelCard: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 10, marginTop: 4 },
  channelHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  channelTitle: { fontSize: 14 },
  channelRow: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  channelRowIcon: { marginTop: 2 },
  channelRowText: { fontSize: 12.5, lineHeight: 19, flex: 1 },

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
