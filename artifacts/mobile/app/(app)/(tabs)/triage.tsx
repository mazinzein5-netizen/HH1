import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
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
import { PATHWAYS, PathwayKey, RED_FLAG_QUESTIONS } from "@/data/pathwayQuestions";
import { useLogoTheme } from "@/context/LogoThemeContext";
import { useColors } from "@/hooks/useColors";

type Step = "pathway" | "redflags" | "scoring" | "results";

export default function TriageScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { prefs } = useLogoTheme();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 + 68 : insets.bottom + 64;

  const [step, setStep] = useState<Step>("pathway");
  const [selectedPathway, setSelectedPathway] = useState<PathwayKey | null>(null);
  const [redFlagAnswers, setRedFlagAnswers] = useState<(boolean | null)[]>(
    new Array(RED_FLAG_QUESTIONS.length).fill(null)
  );
  const [answers, setAnswers] = useState<(number | null)[]>([]);

  const pathway = selectedPathway ? PATHWAYS.find((p) => p.key === selectedPathway)! : null;

  function selectPathway(key: PathwayKey) {
    Haptics.selectionAsync();
    setSelectedPathway(key);
    setRedFlagAnswers(new Array(RED_FLAG_QUESTIONS.length).fill(null));
    setAnswers(new Array(PATHWAYS.find((p) => p.key === key)!.questions.length).fill(null));
    setStep("redflags");
  }

  function setRedFlag(i: number, val: boolean) {
    Haptics.selectionAsync();
    const next = [...redFlagAnswers];
    next[i] = val;
    setRedFlagAnswers(next);
  }

  function setAnswer(qi: number, optionIdx: number) {
    Haptics.selectionAsync();
    const next = [...answers];
    next[qi] = optionIdx;
    setAnswers(next);
  }

  function allRedFlagsAnswered() {
    return redFlagAnswers.every((a) => a !== null);
  }

  function allAnswered() {
    return answers.every((a) => a !== null);
  }

  function calculateScore() {
    if (!pathway) return 0;
    return answers.reduce<number>((sum, ai, qi) => {
      if (ai === null) return sum;
      return sum + pathway.questions[qi].scores[ai];
    }, 0);
  }

  function reset() {
    setStep("pathway");
    setSelectedPathway(null);
    setRedFlagAnswers(new Array(RED_FLAG_QUESTIONS.length).fill(null));
    setAnswers([]);
  }

  const hasRedFlag = redFlagAnswers.some((a) => a === true);
  const stepNum = step === "pathway" ? 1 : step === "redflags" ? 2 : step === "scoring" ? 3 : 4;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      <HoneycombWallpaper density={prefs.density} />
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: topPad + 16, paddingBottom: bottomPad + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Step indicator */}
        <View style={styles.stepRow}>
          {[1, 2, 3, 4].map((s) => (
            <React.Fragment key={s}>
              <View style={[styles.stepDot, {
                backgroundColor: s <= stepNum ? colors.primary : colors.card,
                borderColor: s <= stepNum ? colors.primary : colors.border,
              }]}>
                <Text style={[styles.stepDotText, { color: s <= stepNum ? "#fff" : colors.mutedForeground, fontFamily: "Inter_600SemiBold" }]}>
                  {s}
                </Text>
              </View>
              {s < 4 && <View style={[styles.stepLine, { backgroundColor: s < stepNum ? colors.primary : colors.border }]} />}
            </React.Fragment>
          ))}
        </View>
        <Text style={[styles.stepLabel, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
          {step === "pathway" && "Select Anatomical Pathway"}
          {step === "redflags" && "HSE / NICE Red Flag Screening"}
          {step === "scoring" && (pathway?.scoreTool ?? "Clinical Scoring")}
          {step === "results" && "Clinical Referral Packet"}
        </Text>

        {/* ── STEP 1: Pathway ── */}
        {step === "pathway" && (
          <View style={styles.section}>
            <Text style={[styles.heading, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
              Select Anatomical{"\n"}Pathway
            </Text>
            <Text style={[styles.subheading, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              Choose the region of concern. A NICE/HSE-validated clinical scoring tool is applied per pathway.
            </Text>
            <View style={styles.pathwayGrid}>
              {PATHWAYS.map((p) => (
                <TouchableOpacity
                  key={p.key}
                  activeOpacity={0.85}
                  onPress={() => selectPathway(p.key)}
                  style={[styles.pathwayCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                >
                  <MaterialCommunityIcons
                    name={p.key === "lumbar" ? "human-handsdown" : p.key === "cervical" ? "human" : p.key === "hip" ? "run-fast" : "walk"}
                    size={28}
                    color={colors.primary}
                  />
                  <Text style={[styles.pathwayName, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
                    {p.name}
                  </Text>
                  <Text style={[styles.pathwaySub, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                    {p.subtitle}
                  </Text>
                  <View style={[styles.pathwayBadge, { backgroundColor: "#0f1a5a" }]}>
                    <Text style={[styles.pathwayBadgeText, { color: colors.primary, fontFamily: "Inter_500Medium" }]}>
                      {p.scoreTool.match(/\(([^)]+)\)/)?.[1] ?? p.scoreTool.split(" ").pop()}
                    </Text>
                  </View>
                  <Text style={[styles.pathwayQCount, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                    {p.questions.length} questions
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* ── STEP 2: Red Flags ── */}
        {step === "redflags" && pathway && (
          <View style={styles.section}>
            <View style={[styles.alertBanner, { backgroundColor: "#2a1a08", borderColor: "#7c4a0a" }]}>
              <MaterialCommunityIcons name="flag" size={17} color="#f59e0b" />
              <Text style={[styles.alertText, { color: "#f59e0b", fontFamily: "Inter_500Medium" }]}>
                Red Flag Screening — {pathway.name}
              </Text>
            </View>
            <Text style={[styles.subheading, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              Please answer all questions honestly. A positive response triggers an immediate urgent referral pathway per HSE/NICE guidelines.
            </Text>

            {RED_FLAG_QUESTIONS.map((q, i) => (
              <View key={i} style={[styles.rfCard, { backgroundColor: colors.card, borderColor: redFlagAnswers[i] === true ? colors.accent : colors.border }]}>
                <Text style={[styles.rfText, { color: colors.foreground, fontFamily: "Inter_500Medium" }]}>
                  {i + 1}. {q}
                </Text>
                <View style={styles.rfBtns}>
                  {([true, false] as const).map((val) => (
                    <TouchableOpacity
                      key={String(val)}
                      activeOpacity={0.8}
                      onPress={() => setRedFlag(i, val)}
                      style={[styles.rfBtn, {
                        backgroundColor: redFlagAnswers[i] === val ? (val ? "#4a0f0f" : "#0f2a1a") : colors.background,
                        borderColor: redFlagAnswers[i] === val ? (val ? colors.accent : "#22c55e") : colors.border,
                      }]}
                    >
                      <Text style={[styles.rfBtnText, {
                        color: redFlagAnswers[i] === val ? (val ? colors.accent : "#22c55e") : colors.mutedForeground,
                        fontFamily: redFlagAnswers[i] === val ? "Inter_700Bold" : "Inter_400Regular",
                      }]}>
                        {val ? "YES" : "NO"}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ))}

            {hasRedFlag && (
              <View style={[styles.alertBanner, { backgroundColor: "#2a0808", borderColor: colors.accent }]}>
                <MaterialCommunityIcons name="alert-circle" size={17} color={colors.accent} />
                <Text style={[styles.alertText, { color: colors.accent, fontFamily: "Inter_600SemiBold" }]}>
                  Red Flag Detected — Urgent GP or Emergency Department assessment is required before completing this questionnaire.
                </Text>
              </View>
            )}

            <TouchableOpacity
              activeOpacity={allRedFlagsAnswered() ? 0.85 : 0.4}
              onPress={allRedFlagsAnswered() ? () => setStep("scoring") : undefined}
              style={{ opacity: allRedFlagsAnswered() ? 1 : 0.4 }}
            >
              <LinearGradient colors={["#1a2a8c", "#4F6EF7"]} style={styles.primaryBtn}>
                <Text style={[styles.primaryBtnText, { fontFamily: "Inter_700Bold" }]}>
                  {hasRedFlag ? "Continue (Red Flag Noted)" : "Proceed to Clinical Scoring"}
                </Text>
                <Feather name="arrow-right" size={17} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity onPress={reset} style={styles.backBtn}>
              <Feather name="arrow-left" size={14} color={colors.mutedForeground} />
              <Text style={[styles.backBtnText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                Back to Pathways
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── STEP 3: Scoring Questionnaire ── */}
        {step === "scoring" && pathway && (
          <View style={styles.section}>
            <View style={[styles.toolBanner, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <MaterialCommunityIcons name="clipboard-check" size={18} color={colors.primary} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.toolName, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
                  {pathway.scoreTool}
                </Text>
                <Text style={[styles.toolDesc, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                  {pathway.toolDescription}
                </Text>
              </View>
            </View>

            <Text style={[styles.subheading, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              Select one option per question that best describes your experience over the past 4 weeks.
            </Text>

            <View style={[styles.progressBar, { backgroundColor: colors.card }]}>
              <View style={[styles.progressFill, {
                width: `${(answers.filter(a => a !== null).length / pathway.questions.length) * 100}%`,
                backgroundColor: colors.primary,
              }]} />
            </View>
            <Text style={[styles.progressText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              {answers.filter(a => a !== null).length} / {pathway.questions.length} answered
            </Text>

            {pathway.questions.map((q, qi) => (
              <View key={qi} style={[styles.questionCard, {
                backgroundColor: colors.card,
                borderColor: answers[qi] !== null ? colors.primary : colors.border,
              }]}>
                <Text style={[styles.questionText, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
                  {q.text}
                </Text>
                {q.options.map((opt, oi) => (
                  <TouchableOpacity
                    key={oi}
                    activeOpacity={0.8}
                    onPress={() => setAnswer(qi, oi)}
                    style={[styles.optionBtn, {
                      backgroundColor: answers[qi] === oi ? "#0f1a5a" : colors.background,
                      borderColor: answers[qi] === oi ? colors.primary : colors.border,
                    }]}
                  >
                    <View style={[styles.optionRadio, {
                      borderColor: answers[qi] === oi ? colors.primary : colors.border,
                      backgroundColor: answers[qi] === oi ? colors.primary : "transparent",
                    }]}>
                      {answers[qi] === oi && <View style={styles.optionRadioInner} />}
                    </View>
                    <Text style={[styles.optionText, {
                      color: answers[qi] === oi ? "#fff" : colors.mutedForeground,
                      fontFamily: answers[qi] === oi ? "Inter_500Medium" : "Inter_400Regular",
                    }]}>
                      {opt}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            ))}

            <TouchableOpacity
              activeOpacity={allAnswered() ? 0.85 : 0.4}
              onPress={allAnswered() ? () => { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); setStep("results"); } : undefined}
              style={{ opacity: allAnswered() ? 1 : 0.4 }}
            >
              <LinearGradient colors={["#1a2a8c", "#4F6EF7"]} style={styles.primaryBtn}>
                <MaterialCommunityIcons name="file-document-edit" size={18} color="#fff" />
                <Text style={[styles.primaryBtnText, { fontFamily: "Inter_700Bold" }]}>
                  Generate Referral Packet
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setStep("redflags")} style={styles.backBtn}>
              <Feather name="arrow-left" size={14} color={colors.mutedForeground} />
              <Text style={[styles.backBtnText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>Back</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── STEP 4: Results ── */}
        {step === "results" && pathway && (() => {
          const total = calculateScore();
          const result = pathway.getResult(total);
          const pct = pathway.higherIsBetter
            ? Math.round((total / pathway.maxScore) * 100)
            : 100 - Math.round((total / pathway.maxScore) * 100);
          return (
            <View style={styles.section}>
              <LinearGradient colors={["#111a6e", "#1a268c"]} style={styles.resultsHero}>
                <Text style={[styles.resultsTitle, { fontFamily: "Inter_700Bold" }]}>Referral Packet</Text>
                <Text style={[styles.resultsPathway, { fontFamily: "Inter_400Regular" }]}>
                  {pathway.name} · {pathway.scoreTool.split("(")[0].trim()}
                </Text>
                <Text style={[styles.scoreValue, { color: result.color, fontFamily: "Inter_700Bold" }]}>
                  {pathway.formatScore(total)}
                </Text>
                <View style={[styles.resultLabelBadge, { backgroundColor: result.color + "33", borderColor: result.color }]}>
                  <Text style={[styles.resultLabelText, { color: result.color, fontFamily: "Inter_700Bold" }]}>
                    {result.label}
                  </Text>
                </View>
                <View style={[styles.scoreBarBg, { backgroundColor: "rgba(255,255,255,0.15)", width: "100%", marginTop: 8 }]}>
                  <View style={[styles.scoreBarFill, { width: `${pct}%`, backgroundColor: result.color }]} />
                </View>
              </LinearGradient>

              {hasRedFlag && (
                <View style={[styles.alertBanner, { backgroundColor: "#2a0808", borderColor: colors.accent }]}>
                  <MaterialCommunityIcons name="alert" size={17} color={colors.accent} />
                  <Text style={[styles.alertText, { color: colors.accent, fontFamily: "Inter_600SemiBold" }]}>
                    Red Flag(s) Identified — Override to urgent pathway regardless of score.
                  </Text>
                </View>
              )}

              <View style={[styles.resultCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.resultCardHeader}>
                  <MaterialCommunityIcons name="medical-bag" size={20} color={colors.primary} />
                  <Text style={[styles.resultCardTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
                    Clinical Recommendation
                  </Text>
                </View>
                <Text style={[styles.resultBodyText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                  {result.recommendation}
                </Text>
              </View>

              <View style={[styles.resultCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.resultCardHeader}>
                  <MaterialCommunityIcons name="send-check" size={20} color="#22c55e" />
                  <Text style={[styles.resultCardTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
                    Recommended Referral
                  </Text>
                </View>
                <Text style={[styles.referralText, { color: "#22c55e", fontFamily: "Inter_700Bold" }]}>
                  {result.referral}
                </Text>
              </View>

              <View style={[styles.resultCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.resultCardHeader}>
                  <MaterialCommunityIcons name="note-text" size={18} color={colors.mutedForeground} />
                  <Text style={[styles.resultCardTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>Score Summary</Text>
                </View>
                {pathway.questions.map((q, qi) => (
                  <View key={qi} style={styles.summaryRow}>
                    <Text style={[styles.summaryQ, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]} numberOfLines={2}>
                      {q.text.split(" — ")[0].replace(/^\d+\.\s+/, "")}
                    </Text>
                    <Text style={[styles.summaryA, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
                      {answers[qi] !== null && answers[qi] !== undefined ? q.scores[answers[qi]!] : "—"}
                    </Text>
                  </View>
                ))}
                <View style={[styles.summaryTotal, { borderTopColor: colors.border }]}>
                  <Text style={[styles.summaryTotalLabel, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>Total</Text>
                  <Text style={[styles.summaryTotalValue, { color: colors.primary, fontFamily: "Inter_700Bold" }]}>
                    {pathway.formatScore(total)}
                  </Text>
                </View>
              </View>

              <TouchableOpacity activeOpacity={0.85} onPress={reset}>
                <LinearGradient colors={["#1a2a8c", "#4F6EF7"]} style={styles.primaryBtn}>
                  <MaterialCommunityIcons name="refresh" size={17} color="#fff" />
                  <Text style={[styles.primaryBtnText, { fontFamily: "Inter_700Bold" }]}>New Assessment</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          );
        })()}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: 16, gap: 14 },
  stepRow: { flexDirection: "row", alignItems: "center", justifyContent: "center" },
  stepDot: { width: 34, height: 34, borderRadius: 17, borderWidth: 1.5, alignItems: "center", justifyContent: "center" },
  stepDotText: { fontSize: 14 },
  stepLine: { flex: 1, height: 2, maxWidth: 28, marginHorizontal: 4 },
  stepLabel: { fontSize: 12, textAlign: "center", letterSpacing: 0.3 },
  section: { gap: 14 },
  heading: { fontSize: 26, letterSpacing: -0.5, lineHeight: 32 },
  subheading: { fontSize: 13, lineHeight: 20 },
  pathwayGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  pathwayCard: { width: "47%", borderRadius: 18, borderWidth: 1, padding: 18, gap: 8 },
  pathwayName: { fontSize: 15, letterSpacing: -0.2 },
  pathwaySub: { fontSize: 12 },
  pathwayBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, alignSelf: "flex-start" },
  pathwayBadgeText: { fontSize: 11 },
  pathwayQCount: { fontSize: 11 },
  alertBanner: { flexDirection: "row", alignItems: "flex-start", gap: 10, borderRadius: 12, borderWidth: 1, padding: 12 },
  alertText: { fontSize: 13, lineHeight: 19, flex: 1 },
  rfCard: { borderRadius: 14, borderWidth: 1.5, padding: 14, gap: 12 },
  rfText: { fontSize: 14, lineHeight: 21 },
  rfBtns: { flexDirection: "row", gap: 10 },
  rfBtn: { flex: 1, borderRadius: 10, borderWidth: 1.5, paddingVertical: 11, alignItems: "center" },
  rfBtnText: { fontSize: 14, letterSpacing: 1 },
  primaryBtn: { borderRadius: 14, paddingVertical: 16, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10 },
  primaryBtnText: { color: "#fff", fontSize: 15 },
  backBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 8 },
  backBtnText: { fontSize: 13 },
  toolBanner: { flexDirection: "row", alignItems: "flex-start", gap: 12, borderRadius: 14, borderWidth: 1, padding: 14 },
  toolName: { fontSize: 14, letterSpacing: -0.2 },
  toolDesc: { fontSize: 12, lineHeight: 18, marginTop: 2 },
  progressBar: { height: 5, borderRadius: 3, overflow: "hidden" },
  progressFill: { height: 5, borderRadius: 3 },
  progressText: { fontSize: 11, textAlign: "right" },
  questionCard: { borderRadius: 14, borderWidth: 1.5, padding: 16, gap: 10 },
  questionText: { fontSize: 14, lineHeight: 21 },
  optionBtn: { flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 10, borderWidth: 1.5, padding: 12 },
  optionRadio: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  optionRadioInner: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#fff" },
  optionText: { fontSize: 13, lineHeight: 19, flex: 1 },
  resultsHero: { borderRadius: 20, padding: 24, gap: 10, alignItems: "center" },
  resultsTitle: { color: "#fff", fontSize: 22, letterSpacing: -0.5 },
  resultsPathway: { color: "rgba(255,255,255,0.6)", fontSize: 13 },
  scoreValue: { fontSize: 42, letterSpacing: -1 },
  resultLabelBadge: { borderRadius: 20, borderWidth: 1.5, paddingHorizontal: 18, paddingVertical: 7 },
  resultLabelText: { fontSize: 15 },
  scoreBarBg: { height: 6, borderRadius: 3, overflow: "hidden" },
  scoreBarFill: { height: 6, borderRadius: 3 },
  resultCard: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 12 },
  resultCardHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  resultCardTitle: { fontSize: 15 },
  resultBodyText: { fontSize: 13, lineHeight: 20 },
  referralText: { fontSize: 16, letterSpacing: -0.2 },
  summaryRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12, paddingVertical: 3 },
  summaryQ: { fontSize: 12, flex: 1, lineHeight: 17 },
  summaryA: { fontSize: 14, minWidth: 28, textAlign: "right" },
  summaryTotal: { flexDirection: "row", justifyContent: "space-between", paddingTop: 10, marginTop: 4, borderTopWidth: 1 },
  summaryTotalLabel: { fontSize: 14 },
  summaryTotalValue: { fontSize: 16 },
});
