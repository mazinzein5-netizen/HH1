import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  Animated,
  StatusBar,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";

type TriageCategory = "emergency" | "fasttrack" | "physio" | null;
type Site = "Spine" | "Hip" | "Knee" | "Ankle" | "Shoulder" | "Wrist";

const SITES: Site[] = ["Spine", "Hip", "Knee", "Ankle", "Shoulder", "Wrist"];

interface TriageResult {
  category: TriageCategory;
  label: string;
  description: string;
  action: string;
}

function getTriageResult(redFlag: boolean, anticoag: boolean, site: Site): TriageResult {
  if (redFlag) {
    return {
      category: "emergency",
      label: "CATEGORY 1 — EMERGENCY",
      description: "Critical neurovascular compromise suspected.",
      action: "Present to A&E immediately. Do not delay.",
    };
  }
  if (anticoag) {
    return {
      category: "fasttrack",
      label: "CATEGORY 2 — FAST TRACK",
      description: "High-risk medication alert identified.",
      action: "Schedule urgent physiotherapy assessment within 24–48 hours.",
    };
  }
  return {
    category: "physio",
    label: "CATEGORY 3 — PHYSIOTHERAPY",
    description: `${site} — Conservative management pathway.`,
    action: "Routine physiotherapy referral. Monitor for progression.",
  };
}

export default function TriageScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [redFlag, setRedFlag] = useState(false);
  const [anticoag, setAnticoag] = useState(false);
  const [selectedSite, setSelectedSite] = useState<Site>("Spine");
  const [notes, setNotes] = useState("");
  const [result, setResult] = useState<TriageResult | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 + 84 : insets.bottom + 84;

  function handleToggle(type: "red" | "anticoag") {
    Haptics.impactAsync(type === "red" ? Haptics.ImpactFeedbackStyle.Heavy : Haptics.ImpactFeedbackStyle.Medium);
    if (type === "red") setRedFlag((v) => !v);
    else setAnticoag((v) => !v);
    setResult(null);
  }

  function handleAssess() {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const r = getTriageResult(redFlag, anticoag, selectedSite);
    setResult(r);
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, { toValue: 1, duration: 350, useNativeDriver: true }).start();
  }

  function handleReset() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRedFlag(false);
    setAnticoag(false);
    setSelectedSite("Spine");
    setNotes("");
    setResult(null);
  }

  const catStyle = result
    ? result.category === "emergency"
      ? { bg: colors.emergencyBg, border: colors.emergencyBorder, text: colors.emergency, icon: "alert-octagon" }
      : result.category === "fasttrack"
      ? { bg: colors.fastTrackBg, border: colors.fastTrackBorder, text: colors.fastTrack, icon: "clock-fast" }
      : { bg: colors.physioBg, border: colors.physioBorder, text: colors.physio, icon: "human-handsup" }
    : null;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="dark-content" />
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: topPad + 20, paddingBottom: bottomPad + 16 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={[styles.logoWrap, { backgroundColor: colors.primary }]}>
            <MaterialCommunityIcons name="hospital-box" size={26} color="#fff" />
          </View>
          <View>
            <Text style={[styles.headerTitle, { color: colors.primary, fontFamily: "Inter_700Bold" }]}>IbnCeena</Text>
            <Text style={[styles.headerSub, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>Clinical Triage</Text>
          </View>
        </View>

        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>RED FLAGS</Text>
        <ToggleCard icon="alert-rhombus" title="CES / Myelopathy / ACS Signs" subtitle="Cauda equina, cord compression, or acute coronary" value={redFlag} onToggle={() => handleToggle("red")} activeColor={colors.emergency} activeBg={colors.emergencyBg} activeBorder={colors.emergencyBorder} colors={colors} />

        <Text style={[styles.sectionLabel, { color: colors.mutedForeground, marginTop: 16 }]}>RISK FACTORS</Text>
        <ToggleCard icon="blood-bag" title="On Blood Thinners / Anticoagulants" subtitle="Warfarin, rivaroxaban, apixaban, etc." value={anticoag} onToggle={() => handleToggle("anticoag")} activeColor={colors.fastTrack} activeBg={colors.fastTrackBg} activeBorder={colors.fastTrackBorder} colors={colors} />

        <Text style={[styles.sectionLabel, { color: colors.mutedForeground, marginTop: 16 }]}>PRIMARY SITE</Text>
        <View style={[styles.siteGrid, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {SITES.map((site) => {
            const active = selectedSite === site;
            return (
              <TouchableOpacity key={site} activeOpacity={0.75} onPress={() => { Haptics.selectionAsync(); setSelectedSite(site); setResult(null); }}
                style={[styles.siteChip, { backgroundColor: active ? colors.primary : "transparent" }]}>
                <Text style={[styles.siteChipText, { color: active ? colors.primaryForeground : colors.mutedForeground, fontFamily: active ? "Inter_600SemiBold" : "Inter_400Regular" }]}>{site}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={[styles.sectionLabel, { color: colors.mutedForeground, marginTop: 16 }]}>CLINICAL NOTES</Text>
        <View style={[styles.notesWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <TextInput style={[styles.notesInput, { color: colors.foreground, fontFamily: "Inter_400Regular" }]}
            placeholder="Enter clinical history, mechanism of injury, onset..." placeholderTextColor={colors.mutedForeground}
            multiline numberOfLines={4} value={notes} onChangeText={(t) => { setNotes(t); setResult(null); }} textAlignVertical="top" />
        </View>

        <TouchableOpacity activeOpacity={0.85} onPress={handleAssess} style={[styles.assessBtn, { backgroundColor: colors.primary }]}>
          <Feather name="activity" size={18} color="#fff" />
          <Text style={[styles.assessBtnText, { fontFamily: "Inter_600SemiBold" }]}>Assess Patient</Text>
        </TouchableOpacity>

        {result && catStyle && (
          <Animated.View style={{ opacity: fadeAnim }}>
            <View style={[styles.resultCard, { backgroundColor: catStyle.bg, borderColor: catStyle.border }]}>
              <View style={styles.resultHeader}>
                <MaterialCommunityIcons name={catStyle.icon as any} size={22} color={catStyle.text} />
                <Text style={[styles.resultLabel, { color: catStyle.text, fontFamily: "Inter_700Bold" }]}>{result.label}</Text>
              </View>
              <Text style={[styles.resultDesc, { color: catStyle.text, fontFamily: "Inter_400Regular" }]}>{result.description}</Text>
              <View style={[styles.divider, { backgroundColor: catStyle.border }]} />
              <View style={styles.actionRow}>
                <Feather name="arrow-right-circle" size={15} color={catStyle.text} />
                <Text style={[styles.actionText, { color: catStyle.text, fontFamily: "Inter_500Medium" }]}>{result.action}</Text>
              </View>
            </View>
            <TouchableOpacity activeOpacity={0.7} onPress={handleReset} style={[styles.resetBtn, { borderColor: colors.border }]}>
              <Feather name="refresh-ccw" size={14} color={colors.mutedForeground} />
              <Text style={[styles.resetText, { color: colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>New Assessment</Text>
            </TouchableOpacity>
          </Animated.View>
        )}
      </ScrollView>
    </View>
  );
}

function ToggleCard({ icon, title, subtitle, value, onToggle, activeColor, activeBg, activeBorder, colors }: any) {
  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onToggle}
      style={[styles.toggleCard, { backgroundColor: value ? activeBg : colors.card, borderColor: value ? activeBorder : colors.border, borderWidth: value ? 1.5 : 1 }]}>
      <View style={[styles.toggleIconWrap, { backgroundColor: value ? activeBorder : colors.secondary }]}>
        <MaterialCommunityIcons name={icon} size={20} color={value ? "#fff" : colors.mutedForeground} />
      </View>
      <View style={styles.toggleText}>
        <Text style={[styles.toggleTitle, { color: value ? activeColor : colors.foreground, fontFamily: "Inter_600SemiBold" }]}>{title}</Text>
        <Text style={[styles.toggleSub, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>{subtitle}</Text>
      </View>
      <View style={[styles.checkbox, { backgroundColor: value ? activeBorder : "transparent", borderColor: value ? activeBorder : colors.border }]}>
        {value && <Feather name="check" size={13} color="#fff" />}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: 20 },
  header: { flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 24 },
  logoWrap: { width: 52, height: 52, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 24, letterSpacing: -0.5 },
  headerSub: { fontSize: 13, marginTop: 1 },
  sectionLabel: { fontSize: 11, fontFamily: "Inter_600SemiBold", letterSpacing: 1.2, marginBottom: 10, marginLeft: 2 },
  toggleCard: { flexDirection: "row", alignItems: "center", borderRadius: 14, padding: 14, gap: 12, marginBottom: 0 },
  toggleIconWrap: { width: 38, height: 38, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  toggleText: { flex: 1 },
  toggleTitle: { fontSize: 14, marginBottom: 2 },
  toggleSub: { fontSize: 12, lineHeight: 16 },
  checkbox: { width: 24, height: 24, borderRadius: 7, borderWidth: 1.5, alignItems: "center", justifyContent: "center" },
  siteGrid: { flexDirection: "row", flexWrap: "wrap", borderRadius: 14, borderWidth: 1, padding: 6, gap: 6 },
  siteChip: { paddingHorizontal: 16, paddingVertical: 9, borderRadius: 9 },
  siteChipText: { fontSize: 14 },
  notesWrap: { borderRadius: 14, borderWidth: 1, padding: 14 },
  notesInput: { fontSize: 14, lineHeight: 22, minHeight: 90 },
  assessBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, borderRadius: 14, paddingVertical: 17, marginTop: 16, marginBottom: 20 },
  assessBtnText: { color: "#fff", fontSize: 16, letterSpacing: 0.2 },
  resultCard: { borderRadius: 16, borderWidth: 1.5, padding: 18, marginBottom: 14 },
  resultHeader: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8 },
  resultLabel: { fontSize: 14, letterSpacing: 0.3, flex: 1 },
  resultDesc: { fontSize: 14, lineHeight: 20, marginBottom: 12 },
  divider: { height: 1, opacity: 0.3, marginBottom: 12 },
  actionRow: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  actionText: { fontSize: 13, lineHeight: 19, flex: 1 },
  resetBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, borderRadius: 12, borderWidth: 1, paddingVertical: 12, marginBottom: 8 },
  resetText: { fontSize: 14 },
});
