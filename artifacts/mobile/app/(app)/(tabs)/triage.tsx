import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState, useRef } from "react";
import {
  Animated,
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

type Pathway = "lumbar" | "cervical" | "hip" | "knee" | null;
type Step = 1 | 2 | 3;

interface PathwayConfig {
  id: Pathway;
  title: string;
  subtitle: string;
  score: string;
  questions: { text: string; options: string[] }[];
}

const PATHWAYS: PathwayConfig[] = [
  {
    id: "lumbar",
    title: "Lumbar Spine",
    subtitle: "ODI",
    score: "Oswestry Disability Index",
    questions: [
      {
        text: "Pain Intensity",
        options: [
          "I have no pain at the moment",
          "The pain is very mild at the moment",
          "The pain is moderate at the moment",
          "The pain is fairly severe at the moment",
          "The pain is very severe at the moment",
          "The pain is the worst imaginable",
        ],
      },
      {
        text: "Lifting",
        options: [
          "I can lift heavy weights without extra pain",
          "I can lift heavy weights but it gives extra pain",
          "Pain prevents me lifting heavy weights off the floor",
          "Pain prevents me lifting heavy weights but I can if well positioned",
          "I can lift only very light weights",
          "I cannot lift or carry anything at all",
        ],
      },
      {
        text: "Walking",
        options: [
          "Pain does not prevent me walking any distance",
          "Pain prevents me walking more than 1 mile",
          "Pain prevents me walking more than 1/2 mile",
          "Pain prevents me walking more than 1/4 mile",
          "I can only walk using a stick or crutches",
          "I am in bed most of the time",
        ],
      },
      {
        text: "Sitting",
        options: [
          "I can sit in any chair as long as I like",
          "I can only sit in my favourite chair as long as I like",
          "Pain prevents me sitting more than 1 hour",
          "Pain prevents me sitting more than 1/2 hour",
          "Pain prevents me sitting more than 10 minutes",
          "Pain prevents me from sitting at all",
        ],
      },
      {
        text: "Standing",
        options: [
          "I can stand as long as I want without extra pain",
          "I can stand as long as I want but it gives me extra pain",
          "Pain prevents me from standing for more than 1 hour",
          "Pain prevents me from standing for more than 30 minutes",
          "Pain prevents me from standing for more than 10 minutes",
          "Pain prevents me from standing at all",
        ],
      },
    ],
  },
  {
    id: "cervical",
    title: "Cervical Spine",
    subtitle: "mJOA",
    score: "Modified Japanese Orthopaedic Association",
    questions: [
      {
        text: "Upper Extremity Motor Function",
        options: [
          "Normal (5/5 motor power)",
          "Mild — expanded (4/5 motor power)",
          "Moderate — significant difficulty with chopsticks/button",
          "Severe — unable to use hands for writing",
          "Very Severe — unable to use hands at all",
          "Paralysis",
        ],
      },
      {
        text: "Lower Extremity Motor Function",
        options: [
          "Normal gait",
          "Mild — mild imbalance, walks without aid",
          "Moderate — walks with aid (stick/frame)",
          "Severe — unable to walk without help",
          "Very Severe — wheelchair-dependent",
          "Bed-bound",
        ],
      },
      {
        text: "Upper Extremity Sensory",
        options: [
          "Normal sensation",
          "Mild dysaesthesia",
          "Moderate — loss of sensation but functions",
          "Severe — significant sensory deficit affecting function",
          "Very Severe — analgesia in hands",
          "Complete loss",
        ],
      },
      {
        text: "Bladder Function",
        options: [
          "Normal",
          "Mild frequency/urgency",
          "Moderate — requires Valsalva manoeuvre",
          "Severe — incomplete voiding, dribbling",
          "Very Severe — urinary retention with overflow",
          "Complete retention / catheter-dependent",
        ],
      },
    ],
  },
  {
    id: "hip",
    title: "Hip Joint",
    subtitle: "OHS",
    score: "Oxford Hip Score",
    questions: [
      {
        text: "Hip Pain — How would you describe the pain you usually have from your hip?",
        options: [
          "None",
          "Very mild",
          "Mild",
          "Moderate",
          "Severe",
          "Unbearable",
        ],
      },
      {
        text: "Washing — Have you had trouble washing and drying yourself because of your hip?",
        options: [
          "No trouble at all",
          "Very little trouble",
          "Moderate trouble",
          "Extreme difficulty",
          "Impossible to do",
          "Not applicable",
        ],
      },
      {
        text: "Transport — Have you had difficulty getting in and out of a car or public transport?",
        options: [
          "No difficulty at all",
          "Very little difficulty",
          "Moderate difficulty",
          "Great difficulty",
          "Impossible to do",
          "Not applicable",
        ],
      },
      {
        text: "Walking — How long are you able to walk before the pain from your hip becomes severe?",
        options: [
          "No pain / more than 30 minutes",
          "16-30 minutes",
          "5-15 minutes",
          "Around the house only",
          "Not at all — pain is severe on walking",
          "Cannot walk",
        ],
      },
      {
        text: "Standing — Have you been troubled by pain from your hip while in bed at night?",
        options: [
          "No nights",
          "Only 1 or 2 nights",
          "Some nights",
          "Most nights",
          "Every night",
          "Unable to sleep",
        ],
      },
    ],
  },
  {
    id: "knee",
    title: "Knee Joint",
    subtitle: "OKS",
    score: "Oxford Knee Score",
    questions: [
      {
        text: "Pain — How would you describe the pain you usually have from your knee?",
        options: [
          "None",
          "Very mild",
          "Mild",
          "Moderate",
          "Severe",
          "Unbearable",
        ],
      },
      {
        text: "Stairs — Have you had difficulty going up and down stairs?",
        options: [
          "No difficulty at all",
          "Little difficulty",
          "Moderate difficulty",
          "Extreme difficulty",
          "Impossible to do",
          "Not applicable",
        ],
      },
      {
        text: "Standing — Have you had difficulty standing for more than 15 minutes?",
        options: [
          "No difficulty",
          "Very little difficulty",
          "Moderate difficulty",
          "Extreme difficulty",
          "Impossible",
          "Not applicable",
        ],
      },
      {
        text: "Limping — Do you limp when you walk because of your knee?",
        options: [
          "Rarely / never",
          "Sometimes or just at first",
          "Often, not just at first",
          "Most of the time",
          "All of the time",
          "Unable to walk",
        ],
      },
      {
        text: "Night Pain — Have you been troubled by pain from your knee in bed at night?",
        options: [
          "No nights",
          "Only 1 or 2 nights",
          "Some nights",
          "Most nights",
          "Every night",
          "Unable to sleep",
        ],
      },
    ],
  },
];

function getPathwayScore(answers: number[], pathway: Pathway) {
  const total = answers.reduce((a, b) => a + b, 0);
  const maxScore = answers.length * 5;
  const pct = Math.round((total / maxScore) * 100);

  if (pathway === "lumbar") {
    let category = "Minimal Disability";
    let urgency = "Routine physiotherapy appropriate";
    let action = "Initiate physiotherapy programme with core stabilisation exercises.";
    if (pct >= 61) {
      category = "Crippling Back Pain";
      urgency = "Urgent orthopaedic referral required";
      action = "Refer to orthopaedic consultant urgently. Consider MRI spine.";
    } else if (pct >= 41) {
      category = "Severe Disability";
      urgency = "Priority orthopaedic review recommended";
      action = "Refer to musculoskeletal specialist. Multidisciplinary team involvement.";
    } else if (pct >= 21) {
      category = "Moderate Disability";
      urgency = "Physiotherapy with monitoring";
      action = "Commence structured physiotherapy. Review in 6 weeks.";
    }
    return { pct, category, urgency, action };
  }

  if (pathway === "cervical") {
    let category = "Mild Myelopathy";
    let urgency = "Neurosurgical outpatient review";
    let action = "Refer to neurosurgery outpatient. MRI cervical spine required.";
    if (pct >= 60) {
      category = "Severe Myelopathy";
      urgency = "Urgent neurosurgical referral";
      action = "URGENT: Refer to neurosurgery. Cervical cord compression likely. Avoid manipulation.";
    } else if (pct >= 35) {
      category = "Moderate Myelopathy";
      urgency = "Priority neurosurgical review";
      action = "Priority neurosurgical referral. MRI within 2 weeks.";
    }
    return { pct, category, urgency, action };
  }

  // OHS / OKS (higher score = worse)
  let category = "Excellent";
  let urgency = "Conservative management";
  let action = "Physiotherapy and activity modification. Review in 3 months.";
  if (pct >= 60) {
    category = "Poor Function";
    urgency = "Orthopaedic referral recommended";
    action = "Refer to orthopaedic consultant for assessment. Consider imaging.";
  } else if (pct >= 40) {
    category = "Fair Function";
    urgency = "Physiotherapy with orthopaedic review";
    action = "Structured physiotherapy. Orthopaedic review if no improvement in 3 months.";
  } else if (pct >= 20) {
    category = "Good Function";
    urgency = "Physiotherapy appropriate";
    action = "Continue physiotherapy. Exercise programme and lifestyle modification.";
  }
  return { pct, category, urgency, action };
}

export default function TriageScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState<Step>(1);
  const [selectedPathway, setSelectedPathway] = useState<Pathway>(null);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 + 68 : insets.bottom + 64;

  const pathwayConfig = PATHWAYS.find((p) => p.id === selectedPathway);

  function fade(cb: () => void) {
    Animated.timing(fadeAnim, { toValue: 0, duration: 160, useNativeDriver: true }).start(() => {
      cb();
      Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    });
  }

  function handleBeginScoring() {
    if (!selectedPathway) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setCurrentQ(0);
    setAnswers([]);
    setSelectedOption(null);
    fade(() => setStep(2));
  }

  function handleNextQuestion() {
    if (selectedOption === null) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newAnswers = [...answers, selectedOption];
    setAnswers(newAnswers);

    if (!pathwayConfig) return;
    if (currentQ + 1 < pathwayConfig.questions.length) {
      fade(() => { setCurrentQ(currentQ + 1); setSelectedOption(null); });
    } else {
      fade(() => setStep(3));
    }
  }

  function handleReset() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setStep(1);
    setSelectedPathway(null);
    setCurrentQ(0);
    setAnswers([]);
    setSelectedOption(null);
    fadeAnim.setValue(1);
  }

  const result = step === 3 && pathwayConfig ? getPathwayScore(answers, selectedPathway) : null;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: topPad + 16, paddingBottom: bottomPad + 16 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Subtitle */}
        <Text style={[styles.subtitle, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
          Validated scoring routing for Irish orthopaedic service delivery.
        </Text>

        {/* Step Indicator */}
        <View style={[styles.stepRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {[
            { n: 1, label: "Pathway" },
            { n: 2, label: "Scoring" },
            { n: 3, label: "Referral Packet" },
          ].map((s, i) => {
            const active = step === s.n;
            const done = step > s.n;
            return (
              <React.Fragment key={s.n}>
                <View style={styles.stepItem}>
                  <View
                    style={[
                      styles.stepCircle,
                      {
                        backgroundColor: active ? colors.primary : "transparent",
                        borderColor: active ? colors.primary : done ? colors.primary : colors.border,
                      },
                    ]}
                  >
                    {done ? (
                      <Feather name="check" size={12} color={colors.primary} />
                    ) : (
                      <Text
                        style={[
                          styles.stepNum,
                          { color: active ? "#fff" : colors.mutedForeground, fontFamily: "Inter_600SemiBold" },
                        ]}
                      >
                        {s.n}
                      </Text>
                    )}
                  </View>
                  <Text
                    style={[
                      styles.stepLabel,
                      { color: active ? colors.foreground : colors.mutedForeground, fontFamily: active ? "Inter_600SemiBold" : "Inter_400Regular" },
                    ]}
                  >
                    {s.label}
                  </Text>
                </View>
                {i < 2 && (
                  <View style={[styles.stepLine, { backgroundColor: step > s.n ? colors.primary : colors.border }]} />
                )}
              </React.Fragment>
            );
          })}
        </View>

        <Animated.View style={{ opacity: fadeAnim }}>
          {/* STEP 1: Pathway selector */}
          {step === 1 && (
            <View style={styles.stepWrap}>
              <Text style={[styles.stepHeading, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
                Select Anatomical Pathway
              </Text>
              <View style={styles.pathwayGrid}>
                {PATHWAYS.map((p) => {
                  const isSelected = selectedPathway === p.id;
                  return (
                    <TouchableOpacity
                      key={p.id}
                      activeOpacity={0.85}
                      onPress={() => { Haptics.selectionAsync(); setSelectedPathway(p.id); }}
                      style={[
                        styles.pathwayCard,
                        {
                          backgroundColor: colors.card,
                          borderColor: isSelected ? colors.primary : colors.border,
                          borderWidth: isSelected ? 1.5 : 1,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.pathwayTitle,
                          {
                            color: isSelected ? colors.primary : colors.foreground,
                            fontFamily: "Inter_700Bold",
                          },
                        ]}
                      >
                        {p.title}
                      </Text>
                      <Text
                        style={[
                          styles.pathwayScore,
                          {
                            color: isSelected ? colors.primaryLight : colors.mutedForeground,
                            fontFamily: "Inter_400Regular",
                          },
                        ]}
                      >
                        ({p.subtitle})
                      </Text>
                      <Text style={[styles.pathwaySub, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                        Initiate functional mapping
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handleBeginScoring}
                disabled={!selectedPathway}
                style={[
                  styles.primaryBtn,
                  { backgroundColor: colors.primary, opacity: selectedPathway ? 1 : 0.4 },
                ]}
              >
                <Text style={[styles.primaryBtnText, { fontFamily: "Inter_600SemiBold" }]}>
                  Begin Scoring
                </Text>
                <Feather name="arrow-right" size={18} color="#fff" />
              </TouchableOpacity>
            </View>
          )}

          {/* STEP 2: Scoring */}
          {step === 2 && pathwayConfig && (
            <View style={styles.stepWrap}>
              <View style={[styles.pathwayBadge, { backgroundColor: colors.physioBg, borderColor: colors.physioBorder }]}>
                <Text style={[styles.pathwayBadgeText, { color: colors.primary, fontFamily: "Inter_600SemiBold" }]}>
                  {pathwayConfig.title} — {pathwayConfig.score}
                </Text>
              </View>

              {/* Progress */}
              <View style={styles.qProgress}>
                <Text style={[styles.qProgressText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                  Question {currentQ + 1} of {pathwayConfig.questions.length}
                </Text>
                <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        backgroundColor: colors.primary,
                        width: `${((currentQ + 1) / pathwayConfig.questions.length) * 100}%` as any,
                      },
                    ]}
                  />
                </View>
              </View>

              <Text style={[styles.questionText, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
                {pathwayConfig.questions[currentQ].text}
              </Text>

              <View style={styles.optionsList}>
                {pathwayConfig.questions[currentQ].options.map((opt, i) => {
                  const selected = selectedOption === i;
                  return (
                    <TouchableOpacity
                      key={i}
                      activeOpacity={0.8}
                      onPress={() => { Haptics.selectionAsync(); setSelectedOption(i); }}
                      style={[
                        styles.optionItem,
                        {
                          backgroundColor: selected ? colors.physioBg : colors.card,
                          borderColor: selected ? colors.primary : colors.border,
                          borderWidth: selected ? 1.5 : 1,
                        },
                      ]}
                    >
                      <View
                        style={[
                          styles.optionCircle,
                          {
                            backgroundColor: selected ? colors.primary : "transparent",
                            borderColor: selected ? colors.primary : colors.border,
                          },
                        ]}
                      >
                        {selected && <Feather name="check" size={11} color="#fff" />}
                      </View>
                      <Text
                        style={[
                          styles.optionText,
                          {
                            color: selected ? colors.foreground : colors.mutedForeground,
                            fontFamily: selected ? "Inter_500Medium" : "Inter_400Regular",
                          },
                        ]}
                      >
                        {opt}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handleNextQuestion}
                disabled={selectedOption === null}
                style={[styles.primaryBtn, { backgroundColor: colors.primary, opacity: selectedOption !== null ? 1 : 0.4 }]}
              >
                <Text style={[styles.primaryBtnText, { fontFamily: "Inter_600SemiBold" }]}>
                  {currentQ + 1 < pathwayConfig.questions.length ? "Next Question" : "Get Results"}
                </Text>
                <Feather name={currentQ + 1 < pathwayConfig.questions.length ? "arrow-right" : "check-circle"} size={18} color="#fff" />
              </TouchableOpacity>
            </View>
          )}

          {/* STEP 3: Results */}
          {step === 3 && result && pathwayConfig && (
            <View style={styles.stepWrap}>
              <Text style={[styles.stepHeading, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
                Referral Packet
              </Text>

              <LinearGradient
                colors={result.pct >= 60 ? ["#2a1218", "#3d1a22"] : result.pct >= 40 ? ["#2a1e0d", "#3d2d0d"] : ["#0f1230", "#1a2060"]}
                style={[styles.resultCard, { borderColor: result.pct >= 60 ? colors.emergencyBorder : result.pct >= 40 ? colors.fastTrackBorder : colors.physioBorder }]}
              >
                <View style={styles.resultTop}>
                  <Text style={[styles.resultScore, { fontFamily: "Inter_700Bold", color: result.pct >= 60 ? colors.emergency : result.pct >= 40 ? colors.fastTrack : colors.primary }]}>
                    {result.pct}%
                  </Text>
                  <View>
                    <Text style={[styles.resultCategory, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
                      {result.category}
                    </Text>
                    <Text style={[styles.resultPathway, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                      {pathwayConfig.title} — {pathwayConfig.subtitle}
                    </Text>
                  </View>
                </View>
                <View style={[styles.resultDivider, { backgroundColor: "rgba(255,255,255,0.1)" }]} />
                <View style={styles.urgencyRow}>
                  <MaterialCommunityIcons name="clipboard-arrow-right" size={14} color={colors.mutedForeground} />
                  <Text style={[styles.urgencyText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                    {result.urgency}
                  </Text>
                </View>
                <Text style={[styles.actionText, { color: colors.foreground, fontFamily: "Inter_400Regular" }]}>
                  {result.action}
                </Text>
              </LinearGradient>

              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)}
                style={[styles.primaryBtn, { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.primary }]}
              >
                <MaterialCommunityIcons name="file-document" size={18} color={colors.primary} />
                <Text style={[styles.primaryBtnText, { fontFamily: "Inter_600SemiBold", color: colors.primary }]}>
                  Generate Referral Packet
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.7}
                onPress={handleReset}
                style={[styles.secondaryBtn, { borderColor: colors.border }]}
              >
                <Feather name="refresh-ccw" size={14} color={colors.mutedForeground} />
                <Text style={[styles.secondaryBtnText, { color: colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>
                  New Assessment
                </Text>
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
  scroll: { paddingHorizontal: 16, gap: 14 },
  subtitle: { fontSize: 14, textAlign: "center", lineHeight: 20 },
  stepRow: { flexDirection: "row", alignItems: "center", borderRadius: 16, borderWidth: 1, padding: 16, gap: 0 },
  stepItem: { alignItems: "center", gap: 6, flex: 0 },
  stepCircle: { width: 32, height: 32, borderRadius: 16, borderWidth: 1.5, alignItems: "center", justifyContent: "center" },
  stepNum: { fontSize: 13 },
  stepLabel: { fontSize: 11, textAlign: "center" },
  stepLine: { flex: 1, height: 1, marginHorizontal: 6 },
  stepWrap: { gap: 14 },
  stepHeading: { fontSize: 22, letterSpacing: -0.3 },
  pathwayGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  pathwayCard: { width: "47%", borderRadius: 14, padding: 16, gap: 4, minHeight: 100 },
  pathwayTitle: { fontSize: 16, lineHeight: 22 },
  pathwayScore: { fontSize: 13 },
  pathwaySub: { fontSize: 11, marginTop: 4 },
  primaryBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, borderRadius: 14, paddingVertical: 16 },
  primaryBtnText: { color: "#fff", fontSize: 15 },
  pathwayBadge: { borderRadius: 10, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 8, alignSelf: "flex-start" },
  pathwayBadgeText: { fontSize: 12 },
  qProgress: { gap: 8 },
  qProgressText: { fontSize: 12 },
  progressBar: { height: 3, borderRadius: 2, overflow: "hidden" },
  progressFill: { height: 3, borderRadius: 2 },
  questionText: { fontSize: 17, lineHeight: 24 },
  optionsList: { gap: 8 },
  optionItem: { flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 12, padding: 14 },
  optionCircle: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  optionText: { fontSize: 13, flex: 1, lineHeight: 18 },
  resultCard: { borderRadius: 18, borderWidth: 1.5, padding: 20, gap: 12 },
  resultTop: { flexDirection: "row", alignItems: "center", gap: 16 },
  resultScore: { fontSize: 44, lineHeight: 50 },
  resultCategory: { fontSize: 18, letterSpacing: -0.3 },
  resultPathway: { fontSize: 12, marginTop: 2 },
  resultDivider: { height: 1 },
  urgencyRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  urgencyText: { fontSize: 12 },
  actionText: { fontSize: 14, lineHeight: 21 },
  secondaryBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 12, borderWidth: 1, paddingVertical: 12 },
  secondaryBtnText: { fontSize: 14 },
});
