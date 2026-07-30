import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ThemedStatusBar from "@/components/ThemedStatusBar";
import { useColors } from "@/hooks/useColors";

interface ConsultRecord {
  id: string;
  date: string;
  type: string;
  clinician: string;
  role: string;
  duration: string;
  summary: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
  color: string;
  status: "completed" | "cancelled" | "no-show";
}

const DEMO_HISTORY: ConsultRecord[] = [
  {
    id: "1",
    date: "2026-06-28T10:15:00",
    type: "General Practitioner",
    clinician: "Dr. Aoife Murphy",
    role: "GP · IbnCeena Network",
    duration: "14 min",
    summary: "Routine medication review. Apixaban dose confirmed, blood pressure within target. Advised to continue Metformin with meals. Follow-up in 3 months.",
    icon: "doctor",
    color: "#4F6EF7",
    status: "completed",
  },
  {
    id: "2",
    date: "2026-05-14T14:30:00",
    type: "Physiotherapist",
    clinician: "Mr. Ciarán Kelly",
    role: "Physiotherapist · MSK",
    duration: "22 min",
    summary: "Assessment of chronic lower back discomfort. Home exercise programme discussed. McKenzie extension exercises prescribed. Reassessment in 6 weeks.",
    icon: "human-handsup",
    color: "#22c55e",
    status: "completed",
  },
  {
    id: "3",
    date: "2026-04-03T09:00:00",
    type: "Cardiology Review",
    clinician: "Dr. Ahmed Al-Rashid",
    role: "Cardiologist · AFib Clinic",
    duration: "18 min",
    summary: "Annual AFib review. ECG reviewed — persistent AF, rate-controlled. Apixaban therapy continued. INR monitoring not required on DOAC. Repeat echo in 12 months.",
    icon: "heart-flash",
    color: "#a78bfa",
    status: "completed",
  },
  {
    id: "4",
    date: "2026-03-19T11:00:00",
    type: "General Practitioner",
    clinician: "Dr. Aoife Murphy",
    role: "GP · IbnCeena Network",
    duration: "—",
    summary: "Appointment not attended.",
    icon: "doctor",
    color: "#6b7280",
    status: "no-show",
  },
];

function statusConfig(status: ConsultRecord["status"]) {
  switch (status) {
    case "completed": return { label: "Completed",  color: "#16a34a", bg: "rgba(22,163,74,0.1)"  };
    case "cancelled": return { label: "Cancelled",  color: "#dc2626", bg: "rgba(220,38,38,0.1)"  };
    case "no-show":   return { label: "Not attended", color: "#6b7280", bg: "rgba(107,114,128,0.1)" };
  }
}

function formatDate(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("en-IE", { day: "numeric", month: "long", year: "numeric" })
         + " · " + d.toLocaleTimeString("en-IE", { hour: "2-digit", minute: "2-digit" });
  } catch { return iso; }
}

export default function ConsultHistoryScreen() {
  const colors    = useColors();
  const insets    = useSafeAreaInsets();
  const topPad    = Platform.OS === "web" ? 0 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ThemedStatusBar />
      <View style={[styles.header, { paddingTop: topPad + 12, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <Feather name="arrow-left" size={20} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>Consultation History</Text>
        <View style={[styles.badge, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.badgeText, { color: colors.mutedForeground, fontFamily: "Inter_600SemiBold" }]}>
            {DEMO_HISTORY.filter(r => r.status === "completed").length} completed
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: bottomPad + 32 }]} showsVerticalScrollIndicator={false}>

        <View style={[styles.infoBanner, { backgroundColor: "rgba(79,70,229,0.07)", borderColor: "rgba(79,70,229,0.25)" }]}>
          <MaterialCommunityIcons name="video-outline" size={16} color="#6366f1" />
          <Text style={[styles.infoText, { color: "#6366f1", fontFamily: "Inter_500Medium" }]}>
            Video consultation history. New appointments are automatically logged after each call.
          </Text>
        </View>

        {DEMO_HISTORY.map((rec) => {
          const sc = statusConfig(rec.status);
          return (
            <View key={rec.id} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {/* Top row */}
              <View style={styles.cardTop}>
                <View style={[styles.iconBox, { backgroundColor: rec.color + "20" }]}>
                  <MaterialCommunityIcons name={rec.icon} size={22} color={rec.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.consultType, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>{rec.type}</Text>
                  <Text style={[styles.clinician, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>{rec.clinician}</Text>
                  <Text style={[styles.role, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>{rec.role}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: sc.bg }]}>
                  <Text style={[styles.statusText, { color: sc.color, fontFamily: "Inter_600SemiBold" }]}>{sc.label}</Text>
                </View>
              </View>

              <View style={[styles.divider, { backgroundColor: colors.border }]} />

              {/* Meta row */}
              <View style={styles.metaRow}>
                <View style={styles.metaItem}>
                  <MaterialCommunityIcons name="calendar" size={13} color={colors.mutedForeground} />
                  <Text style={[styles.metaText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>{formatDate(rec.date)}</Text>
                </View>
                {rec.duration !== "—" && (
                  <View style={styles.metaItem}>
                    <MaterialCommunityIcons name="clock-outline" size={13} color={colors.mutedForeground} />
                    <Text style={[styles.metaText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>{rec.duration}</Text>
                  </View>
                )}
              </View>

              {/* Summary */}
              {rec.status === "completed" && (
                <View style={[styles.summaryBox, { backgroundColor: colors.secondary }]}>
                  <Text style={[styles.summaryLabel, { color: colors.mutedForeground, fontFamily: "Inter_600SemiBold" }]}>Consultation notes</Text>
                  <Text style={[styles.summaryText, { color: colors.foreground, fontFamily: "Inter_400Regular" }]}>{rec.summary}</Text>
                </View>
              )}
            </View>
          );
        })}

        <TouchableOpacity
          style={[styles.newConsultBtn, { backgroundColor: "#4F6EF7" }]}
          onPress={() => router.push("/(app)/consultation")}
          activeOpacity={0.85}
        >
          <MaterialCommunityIcons name="video-plus" size={20} color="#fff" />
          <Text style={[styles.newConsultText, { fontFamily: "Inter_700Bold" }]}>Book New Consultation</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 1 },
  backBtn: { padding: 6 },
  headerTitle: { flex: 1, fontSize: 17, letterSpacing: -0.3 },
  badge: { borderRadius: 12, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { fontSize: 11 },
  scroll: { padding: 16, gap: 12 },
  infoBanner: { flexDirection: "row", alignItems: "flex-start", gap: 9, borderRadius: 12, borderWidth: 1, padding: 12 },
  infoText: { fontSize: 12.5, lineHeight: 18, flex: 1 },
  card: { borderRadius: 16, borderWidth: 1, padding: 14, gap: 10 },
  cardTop: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  iconBox: { width: 46, height: 46, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  consultType: { fontSize: 15 },
  clinician: { fontSize: 13, marginTop: 2 },
  role: { fontSize: 11, marginTop: 1 },
  statusBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  statusText: { fontSize: 10.5 },
  divider: { height: 1 },
  metaRow: { flexDirection: "row", gap: 14, flexWrap: "wrap" },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  metaText: { fontSize: 12 },
  summaryBox: { borderRadius: 10, padding: 10, gap: 4 },
  summaryLabel: { fontSize: 10, letterSpacing: 0.8 },
  summaryText: { fontSize: 13, lineHeight: 20 },
  newConsultBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 14, paddingVertical: 15, marginTop: 4 },
  newConsultText: { color: "#fff", fontSize: 15 },
});
