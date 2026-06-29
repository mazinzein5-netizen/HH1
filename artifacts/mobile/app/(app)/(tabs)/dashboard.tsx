import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import {
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/context/AuthContext";
import { usePatient, type Complaint } from "@/context/PatientContext";
import { useColors } from "@/hooks/useColors";

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function severityColor(severity: string, colors: any) {
  switch (severity) {
    case "life-threatening": return { bg: colors.emergencyBg, text: colors.emergency, border: colors.emergencyBorder };
    case "severe": return { bg: colors.emergencyBg, text: colors.emergency, border: colors.emergencyBorder };
    case "moderate": return { bg: colors.fastTrackBg, text: colors.fastTrack, border: colors.fastTrackBorder };
    default: return { bg: colors.physioBg, text: colors.physio, border: colors.physioBorder };
  }
}

export default function DashboardScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { data, loading } = usePatient();

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 + 84 : insets.bottom + 84;

  const activeConditions = data.medicalHistory.filter((c) => c.status !== "resolved").length;
  const activeKardex = data.kardex.filter((k) => k.status === "active").length;
  const recentComplaints = data.complaints.slice(0, 3);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="dark-content" />
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: topPad + 20, paddingBottom: bottomPad + 16 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.headerRow}>
          <View>
            <Text style={[styles.greeting, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              {getGreeting()},
            </Text>
            <Text style={[styles.username, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
              {user?.fullName || user?.username}
            </Text>
          </View>
          <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
            <Text style={[styles.avatarText, { fontFamily: "Inter_700Bold" }]}>
              {(user?.fullName || user?.username || "?")[0].toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Allergy Alert */}
        {data.allergies.some((a) => a.severity === "life-threatening" || a.severity === "severe") && (
          <View style={[styles.allergyBanner, { backgroundColor: colors.emergencyBg, borderColor: colors.emergencyBorder }]}>
            <Feather name="alert-triangle" size={16} color={colors.emergency} />
            <Text style={[styles.allergyBannerText, { color: colors.emergency, fontFamily: "Inter_600SemiBold" }]}>
              High-risk allergy on record — see Profile
            </Text>
          </View>
        )}

        {/* Stats row */}
        <View style={styles.statsRow}>
          {[
            { label: "Conditions", value: activeConditions, icon: "heart-pulse", color: colors.primary },
            { label: "Allergies", value: data.allergies.length, icon: "alert-rhombus", color: colors.emergency },
            { label: "Medications", value: activeKardex, icon: "pill", color: colors.virtual },
          ].map((s) => (
            <View key={s.label} style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <MaterialCommunityIcons name={s.icon as any} size={20} color={s.color} />
              <Text style={[styles.statValue, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>{s.value}</Text>
              <Text style={[styles.statLabel, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Quick Actions */}
        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>NEW ASSESSMENT</Text>
        <View style={styles.actionRow}>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => router.push("/(app)/(tabs)/complaint")}
            style={[styles.actionCard, { backgroundColor: colors.primary }]}
          >
            <MaterialCommunityIcons name="brain" size={28} color="#fff" />
            <Text style={[styles.actionTitle, { fontFamily: "Inter_700Bold" }]}>AI Complaint</Text>
            <Text style={[styles.actionSub, { fontFamily: "Inter_400Regular" }]}>Intelligent intake</Text>
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => router.push("/(app)/(tabs)/triage")}
            style={[styles.actionCard, { backgroundColor: colors.accent }]}
          >
            <MaterialCommunityIcons name="cross-outline" size={28} color="#fff" />
            <Text style={[styles.actionTitle, { fontFamily: "Inter_700Bold" }]}>Triage</Text>
            <Text style={[styles.actionSub, { fontFamily: "Inter_400Regular" }]}>Clinical assessment</Text>
          </TouchableOpacity>
        </View>

        {/* Medical Records */}
        <Text style={[styles.sectionTitle, { color: colors.mutedForeground, marginTop: 8 }]}>MEDICAL RECORDS</Text>
        <View style={styles.recordsRow}>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => router.push("/(app)/medical-history")}
            style={[styles.recordCard, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <MaterialCommunityIcons name="clipboard-pulse" size={22} color={colors.primary} />
            <Text style={[styles.recordTitle, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>Medical History</Text>
            <Text style={[styles.recordCount, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              {data.medicalHistory.length} conditions
            </Text>
            <Feather name="chevron-right" size={16} color={colors.mutedForeground} style={styles.recordArrow} />
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => router.push("/(app)/kardex")}
            style={[styles.recordCard, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <MaterialCommunityIcons name="pill" size={22} color={colors.virtual} />
            <Text style={[styles.recordTitle, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>Kardex</Text>
            <Text style={[styles.recordCount, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              {data.kardex.length} medications
            </Text>
            <Feather name="chevron-right" size={16} color={colors.mutedForeground} style={styles.recordArrow} />
          </TouchableOpacity>
        </View>

        {/* Drug Allergies */}
        {data.allergies.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.mutedForeground, marginTop: 8 }]}>DRUG ALLERGIES</Text>
            <View style={styles.listCol}>
              {data.allergies.map((a) => {
                const sc = severityColor(a.severity, colors);
                return (
                  <View key={a.id} style={[styles.allergyCard, { backgroundColor: sc.bg, borderColor: sc.border }]}>
                    <View style={styles.allergyRow}>
                      <MaterialCommunityIcons name="alert-rhombus" size={16} color={sc.text} />
                      <Text style={[styles.allergyDrug, { color: sc.text, fontFamily: "Inter_700Bold" }]}>{a.drug}</Text>
                      <View style={[styles.severityBadge, { backgroundColor: sc.border }]}>
                        <Text style={[styles.severityText, { fontFamily: "Inter_600SemiBold" }]}>{a.severity.toUpperCase()}</Text>
                      </View>
                    </View>
                    <Text style={[styles.allergyReaction, { color: sc.text, fontFamily: "Inter_400Regular" }]}>{a.reaction}</Text>
                  </View>
                );
              })}
            </View>
          </>
        )}

        {/* Recent Complaints */}
        {recentComplaints.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.mutedForeground, marginTop: 8 }]}>RECENT COMPLAINTS</Text>
            <View style={styles.listCol}>
              {recentComplaints.map((c: Complaint) => (
                <View key={c.id} style={[styles.complaintCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Text style={[styles.complaintChief, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>{c.chiefComplaint}</Text>
                  <Text style={[styles.complaintDate, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                    {new Date(c.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                  </Text>
                  {c.triageRecommendation && (
                    <Text style={[styles.complaintTriage, { color: colors.primary, fontFamily: "Inter_500Medium" }]}>
                      {c.triageRecommendation}
                    </Text>
                  )}
                </View>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: 20 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  greeting: { fontSize: 13 },
  username: { fontSize: 22, letterSpacing: -0.3 },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  avatarText: { color: "#fff", fontSize: 18 },
  allergyBanner: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 12, borderWidth: 1, padding: 12, marginBottom: 16 },
  allergyBannerText: { fontSize: 13, flex: 1 },
  statsRow: { flexDirection: "row", gap: 10, marginBottom: 24 },
  statCard: { flex: 1, alignItems: "center", borderRadius: 14, borderWidth: 1, padding: 14, gap: 4 },
  statValue: { fontSize: 22 },
  statLabel: { fontSize: 11, textAlign: "center" },
  sectionTitle: { fontSize: 11, fontFamily: "Inter_600SemiBold", letterSpacing: 1.2, marginBottom: 10, marginLeft: 2 },
  actionRow: { flexDirection: "row", gap: 12, marginBottom: 16 },
  actionCard: { flex: 1, borderRadius: 16, padding: 16, gap: 6 },
  actionTitle: { color: "#fff", fontSize: 15 },
  actionSub: { color: "rgba(255,255,255,0.75)", fontSize: 12 },
  recordsRow: { flexDirection: "row", gap: 10, marginBottom: 16 },
  recordCard: { flex: 1, borderRadius: 14, borderWidth: 1, padding: 14, gap: 3 },
  recordTitle: { fontSize: 13 },
  recordCount: { fontSize: 11 },
  recordArrow: { position: "absolute", top: 14, right: 12 },
  listCol: { gap: 8, marginBottom: 16 },
  allergyCard: { borderRadius: 12, borderWidth: 1, padding: 12, gap: 4 },
  allergyRow: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
  allergyDrug: { fontSize: 14, flex: 1 },
  severityBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 },
  severityText: { color: "#fff", fontSize: 10 },
  allergyReaction: { fontSize: 12, marginLeft: 24 },
  complaintCard: { borderRadius: 12, borderWidth: 1, padding: 14, gap: 4 },
  complaintChief: { fontSize: 14 },
  complaintDate: { fontSize: 12 },
  complaintTriage: { fontSize: 12 },
});
