import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import ThemedStatusBar from "@/components/ThemedStatusBar";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { PILOT_ACTIVATION_CODE, useAppMode } from "@/context/AppModeContext";
import { usePatient, type Complaint } from "@/context/PatientContext";
import { useColors } from "@/hooks/useColors";

const FALLBACK_QUESTIONS = [
  "How long have you had this symptom?",
  "On a scale of 1–10, how severe is the pain or discomfort?",
  "What makes it better or worse?",
  "Have you experienced this before? If so, when?",
  "Are there any associated symptoms (e.g. fever, numbness, swelling)?",
];

type Step = "input" | "loading-questions" | "questions" | "loading-summary" | "result";

interface QA {
  question: string;
  answer: string;
}

function genId() {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

export default function ComplaintScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { addComplaint } = usePatient();
  const { pilotMode } = useAppMode();

  const [step, setStep] = useState<Step>("input");
  const [chiefComplaint, setChiefComplaint] = useState("");
  const [questions, setQuestions] = useState<string[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [qa, setQa] = useState<QA[]>([]);
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [summary, setSummary] = useState<{ summary: string; recommendation: string; urgency: string } | null>(null);
  const [saved, setSaved] = useState(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 + 84 : insets.bottom + 84;

  function fade(cb: () => void) {
    Animated.timing(fadeAnim, { toValue: 0, duration: 180, useNativeDriver: true }).start(() => {
      cb();
      Animated.timing(fadeAnim, { toValue: 1, duration: 220, useNativeDriver: true }).start();
    });
  }

  async function handleStartComplaint() {
    if (!chiefComplaint.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setStep("loading-questions");

    try {
      const domain = process.env.EXPO_PUBLIC_DOMAIN;
      const res = await fetch(`https://${domain}/api/ai/questions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chiefComplaint: chiefComplaint.trim(), pilotCode: pilotMode ? PILOT_ACTIVATION_CODE : undefined }),
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.questions) && data.questions.length > 0) {
          setQuestions(data.questions);
          fade(() => { setStep("questions"); setCurrentQ(0); setQa([]); });
          return;
        }
      }
    } catch {}

    setQuestions(FALLBACK_QUESTIONS);
    fade(() => { setStep("questions"); setCurrentQ(0); setQa([]); });
  }

  function handleNextQuestion() {
    if (!currentAnswer.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newQa = [...qa, { question: questions[currentQ], answer: currentAnswer.trim() }];
    setQa(newQa);
    setCurrentAnswer("");

    if (currentQ + 1 < questions.length) {
      fade(() => setCurrentQ(currentQ + 1));
    } else {
      fade(async () => {
        setStep("loading-summary");
        try {
          const domain = process.env.EXPO_PUBLIC_DOMAIN;
          const res = await fetch(`https://${domain}/api/ai/summary`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ chiefComplaint, qa: newQa, pilotCode: pilotMode ? PILOT_ACTIVATION_CODE : undefined }),
          });
          if (res.ok) {
            const data = await res.json();
            setSummary(data);
          }
        } catch {}
        setStep("result");
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      });
    }
  }

  async function handleSave() {
    const complaint: Complaint = {
      id: genId(),
      date: new Date().toISOString(),
      chiefComplaint,
      answers: qa,
      aiSummary: summary?.summary,
      triageRecommendation: summary?.recommendation,
    };
    await addComplaint(complaint);
    setSaved(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }

  function handleReset() {
    setStep("input");
    setChiefComplaint("");
    setQuestions([]);
    setCurrentQ(0);
    setQa([]);
    setCurrentAnswer("");
    setSummary(null);
    setSaved(false);
    fadeAnim.setValue(1);
  }

  const recColor = summary?.recommendation
    ? summary.recommendation === "Emergency"
      ? { bg: colors.emergencyBg, border: colors.emergencyBorder, text: colors.emergency, icon: "alert-octagon" }
      : summary.recommendation === "Fast Track"
      ? { bg: colors.fastTrackBg, border: colors.fastTrackBorder, text: colors.fastTrack, icon: "clock-fast" }
      : summary.recommendation === "Virtual"
      ? { bg: colors.virtualBg, border: colors.virtualBorder, text: colors.virtual, icon: "monitor-account" }
      : { bg: colors.physioBg, border: colors.physioBorder, text: colors.physio, icon: "human-handsup" }
    : null;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ThemedStatusBar />
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: topPad + 20, paddingBottom: bottomPad + 16 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.headerRow}>
          <View style={[styles.iconWrap, { backgroundColor: colors.primary }]}>
            <MaterialCommunityIcons name="brain" size={22} color="#fff" />
          </View>
          <View>
            <Text style={[styles.title, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>{pilotMode ? "AI Clinical Intake" : "Guided Intake"}</Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>{pilotMode ? "Intelligent symptom assessment" : "Organise your notes before a GP visit"}</Text>
          </View>
        </View>

        <Animated.View style={{ opacity: fadeAnim }}>
          {/* STEP: Input chief complaint */}
          {step === "input" && (
            <View style={styles.stepWrap}>
              <Text style={[styles.stepLabel, { color: colors.mutedForeground }]}>STEP 1 OF 3 — COMPLAINT</Text>
              <Text style={[styles.questionText, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
                What brings you in today?
              </Text>
              <View style={[styles.inputWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <TextInput
                  style={[styles.input, { color: colors.foreground, fontFamily: "Inter_400Regular" }]}
                  placeholder="Describe your main symptom or concern..."
                  placeholderTextColor={colors.mutedForeground}
                  value={chiefComplaint}
                  onChangeText={setChiefComplaint}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handleStartComplaint}
                disabled={!chiefComplaint.trim()}
                style={[styles.btn, { backgroundColor: colors.primary, opacity: chiefComplaint.trim() ? 1 : 0.5 }]}
              >
                <Feather name="arrow-right" size={18} color="#fff" />
                <Text style={[styles.btnText, { fontFamily: "Inter_600SemiBold" }]}>{pilotMode ? "Begin Assessment" : "Start Questions"}</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* STEP: Loading questions */}
          {step === "loading-questions" && (
            <View style={styles.loadingWrap}>
              <ActivityIndicator color={colors.primary} size="large" />
              <Text style={[styles.loadingText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                {pilotMode ? "Generating clinical questions..." : "Preparing your questions..."}
              </Text>
            </View>
          )}

          {/* STEP: Questions */}
          {step === "questions" && (
            <View style={styles.stepWrap}>
              <Text style={[styles.stepLabel, { color: colors.mutedForeground }]}>
                STEP 2 OF 3 — QUESTION {currentQ + 1} OF {questions.length}
              </Text>

              {/* Progress bar */}
              <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
                <View
                  style={[
                    styles.progressFill,
                    { backgroundColor: colors.primary, width: `${((currentQ + 1) / questions.length) * 100}%` as any },
                  ]}
                />
              </View>

              {/* Chief complaint chip */}
              <View style={[styles.complaintChip, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
                <MaterialCommunityIcons name="stethoscope" size={14} color={colors.mutedForeground} />
                <Text style={[styles.complaintChipText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                  {chiefComplaint}
                </Text>
              </View>

              <Text style={[styles.questionText, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
                {questions[currentQ]}
              </Text>

              <View style={[styles.inputWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <TextInput
                  style={[styles.input, { color: colors.foreground, fontFamily: "Inter_400Regular" }]}
                  placeholder="Your answer..."
                  placeholderTextColor={colors.mutedForeground}
                  value={currentAnswer}
                  onChangeText={setCurrentAnswer}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                  autoFocus
                />
              </View>

              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handleNextQuestion}
                disabled={!currentAnswer.trim()}
                style={[styles.btn, { backgroundColor: colors.primary, opacity: currentAnswer.trim() ? 1 : 0.5 }]}
              >
                <Text style={[styles.btnText, { fontFamily: "Inter_600SemiBold" }]}>
                  {currentQ + 1 < questions.length ? "Next Question" : pilotMode ? "Get Assessment" : "Get Summary"}
                </Text>
                <Feather name={currentQ + 1 < questions.length ? "arrow-right" : "check-circle"} size={18} color="#fff" />
              </TouchableOpacity>

              {/* Previous answers */}
              {qa.length > 0 && (
                <View style={styles.prevAnswers}>
                  <Text style={[styles.prevLabel, { color: colors.mutedForeground }]}>PREVIOUS ANSWERS</Text>
                  {qa.map((item, i) => (
                    <View key={i} style={[styles.prevItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
                      <Text style={[styles.prevQ, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>{item.question}</Text>
                      <Text style={[styles.prevA, { color: colors.foreground, fontFamily: "Inter_500Medium" }]}>{item.answer}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}

          {/* STEP: Loading summary */}
          {step === "loading-summary" && (
            <View style={styles.loadingWrap}>
              <ActivityIndicator color={colors.primary} size="large" />
              <Text style={[styles.loadingText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                {pilotMode ? "Analysing your responses..." : "Putting your summary together..."}
              </Text>
            </View>
          )}

          {/* STEP: Result */}
          {step === "result" && (
            <View style={styles.stepWrap}>
              <Text style={[styles.stepLabel, { color: colors.mutedForeground }]}>
                {pilotMode ? "STEP 3 OF 3 — ASSESSMENT COMPLETE" : "STEP 3 OF 3 — SUMMARY READY"}
              </Text>

              {/* Result */}
              {summary && recColor && pilotMode ? (
                <View style={[styles.resultCard, { backgroundColor: recColor.bg, borderColor: recColor.border }]}>
                  <View style={styles.resultHeader}>
                    <MaterialCommunityIcons name={recColor.icon as any} size={22} color={recColor.text} />
                    <Text style={[styles.resultCategory, { color: recColor.text, fontFamily: "Inter_700Bold" }]}>
                      {summary.recommendation}
                    </Text>
                  </View>
                  <Text style={[styles.resultSummary, { color: recColor.text, fontFamily: "Inter_400Regular" }]}>
                    {summary.summary}
                  </Text>
                </View>
              ) : summary?.summary ? (
                <View style={[styles.resultCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Text style={[styles.resultSummary, { color: colors.foreground, fontFamily: "Inter_400Regular" }]}>
                    {summary.summary}
                  </Text>
                  <Text style={[styles.resultSummary, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                    This is a summary of what you entered — not medical advice. Please share it with your GP.
                  </Text>
                </View>
              ) : (
                <View style={[styles.resultCard, { backgroundColor: colors.physioBg, borderColor: colors.physioBorder }]}>
                  <Text style={[styles.resultSummary, { color: colors.physio, fontFamily: "Inter_400Regular" }]}>
                    {pilotMode
                      ? "Assessment complete. Please speak to a clinician for further evaluation."
                      : "Your notes are saved below. Please share them with your GP at your next visit."}
                  </Text>
                </View>
              )}

              {/* Q&A Summary */}
              <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>YOUR RESPONSES</Text>
              {qa.map((item, i) => (
                <View key={i} style={[styles.prevItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Text style={[styles.prevQ, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>{item.question}</Text>
                  <Text style={[styles.prevA, { color: colors.foreground, fontFamily: "Inter_500Medium" }]}>{item.answer}</Text>
                </View>
              ))}

              {!saved ? (
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={handleSave}
                  style={[styles.btn, { backgroundColor: colors.virtual }]}
                >
                  <Feather name="save" size={18} color="#fff" />
                  <Text style={[styles.btnText, { fontFamily: "Inter_600SemiBold" }]}>Save to Medical Record</Text>
                </TouchableOpacity>
              ) : (
                <View style={[styles.savedBanner, { backgroundColor: colors.virtualBg, borderColor: colors.virtualBorder }]}>
                  <Feather name="check-circle" size={16} color={colors.virtual} />
                  <Text style={[styles.savedText, { color: colors.virtual, fontFamily: "Inter_600SemiBold" }]}>Saved to your records</Text>
                </View>
              )}

              <TouchableOpacity
                activeOpacity={0.7}
                onPress={handleReset}
                style={[styles.resetBtn, { borderColor: colors.border }]}
              >
                <Feather name="refresh-ccw" size={14} color={colors.mutedForeground} />
                <Text style={[styles.resetText, { color: colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>New Complaint</Text>
              </TouchableOpacity>
            </View>
          )}
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: 20 },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 24 },
  iconWrap: { width: 46, height: 46, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 18, letterSpacing: -0.3 },
  subtitle: { fontSize: 12, marginTop: 1 },
  stepWrap: { gap: 14 },
  stepLabel: { fontSize: 11, fontFamily: "Inter_600SemiBold", letterSpacing: 1.2, marginBottom: -6 },
  progressBar: { height: 4, borderRadius: 2, overflow: "hidden" },
  progressFill: { height: 4, borderRadius: 2 },
  complaintChip: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 8 },
  complaintChipText: { fontSize: 13, flex: 1 },
  questionText: { fontSize: 18, lineHeight: 26, letterSpacing: -0.2 },
  inputWrap: { borderRadius: 14, borderWidth: 1, padding: 14 },
  input: { fontSize: 15, lineHeight: 22, minHeight: 80 },
  btn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, borderRadius: 14, paddingVertical: 16 },
  btnText: { color: "#fff", fontSize: 16 },
  loadingWrap: { alignItems: "center", gap: 16, paddingTop: 80 },
  loadingText: { fontSize: 14 },
  prevAnswers: { gap: 8 },
  prevLabel: { fontSize: 11, fontFamily: "Inter_600SemiBold", letterSpacing: 1.2 },
  prevItem: { borderRadius: 12, borderWidth: 1, padding: 12, gap: 4 },
  prevQ: { fontSize: 12 },
  prevA: { fontSize: 14 },
  resultCard: { borderRadius: 16, borderWidth: 1.5, padding: 18, gap: 10 },
  resultHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  resultCategory: { fontSize: 17, flex: 1 },
  resultSummary: { fontSize: 14, lineHeight: 21 },
  sectionLabel: { fontSize: 11, fontFamily: "Inter_600SemiBold", letterSpacing: 1.2 },
  savedBanner: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 12, borderWidth: 1, paddingVertical: 14 },
  savedText: { fontSize: 14 },
  resetBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, borderRadius: 12, borderWidth: 1, paddingVertical: 12 },
  resetText: { fontSize: 14 },
});
