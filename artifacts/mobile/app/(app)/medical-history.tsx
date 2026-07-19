import { MaterialCommunityIcons } from "@expo/vector-icons";
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
import { usePatient, type MedicalCondition } from "@/context/PatientContext";
import { useHiveBot } from "@/context/HiveBotContext";
import { useColors } from "@/hooks/useColors";
import { getConditionEdu, type ConditionEdu } from "@/utils/conditionEducation";

function statusStyle(status: string, colors: any) {
  switch (status) {
    case "active":  return { bg: colors.fastTrackBg,  text: colors.fastTrack,  border: colors.fastTrackBorder };
    case "chronic": return { bg: colors.physioBg,     text: colors.physio,     border: colors.physioBorder };
    default:        return { bg: colors.virtualBg,    text: colors.virtual,    border: colors.virtualBorder };
  }
}

function conditionIcon(status: string): "heart-pulse" | "heart-off-outline" | "heart-flash" {
  if (status === "active")  return "heart-pulse";
  if (status === "resolved") return "heart-off-outline";
  return "heart-flash";
}

function formatDate(d?: string) {
  if (!d) return "—";
  try { return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }); }
  catch { return d; }
}

// ── Education bottom sheet ───────────────────────────────────────────────────

interface EduSheetProps {
  cond: MedicalCondition;
  edu: ConditionEdu;
  colors: ReturnType<typeof useColors>;
  onClose: () => void;
  onAskQueenB: () => void;
}

function EduSheet({ cond, edu, colors, onClose, onAskQueenB }: EduSheetProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[sheet.root, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[sheet.header, { borderBottomColor: colors.border }]}>
        <View style={sheet.dragHandle} />
        <View style={sheet.headerRow}>
          <View style={[sheet.iconBox, { backgroundColor: edu.accentColor + "22", borderColor: edu.accentColor + "55" }]}>
            <MaterialCommunityIcons name={edu.icon as any} size={22} color={edu.accentColor} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[sheet.condName, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>{cond.name}</Text>
            {cond.icd10 && (
              <Text style={[sheet.icd10, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>ICD-10: {cond.icd10}</Text>
            )}
          </View>
          <TouchableOpacity onPress={onClose} style={sheet.closeBtn} activeOpacity={0.7}>
            <MaterialCommunityIcons name="close" size={20} color={colors.mutedForeground} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[sheet.scroll, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* What is it */}
        <EduSection title="What is it?" icon="information-outline" accentColor={edu.accentColor} colors={colors}>
          <Text style={[sheet.bodyText, { color: colors.foreground, fontFamily: "Inter_400Regular" }]}>{edu.whatIsIt}</Text>
        </EduSection>

        {/* How it feels */}
        <EduSection title="How it may feel" icon="emoticon-neutral-outline" accentColor={edu.accentColor} colors={colors}>
          <Text style={[sheet.bodyText, { color: colors.foreground, fontFamily: "Inter_400Regular" }]}>{edu.howItFeels}</Text>
        </EduSection>

        {/* Watch for */}
        <EduSection title="Warning signs to watch for" icon="alert-circle-outline" accentColor="#e11d48" colors={colors}>
          {edu.watchFor.map((item, i) => (
            <View key={i} style={sheet.bulletRow}>
              <View style={[sheet.bullet, { backgroundColor: "#e11d48" }]} />
              <Text style={[sheet.bulletText, { color: colors.foreground, fontFamily: "Inter_400Regular" }]}>{item}</Text>
            </View>
          ))}
        </EduSection>

        {/* Lifestyle tips */}
        <EduSection title="Things that help" icon="leaf-circle-outline" accentColor="#16a34a" colors={colors}>
          {edu.lifestyleTips.map((item, i) => (
            <View key={i} style={sheet.bulletRow}>
              <View style={[sheet.bullet, { backgroundColor: "#16a34a" }]} />
              <Text style={[sheet.bulletText, { color: colors.foreground, fontFamily: "Inter_400Regular" }]}>{item}</Text>
            </View>
          ))}
        </EduSection>

        {/* Key facts */}
        {edu.keyFacts.length > 0 && (
          <EduSection title="Key facts for your care" icon="clipboard-check-outline" accentColor={edu.accentColor} colors={colors}>
            {edu.keyFacts.map((fact, i) => (
              <View key={i} style={[sheet.factRow, { borderBottomColor: colors.border, borderBottomWidth: i < edu.keyFacts.length - 1 ? 1 : 0 }]}>
                <Text style={[sheet.factLabel, { color: colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>{fact.label}</Text>
                <Text style={[sheet.factValue, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>{fact.value}</Text>
              </View>
            ))}
          </EduSection>
        )}

        {/* Emergency reminder */}
        <View style={[sheet.emergencyBox, { backgroundColor: "rgba(220,38,38,0.07)", borderColor: "rgba(220,38,38,0.3)" }]}>
          <MaterialCommunityIcons name="phone-alert" size={18} color="#dc2626" />
          <Text style={[sheet.emergencyText, { color: "#dc2626", fontFamily: "Inter_500Medium" }]}>
            If you have any sudden, severe, or life-threatening symptoms — call 999 immediately.
          </Text>
        </View>

        {/* Queen B CTA */}
        <TouchableOpacity
          style={[sheet.queenBBtn, { backgroundColor: "rgba(201,134,10,0.12)", borderColor: "rgba(201,134,10,0.45)" }]}
          onPress={onAskQueenB}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="bee" size={22} color="#C9860A" />
          <View style={{ flex: 1 }}>
            <Text style={[sheet.queenBTitle, { color: "#C9860A", fontFamily: "Inter_700Bold" }]}>Discuss with Queen B</Text>
            <Text style={[sheet.queenBSub, { color: "#C9860A", fontFamily: "Inter_400Regular" }]}>
              Ask questions, get personalised guidance, and continue the conversation
            </Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={20} color="#C9860A" />
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

function EduSection({
  title,
  icon,
  accentColor,
  colors,
  children,
}: {
  title: string;
  icon: string;
  accentColor: string;
  colors: ReturnType<typeof useColors>;
  children: React.ReactNode;
}) {
  return (
    <View style={[sheet.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={sheet.sectionHeader}>
        <MaterialCommunityIcons name={icon as any} size={16} color={accentColor} />
        <Text style={[sheet.sectionTitle, { color: accentColor, fontFamily: "Inter_700Bold" }]}>{title}</Text>
      </View>
      <View style={sheet.sectionBody}>{children}</View>
    </View>
  );
}

const sheet = StyleSheet.create({
  root: { flex: 1, borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: "hidden" },
  dragHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: "rgba(0,0,0,0.15)", alignSelf: "center", marginTop: 10, marginBottom: 8 },
  header: { borderBottomWidth: 1, paddingBottom: 14, paddingHorizontal: 16 },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  iconBox: { width: 44, height: 44, borderRadius: 13, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  condName: { fontSize: 17, letterSpacing: -0.3 },
  icd10: { fontSize: 11, marginTop: 1 },
  closeBtn: { padding: 6 },
  scroll: { paddingHorizontal: 16, paddingTop: 16, gap: 12 },
  section: { borderRadius: 14, borderWidth: 1, overflow: "hidden" },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 14, paddingVertical: 11 },
  sectionTitle: { fontSize: 13, letterSpacing: 0.1 },
  sectionBody: { paddingHorizontal: 14, paddingBottom: 14, gap: 8 },
  bodyText: { fontSize: 14, lineHeight: 22 },
  bulletRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  bullet: { width: 6, height: 6, borderRadius: 3, marginTop: 8 },
  bulletText: { fontSize: 13.5, lineHeight: 20, flex: 1 },
  factRow: { paddingVertical: 9, gap: 2 },
  factLabel: { fontSize: 11 },
  factValue: { fontSize: 13 },
  emergencyBox: { flexDirection: "row", alignItems: "flex-start", gap: 10, borderRadius: 13, borderWidth: 1, padding: 14 },
  emergencyText: { fontSize: 13, lineHeight: 19, flex: 1 },
  queenBBtn: { flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 16, borderWidth: 1.5, padding: 16 },
  queenBTitle: { fontSize: 15 },
  queenBSub: { fontSize: 12, lineHeight: 17, marginTop: 2, opacity: 0.85 },
});

// ── Condition card (tappable) ─────────────────────────────────────────────────

function ConditionCard({
  cond,
  colors,
  onPress,
}: {
  cond: MedicalCondition;
  colors: ReturnType<typeof useColors>;
  onPress: () => void;
}) {
  const ss = statusStyle(cond.status, colors);
  return (
    <TouchableOpacity
      activeOpacity={0.82}
      onPress={onPress}
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
    >
      <View style={styles.cardHeader}>
        <View style={[styles.iconWrap, { backgroundColor: colors.secondary }]}>
          <MaterialCommunityIcons name={conditionIcon(cond.status)} size={20} color={colors.primary} />
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
        <MaterialCommunityIcons name="chevron-right" size={18} color={colors.mutedForeground} />
      </View>

      <View style={[styles.divider, { backgroundColor: colors.border }]} />

      <View style={styles.cardFooter}>
        <View style={styles.detailRow}>
          <MaterialCommunityIcons name="calendar" size={13} color={colors.mutedForeground} />
          <Text style={[styles.detailLabel, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>Diagnosed</Text>
          <Text style={[styles.detailValue, { color: colors.foreground, fontFamily: "Inter_500Medium" }]}>{formatDate(cond.diagnosedDate)}</Text>
        </View>
        <View style={[styles.learnChip, { backgroundColor: "rgba(201,134,10,0.12)", borderColor: "rgba(201,134,10,0.3)" }]}>
          <MaterialCommunityIcons name="book-open-outline" size={12} color="#C9860A" />
          <Text style={[styles.learnChipText, { color: "#C9860A", fontFamily: "Inter_600SemiBold" }]}>Learn & Discuss</Text>
        </View>
      </View>

      {cond.notes && (
        <View style={[styles.notesBox, { backgroundColor: colors.secondary }]}>
          <MaterialCommunityIcons name="note-text" size={14} color={colors.mutedForeground} />
          <Text style={[styles.notesText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>{cond.notes}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────

export default function MedicalHistoryScreen() {
  const colors    = useColors();
  const insets    = useSafeAreaInsets();
  const { data }  = usePatient();
  const { open: openBot } = useHiveBot();
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const [selected, setSelected] = useState<MedicalCondition | null>(null);

  const active   = data.medicalHistory.filter((c) => c.status === "active");
  const chronic  = data.medicalHistory.filter((c) => c.status === "chronic");
  const resolved = data.medicalHistory.filter((c) => c.status === "resolved");

  function handleSelect(cond: MedicalCondition) {
    setSelected(cond);
  }

  function handleAskQueenB() {
    if (!selected) return;
    const edu = getConditionEdu(selected.name, selected.icd10);
    setSelected(null);
    // Brief delay so modal closes before Queen B opens
    setTimeout(() => openBot(edu.queenBSeed), 250);
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ThemedStatusBar />
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: bottomPad + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Summary chips */}
        <View style={styles.summaryRow}>
          {[
            { label: "Active",   value: active.length,   color: colors.fastTrack },
            { label: "Chronic",  value: chronic.length,  color: colors.physio },
            { label: "Resolved", value: resolved.length, color: colors.virtual },
          ].map((s) => (
            <View key={s.label} style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.summaryValue, { color: s.color, fontFamily: "Inter_700Bold" }]}>{s.value}</Text>
              <Text style={[styles.summaryLabel, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>{s.label}</Text>
            </View>
          ))}
        </View>

        <View style={[styles.eduHint, { backgroundColor: "rgba(201,134,10,0.08)", borderColor: "rgba(201,134,10,0.28)" }]}>
          <MaterialCommunityIcons name="gesture-tap" size={16} color="#C9860A" />
          <Text style={[styles.eduHintText, { color: "#C9860A", fontFamily: "Inter_500Medium" }]}>
            Tap any condition to read patient education and discuss it with Queen B
          </Text>
        </View>

        {active.length > 0 && (
          <>
            <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>ACTIVE CONDITIONS</Text>
            {active.map((c) => <ConditionCard key={c.id} cond={c} colors={colors} onPress={() => handleSelect(c)} />)}
          </>
        )}

        {chronic.length > 0 && (
          <>
            <Text style={[styles.sectionLabel, { color: colors.mutedForeground, marginTop: 8 }]}>CHRONIC CONDITIONS</Text>
            {chronic.map((c) => <ConditionCard key={c.id} cond={c} colors={colors} onPress={() => handleSelect(c)} />)}
          </>
        )}

        {resolved.length > 0 && (
          <>
            <Text style={[styles.sectionLabel, { color: colors.mutedForeground, marginTop: 8 }]}>RESOLVED</Text>
            {resolved.map((c) => <ConditionCard key={c.id} cond={c} colors={colors} onPress={() => handleSelect(c)} />)}
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

      {/* Education modal */}
      <Modal
        visible={!!selected}
        transparent
        animationType="slide"
        onRequestClose={() => setSelected(null)}
      >
        <View style={[styles.modalOverlay]}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setSelected(null)}
          />
          <View style={[styles.modalSheet, { backgroundColor: colors.background }]}>
            {selected && (
              <EduSheet
                cond={selected}
                edu={getConditionEdu(selected.name, selected.icd10)}
                colors={colors}
                onClose={() => setSelected(null)}
                onAskQueenB={handleAskQueenB}
              />
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: 20, paddingTop: 16 },
  summaryRow: { flexDirection: "row", gap: 10, marginBottom: 14 },
  summaryCard: { flex: 1, borderRadius: 12, borderWidth: 1, alignItems: "center", paddingVertical: 12, gap: 2 },
  summaryValue: { fontSize: 22 },
  summaryLabel: { fontSize: 11 },
  eduHint: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 11, borderWidth: 1, padding: 11, marginBottom: 16 },
  eduHintText: { fontSize: 12.5, flex: 1, lineHeight: 17 },
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
  cardFooter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  detailRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  detailLabel: { fontSize: 12 },
  detailValue: { fontSize: 13 },
  learnChip: { flexDirection: "row", alignItems: "center", gap: 4, borderRadius: 8, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 4 },
  learnChipText: { fontSize: 11 },
  notesBox: { flexDirection: "row", gap: 8, borderRadius: 10, padding: 10 },
  notesText: { fontSize: 12, flex: 1, lineHeight: 18 },
  emptyState: { alignItems: "center", paddingTop: 60, gap: 10 },
  emptyTitle: { fontSize: 17 },
  emptyText: { fontSize: 14, textAlign: "center" },
  // Modal
  modalOverlay: { flex: 1, justifyContent: "flex-end" },
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.5)" },
  modalSheet: { height: "88%", borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: "hidden" },
});
