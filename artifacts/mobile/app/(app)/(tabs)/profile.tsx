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

function getPIN(userId?: string) {
  if (!userId) return "000";
  const n = parseInt(userId.slice(-4), 16);
  return String((n % 900) + 100);
}

type CardTab = "standard" | "geriatric";

function HexLogo({ size = 32, color = "#4F6EF7" }: { size?: number; color?: string }) {
  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <MaterialCommunityIcons
        name="hexagon-outline"
        size={size}
        color={color}
        style={StyleSheet.absoluteFill}
      />
      <MaterialCommunityIcons name="heart-flash" size={size * 0.44} color={color} />
    </View>
  );
}

export default function HealthCardScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const { data } = usePatient();
  const [cardTab, setCardTab] = useState<CardTab>("standard");

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 + 68 : insets.bottom + 64;

  const pin = getPIN(user?.id);
  const isGeriatric = cardTab === "geriatric";

  const cardGradient = isGeriatric
    ? (["#5c1010", "#9e2020", "#5c1010"] as const)
    : (["#102060", "#1a3a9e", "#102060"] as const);

  const criticalAllergies = data.allergies.filter(
    (a) => a.severity === "life-threatening" || a.severity === "severe"
  );
  const activeKardex = data.kardex.filter((k) => k.status === "active");

  // Simulated live data
  const heartRate = 72;

  async function handleSOS() {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert("Trigger Auto Help Call", "This will send an emergency alert with your GPS location and medical data. Confirm?", [
      { text: "Cancel", style: "cancel" },
      { text: "Trigger SOS", style: "destructive", onPress: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error) },
    ]);
  }

  async function handleLogout() {
    Alert.alert("Sign Out", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign Out", style: "destructive", onPress: async () => { await logout(); router.replace("/(auth)/login"); } },
    ]);
  }

  const qrData = JSON.stringify({
    type: "IbnCeena",
    id: user?.id?.slice(0, 12),
    name: user?.fullName,
    dob: user?.dateOfBirth,
    blood: user?.bloodType,
    pin,
    allergies: data.allergies.map((a) => a.drug),
  });

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
              Instant critical access linked{"\n"}to physical hardware.
            </Text>
          </View>
          {/* Sub-tabs */}
          <View style={[styles.subTabs, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => { Haptics.selectionAsync(); setCardTab("standard"); }}
              style={[styles.subTab, { backgroundColor: !isGeriatric ? colors.cardElevated : "transparent" }]}
            >
              <Text style={[styles.subTabText, { color: !isGeriatric ? colors.foreground : colors.mutedForeground, fontFamily: !isGeriatric ? "Inter_600SemiBold" : "Inter_400Regular" }]}>
                Standard{"\n"}ID
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => { Haptics.selectionAsync(); setCardTab("geriatric"); }}
              style={[styles.subTab, { backgroundColor: isGeriatric ? colors.emergencyBg : "transparent" }]}
            >
              <Text style={[styles.subTabText, { color: isGeriatric ? colors.accent : colors.mutedForeground, fontFamily: isGeriatric ? "Inter_600SemiBold" : "Inter_400Regular" }]}>
                Geriatric{"\n"}Safety Pack
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Patient ID Card */}
        <LinearGradient
          colors={cardGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.patientCard}
        >
          <View style={styles.patientCardTop}>
            <View style={styles.patientLogoRow}>
              <HexLogo size={32} color={isGeriatric ? colors.accent : colors.primary} />
              <Text style={[styles.patientBrand, { fontFamily: "Inter_700Bold", color: isGeriatric ? colors.accent : colors.primary, letterSpacing: 2 }]}>
                IBNCEENA
              </Text>
            </View>
            <View style={styles.qrBox}>
              <QRCode value={qrData} size={54} color={isGeriatric ? "#E5294E" : colors.primary} backgroundColor="transparent" />
            </View>
          </View>
          <View style={styles.patientInfo}>
            <Text style={[styles.patientIdLabel, { color: "rgba(255,255,255,0.55)", fontFamily: "Inter_400Regular" }]}>
              PATIENT IDENTIFIER
            </Text>
            <Text style={[styles.patientName, { color: "#FFFFFF", fontFamily: "Inter_700Bold" }]}>
              {user?.fullName || user?.username || "Patient Name"}
            </Text>
            <View style={styles.patientMeta}>
              <Text style={[styles.patientMetaText, { color: "rgba(255,255,255,0.7)", fontFamily: "Inter_400Regular" }]}>
                DOB: {user?.dateOfBirth || "—"}
              </Text>
              <View style={[styles.pinBadge, { backgroundColor: "rgba(0,0,0,0.35)" }]}>
                <Text style={[styles.pinText, { color: "rgba(255,255,255,0.85)", fontFamily: "Inter_500Medium" }]}>
                  PIN: {pin}
                </Text>
              </View>
            </View>
          </View>
        </LinearGradient>

        {/* First Responders Note */}
        <View style={[styles.noteCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.noteText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
            <Text style={{ color: colors.foreground, fontFamily: "Inter_600SemiBold" }}>First Responders: </Text>
            Scan the QR code and enter the 3-digit PIN found on the reverse side of the physical card to unlock the critical care dashboard.
          </Text>
        </View>

        {/* Active Medical Profile */}
        <View style={[styles.profileSection, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.profileHeader}>
            <View style={[styles.profileIconWrap, { backgroundColor: colors.emergencyBg }]}>
              <MaterialCommunityIcons name="shield-alert" size={22} color={colors.accent} />
            </View>
            <View>
              <Text style={[styles.profileTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
                Active Medical Profile
              </Text>
              <Text style={[styles.profileSub, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                Live API Link{" "}
                <Text style={{ color: "#5EE7A0" }}>•</Text>
                {" "}AI Safety Scan Active
              </Text>
            </View>
          </View>

          {/* Vitals + GPS */}
          <View style={styles.vitalsRow}>
            <LinearGradient colors={["#2a1218", "#1a0c0e"]} style={[styles.vitalsCard, { borderColor: colors.emergencyBorder }]}>
              <MaterialCommunityIcons name="heart-pulse" size={22} color={colors.accent} />
              <Text style={[styles.vitalsLabel, { color: colors.accent, fontFamily: "Inter_600SemiBold" }]}>
                LIVE VITALS
              </Text>
              <View style={styles.vitalsValue}>
                <Text style={[styles.vitalsNum, { color: colors.accent, fontFamily: "Inter_700Bold" }]}>
                  {heartRate}
                </Text>
                <Text style={[styles.vitalsUnit, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                  bpm
                </Text>
              </View>
            </LinearGradient>

            <LinearGradient colors={["#0f1840", "#111a50"]} style={[styles.vitalsCard, { borderColor: colors.physioBorder }]}>
              <MaterialCommunityIcons name="map-marker" size={22} color={colors.primary} />
              <Text style={[styles.vitalsLabel, { color: colors.mutedForeground, fontFamily: "Inter_600SemiBold" }]}>
                GPS LOCATION
              </Text>
              <Text style={[styles.gpsText, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
                {user?.dateOfBirth ? "Location\nUnavailable" : "Tralee, Co.\nKerry"}
              </Text>
            </LinearGradient>
          </View>

          {/* SOS Button */}
          <TouchableOpacity activeOpacity={0.85} onPress={handleSOS}>
            <LinearGradient
              colors={["#c0392b", "#e74c3c"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.sosBtn}
            >
              <MaterialCommunityIcons name="phone-ring" size={22} color="#fff" />
              <Text style={[styles.sosBtnText, { fontFamily: "Inter_700Bold" }]}>
                Trigger Auto Help Call
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Critical Allergies */}
          {data.allergies.length > 0 && (
            <>
              <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>CRITICAL ALLERGIES</Text>
              <View style={styles.allergyRow}>
                {data.allergies.map((a) => (
                  <View
                    key={a.id}
                    style={[
                      styles.allergyChip,
                      {
                        borderColor: a.severity === "life-threatening" ? colors.accent : colors.fastTrackBorder,
                        backgroundColor: a.severity === "life-threatening" ? colors.emergencyBg : colors.fastTrackBg,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.allergyChipText,
                        {
                          color: a.severity === "life-threatening" ? colors.accent : colors.fastTrack,
                          fontFamily: "Inter_500Medium",
                        },
                      ]}
                    >
                      {a.drug}
                      {a.severity === "life-threatening" ? ` (${a.reaction})` : ""}
                    </Text>
                  </View>
                ))}
              </View>
            </>
          )}

          {/* Current Medications */}
          {activeKardex.length > 0 && (
            <>
              <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>CURRENT MEDICATIONS</Text>
              <View style={styles.medList}>
                {activeKardex.map((k, i) => (
                  <View key={k.id}>
                    <View style={styles.medRow}>
                      <View style={styles.medInfo}>
                        <Text style={[styles.medName, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
                          {k.medication}
                        </Text>
                        <Text style={[styles.medFreq, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                          {k.frequency.replace(" daily", "")} for{" "}
                          {k.notes?.split(".")[0] || "maintenance"}
                        </Text>
                      </View>
                      <View style={[styles.doseBadge, { backgroundColor: colors.cardElevated, borderColor: colors.border }]}>
                        <Text style={[styles.doseText, { color: colors.foreground, fontFamily: "Inter_500Medium" }]}>
                          {k.dose}
                        </Text>
                      </View>
                    </View>
                    {i < activeKardex.length - 1 && (
                      <View style={[styles.medDivider, { backgroundColor: colors.border }]} />
                    )}
                  </View>
                ))}
              </View>
            </>
          )}
        </View>

        {/* Logout */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleLogout}
          style={[styles.logoutBtn, { borderColor: colors.border }]}
        >
          <Feather name="log-out" size={14} color={colors.mutedForeground} />
          <Text style={[styles.logoutText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
            Sign Out
          </Text>
        </TouchableOpacity>
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
  subTabText: { fontSize: 12, textAlign: "center", lineHeight: 17 },
  patientCard: { borderRadius: 20, padding: 20, gap: 16 },
  patientCardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  patientLogoRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  patientBrand: { fontSize: 13 },
  qrBox: { backgroundColor: "transparent" },
  patientInfo: { gap: 6 },
  patientIdLabel: { fontSize: 10, letterSpacing: 1.5 },
  patientName: { fontSize: 26, letterSpacing: -0.3 },
  patientMeta: { flexDirection: "row", alignItems: "center", gap: 10 },
  patientMetaText: { fontSize: 13 },
  pinBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  pinText: { fontSize: 13 },
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
  sectionLabel: { fontSize: 10, fontFamily: "Inter_600SemiBold", letterSpacing: 1.4 },
  allergyRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  allergyChip: { borderRadius: 20, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 7 },
  allergyChipText: { fontSize: 13 },
  medList: { borderRadius: 12, overflow: "hidden" },
  medRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 12, gap: 12 },
  medInfo: { flex: 1 },
  medName: { fontSize: 15 },
  medFreq: { fontSize: 12, marginTop: 2 },
  doseBadge: { borderRadius: 8, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 5 },
  doseText: { fontSize: 13 },
  medDivider: { height: 1, opacity: 0.5 },
  logoutBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 12, borderWidth: 1, paddingVertical: 12 },
  logoutText: { fontSize: 13 },
});
