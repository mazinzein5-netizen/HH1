import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React from "react";
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

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const { data } = usePatient();

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 + 84 : insets.bottom + 84;

  const initials = (user?.fullName || user?.username || "?")
    .split(" ")
    .slice(0, 2)
    .map((w: string) => w[0]?.toUpperCase())
    .join("");

  const qrData = JSON.stringify({
    type: "IbnCeena",
    id: user?.id?.slice(0, 12),
    name: user?.fullName,
    dob: user?.dateOfBirth,
    blood: user?.bloodType,
    allergies: data.allergies.map((a) => a.drug),
  });

  async function handleLogout() {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          await logout();
          router.replace("/(auth)/login");
        },
      },
    ]);
  }

  const activeConditions = data.medicalHistory.filter((c) => c.status !== "resolved").length;
  const activeKardex = data.kardex.filter((k) => k.status === "active").length;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="dark-content" />
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: topPad + 20, paddingBottom: bottomPad + 16 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar & Name */}
        <View style={styles.profileHeader}>
          <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
            <Text style={[styles.avatarText, { fontFamily: "Inter_700Bold" }]}>{initials}</Text>
          </View>
          <Text style={[styles.fullName, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
            {user?.fullName || user?.username}
          </Text>
          <Text style={[styles.username, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
            @{user?.username}
          </Text>
          {user?.bloodType && (
            <View style={[styles.bloodBadge, { backgroundColor: colors.emergencyBg, borderColor: colors.emergencyBorder }]}>
              <MaterialCommunityIcons name="water" size={14} color={colors.emergency} />
              <Text style={[styles.bloodText, { color: colors.emergency, fontFamily: "Inter_700Bold" }]}>
                {user.bloodType}
              </Text>
            </View>
          )}
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          {[
            { label: "Conditions", value: activeConditions, icon: "heart-pulse" },
            { label: "Allergies", value: data.allergies.length, icon: "alert-rhombus" },
            { label: "Medications", value: activeKardex, icon: "pill" },
            { label: "Complaints", value: data.complaints.length, icon: "stethoscope" },
          ].map((s) => (
            <View key={s.label} style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <MaterialCommunityIcons name={s.icon as any} size={16} color={colors.primary} />
              <Text style={[styles.statValue, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>{s.value}</Text>
              <Text style={[styles.statLabel, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* QR Code */}
        <View style={[styles.qrCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.qrHeader}>
            <MaterialCommunityIcons name="qrcode" size={20} color={colors.primary} />
            <View>
              <Text style={[styles.qrTitle, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>Patient QR Code</Text>
              <Text style={[styles.qrSub, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                Scan to share medical summary
              </Text>
            </View>
          </View>
          <View style={styles.qrCenter}>
            <View style={[styles.qrWrap, { backgroundColor: "#fff", borderColor: colors.border }]}>
              <QRCode
                value={qrData}
                size={180}
                color={colors.primary}
                backgroundColor="#ffffff"
              />
            </View>
          </View>
          <Text style={[styles.qrPatientId, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
            Patient ID: {user?.id?.slice(0, 16)}
          </Text>
        </View>

        {/* Personal Details */}
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>PERSONAL DETAILS</Text>
        <View style={[styles.detailCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {[
            { label: "Full Name", value: user?.fullName || "—", icon: "account" },
            { label: "Username", value: `@${user?.username}`, icon: "at" },
            { label: "Email", value: user?.email || "—", icon: "email" },
            { label: "Date of Birth", value: user?.dateOfBirth || "—", icon: "calendar" },
            { label: "Blood Type", value: user?.bloodType || "—", icon: "water" },
          ].map((d, i, arr) => (
            <View key={d.label}>
              <View style={styles.detailRow}>
                <MaterialCommunityIcons name={d.icon as any} size={18} color={colors.mutedForeground} />
                <View style={styles.detailText}>
                  <Text style={[styles.detailLabel, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>{d.label}</Text>
                  <Text style={[styles.detailValue, { color: colors.foreground, fontFamily: "Inter_500Medium" }]}>{d.value}</Text>
                </View>
              </View>
              {i < arr.length - 1 && <View style={[styles.separator, { backgroundColor: colors.border }]} />}
            </View>
          ))}
        </View>

        {/* Logout */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleLogout}
          style={[styles.logoutBtn, { borderColor: colors.emergencyBorder, backgroundColor: colors.emergencyBg }]}
        >
          <Feather name="log-out" size={16} color={colors.emergency} />
          <Text style={[styles.logoutText, { color: colors.emergency, fontFamily: "Inter_600SemiBold" }]}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: 20 },
  profileHeader: { alignItems: "center", marginBottom: 24, gap: 6 },
  avatar: { width: 80, height: 80, borderRadius: 40, alignItems: "center", justifyContent: "center", marginBottom: 4 },
  avatarText: { color: "#fff", fontSize: 32 },
  fullName: { fontSize: 22, letterSpacing: -0.3 },
  username: { fontSize: 14 },
  bloodBadge: { flexDirection: "row", alignItems: "center", gap: 5, borderRadius: 20, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 5, marginTop: 4 },
  bloodText: { fontSize: 14 },
  statsRow: { flexDirection: "row", gap: 8, marginBottom: 20 },
  statCard: { flex: 1, alignItems: "center", borderRadius: 12, borderWidth: 1, padding: 10, gap: 3 },
  statValue: { fontSize: 18 },
  statLabel: { fontSize: 10, textAlign: "center" },
  qrCard: { borderRadius: 16, borderWidth: 1, padding: 18, gap: 14, marginBottom: 20 },
  qrHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  qrTitle: { fontSize: 15 },
  qrSub: { fontSize: 12, marginTop: 1 },
  qrCenter: { alignItems: "center" },
  qrWrap: { borderRadius: 16, borderWidth: 1, padding: 16 },
  qrPatientId: { fontSize: 11, textAlign: "center" },
  sectionLabel: { fontSize: 11, fontFamily: "Inter_600SemiBold", letterSpacing: 1.2, marginBottom: 10, marginLeft: 2 },
  detailCard: { borderRadius: 16, borderWidth: 1, paddingHorizontal: 16, marginBottom: 20 },
  detailRow: { flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 14 },
  detailText: { flex: 1 },
  detailLabel: { fontSize: 12 },
  detailValue: { fontSize: 14, marginTop: 1 },
  separator: { height: 1, marginLeft: 32 },
  logoutBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, borderRadius: 14, borderWidth: 1, paddingVertical: 15 },
  logoutText: { fontSize: 15 },
});
