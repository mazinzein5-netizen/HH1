import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { disableWatcherMode, enableWatcherMode, isWatcherModeEnabled } from "@/utils/watcherMode";
import ThemedStatusBar from "@/components/ThemedStatusBar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import HoneycombWallpaper from "@/components/HoneycombWallpaper";
import { useAuth } from "@/context/AuthContext";
import { useLogoTheme } from "@/context/LogoThemeContext";
import { useColors } from "@/hooks/useColors";
import { getPlanTier } from "@/utils/entitlements";
import { PLAN_META, type PlanTier } from "@/utils/membershipStore";

type ActiveSection = "cognitive" | "falls";

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

export default function GeriatricScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { prefs } = useLogoTheme();
  const topPad = Platform.OS === "web" ? 0 : insets.top;

  const [activeSection, setActiveSection] = useState<ActiveSection>("cognitive");
  const [cogAnswers, setCogAnswers] = useState<(string | null)[]>(new Array(ORIENTATION_QUESTIONS.length).fill(null));
  const [wordRecallShown, setWordRecallShown] = useState(false);
  const [wordRecallAnswers, setWordRecallAnswers] = useState<(boolean | null)[]>(new Array(MEMORY_WORDS.length).fill(null));
  const [cogScoreShown, setCogScoreShown] = useState(false);
  const [stratifyAnswers, setStratifyAnswers] = useState<(boolean | null)[]>(new Array(STRATIFY_ITEMS.length).fill(null));
  const [stratifyShown, setStratifyShown] = useState(false);
  const [watcher, setWatcher] = useState(false);
  const { user } = useAuth();
  const [tier, setTier] = useState<PlanTier | null>(null);

  useEffect(() => {
    isWatcherModeEnabled().then(setWatcher);
  }, []);

  useEffect(() => {
    let alive = true;
    getPlanTier(user?.id ?? "unknown")
      .then((t) => { if (alive) setTier(t); })
      .catch(() => { if (alive) setTier("blue"); });
    return () => { alive = false; };
  }, [user?.id]);

  async function toggleWatcher(v: boolean) {
    Haptics.selectionAsync();
    if (!v) {
      setWatcher(false);
      await disableWatcherMode();
      return;
    }
    const res = await enableWatcherMode();
    if (res.ok) {
      setWatcher(true);
      if (res.reason === "web") {
        Alert.alert(
          "Watcher Mode",
          "Watcher Mode is saved. In the browser preview Sarah can only watch while this tab is open — on a phone she'll send daily check-ins even when the app is closed."
        );
      }
    } else if (res.reason === "permission") {
      Alert.alert(
        "Watcher Mode",
        "Sarah needs notification permission to check in while the app is closed. You can enable notifications for HIVE in your device settings."
      );
    } else {
      Alert.alert("Watcher Mode", "Couldn't turn on Watcher Mode just now — please try again.");
    }
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

  const sections: { key: ActiveSection; label: string; icon: keyof typeof MaterialCommunityIcons.glyphMap; color: string }[] = [
    { key: "cognitive", label: "Cognitive Screen", icon: "brain", color: "#a78bfa" },
    { key: "falls", label: "Falls Risk", icon: "walk", color: "#f59e0b" },
  ];

  const header = (
    <View style={[styles.header, { paddingTop: topPad + 12, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
        <Feather name="arrow-left" size={20} color={colors.foreground} />
      </TouchableOpacity>
      <View style={{ flex: 1 }}>
        <Text style={[styles.headerTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
          Geriatric & Cognitive Care
        </Text>
        <Text style={[styles.headerSub, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
          Memory check-in · Falls awareness
        </Text>
      </View>
      <MaterialCommunityIcons name="brain" size={26} color="#a78bfa" />
    </View>
  );

  // Geriatric & cognitive care is part of the Red Geriatric Safety Pack.
  if (tier !== "red") {
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <ThemedStatusBar />
        <HoneycombWallpaper density={prefs.density} />
        {header}
        {tier === null ? null : (
          <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
            <View style={[styles.gateCard, { backgroundColor: colors.card, borderColor: "#E5294E55" }]}>
              <MaterialCommunityIcons name="shield-star" size={40} color="#E5294E" />
              <Text style={[styles.gateTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
                Part of the Red Geriatric Safety Pack
              </Text>
              <Text style={[styles.gateBody, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                Cognitive screening, falls-risk checks and Sarah Watcher Mode are included with the Red
                Geriatric Safety Pack — the complete elder-care membership.
              </Text>
              <View style={{ gap: 6, alignSelf: "stretch" }}>
                {PLAN_META.red.features.map((f) => (
                  <View key={f} style={styles.gateFeatureRow}>
                    <MaterialCommunityIcons name="check-circle" size={15} color="#E5294E" />
                    <Text style={[styles.gateFeatureText, { color: colors.foreground, fontFamily: "Inter_400Regular" }]}>
                      {f}
                    </Text>
                  </View>
                ))}
              </View>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => { Haptics.selectionAsync(); router.push("/(app)/membership"); }}
                style={{ alignSelf: "stretch" }}
              >
                <LinearGradient
                  colors={["#B91C3C", "#E5294E", "#B91C3C"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.gateBtn}
                >
                  <MaterialCommunityIcons name="shield-star" size={18} color="#fff" />
                  <Text style={[styles.gateBtnText, { fontFamily: "Inter_700Bold" }]}>
                    Upgrade to the Red Geriatric Safety Pack
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </ScrollView>
        )}
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ThemedStatusBar />
      <HoneycombWallpaper density={prefs.density} />

      {header}

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

        {/* ── SARAH WATCHER MODE ── */}
        <View style={[styles.watcherCard, { backgroundColor: colors.card, borderColor: "rgba(201,134,10,0.4)" }]}>
          <View style={[styles.watcherIcon, { backgroundColor: "rgba(201,134,10,0.15)" }]}>
            <MaterialCommunityIcons name="eye-check-outline" size={20} color="#C9860A" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.watcherTitle, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
              Sarah Watcher Mode
            </Text>
            <Text style={[styles.watcherSub, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              Sarah keeps watch even when the app is closed — gentle morning and evening check-ins on the phone, ready to chat with one tap. Ideal for older adults living alone.
            </Text>
          </View>
          <Switch
            value={watcher}
            onValueChange={toggleWatcher}
            trackColor={{ false: colors.border, true: "#C9860A" }}
            thumbColor="#fff"
          />
        </View>

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
                  {cogScore >= 7 ? "No Concerns Noted" : cogScore >= 5 ? "Some Concerns — Discuss With Your GP" : "Please See Your GP Urgently"}
                </Text>
                <Text style={[styles.cogResultSub, { color: "rgba(255,255,255,0.5)", fontFamily: "Inter_400Regular" }]}>
                  This is a general wellbeing check-in, not a diagnosis. Please speak to a qualified clinician for a full evaluation.
                </Text>
              </LinearGradient>
            )}
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
  tabRow: { flexDirection: "row", borderBottomWidth: 1, paddingHorizontal: 16 },
  tabBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 12 },
  tabLabel: { fontSize: 12 },
  scroll: { padding: 16, gap: 14, paddingBottom: 60 },
  gateCard: { borderRadius: 18, borderWidth: 1.5, padding: 22, alignItems: "center", gap: 14 },
  gateTitle: { fontSize: 17, textAlign: "center" },
  gateBody: { fontSize: 13.5, lineHeight: 20, textAlign: "center" },
  gateFeatureRow: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  gateFeatureText: { flex: 1, fontSize: 13, lineHeight: 19 },
  gateBtn: { borderRadius: 14, paddingVertical: 15, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  gateBtnText: { color: "#fff", fontSize: 14.5 },
  watcherCard: { flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 16, borderWidth: 1, padding: 14 },
  watcherIcon: { width: 38, height: 38, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  watcherTitle: { fontSize: 14 },
  watcherSub: { fontSize: 11.5, lineHeight: 16, marginTop: 2 },
  section: { gap: 14 },
  cogHero: { borderRadius: 20, padding: 24, gap: 10, alignItems: "center" },
  cogHeroTitle: { fontSize: 20, letterSpacing: -0.4 },
  cogHeroSub: { fontSize: 13, lineHeight: 20, textAlign: "center" },
  sectionLabel: { fontSize: 10, fontFamily: "Inter_600SemiBold", letterSpacing: 1.4 },
  cogCard: { borderRadius: 14, borderWidth: 1.5, padding: 14, gap: 12 },
  cogQ: { fontSize: 14, lineHeight: 21 },
  cogAnsRow: { flexDirection: "row", gap: 10 },
  cogAnsBtn: { flex: 1, borderRadius: 10, borderWidth: 1.5, paddingVertical: 10, alignItems: "center" },
  cogAnsBtnText: { fontSize: 13 },
  cogHint: { fontSize: 11, lineHeight: 16 },
  wordRow: { flexDirection: "row", gap: 10 },
  wordBadge: { borderRadius: 10, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 8 },
  wordText: { fontSize: 14 },
  revealBtn: { borderRadius: 10, borderWidth: 1, paddingVertical: 12, alignItems: "center" },
  revealBtnText: { fontSize: 14 },
  rfBtns: { flexDirection: "row", alignItems: "center", gap: 8 },
  smallBtn: { borderRadius: 8, borderWidth: 1.5, width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  smallBtnText: { fontSize: 16 },
  cogResult: { borderRadius: 18, borderWidth: 1, borderColor: "transparent", padding: 22, gap: 10, alignItems: "center" },
  cogResultTitle: { fontSize: 14, letterSpacing: 0.5 },
  cogResultScore: { fontSize: 48, letterSpacing: -2 },
  cogResultLabel: { fontSize: 16, textAlign: "center" },
  cogResultSub: { fontSize: 12, lineHeight: 18, textAlign: "center" },
  rfCard: { borderRadius: 14, borderWidth: 1.5, padding: 14, gap: 12 },
  rfText: { fontSize: 14, lineHeight: 21 },
  rfBtnRow: { flexDirection: "row", gap: 10 },
  rfBtn: { flex: 1, borderRadius: 10, borderWidth: 1.5, paddingVertical: 11, alignItems: "center" },
  rfBtnLabel: { fontSize: 14, letterSpacing: 1 },
  primaryBtn: { borderRadius: 14, paddingVertical: 16, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10 },
  primaryBtnText: { fontSize: 15 },
  noteCard: { borderRadius: 14, borderWidth: 1, padding: 14 },
  noteText: { fontSize: 13, lineHeight: 20 },
});
