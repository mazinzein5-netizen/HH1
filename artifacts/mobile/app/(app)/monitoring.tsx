import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import ThemedStatusBar from "@/components/ThemedStatusBar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import HoneycombWallpaper from "@/components/HoneycombWallpaper";
import { RedUpgradeCard, usePlanTier } from "@/components/RedTierGate";
import { useHiveBot } from "@/context/HiveBotContext";
import { useLogoTheme } from "@/context/LogoThemeContext";
import { usePatient } from "@/context/PatientContext";
import { useColors } from "@/hooks/useColors";

const ECG_HEIGHTS = [2, 2, 2, 3, 2, 2, 2, 14, 62, 5, 2, 20, 4, 2, 2, 2, 2, 2, 3, 2, 2, 2, 14, 62, 5, 2, 20, 4, 2, 2, 2];

const SLEEP_STAGES = [
  { label: "Awake", pct: 7, color: "#f97316", hours: "0h 30m" },
  { label: "REM", pct: 24, color: "#a78bfa", hours: "1h 36m" },
  { label: "Light", pct: 46, color: "#4F6EF7", hours: "3h 05m" },
  { label: "Deep", pct: 23, color: "#22c55e", hours: "1h 32m" },
];

const HR_LABELS = ["2a", "4a", "6a", "8a", "10a", "12p", "2p", "4p", "6p", "8p", "10p", "Now"];
const HR_HISTORY = [58, 62, 65, 72, 78, 88, 76, 72, 68, 70, 72, 74];

/** Clamp a number between min and max */
function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

/** Return a random delta within ±range, then clamp result */
function jitter(base: number, delta: number, min: number, max: number) {
  return clamp(base + (Math.random() * 2 - 1) * delta, min, max);
}

type DeviceName = "Apple Watch" | "Fitbit Sense" | "Garmin";

/** Animated glowing dot that pulses for "live" */
function PulseDot({ color }: { color: string }) {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(scale, { toValue: 1.5, duration: 700, useNativeDriver: true, easing: Easing.out(Easing.ease) }),
          Animated.timing(opacity, { toValue: 0.2, duration: 700, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(scale, { toValue: 1, duration: 700, useNativeDriver: true, easing: Easing.in(Easing.ease) }),
          Animated.timing(opacity, { toValue: 0.9, duration: 700, useNativeDriver: true }),
        ]),
      ])
    ).start();
  }, []);

  return (
    <Animated.View
      style={{
        width: 8, height: 8, borderRadius: 4,
        backgroundColor: color,
        transform: [{ scale }],
        opacity,
      }}
    />
  );
}

/** A live metric top card with a smoothly animating value */
function LiveTopCard({
  gradient,
  borderColor,
  icon,
  iconColor,
  value,
  unit,
  label,
}: {
  gradient: [string, string];
  borderColor: string;
  icon: string;
  iconColor: string;
  value: number;
  unit: string;
  label: string;
}) {
  const animVal = useRef(new Animated.Value(value)).current;
  const displayRef = useRef(value);
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    Animated.timing(animVal, {
      toValue: value,
      duration: 600,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();

    const id = animVal.addListener(({ value: v }) => {
      const rounded = Math.round(v);
      if (rounded !== displayRef.current) {
        displayRef.current = rounded;
        setDisplay(rounded);
      }
    });
    return () => animVal.removeListener(id);
  }, [value]);

  return (
    <LinearGradient colors={gradient} style={[styles.topCard, { borderColor }]}>
      <PulseDot color={iconColor} />
      <MaterialCommunityIcons name={icon as any} size={18} color={iconColor} />
      <Text style={[styles.topValue, { color: iconColor, fontFamily: "Inter_700Bold" }]}>{display}</Text>
      <Text style={[styles.topUnit, { color: "#888", fontFamily: "Inter_400Regular" }]}>{unit}</Text>
      <Text style={[styles.topLabel, { color: "#888", fontFamily: "Inter_400Regular" }]}>{label}</Text>
    </LinearGradient>
  );
}

export default function MonitoringScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { prefs } = useLogoTheme();
  const topPad = Platform.OS === "web" ? 0 : insets.top;
  const bottomPad = (Platform.OS === "web" ? 34 : insets.bottom) + 64 + 20;

  const [deviceName] = useState<DeviceName>("Apple Watch");
  const batteryPct = 78;

  const { data: patient } = usePatient();
  const { open: openBot } = useHiveBot();

  const activeMeds = patient.kardex.filter((k) => k.status === "active");
  const ANTICOAG_NAMES = ["apixaban","warfarin","rivaroxaban","dabigatran","edoxaban","heparin","tinzaparin","enoxaparin"];
  const anticoagMeds = activeMeds.filter((m) =>
    ANTICOAG_NAMES.some((n) => m.medication.toLowerCase().includes(n))
  );

  // ── Live fluctuating vitals ──────────────────────────────────────────────
  const [hr, setHr] = useState(72);
  const [spo2, setSpo2] = useState(97);
  const [rr, setRr] = useState(14);
  const [hrBars, setHrBars] = useState(HR_HISTORY);

  // ── Monitoring concern alert ─────────────────────────────────────────────
  const [monitoringAlert, setMonitoringAlert] = useState<{ type: "spo2" | "hr"; value: number } | null>(null);
  const [alertDismissed, setAlertDismissed] = useState(false);
  const alertFiredRef = useRef(false);

  useEffect(() => {
    if (alertDismissed || alertFiredRef.current) return;
    // Flag SpO₂ concern when patient is on anticoagulants (pulmonary embolism risk)
    if (spo2 < 96 && anticoagMeds.length > 0) {
      alertFiredRef.current = true;
      setMonitoringAlert({ type: "spo2", value: spo2 });
      return;
    }
    // Flag HR concern when patient is on any active medication
    if ((hr > 100 || hr < 56) && activeMeds.length > 0) {
      alertFiredRef.current = true;
      setMonitoringAlert({ type: "hr", value: hr });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spo2, hr]);

  function handleMonitoringAlertPress() {
    const seedText =
      monitoringAlert?.type === "spo2"
        ? `My Live HIVE monitor just showed my SpO₂ dropping to ${monitoringAlert.value}%. I'm currently on ${anticoagMeds.map((m) => m.medication).join(" and ")}. Should I be worried about this reading?`
        : `My Live HIVE monitor showed my heart rate at ${monitoringAlert?.value} bpm. I'm on ${activeMeds.map((m) => m.medication).join(", ")}. Is this something I should be concerned about with my medications?`;
    openBot(seedText);
  }

  useEffect(() => {
    const tick = () => {
      setHr((prev) => {
        const next = Math.round(jitter(prev, 3, 55, 105));
        setHrBars((bars) => [...bars.slice(1), next]);
        return next;
      });
      setSpo2((prev) => Math.round(jitter(prev, 0.8, 94, 100)));
      setRr((prev) => Math.round(jitter(prev, 1, 10, 22)));
    };

    const id = setInterval(tick, 2000);
    return () => clearInterval(id);
  }, []);

  const hrMax = Math.max(...hrBars);
  const hrMin = Math.min(...hrBars);
  const tier = usePlanTier();

  // Live monitoring is part of the Red Geriatric Safety Pack.
  if (tier !== "red") {
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <ThemedStatusBar />
        <HoneycombWallpaper density={prefs.density} />
        <View style={[styles.header, { paddingTop: topPad + 12, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
          {router.canGoBack() && (
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
              <Feather name="arrow-left" size={20} color={colors.foreground} />
            </TouchableOpacity>
          )}
          <View style={{ flex: 1 }}>
            <Text style={[styles.headerTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
              Live HIVE
            </Text>
            <Text style={[styles.headerSub, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              Live wearable monitoring
            </Text>
          </View>
          <MaterialCommunityIcons name="heart-pulse" size={26} color="#E5294E" />
        </View>
        {tier === null ? null : (
          <RedUpgradeCard blurb="Live heart-rate, sleep and wearable monitoring is included with the Red Geriatric Safety Pack — the complete elder-care membership." />
        )}
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ThemedStatusBar />
      <HoneycombWallpaper density={prefs.density} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 12, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        {router.canGoBack() && (
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
            <Feather name="arrow-left" size={20} color={colors.foreground} />
          </TouchableOpacity>
        )}
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
            Live HIVE
          </Text>
          <Text style={[styles.headerSub, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
            {deviceName} · Battery {batteryPct}%
          </Text>
        </View>
        <View style={[styles.liveBadge, { backgroundColor: "#0a2818", borderColor: "#22c55e44" }]}>
          <PulseDot color="#22c55e" />
          <Text style={[styles.liveBadgeText, { color: "#22c55e", fontFamily: "Inter_600SemiBold" }]}>LIVE</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: bottomPad }]} showsVerticalScrollIndicator={false}>

        {/* ── TOP METRICS ROW — LIVE ── */}
        <View style={styles.topRow}>
          <LiveTopCard
            gradient={["#1a0818", "#2a0f22"]}
            borderColor={colors.accent + "55"}
            icon="heart-pulse"
            iconColor={colors.accent}
            value={hr}
            unit="bpm"
            label="Heart Rate"
          />
          <LiveTopCard
            gradient={["#0f1840", "#172060"]}
            borderColor={colors.primary + "55"}
            icon="water-percent"
            iconColor={colors.primary}
            value={spo2}
            unit="%"
            label="SpO₂"
          />
          <LiveTopCard
            gradient={["#071a10", "#0a2818"]}
            borderColor="#22c55e55"
            icon="lungs"
            iconColor="#22c55e"
            value={rr}
            unit="rpm"
            label="Resp Rate"
          />
        </View>

        {/* ── Monitoring concern alert — shown when vitals trigger med-related flag ── */}
        {monitoringAlert && !alertDismissed && (
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleMonitoringAlertPress}
            style={[styles.monAlert, { backgroundColor: "rgba(217,119,6,0.08)", borderColor: "#d97706" }]}
          >
            <View style={[styles.monAlertIcon, { backgroundColor: "rgba(217,119,6,0.18)" }]}>
              <MaterialCommunityIcons name="alert-circle" size={20} color="#d97706" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.monAlertTitle, { color: "#d97706", fontFamily: "Inter_700Bold" }]}>
                {monitoringAlert.type === "spo2" ? "⚠️ SpO₂ Concern" : "⚠️ Heart Rate Concern"}
              </Text>
              <Text style={[styles.monAlertBody, { color: colors.foreground, fontFamily: "Inter_400Regular" }]}>
                {monitoringAlert.type === "spo2"
                  ? `SpO₂ reading of ${monitoringAlert.value}% noted — relevant given your blood thinner medication. Tap to ask Sarah.`
                  : `Heart rate of ${monitoringAlert.value} bpm noted with your current medications. Tap to ask Sarah.`}
              </Text>
            </View>
            <View style={styles.monAlertBeeCol}>
              <MaterialCommunityIcons name="bee" size={20} color="#d97706" />
              <Text style={[styles.monAlertAsk, { color: "#d97706", fontFamily: "Inter_600SemiBold" }]}>Ask Sarah</Text>
            </View>
            <TouchableOpacity
              hitSlop={10}
              style={{ padding: 4 }}
              onPress={() => setAlertDismissed(true)}
            >
              <MaterialCommunityIcons name="close" size={15} color={colors.mutedForeground} />
            </TouchableOpacity>
          </TouchableOpacity>
        )}

        {/* ── HEART RATE GRAPH — live bars ── */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="heart-pulse" size={18} color={colors.accent} />
            <Text style={[styles.cardTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>Heart Rate — Today</Text>
          </View>
          <View style={styles.hrStatRow}>
            {[
              { label: "Resting", val: `${hrMin}` },
              { label: "Current", val: `${hr}` },
              { label: "Max", val: `${hrMax}` },
            ].map((s) => (
              <View key={s.label} style={styles.hrStat}>
                <Text style={[styles.hrStatVal, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>{s.val}</Text>
                <Text style={[styles.hrStatLabel, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>{s.label}</Text>
              </View>
            ))}
          </View>
          <View style={styles.barChart}>
            {hrBars.map((h, i) => {
              const isNow = i === hrBars.length - 1;
              const barH = Math.round(Math.max(4, (h / 110) * 60));
              return (
                <View key={i} style={styles.barWrap}>
                  <View style={[styles.bar, {
                    height: barH,
                    backgroundColor: isNow ? colors.accent : colors.primary + "88",
                  }]} />
                  <Text style={[styles.barLabel, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>{HR_LABELS[i]}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* ── SpO2 DETAIL — live ── */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="water-percent" size={18} color={colors.primary} />
            <Text style={[styles.cardTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>Oxygen Saturation (SpO₂)</Text>
          </View>
          <View style={styles.spo2Row}>
            <View style={[styles.spo2Gauge, { borderColor: spo2 >= 95 ? colors.primary : "#f97316" }]}>
              <Text style={[styles.spo2Value, { color: spo2 >= 95 ? colors.primary : "#f97316", fontFamily: "Inter_700Bold" }]}>{spo2}%</Text>
              <Text style={[styles.spo2Sub, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>SpO₂</Text>
            </View>
            <View style={styles.spo2Detail}>
              {[
                { label: "Status", val: spo2 >= 95 ? "Normal (95–100%)" : "Low — See GP", color: spo2 >= 95 ? "#22c55e" : "#f97316" },
                { label: "Last Measured", val: "Live", color: "#22c55e" },
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

        {/* ── RESPIRATORY RATE — live ── */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="lungs" size={18} color="#22c55e" />
            <Text style={[styles.cardTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>Respiratory Rate</Text>
            <View style={[styles.rhythmBadge, { backgroundColor: "#0a2818", borderColor: "#22c55e44" }]}>
              <Text style={[styles.rhythmText, { color: "#22c55e", fontFamily: "Inter_600SemiBold" }]}>
                {rr >= 12 && rr <= 20 ? "Normal" : rr < 12 ? "Low" : "Elevated"}
              </Text>
            </View>
          </View>
          <View style={styles.rrRow}>
            <View style={styles.rrGaugeWrap}>
              <Text style={[styles.rrValue, { color: "#22c55e", fontFamily: "Inter_700Bold" }]}>{rr}</Text>
              <Text style={[styles.rrUnit, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>breaths/min</Text>
            </View>
            <View style={styles.spo2Detail}>
              {[
                { label: "Normal Range", val: "12–20 rpm", color: colors.foreground },
                { label: "Status", val: rr >= 12 && rr <= 20 ? "Normal" : rr < 12 ? "Low" : "Elevated", color: rr >= 12 && rr <= 20 ? "#22c55e" : "#f97316" },
                { label: "Trend", val: "Stable", color: colors.foreground },
              ].map((r) => (
                <View key={r.label} style={styles.spo2Row2}>
                  <Text style={[styles.spo2Key, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>{r.label}</Text>
                  <Text style={[styles.spo2Val, { color: r.color, fontFamily: "Inter_600SemiBold" }]}>{r.val}</Text>
                </View>
              ))}
            </View>
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
              { label: "Heart Rate", val: `${hr} bpm` },
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

        {/* ── OTHER VITALS ── */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="stethoscope" size={18} color={colors.primary} />
            <Text style={[styles.cardTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>Other Vital Signs</Text>
          </View>
          {[
            { label: "Respiratory Rate", val: `${rr} rpm`, status: rr >= 12 && rr <= 20 ? "Normal" : rr < 12 ? "Low" : "Elevated", color: rr >= 12 && rr <= 20 ? "#22c55e" : "#f97316" },
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
  liveBadge: { flexDirection: "row", alignItems: "center", gap: 6, borderRadius: 12, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 5 },
  liveBadgeText: { fontSize: 11, letterSpacing: 0.5 },
  scroll: { padding: 16, gap: 14 },
  topRow: { flexDirection: "row", gap: 10 },
  topCard: { flex: 1, borderRadius: 14, borderWidth: 1, padding: 10, gap: 3, alignItems: "center" },
  topValue: { fontSize: 28, lineHeight: 34 },
  topUnit: { fontSize: 11 },
  topLabel: { fontSize: 10, marginTop: 2, textAlign: "center" },
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
  rrRow: { flexDirection: "row", alignItems: "center", gap: 16 },
  rrGaugeWrap: { alignItems: "center", justifyContent: "center", width: 90 },
  rrValue: { fontSize: 42, lineHeight: 48, letterSpacing: -1 },
  rrUnit: { fontSize: 10, textAlign: "center" },
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

  // ── Monitoring concern alert ──
  monAlert: { flexDirection: "row", alignItems: "center", gap: 10, borderRadius: 14, borderWidth: 1.5, padding: 12 },
  monAlertIcon: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  monAlertTitle: { fontSize: 12.5, marginBottom: 2 },
  monAlertBody: { fontSize: 12, lineHeight: 18 },
  monAlertBeeCol: { alignItems: "center", gap: 3, paddingHorizontal: 6 },
  monAlertAsk: { fontSize: 9.5 },
});
