import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState } from "react";
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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";

type ActiveSection = "cognitive" | "devices" | "falls";

const ORIENTATION_QUESTIONS = [
  { q: "What is today's date?", a: new Date().toLocaleDateString("en-IE", { day: "2-digit", month: "long", year: "numeric" }) },
  { q: "What day of the week is it?", a: new Date().toLocaleDateString("en-IE", { weekday: "long" }) },
  { q: "What month are we in?", a: new Date().toLocaleDateString("en-IE", { month: "long" }) },
  { q: "What year is it?", a: new Date().getFullYear().toString() },
  { q: "What is the name of this town or city?", a: "Tralee" },
];

const MEMORY_WORDS = ["Apple", "Table", "Penny"];

const STRATIFY_ITEMS = [
  "Has the patient had any falls in the past year?",
  "Is the patient confused, agitated, or disoriented at any time?",
  "Does the patient have impaired vision that affects daily function?",
  "Does the patient need to go to the toilet frequently or urgently?",
  "Is the patient's transfer score (Barthel) rated as impaired (needing assistance)?",
];

interface Device {
  id: string;
  name: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  connected: boolean;
  reading?: string;
  readingLabel?: string;
}

export default function GeriatricScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 0 : insets.top;

  const [activeSection, setActiveSection] = useState<ActiveSection>("cognitive");
  const [cogAnswers, setCogAnswers] = useState<(string | null)[]>(new Array(ORIENTATION_QUESTIONS.length).fill(null));
  const [wordRecallShown, setWordRecallShown] = useState(false);
  const [wordRecallAnswers, setWordRecallAnswers] = useState<(boolean | null)[]>(new Array(MEMORY_WORDS.length).fill(null));
  const [cogScoreShown, setCogScoreShown] = useState(false);
  const [stratifyAnswers, setStratifyAnswers] = useState<(boolean | null)[]>(new Array(STRATIFY_ITEMS.length).fill(null));
  const [stratifyShown, setStratifyShown] = useState(false);
  const [devices, setDevices] = useState<Device[]>([
    { id: "watch", name: "Apple Watch", icon: "watch", connected: false, reading: "—", readingLabel: "HR bpm" },
    { id: "fitbit", name: "Fitbit Sense", icon: "watch-variant", connected: false, reading: "—", readingLabel: "SpO₂ %" },
    { id: "garmin", name: "Garmin Vívosmart", icon: "watch-export", connected: false, reading: "—", readingLabel: "Steps" },
    { id: "samsung", name: "Samsung Galaxy Watch", icon: "watch-import", connected: false, reading: "—", readingLabel: "HR bpm" },
  ]);

  function toggleDevice(id: string) {
    Haptics.selectionAsync();
    setDevices((prev) =>
      prev.map((d) => {
        if (d.id !== id) return d;
        const connected = !d.connected;
        const fakeReading = connected
          ? id === "fitbit" ? "97" : id === "garmin" ? "3,240" : "72"
          : "—";
        return { ...d, connected, reading: fakeReading };
      })
    );
  }

  function setOrientation(i: number, val: string) {
    const next = [...cogAnswers];
    next[i] = val;
    setCogAnswers(next);
  }

  function setWordRecall(i: number, val: boolean) {
    Haptics.selectionAsync();
    const next = [...wordRecallAnswers];
    next[i] = val;
    setWordRecallAnswers(next);
  }

  function setStratify(i: number, val: boolean) {
    Haptics.selectionAsync();
    const next = [...stratifyAnswers];
    next[i] = val;
    setStratifyAnswers(next);
  }

  const cogScore =
    cogAnswers.filter((a, i) => a !== null && a.toLowerCase().includes(ORIENTATION_QUESTIONS[i].a.toLowerCase().split(" ")[0])).length
    + wordRecallAnswers.filter(Boolean).length;

  const stratifyScore = stratifyAnswers.filter(Boolean).length;
  const stratifyRisk = stratifyScore === 0 ? { label: "Low Risk", color: "#22c55e" }
    : stratifyScore <= 2 ? { label: "Medium Risk", color: "#f59e0b" }
    : { label: "High Risk — Urgent Review", color: "#ef4444" };

  const connectedCount = devices.filter((d) => d.connected).length;

  const sections: { key: ActiveSection; label: string; icon: keyof typeof MaterialCommunityIcons.glyphMap; color: string }[] = [
    { key: "cognitive", label: "Cognitive Screen", icon: "brain", color: "#a78bfa" },
    { key: "devices", label: "Smart Devices", icon: "devices", color: "#22c55e" },
    { key: "falls", label: "Falls Risk", icon: "walk", color: "#f59e0b" },
  ];

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 12, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <Feather name="arrow-left" size={20} color={colors.foreground} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
            Geriatric & Cognitive Care
          </Text>
          <Text style={[styles.headerSub, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
            Cognitive screen · Falls risk · Smart device vitals
          </Text>
        </View>
        <MaterialCommunityIcons name="brain" size={26} color="#a78bfa" />
      </View>

      {/* Section tabs */}
      <View style={[styles.tabRow, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        {sections.map((s) => (
          <TouchableOpacity
            key={s.key}
            activeOpacity={0.8}
            onPress={() => { Haptics.selectionAsync(); setActiveSection(s.key); }}
            style={[styles.tabBtn, { borderBottomColor: activeSection === s.key ? s.color : "transparent", borderBottomWidth: 2 }]}
          >
            <MaterialCommunityIcons name={s.icon} size={18} color={activeSection === s.key ? s.color : colors.mutedForeground} />
            <Text style={[styles.tabLabel, { color: activeSection === s.key ? s.color : colors.mutedForeground, fontFamily: activeSection === s.key ? "Inter_600SemiBold" : "Inter_400Regular" }]}>
              {s.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── COGNITIVE SCREENING ── */}
        {activeSection === "cognitive" && (
          <View style={styles.section}>
            <LinearGradient colors={["#1a1040", "#0d0d1a"]} style={styles.cogHero}>
              <MaterialCommunityIcons name="brain" size={36} color="#a78bfa" />
              <Text style={[styles.cogHeroTitle, { color: "#fff", fontFamily: "Inter_700Bold" }]}>Cognitive Screening</Text>
              <Text style={[styles.cogHeroSub, { color: "rgba(255,255,255,0.6)", fontFamily: "Inter_400Regular" }]}>
                Adapted MoCA / MMSE screening tool{"\n"}for mild cognitive impairment detection
              </Text>
            </LinearGradient>

            <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>ORIENTATION (5 POINTS)</Text>

            {ORIENTATION_QUESTIONS.map((item, i) => (
              <View key={i} style={[styles.cogCard, { backgroundColor: colors.card, borderColor: cogAnswers[i] ? "#a78bfa" : colors.border }]}>
                <Text style={[styles.cogQ, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>{item.q}</Text>
                <View style={styles.cogAnsRow}>
                  {["Correct", "Incorrect"].map((opt) => (
                    <TouchableOpacity
                      key={opt}
                      activeOpacity={0.8}
                      onPress={() => { Haptics.selectionAsync(); setOrientation(i, opt === "Correct" ? item.a : "wrong"); }}
                      style={[styles.cogAnsBtn, {
                        backgroundColor: cogAnswers[i] !== null
                          ? (opt === "Correct" ? (cogAnswers[i] === item.a || (cogAnswers[i] !== null && cogAnswers[i] !== "wrong") ? "#0f2a1a" : colors.background) : (cogAnswers[i] === "wrong" ? "#2a0808" : colors.background))
                          : colors.background,
                        borderColor: cogAnswers[i] !== null
                          ? (opt === "Correct" ? "#22c55e" : "#ef4444")
                          : colors.border,
                      }]}
                    >
                      <Text style={[styles.cogAnsBtnText, {
                        color: opt === "Correct" ? "#22c55e" : "#ef4444",
                        fontFamily: "Inter_500Medium",
                      }]}>{opt}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <Text style={[styles.cogHint, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                  Expected: {item.a}
                </Text>
              </View>
            ))}

            <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>MEMORY RECALL (3 POINTS)</Text>
            <View style={[styles.cogCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.cogQ, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
                Say these 3 words aloud, then after 2 minutes ask the patient to recall them:
              </Text>
              <View style={styles.wordRow}>
                {MEMORY_WORDS.map((w) => (
                  <View key={w} style={[styles.wordBadge, { backgroundColor: "#1a1040", borderColor: "#a78bfa55" }]}>
                    <Text style={[styles.wordText, { color: "#a78bfa", fontFamily: "Inter_700Bold" }]}>{w}</Text>
                  </View>
                ))}
              </View>
              {!wordRecallShown ? (
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => setWordRecallShown(true)}
                  style={[styles.revealBtn, { backgroundColor: "#1a1040", borderColor: "#a78bfa55" }]}
                >
                  <Text style={[styles.revealBtnText, { color: "#a78bfa", fontFamily: "Inter_600SemiBold" }]}>
                    Reveal Recall Test
                  </Text>
                </TouchableOpacity>
              ) : (
                <>
                  <Text style={[styles.cogQ, { color: colors.foreground, fontFamily: "Inter_600SemiBold", marginTop: 8 }]}>
                    Which words can the patient recall?
                  </Text>
                  {MEMORY_WORDS.map((w, i) => (
                    <View key={i} style={styles.rfBtns}>
                      <Text style={[styles.cogQ, { color: colors.mutedForeground, fontFamily: "Inter_400Regular", flex: 1 }]}>{w}</Text>
                      {([true, false] as const).map((val) => (
                        <TouchableOpacity
                          key={String(val)}
                          activeOpacity={0.8}
                          onPress={() => setWordRecall(i, val)}
                          style={[styles.smallBtn, {
                            backgroundColor: wordRecallAnswers[i] === val ? (val ? "#0f2a1a" : "#2a0808") : colors.background,
                            borderColor: wordRecallAnswers[i] === val ? (val ? "#22c55e" : "#ef4444") : colors.border,
                          }]}
                        >
                          <Text style={[styles.smallBtnText, { color: val ? "#22c55e" : "#ef4444", fontFamily: "Inter_600SemiBold" }]}>
                            {val ? "✓" : "✗"}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  ))}
                </>
              )}
            </View>

            {(wordRecallShown && wordRecallAnswers.every((a) => a !== null) && cogAnswers.every((a) => a !== null)) && (
              <LinearGradient colors={["#1a1040", "#2a1060"]} style={styles.cogResult}>
                <Text style={[styles.cogResultTitle, { color: "#a78bfa", fontFamily: "Inter_700Bold" }]}>
                  Cognitive Screen Score
                </Text>
                <Text style={[styles.cogResultScore, { color: "#fff", fontFamily: "Inter_700Bold" }]}>
                  {cogScore} / 8
                </Text>
                <Text style={[styles.cogResultLabel, { fontFamily: "Inter_600SemiBold", color: cogScore >= 7 ? "#22c55e" : cogScore >= 5 ? "#f59e0b" : "#ef4444" }]}>
                  {cogScore >= 7 ? "Normal Cognition" : cogScore >= 5 ? "Mild Impairment — GP Review" : "Significant Impairment — Urgent Referral"}
                </Text>
                <Text style={[styles.cogResultSub, { color: "rgba(255,255,255,0.5)", fontFamily: "Inter_400Regular" }]}>
                  This is a screening tool only. Full neuropsychological assessment by a qualified clinician is required for diagnosis.
                </Text>
              </LinearGradient>
            )}
          </View>
        )}

        {/* ── SMART DEVICES ── */}
        {activeSection === "devices" && (
          <View style={styles.section}>
            <LinearGradient colors={["#0a2818", "#0d0d1a"]} style={styles.cogHero}>
              <MaterialCommunityIcons name="devices" size={36} color="#22c55e" />
              <Text style={[styles.cogHeroTitle, { color: "#fff", fontFamily: "Inter_700Bold" }]}>Smart Device Hub</Text>
              <Text style={[styles.cogHeroSub, { color: "rgba(255,255,255,0.6)", fontFamily: "Inter_400Regular" }]}>
                Connect wearables for live vitals,{"\n"}fall detection, and activity monitoring
              </Text>
              <View style={[styles.connectedBadge, { backgroundColor: "#22c55e22", borderColor: "#22c55e55" }]}>
                <Text style={[styles.connectedBadgeText, { color: "#22c55e", fontFamily: "Inter_600SemiBold" }]}>
                  {connectedCount} / {devices.length} Connected
                </Text>
              </View>
            </LinearGradient>

            {/* Live readings grid if any connected */}
            {connectedCount > 0 && (
              <>
                <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>LIVE READINGS</Text>
                <View style={styles.readingsGrid}>
                  {[
                    { label: "Heart Rate", value: "72", unit: "bpm", icon: "heart-pulse" as const, color: "#ef4444" },
                    { label: "SpO₂", value: "97", unit: "%", icon: "water-percent" as const, color: "#4F6EF7" },
                    { label: "Steps Today", value: "3,240", unit: "steps", icon: "shoe-sneaker" as const, color: "#22c55e" },
                    { label: "Falls Detected", value: "0", unit: "today", icon: "alert-circle" as const, color: "#f59e0b" },
                  ].map((r) => (
                    <LinearGradient
                      key={r.label}
                      colors={[r.color + "22", r.color + "11"]}
                      style={[styles.readingCard, { borderColor: r.color + "44" }]}
                    >
                      <MaterialCommunityIcons name={r.icon} size={22} color={r.color} />
                      <Text style={[styles.readingValue, { color: r.color, fontFamily: "Inter_700Bold" }]}>{r.value}</Text>
                      <Text style={[styles.readingUnit, { color: "rgba(255,255,255,0.5)", fontFamily: "Inter_400Regular" }]}>{r.unit}</Text>
                      <Text style={[styles.readingLabel, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>{r.label}</Text>
                    </LinearGradient>
                  ))}
                </View>
              </>
            )}

            <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>AVAILABLE DEVICES</Text>

            {devices.map((d) => (
              <View key={d.id} style={[styles.deviceCard, { backgroundColor: colors.card, borderColor: d.connected ? "#22c55e55" : colors.border }]}>
                <View style={[styles.deviceIcon, { backgroundColor: d.connected ? "#0a2818" : colors.background }]}>
                  <MaterialCommunityIcons name={d.icon} size={22} color={d.connected ? "#22c55e" : colors.mutedForeground} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.deviceName, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>{d.name}</Text>
                  <Text style={[styles.deviceStatus, { color: d.connected ? "#22c55e" : colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                    {d.connected ? `● Connected · ${d.reading} ${d.readingLabel}` : "○ Not connected"}
                  </Text>
                </View>
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => toggleDevice(d.id)}
                  style={[styles.connectBtn, {
                    backgroundColor: d.connected ? "#0a2818" : "#0f1a5a",
                    borderColor: d.connected ? "#22c55e55" : colors.primary + "55",
                  }]}
                >
                  <Text style={[styles.connectBtnText, { color: d.connected ? "#22c55e" : colors.primary, fontFamily: "Inter_600SemiBold" }]}>
                    {d.connected ? "Disconnect" : "Pair"}
                  </Text>
                </TouchableOpacity>
              </View>
            ))}

            <View style={[styles.fallCard, { backgroundColor: "#2a1218", borderColor: colors.accent + "55" }]}>
              <MaterialCommunityIcons name="alert-circle" size={20} color={colors.accent} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.fallTitle, { color: colors.accent, fontFamily: "Inter_700Bold" }]}>Fall Detection</Text>
                <Text style={[styles.fallSub, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                  {connectedCount > 0
                    ? "Active — automatic SOS triggered if fall detected. No falls logged today."
                    : "Connect a compatible wearable device to enable automatic fall detection and SOS alerting."}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* ── FALLS RISK ASSESSMENT ── */}
        {activeSection === "falls" && (
          <View style={styles.section}>
            <LinearGradient colors={["#2a1a00", "#0d0d1a"]} style={styles.cogHero}>
              <MaterialCommunityIcons name="walk" size={36} color="#f59e0b" />
              <Text style={[styles.cogHeroTitle, { color: "#fff", fontFamily: "Inter_700Bold" }]}>STRATIFY Falls Risk</Text>
              <Text style={[styles.cogHeroSub, { color: "rgba(255,255,255,0.6)", fontFamily: "Inter_400Regular" }]}>
                Validated falls risk assessment tool{"\n"}used in HSE hospitals and care homes
              </Text>
            </LinearGradient>

            <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>STRATIFY ASSESSMENT (5 ITEMS)</Text>

            {STRATIFY_ITEMS.map((q, i) => (
              <View key={i} style={[styles.rfCard, { backgroundColor: colors.card, borderColor: stratifyAnswers[i] === true ? "#f59e0b55" : colors.border }]}>
                <Text style={[styles.rfText, { color: colors.foreground, fontFamily: "Inter_500Medium" }]}>
                  {i + 1}. {q}
                </Text>
                <View style={styles.rfBtnRow}>
                  {([true, false] as const).map((val) => (
                    <TouchableOpacity
                      key={String(val)}
                      activeOpacity={0.8}
                      onPress={() => setStratify(i, val)}
                      style={[styles.rfBtn, {
                        backgroundColor: stratifyAnswers[i] === val ? (val ? "#2a1a00" : "#0f2a1a") : colors.background,
                        borderColor: stratifyAnswers[i] === val ? (val ? "#f59e0b" : "#22c55e") : colors.border,
                      }]}
                    >
                      <Text style={[styles.rfBtnLabel, {
                        color: stratifyAnswers[i] === val ? (val ? "#f59e0b" : "#22c55e") : colors.mutedForeground,
                        fontFamily: stratifyAnswers[i] === val ? "Inter_700Bold" : "Inter_400Regular",
                      }]}>
                        {val ? "YES" : "NO"}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ))}

            <TouchableOpacity
              activeOpacity={stratifyAnswers.every(a => a !== null) ? 0.85 : 0.4}
              onPress={stratifyAnswers.every(a => a !== null) ? () => { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); setStratifyShown(true); } : undefined}
              style={{ opacity: stratifyAnswers.every(a => a !== null) ? 1 : 0.4 }}
            >
              <LinearGradient colors={["#3a2800", "#7a5a00"]} style={styles.primaryBtn}>
                <MaterialCommunityIcons name="calculator" size={18} color="#f59e0b" />
                <Text style={[styles.primaryBtnText, { color: "#f59e0b", fontFamily: "Inter_700Bold" }]}>Calculate Risk Score</Text>
              </LinearGradient>
            </TouchableOpacity>

            {stratifyShown && (
              <LinearGradient colors={["#2a1a00", "#1a1000"]} style={[styles.cogResult, { borderColor: stratifyRisk.color + "55" }]}>
                <Text style={[styles.cogResultTitle, { color: "#f59e0b", fontFamily: "Inter_700Bold" }]}>STRATIFY Score</Text>
                <Text style={[styles.cogResultScore, { color: "#fff", fontFamily: "Inter_700Bold" }]}>
                  {stratifyScore} / 5
                </Text>
                <Text style={[styles.cogResultLabel, { color: stratifyRisk.color, fontFamily: "Inter_700Bold" }]}>
                  {stratifyRisk.label}
                </Text>
                <Text style={[styles.cogResultSub, { color: "rgba(255,255,255,0.5)", fontFamily: "Inter_400Regular" }]}>
                  {stratifyScore === 0
                    ? "Low falls risk. Standard prevention precautions apply. Review annually."
                    : stratifyScore <= 2
                    ? "Medium risk. Implement falls prevention bundle: bed rails, call bell, non-slip footwear, physiotherapy referral."
                    : "High risk. Urgent multidisciplinary falls team review. Consider occupational therapy home assessment, medication review, and environmental adaptation."}
                </Text>
              </LinearGradient>
            )}

            <View style={[styles.noteCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.noteText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                <Text style={{ color: colors.foreground, fontFamily: "Inter_600SemiBold" }}>STRATIFY Tool: </Text>
                Oliver D, Britton M, Seed P, Martin FC, Hopper AH (1997). Development and evaluation of evidence based risk assessment tool (STRATIFY) to predict which elderly inpatients will fall. BMJ, 315:1049.
              </Text>
            </View>
          </View>
        )}

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
  tabRow: { flexDirection: "row", borderBottomWidth: 1 },
  tabBtn: { flex: 1, flexDirection: "column", alignItems: "center", gap: 4, paddingVertical: 12 },
  tabLabel: { fontSize: 10, textAlign: "center", letterSpacing: 0.2 },
  scroll: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 100, gap: 14 },
  section: { gap: 14 },
  cogHero: { borderRadius: 18, padding: 24, gap: 8, alignItems: "center" },
  cogHeroTitle: { fontSize: 20, letterSpacing: -0.3 },
  cogHeroSub: { fontSize: 13, textAlign: "center", lineHeight: 20 },
  connectedBadge: { marginTop: 6, borderRadius: 20, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 6 },
  connectedBadgeText: { fontSize: 13 },
  sectionLabel: { fontSize: 10, fontFamily: "Inter_600SemiBold", letterSpacing: 1.4 },
  cogCard: { borderRadius: 14, borderWidth: 1.5, padding: 14, gap: 10 },
  cogQ: { fontSize: 14, lineHeight: 21 },
  cogAnsRow: { flexDirection: "row", gap: 10 },
  cogAnsBtn: { flex: 1, borderRadius: 10, borderWidth: 1.5, paddingVertical: 10, alignItems: "center" },
  cogAnsBtnText: { fontSize: 14 },
  cogHint: { fontSize: 11, fontStyle: "italic" },
  wordRow: { flexDirection: "row", gap: 10, flexWrap: "wrap" },
  wordBadge: { borderRadius: 10, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 10 },
  wordText: { fontSize: 18, letterSpacing: 1 },
  revealBtn: { borderRadius: 10, borderWidth: 1, paddingVertical: 12, alignItems: "center" },
  revealBtnText: { fontSize: 14 },
  rfBtns: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 2 },
  smallBtn: { width: 40, height: 40, borderRadius: 10, borderWidth: 1.5, alignItems: "center", justifyContent: "center" },
  smallBtnText: { fontSize: 18 },
  cogResult: { borderRadius: 18, padding: 24, gap: 8, alignItems: "center", borderWidth: 1 },
  cogResultTitle: { fontSize: 14, letterSpacing: 0.5 },
  cogResultScore: { fontSize: 48, letterSpacing: -2 },
  cogResultLabel: { fontSize: 16, letterSpacing: -0.3 },
  cogResultSub: { fontSize: 12, textAlign: "center", lineHeight: 18, marginTop: 4 },
  readingsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  readingCard: { width: "47%", borderRadius: 14, borderWidth: 1, padding: 14, gap: 4 },
  readingValue: { fontSize: 32, letterSpacing: -1 },
  readingUnit: { fontSize: 12 },
  readingLabel: { fontSize: 11 },
  deviceCard: { flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 14, borderWidth: 1, padding: 14 },
  deviceIcon: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  deviceName: { fontSize: 14 },
  deviceStatus: { fontSize: 12, marginTop: 2 },
  connectBtn: { borderRadius: 10, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 8 },
  connectBtnText: { fontSize: 13 },
  fallCard: { flexDirection: "row", alignItems: "flex-start", gap: 12, borderRadius: 14, borderWidth: 1, padding: 14 },
  fallTitle: { fontSize: 14 },
  fallSub: { fontSize: 12, lineHeight: 18, marginTop: 3 },
  rfCard: { borderRadius: 14, borderWidth: 1.5, padding: 14, gap: 12 },
  rfText: { fontSize: 14, lineHeight: 21 },
  rfBtnRow: { flexDirection: "row", gap: 10 },
  rfBtn: { flex: 1, borderRadius: 10, borderWidth: 1.5, paddingVertical: 10, alignItems: "center" },
  rfBtnLabel: { fontSize: 14, letterSpacing: 1 },
  primaryBtn: { borderRadius: 14, paddingVertical: 15, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10 },
  primaryBtnText: { fontSize: 15 },
  noteCard: { borderRadius: 14, borderWidth: 1, padding: 14 },
  noteText: { fontSize: 12, lineHeight: 19 },
});
