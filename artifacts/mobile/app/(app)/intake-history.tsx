import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ThemedStatusBar from "@/components/ThemedStatusBar";
import { usePatient, type Complaint } from "@/context/PatientContext";
import { useColors } from "@/hooks/useColors";

function formatDate(iso?: string) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-IE", {
      day: "numeric", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  } catch { return iso; }
}

function triageColor(rec?: string) {
  const r = (rec ?? "").toLowerCase();
  if (r.includes("emergency") || r.includes("999")) return "#dc2626";
  if (r.includes("urgent")    || r.includes("a&e")) return "#ea580c";
  if (r.includes("gp")        || r.includes("contact")) return "#ca8a04";
  if (r.includes("self")      || r.includes("home"))    return "#16a34a";
  return "#6366f1";
}

function triageIcon(rec?: string): React.ComponentProps<typeof MaterialCommunityIcons>["name"] {
  const r = (rec ?? "").toLowerCase();
  if (r.includes("emergency") || r.includes("999")) return "ambulance";
  if (r.includes("urgent")    || r.includes("a&e")) return "hospital-building";
  if (r.includes("gp")        || r.includes("contact")) return "doctor";
  if (r.includes("self")      || r.includes("home"))    return "home-heart";
  return "clipboard-check-outline";
}

interface DetailSheetProps {
  complaint: Complaint;
  colors: ReturnType<typeof useColors>;
  onClose: () => void;
}

function DetailSheet({ complaint, colors, onClose }: DetailSheetProps) {
  const insets = useSafeAreaInsets();
  const tc     = triageColor(complaint.triageRecommendation);

  return (
    <View style={[detail.root, { backgroundColor: colors.background }]}>
      <View style={[detail.dragHandle, { backgroundColor: colors.border }]} />
      <View style={[detail.header, { borderBottomColor: colors.border }]}>
        <View style={{ flex: 1 }}>
          <Text style={[detail.title, { color: colors.foreground, fontFamily: "Inter_700Bold" }]} numberOfLines={1}>
            {complaint.chiefComplaint}
          </Text>
          <Text style={[detail.date, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
            {formatDate(complaint.date)}
          </Text>
        </View>
        <TouchableOpacity onPress={onClose} style={detail.closeBtn} activeOpacity={0.7}>
          <MaterialCommunityIcons name="close" size={20} color={colors.mutedForeground} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[detail.scroll, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Triage recommendation */}
        {complaint.triageRecommendation ? (
          <View style={[detail.triageBox, { backgroundColor: tc + "14", borderColor: tc + "44" }]}>
            <MaterialCommunityIcons name={triageIcon(complaint.triageRecommendation)} size={22} color={tc} />
            <View style={{ flex: 1 }}>
              <Text style={[detail.triageLabel, { color: tc, fontFamily: "Inter_700Bold" }]}>Clinical Recommendation</Text>
              <Text style={[detail.triageText,  { color: tc, fontFamily: "Inter_500Medium" }]}>{complaint.triageRecommendation}</Text>
            </View>
          </View>
        ) : null}

        {/* AI summary */}
        {complaint.aiSummary ? (
          <View style={[detail.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={detail.sectionHeader}>
              <MaterialCommunityIcons name="text-box-outline" size={15} color={colors.mutedForeground} />
              <Text style={[detail.sectionLabel, { color: colors.mutedForeground, fontFamily: "Inter_600SemiBold" }]}>AI Clinical Summary</Text>
            </View>
            <Text style={[detail.summaryText, { color: colors.foreground, fontFamily: "Inter_400Regular" }]}>{complaint.aiSummary}</Text>
          </View>
        ) : null}

        {/* Questions & answers */}
        {complaint.answers && complaint.answers.length > 0 ? (
          <View style={[detail.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={detail.sectionHeader}>
              <MaterialCommunityIcons name="comment-question-outline" size={15} color={colors.mutedForeground} />
              <Text style={[detail.sectionLabel, { color: colors.mutedForeground, fontFamily: "Inter_600SemiBold" }]}>Assessment Q&A</Text>
            </View>
            {complaint.answers.map((item, i) => (
              <View key={i} style={[detail.qaRow, i > 0 && { borderTopWidth: 1, borderTopColor: colors.border }]}>
                <Text style={[detail.question, { color: colors.mutedForeground, fontFamily: "Inter_600SemiBold" }]}>{item.question}</Text>
                <Text style={[detail.answer,   { color: colors.foreground,      fontFamily: "Inter_400Regular" }]}>{item.answer}</Text>
              </View>
            ))}
          </View>
        ) : null}

        <View style={[detail.noteBox, { backgroundColor: colors.glass, borderColor: colors.glassBorder }]}>
          <MaterialCommunityIcons name="information-outline" size={14} color={colors.mutedForeground} />
          <Text style={[detail.noteText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
            This record was generated by AI-assisted intake and is for information only. Always follow advice from your healthcare team.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const detail = StyleSheet.create({
  root:         { flex: 1, borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: "hidden" },
  dragHandle:   { width: 40, height: 4, borderRadius: 2, alignSelf: "center", marginTop: 10, marginBottom: 8 },
  header:       { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 1 },
  title:        { fontSize: 16, letterSpacing: -0.2 },
  date:         { fontSize: 11, marginTop: 2 },
  closeBtn:     { padding: 6 },
  scroll:       { padding: 16, gap: 12 },
  triageBox:    { flexDirection: "row", alignItems: "flex-start", gap: 12, borderRadius: 14, borderWidth: 1.5, padding: 14 },
  triageLabel:  { fontSize: 11, marginBottom: 2 },
  triageText:   { fontSize: 13.5, lineHeight: 20 },
  section:      { borderRadius: 14, borderWidth: 1, overflow: "hidden" },
  sectionHeader:{ flexDirection: "row", alignItems: "center", gap: 7, paddingHorizontal: 14, paddingVertical: 11 },
  sectionLabel: { fontSize: 11, letterSpacing: 0.5 },
  summaryText:  { fontSize: 13.5, lineHeight: 21, paddingHorizontal: 14, paddingBottom: 14 },
  qaRow:        { paddingHorizontal: 14, paddingVertical: 10, gap: 4 },
  question:     { fontSize: 12, lineHeight: 17 },
  answer:       { fontSize: 13.5, lineHeight: 20 },
  noteBox:      { flexDirection: "row", alignItems: "flex-start", gap: 8, borderRadius: 12, borderWidth: 1, padding: 11 },
  noteText:     { flex: 1, fontSize: 11.5, lineHeight: 17 },
});

// ── Main screen ────────────────────────────────────────────────────────────────

export default function IntakeHistoryScreen() {
  const colors    = useColors();
  const insets    = useSafeAreaInsets();
  const { data }  = usePatient();
  const topPad    = Platform.OS === "web" ? 0 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const [selected, setSelected] = useState<Complaint | null>(null);
  const sorted = [...(data.complaints ?? [])].reverse();

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ThemedStatusBar />
      <View style={[styles.header, { paddingTop: topPad + 12, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <Feather name="arrow-left" size={20} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>Intake History</Text>
        <View style={[styles.countBadge, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.countText, { color: colors.mutedForeground, fontFamily: "Inter_600SemiBold" }]}>{sorted.length}</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: bottomPad + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        {sorted.length === 0 ? (
          <View style={styles.empty}>
            <MaterialCommunityIcons name="clipboard-text-outline" size={52} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>No intake records yet</Text>
            <Text style={[styles.emptyBody, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              Complete an AI Clinical Intake in the HIVE tab. Your questionnaire summaries and triage recommendations will appear here.
            </Text>
            <TouchableOpacity
              style={[styles.emptyBtn, { backgroundColor: colors.primary }]}
              onPress={() => router.push("/(app)/(tabs)/complaint")}
              activeOpacity={0.85}
            >
              <MaterialCommunityIcons name="clipboard-plus-outline" size={18} color="#fff" />
              <Text style={[styles.emptyBtnText, { fontFamily: "Inter_700Bold" }]}>Start Clinical Intake</Text>
            </TouchableOpacity>
          </View>
        ) : (
          sorted.map((c, i) => {
            const tc = triageColor(c.triageRecommendation);
            return (
              <TouchableOpacity
                key={c.id ?? i}
                activeOpacity={0.82}
                onPress={() => setSelected(c)}
                style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                <View style={styles.cardTop}>
                  <View style={[styles.triageIcon, { backgroundColor: tc + "18" }]}>
                    <MaterialCommunityIcons name={triageIcon(c.triageRecommendation)} size={22} color={tc} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.complaint, { color: colors.foreground, fontFamily: "Inter_700Bold" }]} numberOfLines={2}>
                      {c.chiefComplaint}
                    </Text>
                    <Text style={[styles.dateText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                      {formatDate(c.date)}
                    </Text>
                  </View>
                  <MaterialCommunityIcons name="chevron-right" size={18} color={colors.mutedForeground} />
                </View>

                {c.triageRecommendation ? (
                  <View style={[styles.triageChip, { backgroundColor: tc + "12", borderColor: tc + "35" }]}>
                    <Text style={[styles.triageChipText, { color: tc, fontFamily: "Inter_600SemiBold" }]} numberOfLines={1}>
                      {c.triageRecommendation}
                    </Text>
                  </View>
                ) : null}

                {c.aiSummary ? (
                  <Text style={[styles.summary, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]} numberOfLines={2}>
                    {c.aiSummary}
                  </Text>
                ) : null}
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      <Modal visible={!!selected} transparent animationType="slide" onRequestClose={() => setSelected(null)}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setSelected(null)} />
          <View style={[styles.modalSheet, { backgroundColor: colors.background }]}>
            {selected && <DetailSheet complaint={selected} colors={colors} onClose={() => setSelected(null)} />}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root:          { flex: 1 },
  header:        { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 1 },
  backBtn:       { padding: 6 },
  headerTitle:   { flex: 1, fontSize: 17, letterSpacing: -0.3 },
  countBadge:    { borderRadius: 12, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 4 },
  countText:     { fontSize: 12 },
  scroll:        { padding: 16, gap: 12 },
  card:          { borderRadius: 16, borderWidth: 1, padding: 14, gap: 10 },
  cardTop:       { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  triageIcon:    { width: 44, height: 44, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  complaint:     { fontSize: 15, lineHeight: 21 },
  dateText:      { fontSize: 11, marginTop: 3 },
  triageChip:    { borderRadius: 8, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 5 },
  triageChipText: { fontSize: 12 },
  summary:       { fontSize: 12.5, lineHeight: 18 },
  empty:         { alignItems: "center", paddingTop: 60, gap: 12, paddingHorizontal: 24 },
  emptyTitle:    { fontSize: 18, textAlign: "center" },
  emptyBody:     { fontSize: 13.5, lineHeight: 20, textAlign: "center" },
  emptyBtn:      { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 14, paddingHorizontal: 24, paddingVertical: 14, marginTop: 8 },
  emptyBtnText:  { color: "#fff", fontSize: 15 },
  modalOverlay:  { flex: 1, justifyContent: "flex-end" },
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.5)" },
  modalSheet:    { height: "88%", borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: "hidden" },
});
