import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import {
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { usePatient, type MedicalCondition } from "@/context/PatientContext";
import { useColors } from "@/hooks/useColors";

function statusStyle(status: string, colors: any) {
  switch (status) {
    case "active": return { bg: colors.fastTrackBg, text: colors.fastTrack, border: colors.fastTrackBorder };
    case "chronic": return { bg: colors.physioBg, text: colors.physio, border: colors.physioBorder };
    default: return { bg: colors.virtualBg, text: colors.virtual, border: colors.virtualBorder };
  }
}

function ConditionCard({ cond, colors }: { cond: MedicalCondition; colors: any }) {
  const ss = statusStyle(cond.status, colors);
  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.cardHeader}>
        <View style={[styles.iconWrap, { backgroundColor: colors.secondary }]}>
          <MaterialCommunityIcons name="heart-pulse" size={20} color={colors.primary} />
        </View>
        <View style={styles.cardTitleWrap}>
          <Text style={[styles.condName, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>{cond.name}</Text>
          {cond.icd10 && (
            <Text style={[styles.icd10, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>ICD-10: {cond.icd10}</Text>
          )}
        </View>
        <View style={[styles.statusBadge, { backgroundColor: ss.bg, borderColor: ss.border }]}>
          <Text style={[styles.statusText, { color: ss.text, fontFamily: "Inter_600SemiBold" }]}>{cond.status.toUpperCase()}</Text>
        </View>
      </View>

      <View style={[styles.divider, { backgroundColor: colors.border }]} />

      <View style={styles.detailRow}>
        <MaterialCommunityIcons name="calendar" size={13} color={colors.mutedForeground} />
        <Text style={[styles.detailLabel, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>Diagnosed</Text>
        <Text style={[styles.detailValue, { color: colors.foreground, fontFamily: "Inter_500Medium" }]}>{formatDate(cond.diagnosedDate)}</Text>
      </View>

      {cond.notes && (
        <View style={[styles.notesBox, { backgroundColor: colors.secondary }]}>
          <MaterialCommunityIcons name="note-text" size={14} color={colors.mutedForeground} />
          <Text style={[styles.notesText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>{cond.notes}</Text>
        </View>
      )}
    </View>
  );
}

export default function MedicalHistoryScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { data } = usePatient();

  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const active = data.medicalHistory.filter((c) => c.status === "active");
  const chronic = data.medicalHistory.filter((c) => c.status === "chronic");
  const resolved = data.medicalHistory.filter((c) => c.status === "resolved");

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="dark-content" />
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: bottomPad + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.summaryRow}>
          {[
            { label: "Active", value: active.length, color: colors.fastTrack },
            { label: "Chronic", value: chronic.length, color: colors.physio },
            { label: "Resolved", value: resolved.length, color: colors.virtual },
          ].map((s) => (
            <View key={s.label} style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.summaryValue, { color: s.color, fontFamily: "Inter_700Bold" }]}>{s.value}</Text>
              <Text style={[styles.summaryLabel, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>{s.label}</Text>
            </View>
          ))}
        </View>

        {active.length > 0 && (
          <>
            <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>ACTIVE CONDITIONS</Text>
            {active.map((c) => <ConditionCard key={c.id} cond={c} colors={colors} />)}
          </>
        )}

        {chronic.length > 0 && (
          <>
            <Text style={[styles.sectionLabel, { color: colors.mutedForeground, marginTop: 8 }]}>CHRONIC CONDITIONS</Text>
            {chronic.map((c) => <ConditionCard key={c.id} cond={c} colors={colors} />)}
          </>
        )}

        {resolved.length > 0 && (
          <>
            <Text style={[styles.sectionLabel, { color: colors.mutedForeground, marginTop: 8 }]}>RESOLVED</Text>
            {resolved.map((c) => <ConditionCard key={c.id} cond={c} colors={colors} />)}
          </>
        )}

        {data.medicalHistory.length === 0 && (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="clipboard-pulse-outline" size={48} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>No conditions recorded</Text>
            <Text style={[styles.emptyText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>Your medical history will appear here</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function formatDate(d?: string) {
  if (!d) return "—";
  try { return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }); } catch { return d; }
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: 20, paddingTop: 16 },
  summaryRow: { flexDirection: "row", gap: 10, marginBottom: 20 },
  summaryCard: { flex: 1, borderRadius: 12, borderWidth: 1, alignItems: "center", paddingVertical: 12, gap: 2 },
  summaryValue: { fontSize: 22 },
  summaryLabel: { fontSize: 11 },
  sectionLabel: { fontSize: 11, fontFamily: "Inter_600SemiBold", letterSpacing: 1.2, marginBottom: 10, marginLeft: 2 },
  card: { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 12, gap: 12 },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
  iconWrap: { width: 40, height: 40, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  cardTitleWrap: { flex: 1 },
  condName: { fontSize: 16 },
  icd10: { fontSize: 12, marginTop: 1 },
  statusBadge: { borderRadius: 8, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 3 },
  statusText: { fontSize: 10 },
  divider: { height: 1 },
  detailRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  detailLabel: { fontSize: 12, flex: 1 },
  detailValue: { fontSize: 13 },
  notesBox: { flexDirection: "row", gap: 8, borderRadius: 10, padding: 10 },
  notesText: { fontSize: 12, flex: 1, lineHeight: 18 },
  emptyState: { alignItems: "center", paddingTop: 60, gap: 10 },
  emptyTitle: { fontSize: 17 },
  emptyText: { fontSize: 14, textAlign: "center" },
});
