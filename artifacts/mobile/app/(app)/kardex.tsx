import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import ThemedStatusBar from "@/components/ThemedStatusBar";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { usePatient, type KardexEntry } from "@/context/PatientContext";
import { useColors } from "@/hooks/useColors";

const ROUTE_ICONS: Record<string, string> = {
  Oral: "pill",
  oral: "pill",
  IV: "needle",
  IM: "needle",
  SC: "needle",
  Topical: "hand-back-right",
  Inhaled: "air-filter",
};

function statusStyle(status: string, colors: any) {
  if (status === "active") return { bg: colors.virtualBg, text: colors.virtual, border: colors.virtualBorder };
  if (status === "discontinued") return { bg: colors.emergencyBg, text: colors.emergency, border: colors.emergencyBorder };
  return { bg: colors.physioBg, text: colors.physio, border: colors.physioBorder };
}

export default function KardexScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { data } = usePatient();

  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;
  const active = data.kardex.filter((k) => k.status === "active");
  const other = data.kardex.filter((k) => k.status !== "active");

  function KardexCard({ entry }: { entry: KardexEntry }) {
    const ss = statusStyle(entry.status, colors);
    const routeIcon = ROUTE_ICONS[entry.route] ?? "pill";
    return (
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.cardHeader}>
          <View style={[styles.iconWrap, { backgroundColor: colors.secondary }]}>
            <MaterialCommunityIcons name={routeIcon as any} size={20} color={colors.primary} />
          </View>
          <View style={styles.cardTitleWrap}>
            <Text style={[styles.medName, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>{entry.medication}</Text>
            <Text style={[styles.dosage, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              {entry.dose} · {entry.frequency}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: ss.bg, borderColor: ss.border }]}>
            <Text style={[styles.statusText, { color: ss.text, fontFamily: "Inter_600SemiBold" }]}>
              {entry.status.toUpperCase()}
            </Text>
          </View>
        </View>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        <View style={styles.detailGrid}>
          <DetailItem icon="road-variant" label="Route" value={entry.route} colors={colors} />
          <DetailItem icon="calendar-start" label="Started" value={formatDate(entry.startDate)} colors={colors} />
          <DetailItem icon="doctor" label="Prescribed by" value={entry.prescribedBy} colors={colors} />
          {entry.endDate && <DetailItem icon="calendar-end" label="Ended" value={formatDate(entry.endDate)} colors={colors} />}
        </View>

        {entry.notes && (
          <View style={[styles.notesBox, { backgroundColor: colors.secondary }]}>
            <MaterialCommunityIcons name="note-text" size={14} color={colors.mutedForeground} />
            <Text style={[styles.notesText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>{entry.notes}</Text>
          </View>
        )}
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ThemedStatusBar />
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: bottomPad + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.summaryRow]}>
          {[
            { label: "Active", value: active.length, color: colors.virtual },
            { label: "Total", value: data.kardex.length, color: colors.primary },
            { label: "Discontinued", value: other.length, color: colors.mutedForeground },
          ].map((s) => (
            <View key={s.label} style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.summaryValue, { color: s.color, fontFamily: "Inter_700Bold" }]}>{s.value}</Text>
              <Text style={[styles.summaryLabel, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>{s.label}</Text>
            </View>
          ))}
        </View>

        {active.length > 0 && (
          <>
            <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>ACTIVE MEDICATIONS</Text>
            {active.map((k) => <KardexCard key={k.id} entry={k} />)}
          </>
        )}

        {other.length > 0 && (
          <>
            <Text style={[styles.sectionLabel, { color: colors.mutedForeground, marginTop: 8 }]}>PREVIOUS MEDICATIONS</Text>
            {other.map((k) => <KardexCard key={k.id} entry={k} />)}
          </>
        )}
      </ScrollView>
    </View>
  );
}

function DetailItem({ icon, label, value, colors }: { icon: string; label: string; value: string; colors: any }) {
  return (
    <View style={styles.detailItem}>
      <MaterialCommunityIcons name={icon as any} size={13} color={colors.mutedForeground} />
      <View>
        <Text style={[styles.detailLabel, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>{label}</Text>
        <Text style={[styles.detailValue, { color: colors.foreground, fontFamily: "Inter_500Medium" }]}>{value}</Text>
      </View>
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
  medName: { fontSize: 16 },
  dosage: { fontSize: 13, marginTop: 1 },
  statusBadge: { borderRadius: 8, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 3 },
  statusText: { fontSize: 10 },
  divider: { height: 1 },
  detailGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  detailItem: { flexDirection: "row", alignItems: "flex-start", gap: 6, minWidth: "45%" },
  detailLabel: { fontSize: 11 },
  detailValue: { fontSize: 13 },
  notesBox: { flexDirection: "row", gap: 8, borderRadius: 10, padding: 10 },
  notesText: { fontSize: 12, flex: 1, lineHeight: 18 },
});
