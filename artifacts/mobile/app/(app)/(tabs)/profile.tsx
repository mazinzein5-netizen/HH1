import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import QRCode from "react-native-qrcode-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/context/AuthContext";
import { usePatient } from "@/context/PatientContext";
import { useColors } from "@/hooks/useColors";

type MemberGrade = "standard" | "gold" | "geriatric";
type CardTab = "standard" | "geriatric";

function getPIN(userId?: string) {
  if (!userId) return "542";
  const n = parseInt(userId.slice(-4), 16) || 542;
  return String((n % 900) + 100);
}

function HexLogo({ size = 32, color = "#4F6EF7" }: { size?: number; color?: string }) {
  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <MaterialCommunityIcons name="hexagon-outline" size={size} color={color} style={StyleSheet.absoluteFill} />
      <MaterialCommunityIcons name="heart-flash" size={size * 0.44} color={color} />
    </View>
  );
}

const MEMBER_GRADES: { key: MemberGrade; label: string; color: string; gradient: readonly [string, string, string]; benefits: string[] }[] = [
  {
    key: "standard",
    label: "Standard",
    color: "#4F6EF7",
    gradient: ["#102060", "#1a3a9e", "#102060"],
    benefits: ["Digital Health Card", "2 Triage Pathways", "QR Emergency Access", "Medication Record"],
  },
  {
    key: "gold",
    label: "Gold Premium",
    color: "#D4A017",
    gradient: ["#3a2800", "#7a5a00", "#3a2800"],
    benefits: ["All Standard Features", "All 4 Triage Pathways", "Priority GP Referral", "Annual Health Review", "Physiotherapy Network Access"],
  },
  {
    key: "geriatric",
    label: "Geriatric Safety",
    color: "#E5294E",
    gradient: ["#5c1010", "#9e2020", "#5c1010"],
    benefits: ["All Gold Features", "Falls Detection", "Cognitive Screening", "Smart Device Link", "24/7 SOS Auto-Call", "Carer Access Portal"],
  },
];

export default function HealthCardScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { data } = usePatient();
  const [cardTab, setCardTab] = useState<CardTab>("standard");
  const [memberGrade, setMemberGrade] = useState<MemberGrade>("standard");

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

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
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
                    ? (t === "geriatric" ? colors.emergencyBg : colors.cardElevated)
                    : "transparent",
                }]}
              >
                <Text style={[styles.subTabText, {
                  color: cardTab === t ? (t === "geriatric" ? colors.accent : colors.foreground) : colors.mutedForeground,
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
                backgroundColor: memberGrade === g.key ? g.color + "22" : colors.card,
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

        {/* Patient ID Card */}
        <LinearGradient colors={cardGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.patientCard}>
          {/* Watermark hex */}
          <View style={styles.cardWatermark} pointerEvents="none">
            <MaterialCommunityIcons name="hexagon-outline" size={180} color="rgba(255,255,255,0.05)" />
          </View>
          <View style={styles.patientCardTop}>
            <View style={styles.patientLogoRow}>
              <HexLogo size={30} color={isGeriatric ? "#E5294E" : grade.color} />
              <View>
                <Text style={[styles.patientBrand, { color: isGeriatric ? "#E5294E" : grade.color, fontFamily: "Inter_700Bold", letterSpacing: 2 }]}>
                  IBNCEENA
                </Text>
                <Text style={[styles.memberLabel, { color: "rgba(255,255,255,0.6)", fontFamily: "Inter_400Regular" }]}>
                  {grade.label.toUpperCase()}
                </Text>
              </View>
            </View>
            <View style={styles.qrBox}>
              <QRCode value={qrData} size={52} color={isGeriatric ? "#E5294E" : grade.color} backgroundColor="transparent" />
            </View>
          </View>
          <View style={styles.patientInfo}>
            <Text style={[styles.patientIdLabel, { color: "rgba(255,255,255,0.5)", fontFamily: "Inter_400Regular" }]}>
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
            <View>
              <Text style={[styles.profileTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>Active Medical Profile</Text>
              <Text style={[styles.profileSub, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                Live API Link {"  "}
                <Text style={{ color: "#5EE7A0" }}>●</Text>
                {"  "}AI Safety Scan Active
              </Text>
            </View>
          </View>

          {/* Vitals */}
          <View style={styles.vitalsRow}>
            <LinearGradient colors={["#2a1218", "#1a0c0e"]} style={[styles.vitalsCard, { borderColor: colors.emergencyBorder }]}>
              <MaterialCommunityIcons name="heart-pulse" size={22} color={colors.accent} />
              <Text style={[styles.vitalsLabel, { color: colors.accent, fontFamily: "Inter_600SemiBold" }]}>LIVE VITALS</Text>
              <View style={styles.vitalsValue}>
                <Text style={[styles.vitalsNum, { color: colors.accent, fontFamily: "Inter_700Bold" }]}>72</Text>
                <Text style={[styles.vitalsUnit, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>bpm</Text>
              </View>
            </LinearGradient>
            <LinearGradient colors={["#0f1840", "#111a50"]} style={[styles.vitalsCard, { borderColor: colors.physioBorder }]}>
              <MaterialCommunityIcons name="map-marker" size={22} color={colors.primary} />
              <Text style={[styles.vitalsLabel, { color: colors.mutedForeground, fontFamily: "Inter_600SemiBold" }]}>GPS LOCATION</Text>
              <Text style={[styles.gpsText, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>Tralee, Co.{"\n"}Kerry</Text>
            </LinearGradient>
          </View>

          {/* SOS Button */}
          <TouchableOpacity activeOpacity={0.85} onPress={handleSOS}>
            <LinearGradient colors={["#c0392b", "#e74c3c"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.sosBtn}>
              <MaterialCommunityIcons name="phone-ring" size={22} color="#fff" />
              <Text style={[styles.sosBtnText, { fontFamily: "Inter_700Bold" }]}>Trigger Auto Help Call</Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Geriatric shortcut */}
          {(cardTab === "geriatric" || memberGrade === "geriatric") && (
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => router.push("/(app)/geriatric")}
              style={[styles.geriatricBtn, { backgroundColor: "#1a1040", borderColor: "#a78bfa55" }]}
            >
              <MaterialCommunityIcons name="brain" size={18} color="#a78bfa" />
              <Text style={[styles.geriatricBtnText, { color: "#a78bfa", fontFamily: "Inter_600SemiBold" }]}>
                Open Geriatric & Cognitive Assessment
              </Text>
              <Feather name="chevron-right" size={14} color="#a78bfa" />
            </TouchableOpacity>
          )}

          {/* Allergies */}
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
                      {a.drug}{a.severity === "life-threatening" ? ` (${a.reaction})` : ""}
                    </Text>
                  </View>
                ))}
              </View>
            </>
          )}

          {/* Medications */}
          {activeKardex.length > 0 && (
            <>
              <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>CURRENT MEDICATIONS</Text>
              {activeKardex.map((k, i) => (
                <View key={k.id}>
                  <View style={styles.medRow}>
                    <View style={styles.medInfo}>
                      <Text style={[styles.medName, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>{k.medication}</Text>
                      <Text style={[styles.medFreq, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>{k.frequency}</Text>
                    </View>
                    <View style={[styles.doseBadge, { backgroundColor: colors.cardElevated, borderColor: colors.border }]}>
                      <Text style={[styles.doseText, { color: colors.foreground, fontFamily: "Inter_500Medium" }]}>{k.dose}</Text>
                    </View>
                  </View>
                  {i < activeKardex.length - 1 && <View style={[styles.medDivider, { backgroundColor: colors.border }]} />}
                </View>
              ))}
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: 16, gap: 14 },
  titleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 12 },
  title: { fontSize: 26, letterSpacing: -0.5, lineHeight: 32 },
  titleSub: { fontSize: 12, lineHeight: 18, marginTop: 6 },
  subTabs: { borderRadius: 14, borderWidth: 1, overflow: "hidden", flexShrink: 0 },
  subTab: { paddingHorizontal: 12, paddingVertical: 10 },
  subTabText: { fontSize: 11, textAlign: "center", lineHeight: 16 },
  gradeRow: { flexDirection: "row", gap: 8 },
  gradeBtn: { flex: 1, borderRadius: 12, borderWidth: 1.5, padding: 10, alignItems: "center", gap: 5 },
  gradeBtnText: { fontSize: 11, textAlign: "center", lineHeight: 15 },
  patientCard: { borderRadius: 20, padding: 20, gap: 16, overflow: "hidden" },
  cardWatermark: { position: "absolute", right: -40, top: -30, opacity: 1 },
  patientCardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  patientLogoRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  patientBrand: { fontSize: 13 },
  memberLabel: { fontSize: 9, letterSpacing: 1 },
  qrBox: {},
  patientInfo: { gap: 6 },
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
  vitalsRow: { flexDirection: "row", gap: 10 },
  vitalsCard: { flex: 1, borderRadius: 14, borderWidth: 1, padding: 14, gap: 6 },
  vitalsLabel: { fontSize: 10, letterSpacing: 1.2 },
  vitalsValue: { flexDirection: "row", alignItems: "flex-end", gap: 4 },
  vitalsNum: { fontSize: 38, lineHeight: 42 },
  vitalsUnit: { fontSize: 14, marginBottom: 4 },
  gpsText: { fontSize: 18, lineHeight: 26 },
  sosBtn: { borderRadius: 14, paddingVertical: 17, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10 },
  sosBtnText: { color: "#FFFFFF", fontSize: 16 },
  geriatricBtn: { borderRadius: 12, borderWidth: 1, padding: 14, flexDirection: "row", alignItems: "center", gap: 10 },
  geriatricBtnText: { fontSize: 14, flex: 1 },
  sectionLabel: { fontSize: 10, fontFamily: "Inter_600SemiBold", letterSpacing: 1.4 },
  allergyRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  allergyChip: { borderRadius: 20, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 7 },
  allergyChipText: { fontSize: 13 },
  medRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 10, gap: 12 },
  medInfo: { flex: 1 },
  medName: { fontSize: 15 },
  medFreq: { fontSize: 12, marginTop: 2 },
  doseBadge: { borderRadius: 8, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 5 },
  doseText: { fontSize: 13 },
  medDivider: { height: 1, opacity: 0.4 },
});
