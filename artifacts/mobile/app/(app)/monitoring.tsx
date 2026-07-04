import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState } from "react";
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
import HoneycombWallpaper from "@/components/HoneycombWallpaper";
import { useLogoTheme } from "@/context/LogoThemeContext";
import { useColors } from "@/hooks/useColors";

const HR_BARS = [58, 62, 65, 72, 78, 88, 76, 72, 68, 70, 72, 74];
const HR_LABELS = ["2a", "4a", "6a", "8a", "10a", "12p", "2p", "4p", "6p", "8p", "10p", "Now"];

const ECG_HEIGHTS = [2, 2, 2, 3, 2, 2, 2, 14, 62, 5, 2, 20, 4, 2, 2, 2, 2, 2, 3, 2, 2, 2, 14, 62, 5, 2, 20, 4, 2, 2, 2];

const SLEEP_STAGES = [
  { label: "Awake", pct: 7, color: "#f97316", hours: "0h 30m" },
  { label: "REM", pct: 24, color: "#a78bfa", hours: "1h 36m" },
  { label: "Light", pct: 46, color: "#4F6EF7", hours: "3h 05m" },
  { label: "Deep", pct: 23, color: "#22c55e", hours: "1h 32m" },
];

type DeviceName = "Apple Watch" | "Fitbit Sense" | "Garmin";

export default function MonitoringScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { prefs } = useLogoTheme();
  const topPad = Platform.OS === "web" ? 0 : insets.top;

  const [deviceName] = useState<DeviceName>("Apple Watch");
  const batteryPct = 78;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      <HoneycombWallpaper density={prefs.density} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 12, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <Feather name="arrow-left" size={20} color={colors.foreground} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
            Health Monitoring
          </Text>
          <Text style={[styles.headerSub, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
            {deviceName} · Battery {batteryPct}%
          </Text>
        </View>
        <View style={[styles.liveBadge, { backgroundColor: "#0a2818", borderColor: "#22c55e44" }]}>
          <View style={styles.liveDot} />
          <Text style={[styles.liveBadgeText, { color: "#22c55e", fontFamily: "Inter_600SemiBold" }]}>LIVE</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── TOP METRICS ROW ── */}
        <View style={styles.topRow}>
          <LinearGradient colors={["#1a0818", "#2a0f22"]} style={[styles.topCard, { borderColor: colors.accent + "44" }]}>
            <MaterialCommunityIcons name="heart-pulse" size={18} color={colors.accent} />
            <Text style={[styles.topValue, { color: colors.accent, fontFamily: "Inter_700Bold" }]}>72</Text>
            <Text style={[styles.topUnit, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>bpm</Text>
            <Text style={[styles.topLabel, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>Heart Rate</Text>
          </LinearGradient>

          <LinearGradient colors={["#0f1840", "#172060"]} style={[styles.topCard, { borderColor: colors.primary + "44" }]}>
            <MaterialCommunityIcons name="water-percent" size={18} color={colors.primary} />
            <Text style={[styles.topValue, { color: colors.primary, fontFamily: "Inter_700Bold" }]}>97</Text>
            <Text style={[styles.topUnit, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>%</Text>
            <Text style={[styles.topLabel, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>SpO₂</Text>
          </LinearGradient>

          <LinearGradient colors={["#1a1200", "#2a1e00"]} style={[styles.topCard, { borderColor: colors.gold + "44" }]}>
            <MaterialCommunityIcons name="head-dots-horizontal" size={18} color={colors.gold} />
            <Text style={[styles.topValue, { color: colors.gold, fontFamily: "Inter_700Bold" }]}>32</Text>
            <Text style={[styles.topUnit, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>/100</Text>
            <Text style={[styles.topLabel, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>Stress</Text>
          </LinearGradient>
        </View>

        {/* ── HEART RATE GRAPH ── */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="heart-pulse" size={18} color={colors.accent} />
            <Text style={[styles.cardTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>Heart Rate — Today</Text>
          </View>
          <View style={styles.hrStatRow}>
            {[{ label: "Resting", val: "58" }, { label: "Current", val: "72" }, { label: "Max", val: "94" }].map((s) => (
              <View key={s.label} style={styles.hrStat}>
                <Text style={[styles.hrStatVal, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>{s.val}</Text>
                <Text style={[styles.hrStatLabel, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>{s.label}</Text>
              </View>
            ))}
          </View>
          <View style={styles.barChart}>
            {HR_BARS.map((h, i) => {
              const isNow = i === HR_BARS.length - 1;
              const barH = Math.round((h / 100) * 60);
              return (
                <View key={i} style={styles.barWrap}>
                  <View style={[styles.bar, { height: barH, backgroundColor: isNow ? colors.accent : colors.primary + "88" }]} />
                  <Text style={[styles.barLabel, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>{HR_LABELS[i]}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* ── SpO2 DETAIL ── */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="water-percent" size={18} color={colors.primary} />
            <Text style={[styles.cardTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>Oxygen Saturation (SpO₂)</Text>
          </View>
          <View style={styles.spo2Row}>
            <View style={[styles.spo2Gauge, { borderColor: colors.primary }]}>
              <Text style={[styles.spo2Value, { color: colors.primary, fontFamily: "Inter_700Bold" }]}>97%</Text>
              <Text style={[styles.spo2Sub, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>SpO₂</Text>
            </View>
            <View style={styles.spo2Detail}>
              {[
                { label: "Status", val: "Normal (95–100%)", color: "#22c55e" },
                { label: "Last Measured", val: "2 minutes ago", color: colors.foreground },
                { label: "Average (24h)", val: "96.8%", color: colors.foreground },
                { label: "Lowest (sleep)", val: "94%", color: colors.gold },
              ].map((r) => (
                <View key={r.label} style={styles.spo2Row2}>
                  <Text style={[styles.spo2Key, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>{r.label}</Text>
                  <Text style={[styles.spo2Val, { color: r.color, fontFamily: "Inter_600SemiBold" }]}>{r.val}</Text>
                </View>
              ))}
            </View>
          </View>
          <View style={[styles.noteBox, { backgroundColor: colors.glassPrimary, borderColor: colors.glassPrimaryBorder }]}>
            <MaterialCommunityIcons name="information" size={14} color={colors.primary} />
            <Text style={[styles.noteText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              SpO₂ below 90% requires immediate medical attention. Consult your GP if readings are consistently below 95%.
            </Text>
          </View>
        </View>

        {/* ── ECG ── */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="pulse" size={18} color="#22c55e" />
            <Text style={[styles.cardTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>ECG — Last Recording</Text>
            <View style={[styles.rhythmBadge, { backgroundColor: "#0a2818", borderColor: "#22c55e44" }]}>
              <Text style={[styles.rhythmText, { color: "#22c55e", fontFamily: "Inter_600SemiBold" }]}>Normal Sinus</Text>
            </View>
          </View>
          <View style={styles.ecgWave}>
            {ECG_HEIGHTS.map((h, i) => (
              <View
                key={i}
                style={[styles.ecgBar, {
                  height: Math.max(2, h),
                  backgroundColor: h > 40 ? "#22c55e" : h > 10 ? "#22c55e88" : "#22c55e33",
                }]}
              />
            ))}
          </View>
          <View style={styles.ecgMetrics}>
            {[
              { label: "Heart Rate", val: "72 bpm" },
              { label: "QRS Duration", val: "82 ms" },
              { label: "PR Interval", val: "156 ms" },
              { label: "QT Interval", val: "388 ms" },
            ].map((m) => (
              <View key={m.label} style={[styles.ecgMetric, { backgroundColor: colors.cardElevated, borderColor: colors.border }]}>
                <Text style={[styles.ecgMetricVal, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>{m.val}</Text>
                <Text style={[styles.ecgMetricLabel, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>{m.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── SLEEP ANALYSIS ── */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="sleep" size={18} color="#a78bfa" />
            <Text style={[styles.cardTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>Sleep Analysis — Last Night</Text>
          </View>
          <View style={styles.sleepSummary}>
            <View>
              <Text style={[styles.sleepTotal, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>6h 43m</Text>
              <Text style={[styles.sleepSub, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>Total Sleep</Text>
            </View>
            <View style={[styles.sleepScoreBadge, { backgroundColor: "rgba(167,139,250,0.15)", borderColor: "rgba(167,139,250,0.3)" }]}>
              <Text style={[styles.sleepScore, { color: "#a78bfa", fontFamily: "Inter_700Bold" }]}>78</Text>
              <Text style={[styles.sleepScoreLabel, { color: "#a78bfa", fontFamily: "Inter_400Regular" }]}>/ 100</Text>
            </View>
          </View>
          <View style={styles.sleepBar}>
            {SLEEP_STAGES.map((s) => (
              <View key={s.label} style={[styles.sleepSegment, { flex: s.pct, backgroundColor: s.color }]} />
            ))}
          </View>
          <View style={styles.stageGrid}>
            {SLEEP_STAGES.map((s) => (
              <View key={s.label} style={styles.stageItem}>
                <View style={[styles.stageDot, { backgroundColor: s.color }]} />
                <View>
                  <Text style={[styles.stageLabel, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>{s.label}</Text>
                  <Text style={[styles.stageHours, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>{s.hours}</Text>
                </View>
              </View>
            ))}
          </View>
          <View style={styles.sleepExtra}>
            {[
              { label: "Sleep Efficiency", val: "82%" },
              { label: "Bedtime", val: "11:18 PM" },
              { label: "Wake Time", val: "6:01 AM" },
              { label: "Interruptions", val: "2 times" },
            ].map((r) => (
              <View key={r.label} style={styles.sleepRow}>
                <Text style={[styles.sleepKey, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>{r.label}</Text>
                <Text style={[styles.sleepVal, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>{r.val}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── STRESS & HRV ── */}
        <View style={styles.twoCol}>
          <View style={[styles.halfCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <MaterialCommunityIcons name="head-dots-horizontal" size={20} color={colors.gold} />
            <Text style={[styles.halfTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>Stress Level</Text>
            <Text style={[styles.halfValue, { color: colors.gold, fontFamily: "Inter_700Bold" }]}>32</Text>
            <Text style={[styles.halfUnit, { color: "#22c55e", fontFamily: "Inter_600SemiBold" }]}>Low Stress</Text>
            <View style={[styles.miniBar, { backgroundColor: colors.cardElevated }]}>
              <View style={[styles.miniFill, { width: "32%", backgroundColor: colors.gold }]} />
            </View>
          </View>

          <View style={[styles.halfCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <MaterialCommunityIcons name="heart-multiple" size={20} color="#a78bfa" />
            <Text style={[styles.halfTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>HRV</Text>
            <Text style={[styles.halfValue, { color: "#a78bfa", fontFamily: "Inter_700Bold" }]}>42</Text>
            <Text style={[styles.halfUnit, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>ms — Normal</Text>
            <View style={[styles.miniBar, { backgroundColor: colors.cardElevated }]}>
              <View style={[styles.miniFill, { width: "58%", backgroundColor: "#a78bfa" }]} />
            </View>
          </View>
        </View>

        {/* ── METABOLISM ── */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="fire" size={18} color="#f97316" />
            <Text style={[styles.cardTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>Metabolism & Calories</Text>
          </View>
          <View style={styles.metaGrid}>
            {[
              { label: "Active Calories", val: "342 kcal", icon: "run", color: "#f97316" },
              { label: "BMR (Resting)", val: "1,680 kcal", icon: "bed", color: colors.primary },
              { label: "Total Expenditure", val: "2,022 kcal", icon: "sigma", color: "#22c55e" },
              { label: "Steps Today", val: "3,240", icon: "shoe-sneaker", color: colors.gold },
            ].map((m) => (
              <View key={m.label} style={[styles.metaCard, { backgroundColor: colors.cardElevated, borderColor: colors.border }]}>
                <MaterialCommunityIcons name={m.icon as any} size={18} color={m.color} />
                <Text style={[styles.metaVal, { color: m.color, fontFamily: "Inter_700Bold" }]}>{m.val}</Text>
                <Text style={[styles.metaLabel, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>{m.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── VITALS ── */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="stethoscope" size={18} color={colors.primary} />
            <Text style={[styles.cardTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>Other Vital Signs</Text>
          </View>
          {[
            { label: "Respiratory Rate", val: "14 rpm", status: "Normal", color: "#22c55e" },
            { label: "Body Temperature", val: "36.6 °C", status: "Normal", color: "#22c55e" },
            { label: "Blood Pressure (est.)", val: "128 / 78 mmHg", status: "Normal", color: "#22c55e" },
            { label: "Body Battery", val: "68 / 100", status: "Good", color: colors.gold },
          ].map((v, i) => (
            <View key={v.label} style={[styles.vitalRow, i > 0 && { borderTopWidth: 1, borderTopColor: colors.border }]}>
              <Text style={[styles.vitalLabel, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>{v.label}</Text>
              <View style={{ alignItems: "flex-end" }}>
                <Text style={[styles.vitalVal, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>{v.val}</Text>
                <Text style={[styles.vitalStatus, { color: v.color, fontFamily: "Inter_400Regular" }]}>{v.status}</Text>
              </View>
            </View>
          ))}
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", gap: 14, paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 1 },
  backBtn: { padding: 6 },
  headerTitle: { fontSize: 17, letterSpacing: -0.3 },
  headerSub: { fontSize: 11, marginTop: 2 },
  liveBadge: { flexDirection: "row", alignItems: "center", gap: 5, borderRadius: 12, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 5 },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: "#22c55e" },
  liveBadgeText: { fontSize: 11, letterSpacing: 0.5 },
  scroll: { padding: 16, gap: 14, paddingBottom: 60 },
  topRow: { flexDirection: "row", gap: 10 },
  topCard: { flex: 1, borderRadius: 14, borderWidth: 1, padding: 14, gap: 2, alignItems: "center" },
  topValue: { fontSize: 30, lineHeight: 36 },
  topUnit: { fontSize: 11 },
  topLabel: { fontSize: 10, marginTop: 2 },
  card: { borderRadius: 18, borderWidth: 1, padding: 16, gap: 14 },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
  cardTitle: { fontSize: 15, flex: 1 },
  rhythmBadge: { borderRadius: 10, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 4 },
  rhythmText: { fontSize: 11 },
  hrStatRow: { flexDirection: "row", justifyContent: "space-around" },
  hrStat: { alignItems: "center", gap: 2 },
  hrStatVal: { fontSize: 22 },
  hrStatLabel: { fontSize: 11 },
  barChart: { flexDirection: "row", alignItems: "flex-end", gap: 4, height: 70 },
  barWrap: { flex: 1, alignItems: "center", gap: 4 },
  bar: { width: "100%", borderRadius: 3, minHeight: 4 },
  barLabel: { fontSize: 8 },
  spo2Row: { flexDirection: "row", alignItems: "flex-start", gap: 16 },
  spo2Gauge: { width: 90, height: 90, borderRadius: 45, borderWidth: 4, alignItems: "center", justifyContent: "center" },
  spo2Value: { fontSize: 24 },
  spo2Sub: { fontSize: 11 },
  spo2Detail: { flex: 1, gap: 8 },
  spo2Row2: { flexDirection: "row", justifyContent: "space-between" },
  spo2Key: { fontSize: 12 },
  spo2Val: { fontSize: 12 },
  noteBox: { flexDirection: "row", alignItems: "flex-start", gap: 8, borderRadius: 10, borderWidth: 1, padding: 10 },
  noteText: { fontSize: 11, lineHeight: 17, flex: 1 },
  ecgWave: { flexDirection: "row", alignItems: "center", gap: 2, height: 70, overflow: "hidden" },
  ecgBar: { flex: 1, borderRadius: 1, maxWidth: 5 },
  ecgMetrics: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  ecgMetric: { flex: 1, minWidth: "45%", borderRadius: 10, borderWidth: 1, padding: 10, alignItems: "center" },
  ecgMetricVal: { fontSize: 14 },
  ecgMetricLabel: { fontSize: 10, marginTop: 2 },
  sleepSummary: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  sleepTotal: { fontSize: 30, letterSpacing: -1 },
  sleepSub: { fontSize: 12 },
  sleepScoreBadge: { borderRadius: 14, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 10, flexDirection: "row", alignItems: "baseline", gap: 2 },
  sleepScore: { fontSize: 28 },
  sleepScoreLabel: { fontSize: 14 },
  sleepBar: { flexDirection: "row", height: 10, borderRadius: 5, overflow: "hidden", gap: 1 },
  sleepSegment: { borderRadius: 3 },
  stageGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  stageItem: { flexDirection: "row", alignItems: "center", gap: 8, width: "47%" },
  stageDot: { width: 10, height: 10, borderRadius: 5 },
  stageLabel: { fontSize: 11 },
  stageHours: { fontSize: 13 },
  sleepExtra: { gap: 8 },
  sleepRow: { flexDirection: "row", justifyContent: "space-between" },
  sleepKey: { fontSize: 13 },
  sleepVal: { fontSize: 13 },
  twoCol: { flexDirection: "row", gap: 12 },
  halfCard: { flex: 1, borderRadius: 16, borderWidth: 1, padding: 14, gap: 6 },
  halfTitle: { fontSize: 13 },
  halfValue: { fontSize: 36, letterSpacing: -1 },
  halfUnit: { fontSize: 12 },
  miniBar: { height: 5, borderRadius: 3, overflow: "hidden", marginTop: 4 },
  miniFill: { height: 5, borderRadius: 3 },
  metaGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  metaCard: { width: "47%", borderRadius: 12, borderWidth: 1, padding: 12, gap: 4 },
  metaVal: { fontSize: 16 },
  metaLabel: { fontSize: 11 },
  vitalRow: { paddingVertical: 10, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  vitalLabel: { fontSize: 13 },
  vitalVal: { fontSize: 14 },
  vitalStatus: { fontSize: 11, marginTop: 1 },
});
