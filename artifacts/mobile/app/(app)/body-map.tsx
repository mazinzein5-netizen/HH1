import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useRef, useState } from "react";
import {
  Alert,
  Animated,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Svg, { Circle, Ellipse, Path, Rect } from "react-native-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ThemedStatusBar from "@/components/ThemedStatusBar";
import HoneycombWallpaper from "@/components/HoneycombWallpaper";
import { useHiveBot } from "@/context/HiveBotContext";
import { useLogoTheme } from "@/context/LogoThemeContext";
import { useColors } from "@/hooks/useColors";
import { RED_FLAG_QUESTIONS, type PathwayKey } from "@/data/pathwayQuestions";

export const HIVE_PAIN_DOCTOR_NUMBER = "1800 494 483";

type Region = "upperLimb" | "spine" | "leg";
type Step =
  | "map"
  | "menu"
  | "kneeDuration"
  | "kneeRedFlags"
  | "acuteKnee"
  | "acuteResult"
  | "hipScreen"
  | "hipResult"
  | "neckShoulder"
  | "neckShoulderResult";

interface MenuOption {
  label: string;
  sub: string;
  icon: string;
  action: { type: "pathway"; key: PathwayKey } | { type: "step"; step: Step };
}

const REGION_META: Record<Region, { title: string; blurb: string }> = {
  upperLimb: {
    title: "Arm & Hand",
    blurb: "Choose the part of your arm that hurts the most.",
  },
  spine: {
    title: "Back & Neck",
    blurb: "Choose the part of your back or neck that hurts the most.",
  },
  leg: {
    title: "Leg & Foot",
    blurb: "Choose the part of your leg that hurts the most.",
  },
};

const REGION_MENUS: Record<Region, MenuOption[]> = {
  upperLimb: [
    { label: "Shoulder", sub: "Pain at the top of the arm", icon: "arm-flex", action: { type: "step", step: "neckShoulder" } },
    { label: "Elbow", sub: "Pain around the elbow joint", icon: "angle-acute", action: { type: "pathway", key: "elbow" } },
    { label: "Wrist & Hand", sub: "Pain, numbness or tingling", icon: "hand-back-right", action: { type: "pathway", key: "wristHand" } },
  ],
  spine: [
    { label: "Neck / Shoulder", sub: "We'll help work out which one", icon: "head-outline", action: { type: "step", step: "neckShoulder" } },
    { label: "Mid Back", sub: "Between the shoulder blades", icon: "human-male", action: { type: "pathway", key: "thoracic" } },
    { label: "Low Back", sub: "Lower back, may reach the legs", icon: "seat-outline", action: { type: "pathway", key: "lumbar" } },
  ],
  leg: [
    { label: "Hip", sub: "Groin, buttock or thigh pain", icon: "walk", action: { type: "step", step: "hipScreen" } },
    { label: "Knee", sub: "Pain in or around the knee", icon: "run", action: { type: "step", step: "kneeDuration" } },
    { label: "Ankle & Foot", sub: "Pain below the knee joint", icon: "shoe-print", action: { type: "pathway", key: "ankleFoot" } },
  ],
};

/* ─── Acute knee proforma ─── */
const ACUTE_KNEE_QUESTIONS: { text: string; options: string[] }[] = [
  {
    text: "What happened to your knee?",
    options: ["Twisted it (sport or turning)", "Fell or landed on it", "Direct blow or knock", "It just started hurting — no injury"],
  },
  {
    text: "When did the pain start?",
    options: ["Today", "In the last week", "1–2 weeks ago", "2–4 weeks ago"],
  },
  {
    text: "Did the knee swell up?",
    options: ["Yes — within 2 hours", "Yes — the next day or later", "A little", "No swelling"],
  },
  {
    text: "Can you put weight on that leg?",
    options: ["Yes, walking normally", "Yes, but it is painful", "Only a few steps", "No — I cannot stand on it"],
  },
  {
    text: "Does the knee lock, catch, or give way?",
    options: ["No", "It feels wobbly / gives way", "It catches sometimes", "It locks — I can't straighten it"],
  },
];

/* ─── Hip neurogenic screen ─── */
const HIP_SCREEN_QUESTIONS: string[] = [
  "Does the pain travel from your back or buttock down the leg, past the knee?",
  "Do you get numbness, tingling or 'electric' feelings in the leg or foot?",
  "Is the pain worse when sitting, coughing, or sneezing rather than when walking?",
];

/* ─── Neck vs shoulder differentiator ─── */
const NECK_SHOULDER_QUESTIONS: { text: string; options: [string, string] }[] = [
  {
    text: "What makes the pain worse?",
    options: ["Turning or tilting my head", "Lifting or reaching with my arm"],
  },
  {
    text: "Where do you feel it most?",
    options: ["Neck, with pain spreading down the arm", "The shoulder itself, at the top of the arm"],
  },
  {
    text: "Do you have numbness or tingling in your hand or fingers?",
    options: ["Yes — numbness or tingling", "No — just pain in the shoulder"],
  },
];

export default function BodyMapScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { prefs } = useLogoTheme();
  const hiveBot = useHiveBot();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const [step, setStep] = useState<Step>("map");
  const [region, setRegion] = useState<Region | null>(null);
  const [acuteAnswers, setAcuteAnswers] = useState<(number | null)[]>(new Array(ACUTE_KNEE_QUESTIONS.length).fill(null));
  const [kneeRedFlagAnswers, setKneeRedFlagAnswers] = useState<(boolean | null)[]>(new Array(RED_FLAG_QUESTIONS.length).fill(null));
  const [hipAnswers, setHipAnswers] = useState<(boolean | null)[]>(new Array(HIP_SCREEN_QUESTIONS.length).fill(null));
  const [nsAnswers, setNsAnswers] = useState<(number | null)[]>(new Array(NECK_SHOULDER_QUESTIONS.length).fill(null));

  const zoom = useRef(new Animated.Value(0)).current;

  function pickRegion(r: Region) {
    Haptics.selectionAsync();
    setRegion(r);
    setStep("menu");
    Animated.spring(zoom, { toValue: 1, useNativeDriver: true, friction: 8 }).start();
  }

  function backToMap() {
    Haptics.selectionAsync();
    setStep("map");
    setRegion(null);
    Animated.spring(zoom, { toValue: 0, useNativeDriver: true, friction: 8 }).start();
  }

  function goToPathway(key: PathwayKey) {
    Haptics.selectionAsync();
    router.push({ pathname: "/(app)/(tabs)/triage", params: { pathway: key, ts: String(Date.now()) } });
  }

  function handleMenuOption(opt: MenuOption) {
    if (opt.action.type === "pathway") {
      goToPathway(opt.action.key);
    } else {
      Haptics.selectionAsync();
      if (opt.action.step === "kneeDuration") {
        setAcuteAnswers(new Array(ACUTE_KNEE_QUESTIONS.length).fill(null));
        setKneeRedFlagAnswers(new Array(RED_FLAG_QUESTIONS.length).fill(null));
      }
      if (opt.action.step === "hipScreen") setHipAnswers(new Array(HIP_SCREEN_QUESTIONS.length).fill(null));
      if (opt.action.step === "neckShoulder") setNsAnswers(new Array(NECK_SHOULDER_QUESTIONS.length).fill(null));
      setStep(opt.action.step);
    }
  }

  function callPainDoctor() {
    const tel = HIVE_PAIN_DOCTOR_NUMBER.replace(/\s/g, "");
    Alert.alert(
      "Call the HIVE Pain Doctor",
      `This will call the HIVE pain doctor line on ${HIVE_PAIN_DOCTOR_NUMBER}.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Call now",
          onPress: () =>
            Linking.openURL(`tel:${tel}`).catch(() => {
              Alert.alert("Unable to place call", `Please dial ${HIVE_PAIN_DOCTOR_NUMBER} manually.`);
            }),
        },
      ]
    );
  }

  const kneeHasRedFlag = kneeRedFlagAnswers.some((a) => a === true);
  const hipPositive = hipAnswers.some((a) => a === true);
  const nsShoulderVotes = nsAnswers.filter((a) => a === 1).length;
  const nsIsShoulder = nsShoulderVotes >= 2;

  /* ── zoom transforms per region ── */
  const regionTransforms: Record<Region, { scale: number; tx: number; ty: number }> = {
    upperLimb: { scale: 1.7, tx: 0, ty: 55 },
    spine: { scale: 1.7, tx: 0, ty: 30 },
    leg: { scale: 1.7, tx: 0, ty: -70 },
  };
  const active = region ? regionTransforms[region] : { scale: 1, tx: 0, ty: 0 };
  const scale = zoom.interpolate({ inputRange: [0, 1], outputRange: [1, active.scale] });
  const translateY = zoom.interpolate({ inputRange: [0, 1], outputRange: [0, active.ty] });

  const outline = colors.foreground;
  const fillIdle = colors.glass;
  const fillActive = colors.glassGold;
  const strokeActive = colors.gold;

  function zoneProps(r: Region) {
    const isActive = region === r;
    return {
      fill: isActive ? fillActive : "transparent",
      stroke: isActive ? strokeActive : "transparent",
      strokeWidth: 2.5,
      onPress: step === "map" ? () => pickRegion(r) : undefined,
    };
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ThemedStatusBar backgroundColor="transparent" translucent />
      <HoneycombWallpaper density={prefs.density} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 8 }]}>
        <TouchableOpacity
          onPress={() => {
            if (step === "map") router.back();
            else if (step === "menu") backToMap();
            else if (step === "acuteResult") setStep("acuteKnee");
            else if (step === "acuteKnee") setStep("kneeRedFlags");
            else if (step === "kneeRedFlags") setStep("kneeDuration");
            else if (step === "hipResult") setStep("hipScreen");
            else if (step === "neckShoulderResult") setStep("neckShoulder");
            else setStep("menu");
          }}
          style={[styles.backBtn, { backgroundColor: colors.glass, borderColor: colors.glassBorder }]}
          activeOpacity={0.7}
        >
          <Feather name="chevron-left" size={26} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
          Where Is Your Pain?
        </Text>
        <View style={{ width: 48 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: bottomPad + 28, paddingHorizontal: 20 }}
        showsVerticalScrollIndicator={false}
      >
        {(step === "map" || step === "menu") && (
          <>
            <Text style={[styles.explain, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              {step === "map"
                ? "Tap the area of the body where you feel pain. We will then ask a few simple questions to guide you to the right care."
                : REGION_META[region!].blurb}
            </Text>

            {/* Body figure */}
            <View style={styles.figureWrap}>
              <Animated.View style={{ transform: [{ translateY }, { scale }] }}>
                <Svg width={230} height={340} viewBox="0 0 200 300">
                  {/* figure outline */}
                  <Circle cx={100} cy={26} r={18} stroke={outline} strokeWidth={2.5} fill={fillIdle} />
                  <Path d="M92 44 L92 52 L108 52 L108 44" stroke={outline} strokeWidth={2.5} fill="none" />
                  {/* torso */}
                  <Path
                    d="M72 56 Q100 50 128 56 L124 130 Q100 138 76 130 Z"
                    stroke={outline}
                    strokeWidth={2.5}
                    fill={fillIdle}
                  />
                  {/* arms */}
                  <Path d="M72 58 Q58 64 54 92 L48 128 Q46 136 52 138 Q58 140 60 132 L68 96" stroke={outline} strokeWidth={2.5} fill={fillIdle} />
                  <Path d="M128 58 Q142 64 146 92 L152 128 Q154 136 148 138 Q142 140 140 132 L132 96" stroke={outline} strokeWidth={2.5} fill={fillIdle} />
                  {/* legs */}
                  <Path d="M80 134 L76 200 L74 262 Q74 270 82 270 Q90 270 90 262 L94 202 L97 148" stroke={outline} strokeWidth={2.5} fill={fillIdle} />
                  <Path d="M120 134 L124 200 L126 262 Q126 270 118 270 Q110 270 110 262 L106 202 L103 148" stroke={outline} strokeWidth={2.5} fill={fillIdle} />
                  {/* feet */}
                  <Path d="M74 268 L64 274 Q62 278 68 278 L86 278" stroke={outline} strokeWidth={2} fill="none" />
                  <Path d="M126 268 L136 274 Q138 278 132 278 L114 278" stroke={outline} strokeWidth={2} fill="none" />

                  {/* tap zones */}
                  <Rect x={38} y={50} width={40} height={96} rx={14} {...zoneProps("upperLimb")} />
                  <Rect x={122} y={50} width={40} height={96} rx={14} {...zoneProps("upperLimb")} />
                  <Rect x={80} y={8} width={40} height={132} rx={14} {...zoneProps("spine")} />
                  <Rect x={66} y={140} width={68} height={144} rx={14} {...zoneProps("leg")} />
                  {/* zone dots for discoverability */}
                  {step === "map" && (
                    <>
                      <Circle cx={58} cy={92} r={7} fill={colors.gold} onPress={() => pickRegion("upperLimb")} />
                      <Circle cx={142} cy={92} r={7} fill={colors.gold} onPress={() => pickRegion("upperLimb")} />
                      <Circle cx={100} cy={90} r={7} fill={colors.gold} onPress={() => pickRegion("spine")} />
                      <Circle cx={100} cy={200} r={7} fill={colors.gold} onPress={() => pickRegion("leg")} />
                    </>
                  )}
                </Svg>
              </Animated.View>
            </View>

            {step === "map" && (
              <View style={{ gap: 12 }}>
                {(Object.keys(REGION_META) as Region[]).map((r) => (
                  <TouchableOpacity
                    key={r}
                    activeOpacity={0.85}
                    onPress={() => pickRegion(r)}
                    style={[styles.regionBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
                  >
                    <View style={[styles.regionIcon, { backgroundColor: colors.glassGold, borderColor: colors.glassGoldBorder }]}>
                      <MaterialCommunityIcons
                        name={r === "upperLimb" ? "arm-flex" : r === "spine" ? "human-male" : "walk"}
                        size={26}
                        color={colors.gold}
                      />
                    </View>
                    <Text style={[styles.regionLabel, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
                      {REGION_META[r].title}
                    </Text>
                    <Feather name="chevron-right" size={22} color={colors.mutedForeground} />
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {step === "menu" && region && (
              <View style={{ gap: 12 }}>
                <Text style={[styles.menuTitle, { color: colors.gold, fontFamily: "Inter_700Bold" }]}>
                  {REGION_META[region].title}
                </Text>
                {REGION_MENUS[region].map((opt) => (
                  <TouchableOpacity
                    key={opt.label}
                    activeOpacity={0.85}
                    onPress={() => handleMenuOption(opt)}
                    style={[styles.regionBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
                  >
                    <View style={[styles.regionIcon, { backgroundColor: colors.glassPrimary, borderColor: colors.glassPrimaryBorder }]}>
                      <MaterialCommunityIcons name={opt.icon as any} size={26} color={colors.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.regionLabel, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
                        {opt.label}
                      </Text>
                      <Text style={[styles.regionSub, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                        {opt.sub}
                      </Text>
                    </View>
                    <Feather name="chevron-right" size={22} color={colors.mutedForeground} />
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </>
        )}

        {/* ── Knee duration branch ── */}
        {step === "kneeDuration" && (
          <View style={{ gap: 14, marginTop: 6 }}>
            <Text style={[styles.qTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
              How long have you had this knee pain?
            </Text>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => {
                Haptics.selectionAsync();
                setAcuteAnswers(new Array(ACUTE_KNEE_QUESTIONS.length).fill(null));
                setKneeRedFlagAnswers(new Array(RED_FLAG_QUESTIONS.length).fill(null));
                setStep("kneeRedFlags");
              }}
              style={[styles.bigOption, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <MaterialCommunityIcons name="clock-fast" size={28} color={colors.fastTrack} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.bigOptionLabel, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
                  Less than a month
                </Text>
                <Text style={[styles.regionSub, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                  A recent or sudden problem — we'll ask what happened
                </Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => goToPathway("knee")}
              style={[styles.bigOption, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <MaterialCommunityIcons name="calendar-month" size={28} color={colors.primary} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.bigOptionLabel, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
                  More than a month
                </Text>
                <Text style={[styles.regionSub, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                  A longer-term problem — Oxford Knee Score questionnaire
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Knee red-flag safety questions ── */}
        {step === "kneeRedFlags" && (
          <View style={{ gap: 16, marginTop: 6 }}>
            <Text style={[styles.explain, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              First, some important safety questions. Please answer all of them honestly — if you answer yes to any, please contact your GP urgently or call 112.
            </Text>
            {RED_FLAG_QUESTIONS.map((q, qi) => (
              <View key={qi} style={[styles.qCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.qText, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>{q}</Text>
                <View style={{ flexDirection: "row", gap: 10, marginTop: 12 }}>
                  {[true, false].map((val) => {
                    const sel = kneeRedFlagAnswers[qi] === val;
                    return (
                      <TouchableOpacity
                        key={String(val)}
                        activeOpacity={0.8}
                        onPress={() => {
                          Haptics.selectionAsync();
                          const next = [...kneeRedFlagAnswers];
                          next[qi] = val;
                          setKneeRedFlagAnswers(next);
                        }}
                        style={[
                          styles.ynBtn,
                          {
                            backgroundColor: sel ? (val ? colors.emergencyBg : colors.virtualBg) : colors.glass,
                            borderColor: sel ? (val ? colors.emergency : colors.virtual) : colors.glassBorder,
                          },
                        ]}
                      >
                        <Text style={[styles.ynText, { color: sel ? (val ? colors.emergency : colors.virtual) : colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
                          {val ? "Yes" : "No"}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            ))}
            {kneeHasRedFlag && (
              <View style={[styles.warnBox, { backgroundColor: colors.emergencyBg, borderColor: colors.emergencyBorder }]}>
                <Feather name="alert-triangle" size={20} color={colors.emergency} />
                <Text style={[styles.warnText, { color: colors.emergency, fontFamily: "Inter_600SemiBold" }]}>
                  You answered yes to a safety question. Please contact your GP urgently or call 112. You can still continue below.
                </Text>
              </View>
            )}
            <TouchableOpacity
              disabled={kneeRedFlagAnswers.some((a) => a === null)}
              activeOpacity={0.85}
              onPress={() => {
                Haptics.selectionAsync();
                setStep("acuteKnee");
              }}
              style={[styles.primaryCta, { backgroundColor: kneeRedFlagAnswers.some((a) => a === null) ? colors.muted : colors.primary }]}
            >
              <Text style={[styles.primaryCtaText, { fontFamily: "Inter_600SemiBold", color: kneeRedFlagAnswers.some((a) => a === null) ? colors.mutedForeground : "#fff" }]}>
                Continue
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Acute knee proforma ── */}
        {step === "acuteKnee" && (
          <View style={{ gap: 18, marginTop: 6 }}>
            <Text style={[styles.explain, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              A few quick questions about your recent knee injury.
            </Text>
            {ACUTE_KNEE_QUESTIONS.map((q, qi) => (
              <View key={qi} style={[styles.qCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.qText, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>{q.text}</Text>
                <View style={{ gap: 8, marginTop: 10 }}>
                  {q.options.map((opt, oi) => {
                    const sel = acuteAnswers[qi] === oi;
                    return (
                      <TouchableOpacity
                        key={oi}
                        activeOpacity={0.8}
                        onPress={() => {
                          Haptics.selectionAsync();
                          const next = [...acuteAnswers];
                          next[qi] = oi;
                          setAcuteAnswers(next);
                        }}
                        style={[
                          styles.optBtn,
                          {
                            backgroundColor: sel ? colors.glassGold : colors.glass,
                            borderColor: sel ? colors.gold : colors.glassBorder,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.optText,
                            { color: sel ? colors.gold : colors.foreground, fontFamily: sel ? "Inter_600SemiBold" : "Inter_400Regular" },
                          ]}
                        >
                          {opt}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            ))}
            <TouchableOpacity
              disabled={acuteAnswers.some((a) => a === null)}
              activeOpacity={0.85}
              onPress={() => {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                setStep("acuteResult");
              }}
              style={[
                styles.primaryCta,
                {
                  backgroundColor: acuteAnswers.some((a) => a === null) ? colors.muted : colors.primary,
                },
              ]}
            >
              <Text style={[styles.primaryCtaText, { fontFamily: "Inter_600SemiBold", color: acuteAnswers.some((a) => a === null) ? colors.mutedForeground : "#fff" }]}>
                See My Next Step
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Acute knee result ── */}
        {step === "acuteResult" && (
          <View style={{ gap: 16, marginTop: 6 }}>
            <View style={[styles.qCard, { backgroundColor: colors.card, borderColor: colors.gold + "55" }]}>
              <MaterialCommunityIcons name="stethoscope" size={34} color={colors.gold} style={{ marginBottom: 8 }} />
              <Text style={[styles.qTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
                Speak to the HIVE Pain Doctor
              </Text>
              <Text style={[styles.explain, { color: colors.mutedForeground, fontFamily: "Inter_400Regular", marginTop: 8 }]}>
                Because your knee problem is recent, the safest next step is a short call with the HIVE pain doctor. They will review what happened and arrange the right care for you.
              </Text>
              {kneeHasRedFlag && (
                <View style={[styles.warnBox, { backgroundColor: colors.emergencyBg, borderColor: colors.emergencyBorder }]}>
                  <Feather name="alert-triangle" size={20} color={colors.emergency} />
                  <Text style={[styles.warnText, { color: colors.emergency, fontFamily: "Inter_600SemiBold" }]}>
                    Important — based on your safety answers, please contact your GP urgently or call 112.
                  </Text>
                </View>
              )}
              {(acuteAnswers[3] === 3 || acuteAnswers[4] === 3) && (
                <View style={[styles.warnBox, { backgroundColor: colors.emergencyBg, borderColor: colors.emergencyBorder }]}>
                  <Feather name="alert-triangle" size={20} color={colors.emergency} />
                  <Text style={[styles.warnText, { color: colors.emergency, fontFamily: "Inter_600SemiBold" }]}>
                    If you cannot put any weight on the leg, or the knee is locked, please attend an urgent care or emergency department today.
                  </Text>
                </View>
              )}
            </View>
            <TouchableOpacity activeOpacity={0.85} onPress={callPainDoctor} style={[styles.primaryCta, { backgroundColor: colors.gold }]}>
              <Feather name="phone-call" size={20} color="#fff" />
              <Text style={[styles.primaryCtaText, { fontFamily: "Inter_600SemiBold", color: "#fff" }]}>
                Call the HIVE Pain Doctor
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => {
                const labels = ["What happened", "When it started", "Swelling", "Weight-bearing", "Locking or giving way"];
                const seed = `I have a recent knee injury. ${ACUTE_KNEE_QUESTIONS.map((q, i) => `${labels[i]}: ${q.options[acuteAnswers[i] ?? 0]}`).join(". ")}. What should I do while I wait to speak to the pain doctor?`;
                hiveBot.open(seed);
              }}
              style={[styles.secondaryCta, { borderColor: colors.border, backgroundColor: colors.card }]}
            >
              <MaterialCommunityIcons name="robot-happy" size={20} color={colors.gold} />
              <Text style={[styles.primaryCtaText, { fontFamily: "Inter_600SemiBold", color: colors.foreground }]}>
                Ask HIVE Bot for Advice
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Hip neurogenic screen ── */}
        {step === "hipScreen" && (
          <View style={{ gap: 16, marginTop: 6 }}>
            <Text style={[styles.explain, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              Hip pain sometimes comes from the back rather than the hip joint. Three quick questions help us check.
            </Text>
            {HIP_SCREEN_QUESTIONS.map((q, qi) => (
              <View key={qi} style={[styles.qCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.qText, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>{q}</Text>
                <View style={{ flexDirection: "row", gap: 10, marginTop: 12 }}>
                  {[true, false].map((val) => {
                    const sel = hipAnswers[qi] === val;
                    return (
                      <TouchableOpacity
                        key={String(val)}
                        activeOpacity={0.8}
                        onPress={() => {
                          Haptics.selectionAsync();
                          const next = [...hipAnswers];
                          next[qi] = val;
                          setHipAnswers(next);
                        }}
                        style={[
                          styles.ynBtn,
                          {
                            backgroundColor: sel ? (val ? colors.emergencyBg : colors.virtualBg) : colors.glass,
                            borderColor: sel ? (val ? colors.emergency : colors.virtual) : colors.glassBorder,
                          },
                        ]}
                      >
                        <Text style={[styles.ynText, { color: sel ? (val ? colors.emergency : colors.virtual) : colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
                          {val ? "Yes" : "No"}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            ))}
            <TouchableOpacity
              disabled={hipAnswers.some((a) => a === null)}
              activeOpacity={0.85}
              onPress={() => {
                Haptics.selectionAsync();
                setStep("hipResult");
              }}
              style={[styles.primaryCta, { backgroundColor: hipAnswers.some((a) => a === null) ? colors.muted : colors.primary }]}
            >
              <Text style={[styles.primaryCtaText, { fontFamily: "Inter_600SemiBold", color: hipAnswers.some((a) => a === null) ? colors.mutedForeground : "#fff" }]}>
                Continue
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Hip screen result ── */}
        {step === "hipResult" && (
          <View style={{ gap: 16, marginTop: 6 }}>
            <View style={[styles.qCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <MaterialCommunityIcons
                name={hipPositive ? "human-handsdown" : "walk"}
                size={34}
                color={hipPositive ? colors.fastTrack : colors.primary}
                style={{ marginBottom: 8 }}
              />
              <Text style={[styles.qTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
                {hipPositive ? "Your pain may be coming from your back" : "Your pain looks like true hip pain"}
              </Text>
              <Text style={[styles.explain, { color: colors.mutedForeground, fontFamily: "Inter_400Regular", marginTop: 8 }]}>
                {hipPositive
                  ? "Pain that travels down the leg with numbness or tingling is often 'neurogenic' — caused by a nerve in the lower back rather than the hip joint. We recommend the low back questionnaire."
                  : "Your answers do not suggest nerve pain from the back, so the hip questionnaire is the right next step."}
              </Text>
            </View>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => goToPathway(hipPositive ? "lumbar" : "hip")}
              style={[styles.primaryCta, { backgroundColor: colors.primary }]}
            >
              <Text style={[styles.primaryCtaText, { fontFamily: "Inter_600SemiBold", color: "#fff" }]}>
                {hipPositive ? "Start Low Back Questionnaire" : "Start Hip Questionnaire"}
              </Text>
            </TouchableOpacity>
            {hipPositive && (
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => goToPathway("hip")}
                style={[styles.secondaryCta, { borderColor: colors.border, backgroundColor: colors.card }]}
              >
                <Text style={[styles.primaryCtaText, { fontFamily: "Inter_600SemiBold", color: colors.foreground }]}>
                  Do the Hip Questionnaire Instead
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* ── Neck vs shoulder differentiator ── */}
        {step === "neckShoulder" && (
          <View style={{ gap: 16, marginTop: 6 }}>
            <Text style={[styles.explain, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              Neck problems and shoulder problems can feel very similar. Three quick questions help us point you to the right check.
            </Text>
            {NECK_SHOULDER_QUESTIONS.map((q, qi) => (
              <View key={qi} style={[styles.qCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.qText, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>{q.text}</Text>
                <View style={{ gap: 8, marginTop: 10 }}>
                  {q.options.map((opt, oi) => {
                    const sel = nsAnswers[qi] === oi;
                    return (
                      <TouchableOpacity
                        key={oi}
                        activeOpacity={0.8}
                        onPress={() => {
                          Haptics.selectionAsync();
                          const next = [...nsAnswers];
                          next[qi] = oi;
                          setNsAnswers(next);
                        }}
                        style={[
                          styles.optBtn,
                          { backgroundColor: sel ? colors.glassPrimary : colors.glass, borderColor: sel ? colors.primary : colors.glassBorder },
                        ]}
                      >
                        <Text style={[styles.optText, { color: sel ? colors.primary : colors.foreground, fontFamily: sel ? "Inter_600SemiBold" : "Inter_400Regular" }]}>
                          {opt}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            ))}
            <TouchableOpacity
              disabled={nsAnswers.some((a) => a === null)}
              activeOpacity={0.85}
              onPress={() => {
                Haptics.selectionAsync();
                setStep("neckShoulderResult");
              }}
              style={[styles.primaryCta, { backgroundColor: nsAnswers.some((a) => a === null) ? colors.muted : colors.primary }]}
            >
              <Text style={[styles.primaryCtaText, { fontFamily: "Inter_600SemiBold", color: nsAnswers.some((a) => a === null) ? colors.mutedForeground : "#fff" }]}>
                Continue
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Neck vs shoulder result ── */}
        {step === "neckShoulderResult" && (
          <View style={{ gap: 16, marginTop: 6 }}>
            <View style={[styles.qCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <MaterialCommunityIcons
                name={nsIsShoulder ? "arm-flex" : "head-outline"}
                size={34}
                color={colors.primary}
                style={{ marginBottom: 8 }}
              />
              <Text style={[styles.qTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
                {nsIsShoulder ? "This looks like a shoulder problem" : "This may be coming from your neck"}
              </Text>
              <Text style={[styles.explain, { color: colors.mutedForeground, fontFamily: "Inter_400Regular", marginTop: 8 }]}>
                {nsIsShoulder
                  ? "Pain that is worse when using the arm, felt at the top of the arm, without numbness, usually comes from the shoulder itself. The Oxford Shoulder Score is the right questionnaire."
                  : "Pain triggered by neck movement, spreading down the arm, or with numbness and tingling often comes from the neck. The neck (cervical spine) check is the right questionnaire."}
              </Text>
            </View>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => goToPathway(nsIsShoulder ? "shoulder" : "cervical")}
              style={[styles.primaryCta, { backgroundColor: colors.primary }]}
            >
              <Text style={[styles.primaryCtaText, { fontFamily: "Inter_600SemiBold", color: "#fff" }]}>
                {nsIsShoulder ? "Start Shoulder Questionnaire" : "Start Neck Questionnaire"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => goToPathway(nsIsShoulder ? "cervical" : "shoulder")}
              style={[styles.secondaryCta, { borderColor: colors.border, backgroundColor: colors.card }]}
            >
              <Text style={[styles.primaryCtaText, { fontFamily: "Inter_600SemiBold", color: colors.foreground }]}>
                {nsIsShoulder ? "Do the Neck Questionnaire Instead" : "Do the Shoulder Questionnaire Instead"}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 10,
    gap: 8,
  },
  backBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { flex: 1, textAlign: "center", fontSize: 22 },
  explain: { fontSize: 17, lineHeight: 25, textAlign: "center", marginTop: 4 },
  figureWrap: { alignItems: "center", marginVertical: 10, overflow: "hidden", height: 350 },
  regionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderWidth: 1,
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 16,
    minHeight: 72,
  },
  regionIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  regionLabel: { fontSize: 19, flexShrink: 1 },
  regionSub: { fontSize: 14.5, marginTop: 2 },
  menuTitle: { fontSize: 16, letterSpacing: 1.2, textTransform: "uppercase", textAlign: "center" },
  qTitle: { fontSize: 22, lineHeight: 30 },
  qCard: { borderWidth: 1, borderRadius: 18, padding: 18 },
  qText: { fontSize: 18, lineHeight: 26 },
  optBtn: { borderWidth: 1.5, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 14, minHeight: 54, justifyContent: "center" },
  optText: { fontSize: 16.5, lineHeight: 22 },
  ynBtn: { flex: 1, borderWidth: 1.5, borderRadius: 14, minHeight: 58, alignItems: "center", justifyContent: "center" },
  ynText: { fontSize: 19 },
  bigOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderWidth: 1,
    borderRadius: 18,
    padding: 18,
    minHeight: 84,
  },
  bigOptionLabel: { fontSize: 20 },
  primaryCta: {
    flexDirection: "row",
    gap: 10,
    borderRadius: 16,
    minHeight: 60,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
  },
  secondaryCta: {
    flexDirection: "row",
    gap: 10,
    borderWidth: 1,
    borderRadius: 16,
    minHeight: 60,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
  },
  primaryCtaText: { fontSize: 18 },
  warnBox: {
    flexDirection: "row",
    gap: 10,
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginTop: 14,
    alignItems: "center",
  },
  warnText: { flex: 1, fontSize: 15.5, lineHeight: 22 },
});
