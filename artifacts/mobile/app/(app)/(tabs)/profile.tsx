import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import * as Sharing from "expo-sharing";
import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import ThemedStatusBar from "@/components/ThemedStatusBar";
import QRCode from "react-native-qrcode-svg";
import { captureRef } from "react-native-view-shot";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/context/AuthContext";
import { KardexEntry, usePatient } from "@/context/PatientContext";
import HiveLogo from "@/components/HiveLogo";
import HoneycombWallpaper from "@/components/HoneycombWallpaper";
import Toast from "@/components/Toast";
import { useLogoTheme } from "@/context/LogoThemeContext";
import { useColors } from "@/hooks/useColors";

type MediaLibraryModule = typeof import("expo-media-library");
let ML: MediaLibraryModule | null = null;
try {
  ML = require("expo-media-library") as MediaLibraryModule;
} catch {
  // expo-media-library native module unavailable on web
}

type MemberGrade = "standard" | "gold" | "geriatric";
type CardTab = "standard" | "geriatric";

function getPIN(userId?: string) {
  if (!userId) return "542";
  const n = parseInt(userId.slice(-4), 16) || 542;
  return String((n % 900) + 100);
}

const MEMBER_GRADES: { key: MemberGrade; label: string; color: string; gradient: readonly [string, string, string]; benefits: string[] }[] = [
  {
    key: "standard",
    label: "Standard",
    color: "#4F6EF7",
    gradient: ["#102060", "#1a3a9e", "#102060"],
    benefits: ["Digital Health Card", "2 Health Questionnaires", "QR Emergency Access", "Medication Record"],
  },
  {
    key: "gold",
    label: "Gold Premium",
    color: "#D4A017",
    gradient: ["#2a1a00", "#6b4400", "#2a1a00"],
    benefits: ["All Standard Features", "All 4 Health Questionnaires", "Priority GP Access", "Annual Health Review", "Physiotherapy Network Access"],
  },
  {
    key: "geriatric",
    label: "Geriatric Safety",
    color: "#E5294E",
    gradient: ["#5c1010", "#9e2020", "#5c1010"],
    benefits: ["All Gold Features", "Falls Detection", "Cognitive Screening", "Smart Device Link", "24/7 SOS Auto-Call", "Carer Access Portal"],
  },
];

function MedDetailModal({ med, onClose }: { med: KardexEntry | null; onClose: () => void }) {
  const colors = useColors();
  if (!med) return null;

  const rows: { label: string; value: string; color?: string }[] = [
    { label: "Prescriber", value: med.prescribedBy },
    { label: "Title / Specialty", value: med.prescriberTitle ?? "General Practitioner" },
    { label: "IMC Registration No.", value: med.prescriberIMC ? `IMC ${med.prescriberIMC}` : "N/A", color: colors.goldLight },
    { label: "HSE Reference", value: med.prescriberHSERef ?? "N/A" },
    { label: "Prescription Date", value: med.prescriptionDate ?? med.startDate },
    { label: "Prescription Time", value: med.prescriptionTime ? `${med.prescriptionTime}` : "N/A" },
    {
      label: "Prescription Type",
      value: med.isRecurring
        ? `Recurring — every ${med.reviewIntervalDays ?? 90} days`
        : "Once-off prescription",
      color: med.isRecurring ? "#22c55e" : colors.foreground,
    },
    { label: "Next Review Date", value: med.nextReviewDate ?? "N/A" },
    { label: "Pharmacy", value: med.pharmacy ?? "N/A" },
    { label: "Batch / Lot Number", value: med.batchNumber ?? "N/A" },
  ];

  return (
    <Modal visible={!!med} transparent animationType="slide" onRequestClose={onClose}>
      <View style={[mStyles.overlay]}>
        <TouchableOpacity style={mStyles.backdrop} activeOpacity={1} onPress={onClose} />
        <View style={[mStyles.sheet, { backgroundColor: colors.card }]}>
          <View style={[mStyles.handle, { backgroundColor: colors.border }]} />

          <LinearGradient colors={["#0e1560", "#1320a0"]} style={mStyles.modalHeader}>
            <MaterialCommunityIcons name="pill" size={20} color={colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={[mStyles.medName, { color: "#fff", fontFamily: "Inter_700Bold" }]}>{med.medication}</Text>
              <Text style={[mStyles.medDose, { color: "rgba(255,255,255,0.65)", fontFamily: "Inter_400Regular" }]}>
                {med.dose} · {med.frequency} · {med.route}
              </Text>
            </View>
            <View style={[mStyles.statusBadge, {
              backgroundColor: med.status === "active" ? "#0a2818" : colors.cardElevated,
              borderColor: med.status === "active" ? "#22c55e44" : colors.border,
            }]}>
              <Text style={[mStyles.statusText, {
                color: med.status === "active" ? "#22c55e" : colors.mutedForeground,
                fontFamily: "Inter_600SemiBold",
              }]}>
                {med.status.toUpperCase()}
              </Text>
            </View>
          </LinearGradient>

          <ScrollView style={{ maxHeight: 460 }} showsVerticalScrollIndicator={false}>
            <View style={mStyles.section}>
              <View style={[mStyles.sectionHeader, { backgroundColor: colors.glassGold, borderColor: colors.glassGoldBorder }]}>
                <MaterialCommunityIcons name="doctor" size={16} color={colors.gold} />
                <Text style={[mStyles.sectionTitle, { color: colors.goldLight, fontFamily: "Inter_700Bold" }]}>
                  PRESCRIBER DETAILS
                </Text>
              </View>
              {rows.slice(0, 5).map((r) => (
                <View key={r.label} style={[mStyles.row, { borderBottomColor: colors.border }]}>
                  <Text style={[mStyles.rowLabel, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>{r.label}</Text>
                  <Text style={[mStyles.rowVal, { color: r.color ?? colors.foreground, fontFamily: "Inter_600SemiBold" }]}>{r.value}</Text>
                </View>
              ))}
            </View>

            <View style={mStyles.section}>
              <View style={[mStyles.sectionHeader, { backgroundColor: colors.glassPrimary, borderColor: colors.glassPrimaryBorder }]}>
                <MaterialCommunityIcons name="calendar-clock" size={16} color={colors.primary} />
                <Text style={[mStyles.sectionTitle, { color: colors.primaryLight, fontFamily: "Inter_700Bold" }]}>
                  PRESCRIPTION DETAILS
                </Text>
              </View>
              {rows.slice(5).map((r) => (
                <View key={r.label} style={[mStyles.row, { borderBottomColor: colors.border }]}>
                  <Text style={[mStyles.rowLabel, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>{r.label}</Text>
                  <Text style={[mStyles.rowVal, { color: r.color ?? colors.foreground, fontFamily: "Inter_600SemiBold" }]}>{r.value}</Text>
                </View>
              ))}
            </View>

            {med.notes && (
              <View style={mStyles.section}>
                <View style={[mStyles.sectionHeader, { backgroundColor: colors.glass, borderColor: colors.glassBorder }]}>
                  <MaterialCommunityIcons name="note-text" size={16} color={colors.mutedForeground} />
                  <Text style={[mStyles.sectionTitle, { color: colors.mutedForeground, fontFamily: "Inter_700Bold" }]}>
                    CARE NOTES
                  </Text>
                </View>
                <View style={mStyles.notesBox}>
                  <Text style={[mStyles.notesText, { color: colors.foreground, fontFamily: "Inter_400Regular" }]}>{med.notes}</Text>
                </View>
              </View>
            )}
          </ScrollView>

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={onClose}
            style={[mStyles.closeBtn, { backgroundColor: colors.cardElevated, borderColor: colors.border }]}
          >
            <Text style={[mStyles.closeBtnText, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

export default function HealthCardScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { data } = usePatient();
  const { prefs } = useLogoTheme();
  const [cardTab, setCardTab] = useState<CardTab>("standard");
  const [memberGrade, setMemberGrade] = useState<MemberGrade>("standard");
  const [selectedMed, setSelectedMed] = useState<KardexEntry | null>(null);
  const [sharing, setSharing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const exportRef = useRef<View>(null);
  const deviceConnected = true;

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 + 68 : insets.bottom + 64;

  const pin = getPIN(user?.id);
  const isGeriatric = cardTab === "geriatric";
  const grade = MEMBER_GRADES.find((g) => g.key === memberGrade)!;
  const activeKardex = data.kardex.filter((k) => k.status === "active");

  const qrData = JSON.stringify({
    type: "IbnCeena",
    id: user?.id?.slice(0, 12) ?? "demo001",
    name: user?.fullName ?? "John Doe",
    dob: user?.dateOfBirth ?? "12/04/1955",
    blood: user?.bloodType ?? "O+",
    pin,
    allergies: data.allergies.map((a) => a.drug),
    member: memberGrade,
  });

  const cardGradient = isGeriatric
    ? (["#5c1010", "#9e2020", "#5c1010"] as const)
    : grade.gradient;

  async function handleSOS() {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert("Trigger Auto Help Call", "This will send an emergency alert with your GPS location and medical data. Confirm?", [
      { text: "Cancel", style: "cancel" },
      { text: "Trigger SOS", style: "destructive", onPress: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error) },
    ]);
  }

  async function handleShareCard() {
    if (!exportRef.current) return;
    try {
      setSharing(true);
      Haptics.selectionAsync();
      const uri = await captureRef(exportRef, { format: "png", quality: 1, result: "tmpfile" });
      const available = await Sharing.isAvailableAsync();
      if (!available) {
        Alert.alert("Sharing unavailable", "Your device does not support sharing files.");
        return;
      }
      await Sharing.shareAsync(uri, { mimeType: "image/png", dialogTitle: "Share Health Card" });
    } catch {
      Alert.alert("Export failed", "Could not capture the health card. Please try again.");
    } finally {
      setSharing(false);
    }
  }

  async function saveToLibrary(uri: string) {
    await ML!.saveToLibraryAsync(uri);
    setToastMessage("Saved to Camera Roll");
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setToastVisible(true);
  }

  async function saveToAlbum(uri: string) {
    const asset = await ML!.createAssetAsync(uri);
    const albumName = "IbnCeena Health Cards";
    const existing = await ML!.getAlbumAsync(albumName);
    if (existing == null) {
      await ML!.createAlbumAsync(albumName, asset, false);
    } else {
      await ML!.addAssetsToAlbumAsync([asset], existing, false);
    }
    setToastMessage(`Saved to "${albumName}" album`);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setToastVisible(true);
  }

  function handleSaveChoice() {
    if (!exportRef.current) return;
    if (Platform.OS === "web") {
      Alert.alert(
        "Not Available on Web",
        "Saving to Photos isn't supported in the browser. Use the Share button to download your Health Card.",
        [{ text: "OK" }],
      );
      return;
    }
    Alert.alert(
      "Save Health Card",
      "Where would you like to save the card?",
      [
        {
          text: "Camera Roll",
          onPress: async () => {
            try {
              setSaving(true);
              Haptics.selectionAsync();
              const { status } = await ML!.requestPermissionsAsync();
              if (status !== "granted") {
                Alert.alert("Permission Required", "Please allow photo access in your device settings.");
                return;
              }
              const uri = await captureRef(exportRef, { format: "png", quality: 1, result: "tmpfile" });
              await saveToLibrary(uri);
            } catch {
              Alert.alert("Save failed", "Could not save the health card. Please try again.");
            } finally {
              setSaving(false);
            }
          },
        },
        {
          text: 'IbnCeena Health Cards Album',
          onPress: async () => {
            try {
              setSaving(true);
              Haptics.selectionAsync();
              const { status } = await ML!.requestPermissionsAsync();
              if (status !== "granted") {
                Alert.alert("Permission Required", "Please allow photo access in your device settings.");
                return;
              }
              const uri = await captureRef(exportRef, { format: "png", quality: 1, result: "tmpfile" });
              await saveToAlbum(uri);
            } catch {
              Alert.alert("Save failed", "Could not save the health card. Please try again.");
            } finally {
              setSaving(false);
            }
          },
        },
        { text: "Cancel", style: "cancel" },
      ],
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ThemedStatusBar />
      <HoneycombWallpaper density={prefs.density} />

      <MedDetailModal med={selectedMed} onClose={() => setSelectedMed(null)} />

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: topPad + 16, paddingBottom: bottomPad + 16 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Title row */}
        <View style={styles.titleRow}>
          <View>
            <Text style={[styles.title, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
              Health Card{"\n"}Portal
            </Text>
            <Text style={[styles.titleSub, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              Instant critical access{"\n"}linked to physical hardware.
            </Text>
          </View>
          <View style={[styles.subTabs, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {(["standard", "geriatric"] as CardTab[]).map((t) => (
              <TouchableOpacity
                key={t}
                activeOpacity={0.8}
                onPress={() => { Haptics.selectionAsync(); setCardTab(t); }}
                style={[styles.subTab, {
                  backgroundColor: cardTab === t
                    ? (t === "geriatric" ? colors.emergencyBg : colors.glassPrimary)
                    : "transparent",
                  borderWidth: cardTab === t ? 1 : 0,
                  borderColor: cardTab === t ? (t === "geriatric" ? colors.emergencyBorder : colors.glassPrimaryBorder) : "transparent",
                }]}
              >
                <Text style={[styles.subTabText, {
                  color: cardTab === t ? (t === "geriatric" ? colors.accent : colors.primary) : colors.mutedForeground,
                  fontFamily: cardTab === t ? "Inter_600SemiBold" : "Inter_400Regular",
                }]}>
                  {t === "standard" ? "Standard\nID" : "Geriatric\nSafety Pack"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Membership Grade Selector */}
        <View style={styles.gradeRow}>
          {MEMBER_GRADES.map((g) => (
            <TouchableOpacity
              key={g.key}
              activeOpacity={0.85}
              onPress={() => { Haptics.selectionAsync(); setMemberGrade(g.key); }}
              style={[styles.gradeBtn, {
                borderColor: memberGrade === g.key ? g.color : colors.border,
                backgroundColor: memberGrade === g.key ? g.color + "1a" : colors.glass,
                borderWidth: memberGrade === g.key ? 1.5 : 1,
              }]}
            >
              <MaterialCommunityIcons
                name={g.key === "standard" ? "card-account-details" : g.key === "gold" ? "crown" : "shield-star"}
                size={18}
                color={memberGrade === g.key ? g.color : colors.mutedForeground}
              />
              <Text style={[styles.gradeBtnText, {
                color: memberGrade === g.key ? g.color : colors.mutedForeground,
                fontFamily: memberGrade === g.key ? "Inter_700Bold" : "Inter_400Regular",
              }]}>
                {g.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Patient ID Card — HIVE logo treatment */}
        <LinearGradient colors={cardGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.patientCard}>
          <HoneycombWallpaper density={prefs.density} />
          <View style={[styles.goldBar, { backgroundColor: memberGrade === "gold" ? colors.gold : "rgba(201,134,10,0.4)" }]} />
          <View style={styles.patientCardTop}>
            <View style={styles.patientLogoBlock}>
              <HiveLogo
                size={22}
                goldIntensity={prefs.goldIntensity}
                depth={prefs.depth}
                textWeight={prefs.textWeight}
                showText
              />
              <Text style={[styles.memberLabel, { color: "rgba(255,255,255,0.5)", fontFamily: "Inter_400Regular", marginTop: 4 }]}>
                {grade.label.toUpperCase()}
              </Text>
            </View>
            <View style={styles.qrBox}>
              <QRCode value={qrData} size={76} color={isGeriatric ? "#E5294E" : grade.color} backgroundColor="transparent" />
            </View>
          </View>
          <View style={styles.patientInfo}>
            <Text style={[styles.patientIdLabel, { color: "rgba(255,255,255,0.45)", fontFamily: "Inter_400Regular" }]}>
              PATIENT IDENTIFIER
            </Text>
            <Text style={[styles.patientName, { color: "#FFFFFF", fontFamily: "Inter_700Bold" }]}>
              {user?.fullName ?? "John Doe"}
            </Text>
            <View style={styles.patientMeta}>
              <Text style={[styles.patientMetaText, { color: "rgba(255,255,255,0.7)", fontFamily: "Inter_400Regular" }]}>
                DOB: {user?.dateOfBirth ?? "12/04/1955"}
              </Text>
              <Text style={[styles.patientMetaText, { color: "rgba(255,255,255,0.7)", fontFamily: "Inter_400Regular" }]}>
                {user?.bloodType ?? "O+"}
              </Text>
              <View style={[styles.pinBadge, { backgroundColor: "rgba(0,0,0,0.35)" }]}>
                <Text style={[styles.pinText, { color: "rgba(255,255,255,0.85)", fontFamily: "Inter_500Medium" }]}>
                  PIN: {pin}
                </Text>
              </View>
            </View>
          </View>
        </LinearGradient>

        {/* Health Card Action Buttons */}
        <View style={styles.cardActionsRow}>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleShareCard}
            disabled={sharing || saving}
            style={[styles.shareBtn, { backgroundColor: colors.glassPrimary, borderColor: colors.glassPrimaryBorder, opacity: sharing ? 0.6 : 1 }]}
          >
            {sharing ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <MaterialCommunityIcons name="share-variant" size={18} color={colors.primary} />
            )}
            <Text style={[styles.shareBtnText, { color: colors.primary, fontFamily: "Inter_600SemiBold" }]}>
              {sharing ? "Exporting…" : "Share"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleSaveChoice}
            disabled={saving || sharing}
            style={[styles.shareBtn, { backgroundColor: colors.glass, borderColor: colors.border, opacity: saving ? 0.6 : 1 }]}
          >
            {saving ? (
              <ActivityIndicator size="small" color={colors.foreground} />
            ) : (
              <MaterialCommunityIcons name="download" size={18} color={colors.foreground} />
            )}
            <Text style={[styles.shareBtnText, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
              {saving ? "Saving…" : "Save"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Membership Benefits */}
        <View style={[styles.benefitsCard, { backgroundColor: colors.card, borderColor: grade.color + "44" }]}>
          <View style={styles.benefitsHeader}>
            <MaterialCommunityIcons
              name={grade.key === "standard" ? "card-account-details" : grade.key === "gold" ? "crown" : "shield-star"}
              size={18}
              color={grade.color}
            />
            <Text style={[styles.benefitsTitle, { color: grade.color, fontFamily: "Inter_700Bold" }]}>
              {grade.label} Benefits
            </Text>
          </View>
          {grade.benefits.map((b, i) => (
            <View key={i} style={styles.benefitRow}>
              <MaterialCommunityIcons name="check-circle" size={15} color={grade.color} />
              <Text style={[styles.benefitText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>{b}</Text>
            </View>
          ))}
        </View>

        {/* First Responders Note */}
        <View style={[styles.noteCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.noteText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
            <Text style={{ color: colors.foreground, fontFamily: "Inter_600SemiBold" }}>First Responders: </Text>
            Scan the QR code and enter the 3-digit PIN to unlock the critical care dashboard with full medication, allergy and condition history.
          </Text>
        </View>

        {/* Active Medical Profile */}
        <View style={[styles.profileSection, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.profileHeader}>
            <View style={[styles.profileIconWrap, { backgroundColor: colors.emergencyBg }]}>
              <MaterialCommunityIcons name="shield-alert" size={22} color={colors.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.profileTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>Active Medical Profile</Text>
              <Text style={[styles.profileSub, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                Live API Link {"  "}<Text style={{ color: "#5EE7A0" }}>●</Text>{"  "}AI Safety Scan Active
              </Text>
            </View>
          </View>

          <View style={styles.vitalsRow}>
            <LinearGradient colors={["#2a1218", "#1a0c0e"]} style={[styles.vitalsCard, { borderColor: colors.emergencyBorder }]}>
              <MaterialCommunityIcons name="heart-pulse" size={18} color={colors.accent} />
              <Text style={[styles.vitalsLabel, { color: colors.accent, fontFamily: "Inter_600SemiBold" }]}>HEART RATE</Text>
              <View style={styles.vitalsValue}>
                <Text style={[styles.vitalsNum, { color: colors.accent, fontFamily: "Inter_700Bold" }]}>72</Text>
                <Text style={[styles.vitalsUnit, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>bpm</Text>
              </View>
            </LinearGradient>

            {deviceConnected && (
              <LinearGradient colors={["#0f1840", "#111a50"]} style={[styles.vitalsCard, { borderColor: colors.physioBorder }]}>
                <MaterialCommunityIcons name="water-percent" size={18} color={colors.primary} />
                <Text style={[styles.vitalsLabel, { color: colors.primary, fontFamily: "Inter_600SemiBold" }]}>SpO₂</Text>
                <View style={styles.vitalsValue}>
                  <Text style={[styles.vitalsNum, { color: colors.primary, fontFamily: "Inter_700Bold" }]}>97</Text>
                  <Text style={[styles.vitalsUnit, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>%</Text>
                </View>
              </LinearGradient>
            )}

            <LinearGradient colors={["#0f200a", "#111a0c"]} style={[styles.vitalsCard, { borderColor: "#22c55e33" }]}>
              <MaterialCommunityIcons name="map-marker" size={18} color="#22c55e" />
              <Text style={[styles.vitalsLabel, { color: "#22c55e", fontFamily: "Inter_600SemiBold" }]}>GPS</Text>
              <Text style={[styles.gpsText, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>Tralee{"\n"}Kerry</Text>
            </LinearGradient>
          </View>

          {deviceConnected && (
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => { Haptics.selectionAsync(); router.push("/(app)/monitoring"); }}
              style={[styles.monitoringBtn, { backgroundColor: colors.glassPrimary, borderColor: colors.glassPrimaryBorder }]}
            >
              <MaterialCommunityIcons name="chart-areaspline" size={17} color={colors.primary} />
              <Text style={[styles.monitoringBtnText, { color: colors.primary, fontFamily: "Inter_600SemiBold" }]}>
                View Full Health Monitoring — Sleep · ECG · HRV · Metabolism
              </Text>
              <Feather name="chevron-right" size={14} color={colors.primary} />
            </TouchableOpacity>
          )}

          <TouchableOpacity activeOpacity={0.85} onPress={handleSOS}>
            <LinearGradient colors={["#c0392b", "#e74c3c"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.sosBtn}>
              <MaterialCommunityIcons name="phone-ring" size={22} color="#fff" />
              <Text style={[styles.sosBtnText, { fontFamily: "Inter_700Bold" }]}>Trigger Auto Help Call</Text>
            </LinearGradient>
          </TouchableOpacity>

          {(cardTab === "geriatric" || memberGrade === "geriatric") && (
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => router.push("/(app)/geriatric")}
              style={[styles.geriatricBtn, { backgroundColor: "rgba(167,139,250,0.10)", borderColor: "rgba(167,139,250,0.25)" }]}
            >
              <MaterialCommunityIcons name="brain" size={18} color="#a78bfa" />
              <Text style={[styles.geriatricBtnText, { color: "#a78bfa", fontFamily: "Inter_600SemiBold" }]}>
                Open Memory & Wellbeing Check-In
              </Text>
              <Feather name="chevron-right" size={14} color="#a78bfa" />
            </TouchableOpacity>
          )}

          {data.allergies.length > 0 && (
            <>
              <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>CRITICAL ALLERGIES</Text>
              <View style={styles.allergyRow}>
                {data.allergies.map((a) => (
                  <View key={a.id} style={[styles.allergyChip, {
                    borderColor: a.severity === "life-threatening" ? colors.accent : colors.fastTrackBorder,
                    backgroundColor: a.severity === "life-threatening" ? colors.emergencyBg : colors.fastTrackBg,
                  }]}>
                    <Text style={[styles.allergyChipText, {
                      color: a.severity === "life-threatening" ? colors.accent : colors.fastTrack,
                      fontFamily: "Inter_500Medium",
                    }]}>
                      {a.drug}{a.severity === "life-threatening" ? ` — ${a.reaction}` : ""}
                    </Text>
                  </View>
                ))}
              </View>
            </>
          )}

          {activeKardex.length > 0 && (
            <>
              <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
                CURRENT MEDICATIONS
              </Text>
              <View style={[styles.medTable, { backgroundColor: colors.cardElevated, borderColor: colors.border }]}>
                {activeKardex.map((med, i) => (
                  <TouchableOpacity
                    key={med.id}
                    activeOpacity={0.85}
                    onPress={() => { Haptics.selectionAsync(); setSelectedMed(med); }}
                    style={[styles.medRow, i > 0 && { borderTopWidth: 1, borderTopColor: colors.border }]}
                  >
                    <View style={styles.medInfo}>
                      <Text style={[styles.medName, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>{med.medication}</Text>
                      <Text style={[styles.medFreq, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                        {med.frequency} · {med.route}
                      </Text>
                      <Text style={[styles.medPrescriber, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                        Dr. {med.prescribedBy}
                      </Text>
                    </View>
                    <View style={[styles.doseBadge, { backgroundColor: colors.glassPrimary, borderColor: colors.glassPrimaryBorder }]}>
                      <Text style={[styles.doseText, { color: colors.primaryLight, fontFamily: "Inter_600SemiBold" }]}>{med.dose}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}
        </View>
      </ScrollView>

      {/* Off-screen export card — captured by captureRef when sharing */}
      <View ref={exportRef} collapsable={false} style={xStyles.offscreen}>
        <LinearGradient colors={["#0b1230", "#0e1a45", "#0b1230"]} style={xStyles.card}>
          {/* Header row */}
          <LinearGradient colors={cardGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={xStyles.header}>
            <View style={xStyles.headerLeft}>
              <HiveLogo size={22} goldIntensity={prefs.goldIntensity} depth={prefs.depth} textWeight={prefs.textWeight} showText />
              <Text style={xStyles.memberLabel}>{grade.label.toUpperCase()}</Text>
            </View>
            <View>
              <QRCode value={qrData} size={68} color={isGeriatric ? "#E5294E" : grade.color} backgroundColor="transparent" />
            </View>
          </LinearGradient>

          {/* Patient identity */}
          <View style={xStyles.identityBlock}>
            <Text style={xStyles.idCaption}>PATIENT IDENTIFIER</Text>
            <Text style={xStyles.patientName}>{user?.fullName ?? "John Doe"}</Text>
            <View style={xStyles.metaRow}>
              <View style={xStyles.metaChip}>
                <Text style={xStyles.metaLabel}>DOB</Text>
                <Text style={xStyles.metaValue}>{user?.dateOfBirth ?? "12/04/1955"}</Text>
              </View>
              <View style={xStyles.metaChip}>
                <Text style={xStyles.metaLabel}>BLOOD TYPE</Text>
                <Text style={[xStyles.metaValue, { color: "#E5294E" }]}>{user?.bloodType ?? "O+"}</Text>
              </View>
              <View style={xStyles.metaChip}>
                <Text style={xStyles.metaLabel}>PIN</Text>
                <Text style={xStyles.metaValue}>{pin}</Text>
              </View>
            </View>
          </View>

          {/* Critical Allergies */}
          {data.allergies.length > 0 && (
            <View style={xStyles.section}>
              <View style={xStyles.sectionHeader}>
                <Text style={xStyles.sectionTitle}>⚠  CRITICAL ALLERGIES</Text>
              </View>
              <View style={xStyles.chipRow}>
                {data.allergies.map((a) => (
                  <View key={a.id} style={[xStyles.allergyChip, { borderColor: a.severity === "life-threatening" ? "#E5294E" : "#4F6EF7" }]}>
                    <Text style={[xStyles.allergyChipText, { color: a.severity === "life-threatening" ? "#E5294E" : "#7b97ff" }]}>
                      {a.drug}{a.severity === "life-threatening" ? ` — ${a.reaction}` : ""}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Active Medications */}
          {activeKardex.length > 0 && (
            <View style={xStyles.section}>
              <View style={xStyles.sectionHeader}>
                <Text style={xStyles.sectionTitle}>💊  ACTIVE MEDICATIONS</Text>
              </View>
              {activeKardex.map((med, i) => (
                <View key={med.id} style={[xStyles.medRow, i > 0 && { borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.07)" }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={xStyles.medName}>{med.medication}</Text>
                    <Text style={xStyles.medDetail}>{med.dose}  ·  {med.frequency}  ·  {med.route}</Text>
                    <Text style={xStyles.medPrescriber}>Prescribed by Dr. {med.prescribedBy}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Footer */}
          <View style={xStyles.footer}>
            <Text style={xStyles.footerText}>FOR EMERGENCY USE — Scan QR and enter PIN for full health record</Text>
            <Text style={xStyles.footerDate}>Exported {new Date().toLocaleDateString("en-IE", { day: "2-digit", month: "short", year: "numeric" })}</Text>
          </View>
        </LinearGradient>
      </View>

      <Toast
        message={toastMessage}
        visible={toastVisible}
        onHide={() => setToastVisible(false)}
        bottomOffset={bottomPad + 16}
      />
    </View>
  );
}

const mStyles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: "flex-end" },
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.65)" },
  sheet: { borderTopLeftRadius: 26, borderTopRightRadius: 26, paddingBottom: 34, overflow: "hidden" },
  handle: { width: 40, height: 4, borderRadius: 2, alignSelf: "center", marginTop: 10, marginBottom: 4 },
  modalHeader: { padding: 18, flexDirection: "row", alignItems: "flex-start", gap: 12 },
  medName: { fontSize: 18, letterSpacing: -0.3 },
  medDose: { fontSize: 12, marginTop: 2 },
  statusBadge: { borderRadius: 10, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 4, marginTop: 2 },
  statusText: { fontSize: 10, letterSpacing: 0.5 },
  section: { marginHorizontal: 16, marginTop: 14, gap: 0 },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 8, marginBottom: 4 },
  sectionTitle: { fontSize: 11, letterSpacing: 1 },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 10, borderBottomWidth: 1, gap: 12 },
  rowLabel: { fontSize: 13, flex: 1 },
  rowVal: { fontSize: 13, textAlign: "right", flex: 1 },
  notesBox: { padding: 12 },
  notesText: { fontSize: 13, lineHeight: 20 },
  closeBtn: { margin: 16, borderRadius: 14, borderWidth: 1, paddingVertical: 14, alignItems: "center" },
  closeBtnText: { fontSize: 15 },
});

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: 16, gap: 14 },
  titleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 12 },
  title: { fontSize: 26, letterSpacing: -0.5, lineHeight: 32 },
  titleSub: { fontSize: 12, lineHeight: 18, marginTop: 6 },
  subTabs: { borderRadius: 14, borderWidth: 1, overflow: "hidden", flexShrink: 0 },
  subTab: { paddingHorizontal: 12, paddingVertical: 10, margin: 4, borderRadius: 10 },
  subTabText: { fontSize: 11, textAlign: "center", lineHeight: 16 },
  gradeRow: { flexDirection: "row", gap: 8 },
  gradeBtn: { flex: 1, borderRadius: 12, padding: 10, alignItems: "center", gap: 5 },
  gradeBtnText: { fontSize: 11, textAlign: "center", lineHeight: 15 },
  patientCard: { borderRadius: 20, padding: 20, gap: 16, overflow: "hidden" },
  goldBar: { position: "absolute", top: 0, left: 0, right: 0, height: 2.5 },
  patientCardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", zIndex: 1 },
  patientLogoBlock: { gap: 2 },
  memberLabel: { fontSize: 9, letterSpacing: 1 },
  qrBox: {},
  patientInfo: { gap: 6, zIndex: 1 },
  patientIdLabel: { fontSize: 10, letterSpacing: 1.5 },
  patientName: { fontSize: 26, letterSpacing: -0.3 },
  patientMeta: { flexDirection: "row", alignItems: "center", gap: 10, flexWrap: "wrap" },
  patientMetaText: { fontSize: 13 },
  pinBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  pinText: { fontSize: 13 },
  benefitsCard: { borderRadius: 16, borderWidth: 1.5, padding: 16, gap: 10 },
  benefitsHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  benefitsTitle: { fontSize: 14 },
  benefitRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  benefitText: { fontSize: 13 },
  noteCard: { borderRadius: 14, borderWidth: 1, padding: 14 },
  noteText: { fontSize: 13, lineHeight: 20 },
  profileSection: { borderRadius: 18, borderWidth: 1, padding: 18, gap: 14 },
  profileHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
  profileIconWrap: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  profileTitle: { fontSize: 16 },
  profileSub: { fontSize: 12, marginTop: 2 },
  vitalsRow: { flexDirection: "row", gap: 8 },
  vitalsCard: { flex: 1, borderRadius: 14, borderWidth: 1, padding: 12, gap: 4 },
  vitalsLabel: { fontSize: 9, letterSpacing: 1.1 },
  vitalsValue: { flexDirection: "row", alignItems: "flex-end", gap: 3 },
  vitalsNum: { fontSize: 30, lineHeight: 34 },
  vitalsUnit: { fontSize: 12, marginBottom: 3 },
  gpsText: { fontSize: 14, lineHeight: 20 },
  monitoringBtn: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12 },
  monitoringBtnText: { flex: 1, fontSize: 12, lineHeight: 17 },
  sosBtn: { borderRadius: 14, paddingVertical: 17, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10 },
  sosBtnText: { color: "#FFFFFF", fontSize: 16 },
  geriatricBtn: { borderRadius: 12, borderWidth: 1, padding: 14, flexDirection: "row", alignItems: "center", gap: 10 },
  geriatricBtnText: { fontSize: 14, flex: 1 },
  sectionLabel: { fontSize: 10, fontFamily: "Inter_600SemiBold", letterSpacing: 1.4 },
  allergyRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  allergyChip: { borderRadius: 20, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 7 },
  allergyChipText: { fontSize: 13 },
  medTable: { borderRadius: 14, borderWidth: 1, overflow: "hidden" },
  medRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 12, paddingVertical: 12, gap: 12 },
  medInfo: { flex: 1, gap: 2 },
  medName: { fontSize: 15 },
  medFreq: { fontSize: 12 },
  medPrescriber: { fontSize: 11 },
  doseBadge: { borderRadius: 8, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 5 },
  doseText: { fontSize: 13 },
  cardActionsRow: { flexDirection: "row", gap: 10 },
  shareBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 14, borderWidth: 1, paddingVertical: 14 },
  shareBtnText: { fontSize: 14 },
});

const xStyles = StyleSheet.create({
  offscreen: { position: "absolute", left: -9999, top: 0, width: 360 },
  card: { borderRadius: 20, overflow: "hidden" },
  header: { padding: 20, flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  headerLeft: { gap: 4 },
  memberLabel: { fontSize: 9, color: "rgba(255,255,255,0.5)", letterSpacing: 1.2, fontFamily: "Inter_400Regular" },
  identityBlock: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8, gap: 6 },
  idCaption: { fontSize: 9, color: "rgba(255,255,255,0.45)", letterSpacing: 1.5, fontFamily: "Inter_400Regular" },
  patientName: { fontSize: 28, color: "#FFFFFF", fontFamily: "Inter_700Bold", letterSpacing: -0.3 },
  metaRow: { flexDirection: "row", gap: 8, marginTop: 4 },
  metaChip: { backgroundColor: "rgba(0,0,0,0.3)", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, gap: 2 },
  metaLabel: { fontSize: 9, color: "rgba(255,255,255,0.45)", letterSpacing: 1, fontFamily: "Inter_400Regular" },
  metaValue: { fontSize: 14, color: "#FFFFFF", fontFamily: "Inter_700Bold" },
  section: { marginHorizontal: 16, marginBottom: 12 },
  sectionHeader: { backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, marginBottom: 8 },
  sectionTitle: { fontSize: 11, color: "rgba(255,255,255,0.7)", fontFamily: "Inter_700Bold", letterSpacing: 1 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  allergyChip: { borderRadius: 16, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 5, backgroundColor: "rgba(0,0,0,0.25)" },
  allergyChipText: { fontSize: 12, fontFamily: "Inter_500Medium" },
  medRow: { paddingVertical: 10, paddingHorizontal: 12 },
  medName: { fontSize: 14, color: "#FFFFFF", fontFamily: "Inter_600SemiBold" },
  medDetail: { fontSize: 12, color: "rgba(255,255,255,0.55)", fontFamily: "Inter_400Regular", marginTop: 2 },
  medPrescriber: { fontSize: 11, color: "rgba(255,255,255,0.4)", fontFamily: "Inter_400Regular", marginTop: 1 },
  footer: { marginHorizontal: 16, marginBottom: 18, marginTop: 4, gap: 4, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.08)", paddingTop: 12 },
  footerText: { fontSize: 10, color: "rgba(255,255,255,0.45)", fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 15 },
  footerDate: { fontSize: 10, color: "rgba(255,255,255,0.3)", fontFamily: "Inter_400Regular", textAlign: "center" },
});
