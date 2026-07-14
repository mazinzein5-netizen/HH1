import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Speech from "expo-speech";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Easing,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PILOT_ACTIVATION_CODE, useAppMode } from "@/context/AppModeContext";
import { usePatient } from "@/context/PatientContext";
import { useColors } from "@/hooks/useColors";
import {
  callEmergencyServices,
  EMERGENCY_NUMBER,
  formatPatientCard,
  shareWithHealthServices,
} from "@/utils/healthShare";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  seedContext?: string;
  painHelper?: boolean;
}

const PILOT_GREETING: ChatMessage = {
  role: "assistant",
  content:
    "Hi there 🐝 I'm Queen B — your companion on this health journey.\n\nFirst things first — how are you feeling right now, in yourself? Not just physically, but how are you doing today?",
};

const CLEAN_GREETING: ChatMessage = {
  role: "assistant",
  content:
    "Hi there 🐝 I'm Queen B — I'm here as your companion. Think of me as a warm friend who's walked this road before and wants to help you feel a little less alone on yours.\n\nI won't give medical advice — your doctor is the right person for that — but I can listen, help you make sense of things, and be here with you.\n\nHow are you feeling today?",
};

const PAIN_HELPER_GREETING: ChatMessage = {
  role: "assistant",
  content:
    "Hi there 🐝 I'm Queen B. I can hear that something's not quite right, and I want to help.\n\nLet's take it gently. Tell me, in your own words — what's been bothering you? There's no rush, and nothing is too small to mention.",
};

function toSpeakable(text: string): string {
  return text
    .replace(/【[^】]*】/g, "")
    .replace(/[*_#`]/g, "")
    .replace(/⚠️/g, "Warning. ")
    .replace(/CONTRAINDICATION:/gi, "Drug interaction alert.")
    .replace(/\s+/g, " ")
    .trim();
}

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

function parseGuidelineChips(text: string): React.ReactNode[] {
  const parts = text.split(/(【[^】]+】)/g);
  return parts.map((part, i) => {
    if (part.startsWith("【") && part.endsWith("】")) {
      return (
        <Text key={i} style={styles.guidelineChip}>
          {part}
        </Text>
      );
    }
    return <Text key={i}>{part}</Text>;
  });
}

function isContraindictionMsg(content: string) {
  return /^⚠️\s*CONTRAINDICATION:/i.test(content.trimStart());
}

function isRedFlagMsg(content: string) {
  return (content.startsWith("⚠️") || content.includes("RED FLAG")) &&
    !isContraindictionMsg(content);
}

// ── Contraindiction bubble (amber) ────────────────────────────────────────────

function ContraindictionBubble({
  content,
  colors,
}: {
  content: string;
  colors: ReturnType<typeof useColors>;
}) {
  const body = content.replace(/^⚠️\s*CONTRAINDICATION:\s*/i, "").trimStart();
  return (
    <View style={[styles.contraindictionBubble, { borderColor: "#d97706", backgroundColor: "rgba(217,119,6,0.09)" }]}>
      <View style={styles.contraindictionHeader}>
        <View style={[styles.contraindictionIconBox, { backgroundColor: "rgba(217,119,6,0.18)" }]}>
          <MaterialCommunityIcons name="alert-circle" size={16} color="#d97706" />
        </View>
        <Text style={[styles.contraindictionTitle, { color: "#d97706" }]}>
          Drug Interaction Alert
        </Text>
      </View>
      <Text style={[styles.bubbleText, { color: colors.foreground, fontFamily: "Inter_400Regular" }]}>
        {body}
      </Text>
      <View style={[styles.contraindictionFooter, { borderTopColor: "rgba(217,119,6,0.25)" }]}>
        <MaterialCommunityIcons name="doctor" size={12} color="#d97706" />
        <Text style={[styles.contraindictionNote, { color: "#d97706" }]}>
          Contact your GP or pharmacist before taking any new medication.
        </Text>
      </View>
    </View>
  );
}

// ── Message bubbles ───────────────────────────────────────────────────────────

function BotBubble({ content, colors }: { content: string; colors: ReturnType<typeof useColors> }) {
  if (isContraindictionMsg(content)) {
    return <ContraindictionBubble content={content} colors={colors} />;
  }

  const isRedFlag = isRedFlagMsg(content);
  return (
    <View style={[
      styles.botBubble,
      {
        backgroundColor: isRedFlag ? colors.emergencyBg : colors.card,
        borderColor: isRedFlag ? colors.emergencyBorder : colors.border,
      },
    ]}>
      <Text style={[styles.bubbleText, { color: isRedFlag ? colors.emergency : colors.foreground, fontFamily: "Inter_400Regular" }]}>
        {parseGuidelineChips(content)}
      </Text>
    </View>
  );
}

function UserBubble({ content, colors }: { content: string; colors: ReturnType<typeof useColors> }) {
  return (
    <View style={[styles.userBubble, { backgroundColor: colors.primary }]}>
      <Text style={[styles.bubbleText, { color: "#fff", fontFamily: "Inter_400Regular" }]}>{content}</Text>
    </View>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function ChatBot({ visible, onClose, seedContext, painHelper }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { data: patient } = usePatient();
  const { pilotMode } = useAppMode();
  const greeting = painHelper ? PAIN_HELPER_GREETING : pilotMode ? PILOT_GREETING : CLEAN_GREETING;
  const [messages, setMessages] = useState<ChatMessage[]>([greeting]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [voiceOn, setVoiceOn] = useState(true);
  const voiceOnRef = useRef(voiceOn);
  voiceOnRef.current = voiceOn;

  const activeMeds = patient.kardex.filter((k) => k.status === "active");

  // Refs to prevent duplicate proactive checks
  const proactiveCheckedRef = useRef(false);
  const seededRef = useRef<string | undefined>(undefined);

  function speak(text: string) {
    if (!voiceOnRef.current) return;
    try {
      Speech.stop();
      Speech.speak(toSpeakable(text), { language: "en-IE", rate: 0.95 });
    } catch {}
  }

  function toggleVoice() {
    setVoiceOn((v) => {
      if (v) { try { Speech.stop(); } catch {} }
      return !v;
    });
  }

  useEffect(() => {
    if (!visible) { try { Speech.stop(); } catch {} }
    return () => { try { Speech.stop(); } catch {} };
  }, [visible]);

  const flatListRef = useRef<FlatList>(null);
  const slideAnim  = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  // Swap greeting when mode changes (fresh conversation)
  useEffect(() => {
    setMessages((prev) => (prev.length <= 1 ? [greeting] : prev));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pilotMode, painHelper]);

  // Slide animation
  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: visible ? 0 : SCREEN_HEIGHT,
      duration: visible ? 340 : 280,
      easing: visible ? Easing.out(Easing.cubic) : Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [visible]);

  // ── Proactive contraindication check on first open ──────────────────────────
  useEffect(() => {
    if (!visible || proactiveCheckedRef.current) return;
    if (!activeMeds.length && !patient.allergies.length) return;
    proactiveCheckedRef.current = true;

    const domain = process.env.EXPO_PUBLIC_DOMAIN;
    if (!domain) return;

    fetch(`https://${domain}/api/ai/contraindications`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        medications: activeMeds.map((m) => ({ name: m.medication, dose: m.dose, frequency: m.frequency })),
        allergies: patient.allergies.map((a) => ({ drug: a.drug, reaction: a.reaction, severity: a.severity })),
      }),
    })
      .then((r) => r.json())
      .then((data: { flags?: { drugs: string[]; concern: string; action: string; severity: string }[] }) => {
        if (!Array.isArray(data.flags) || data.flags.length === 0) return;
        const flagMessages: ChatMessage[] = data.flags.map((f) => ({
          role: "assistant",
          content: `⚠️ CONTRAINDICATION: ${f.drugs.join(" + ")}\n\n${f.concern}\n\n${f.action}`,
        }));
        setMessages((prev) => [...prev, ...flagMessages]);
        // Speak the first flag
        if (flagMessages[0]) speak(flagMessages[0].content);
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  // Reset proactive check when chat is closed (new session each open)
  useEffect(() => {
    if (!visible) {
      proactiveCheckedRef.current = false;
    }
  }, [visible]);

  // Seed the bot when opened from the pain pathway
  useEffect(() => {
    if (visible && seedContext && !loading && seededRef.current !== seedContext) {
      seededRef.current = seedContext;
      sendMessage(seedContext);
    }
    if (!visible) { seededRef.current = undefined; }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, seedContext, loading]);

  const hasRedFlag = pilotMode && messages.some(
    (m) => m.role === "assistant" && isRedFlagMsg(m.content)
  );

  const hasContraindiction = messages.some(
    (m) => m.role === "assistant" && isContraindictionMsg(m.content)
  );

  async function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const userMsg: ChatMessage = { role: "user", content: trimmed };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setLoading(true);

    try {
      const domain = process.env.EXPO_PUBLIC_DOMAIN;
      const res = await fetch(`https://${domain}/api/ai/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextMessages.map(({ role, content }) => ({ role, content })),
          pilotCode: pilotMode ? PILOT_ACTIVATION_CODE : undefined,
          mode: painHelper ? "painDescribe" : undefined,
          // Always send patient context so Queen B can detect interactions in real-time
          patientContext: {
            medications: activeMeds.map((m) => ({
              name: m.medication,
              dose: m.dose,
              frequency: m.frequency,
            })),
            allergies: patient.allergies.map((a) => ({
              drug: a.drug,
              reaction: a.reaction,
              severity: a.severity,
            })),
          },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.message) {
          setMessages((prev) => [...prev, { role: "assistant", content: data.message }]);
          speak(data.message);
        }
      } else {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: "I'm having trouble connecting right now. Please check your connection and try again." },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "I'm having trouble connecting right now. Please check your connection and try again." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleSend() {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    sendMessage(text);
  }

  function handleShareToServices() {
    const transcript = messages
      .slice(1)
      .map((m) => `${m.role === "user" ? "Patient" : "Queen B"}: ${m.content}`)
      .join("\n\n");

    const body = [
      formatPatientCard(patient),
      "",
      painHelper ? "PAIN DESCRIPTION CONVERSATION" : pilotMode ? "PAIN ASSESSMENT CONVERSATION" : "GUIDELINE INFORMATION CONVERSATION",
      "",
      transcript || "No conversation recorded yet.",
    ].join("\n");

    shareWithHealthServices(
      painHelper || pilotMode ? "Queen B — Clinical Handover Summary" : "Queen B — Conversation Summary",
      body,
    );
  }

  function handleClear() {
    setMessages([greeting]);
    setInput("");
    seededRef.current = undefined;
    proactiveCheckedRef.current = false;
  }

  const bottomPad = Platform.OS === "ios" ? insets.bottom : 8;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
        <Animated.View
          style={[
            styles.sheet,
            { backgroundColor: colors.background, transform: [{ translateY: slideAnim }] },
          ]}
        >
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View style={styles.dragHandle} />
            <View style={styles.headerRow}>
              <View style={[styles.botIcon, { backgroundColor: "rgba(201,134,10,0.18)", borderColor: "rgba(201,134,10,0.4)" }]}>
                <MaterialCommunityIcons name="bee" size={20} color="#C9860A" />
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <Text style={[styles.headerTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
                    Queen B
                  </Text>
                  {hasContraindiction && (
                    <View style={styles.contraindictionHeaderBadge}>
                      <MaterialCommunityIcons name="alert-circle" size={11} color="#fff" />
                      <Text style={styles.contraindictionHeaderBadgeText}>Interaction flagged</Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.headerSub, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                  {painHelper ? "Helping You Describe Your Pain" : pilotMode ? "Pain & Clinical Guidance" : "Guideline Information"}
                </Text>
              </View>
              <TouchableOpacity
                onPress={toggleVoice}
                style={[styles.clearBtn, { borderColor: voiceOn ? "rgba(201,134,10,0.5)" : colors.border }]}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons
                  name={voiceOn ? "volume-high" : "volume-off"}
                  size={16}
                  color={voiceOn ? "#C9860A" : colors.mutedForeground}
                />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={callEmergencyServices}
                style={[styles.emergencyPill, { backgroundColor: colors.emergencyBg, borderColor: colors.emergencyBorder }]}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons name="phone-alert" size={15} color={colors.emergency} />
                <Text style={[styles.emergencyPillText, { color: colors.emergency, fontFamily: "Inter_700Bold" }]}>
                  {EMERGENCY_NUMBER}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleClear} style={[styles.clearBtn, { borderColor: colors.border }]} activeOpacity={0.7}>
                <MaterialCommunityIcons name="delete-sweep" size={16} color={colors.mutedForeground} />
              </TouchableOpacity>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
                <MaterialCommunityIcons name="close" size={20} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Message list */}
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={0}
          >
            <FlatList
              ref={flatListRef}
              data={messages}
              keyExtractor={(_, i) => String(i)}
              contentContainerStyle={[styles.messageList, { paddingBottom: 12 }]}
              onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
              renderItem={({ item }) =>
                item.role === "assistant" ? (
                  <BotBubble content={item.content} colors={colors} />
                ) : (
                  <UserBubble content={item.content} colors={colors} />
                )
              }
              ListFooterComponent={
                loading ? (
                  <View style={[styles.botBubble, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <ActivityIndicator size="small" color={colors.mutedForeground} />
                  </View>
                ) : null
              }
            />

            {/* Safety notice — clean (store) mode */}
            {!pilotMode && (
              <View style={[styles.safetyNotice, { backgroundColor: colors.glass, borderColor: colors.glassBorder }]}>
                <MaterialCommunityIcons name="information-outline" size={15} color={colors.mutedForeground} />
                <Text style={[styles.safetyNoticeText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                  General guideline information only — not medical advice. If you are worried about your
                  health, contact your GP or call {EMERGENCY_NUMBER}.
                </Text>
              </View>
            )}

            {/* Red flag escalation banner (pilot mode) */}
            {hasRedFlag && (
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={callEmergencyServices}
                style={[styles.redFlagBanner, { backgroundColor: colors.emergencyBg, borderColor: colors.emergency }]}
              >
                <MaterialCommunityIcons name="phone-alert" size={18} color={colors.emergency} />
                <Text style={[styles.redFlagText, { color: colors.emergency, fontFamily: "Inter_700Bold" }]}>
                  Urgent symptoms flagged — Call Emergency Services ({EMERGENCY_NUMBER})
                </Text>
              </TouchableOpacity>
            )}

            {/* Contraindication banner — shown whenever a flag is active */}
            {hasContraindiction && (
              <View style={[styles.contraindictionBanner, { backgroundColor: "rgba(217,119,6,0.08)", borderColor: "#d97706" }]}>
                <MaterialCommunityIcons name="alert-circle" size={16} color="#d97706" />
                <Text style={[styles.contraindictionBannerText, { color: "#d97706", fontFamily: "Inter_600SemiBold" }]}>
                  Drug interaction flagged — review above and contact your GP or pharmacist.
                </Text>
              </View>
            )}

            {/* Action toolbar */}
            <View style={[styles.actionRow, { borderTopColor: colors.border }]}>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={callEmergencyServices}
                style={[styles.actionBtn, { backgroundColor: colors.emergencyBg, borderColor: colors.emergencyBorder }]}
              >
                <MaterialCommunityIcons name="phone-alert" size={16} color={colors.emergency} />
                <Text style={[styles.actionBtnText, { color: colors.emergency, fontFamily: "Inter_600SemiBold" }]}>Emergency</Text>
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handleShareToServices}
                style={[styles.actionBtn, { backgroundColor: colors.glassGold, borderColor: colors.glassGoldBorder }]}
              >
                <MaterialCommunityIcons name="share-variant" size={16} color={colors.gold} />
                <Text style={[styles.actionBtnText, { color: colors.gold, fontFamily: "Inter_600SemiBold" }]}>Send to Health Services</Text>
              </TouchableOpacity>
            </View>

            {/* Input bar */}
            <View style={[styles.inputBar, { borderTopColor: colors.border, paddingBottom: bottomPad }]}>
              <View style={[styles.inputWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <TextInput
                  style={[styles.textInput, { color: colors.foreground, fontFamily: "Inter_400Regular" }]}
                  placeholder={
                    painHelper || pilotMode
                      ? "Describe your pain or ask a question..."
                      : "Ask about a medication, guideline, or health topic..."
                  }
                  placeholderTextColor={colors.mutedForeground}
                  value={input}
                  onChangeText={setInput}
                  multiline
                  maxLength={600}
                  onSubmitEditing={handleSend}
                  blurOnSubmit={false}
                />
                <TouchableOpacity
                  onPress={handleSend}
                  disabled={!input.trim() || loading}
                  style={[
                    styles.sendBtn,
                    { backgroundColor: input.trim() && !loading ? "#C9860A" : colors.border },
                  ]}
                  activeOpacity={0.8}
                >
                  <MaterialCommunityIcons
                    name="send"
                    size={18}
                    color={input.trim() && !loading ? "#fff" : colors.mutedForeground}
                  />
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay:  { flex: 1, justifyContent: "flex-end" },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.5)" },
  sheet: {
    height: SCREEN_HEIGHT * 0.85,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: "hidden",
  },
  dragHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignSelf: "center",
    marginTop: 10, marginBottom: 6,
  },
  header: { borderBottomWidth: 1, paddingBottom: 14, paddingHorizontal: 16 },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  botIcon: { width: 38, height: 38, borderRadius: 11, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 16, letterSpacing: -0.2 },
  headerSub: { fontSize: 11, marginTop: 1 },

  contraindictionHeaderBadge: {
    flexDirection: "row", alignItems: "center", gap: 3,
    backgroundColor: "#d97706", borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2,
  },
  contraindictionHeaderBadgeText: { color: "#fff", fontSize: 9.5, fontFamily: "Inter_700Bold" },

  emergencyPill: { flexDirection: "row", alignItems: "center", gap: 4, borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  emergencyPillText: { fontSize: 12, letterSpacing: 0.3 },
  clearBtn: { alignItems: "center", justifyContent: "center", borderWidth: 1, borderRadius: 8, padding: 7 },
  closeBtn: { padding: 4 },

  safetyNotice: { flexDirection: "row", alignItems: "center", gap: 8, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, marginHorizontal: 14, marginBottom: 4 },
  safetyNoticeText: { fontSize: 11, lineHeight: 15, flex: 1 },

  redFlagBanner: { flexDirection: "row", alignItems: "center", gap: 8, borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11, marginHorizontal: 14, marginBottom: 4 },
  redFlagText: { fontSize: 13, lineHeight: 18, flex: 1 },

  contraindictionBanner: {
    flexDirection: "row", alignItems: "center", gap: 8,
    borderWidth: 1, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 10,
    marginHorizontal: 14, marginBottom: 4,
  },
  contraindictionBannerText: { fontSize: 12.5, lineHeight: 18, flex: 1 },

  actionRow: { flexDirection: "row", gap: 8, paddingHorizontal: 14, paddingTop: 10, borderTopWidth: 1 },
  actionBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, borderWidth: 1, borderRadius: 10, paddingVertical: 10 },
  actionBtnText: { fontSize: 12.5 },

  messageList: { paddingHorizontal: 14, paddingTop: 14, gap: 10 },
  botBubble: { alignSelf: "flex-start", maxWidth: "88%", borderRadius: 16, borderTopLeftRadius: 4, borderWidth: 1, padding: 12 },
  userBubble: { alignSelf: "flex-end", maxWidth: "80%", borderRadius: 16, borderBottomRightRadius: 4, padding: 12 },
  bubbleText: { fontSize: 14, lineHeight: 21 },
  guidelineChip: { backgroundColor: "rgba(201,134,10,0.15)", color: "#C9860A", fontFamily: "Inter_600SemiBold", fontSize: 12, borderRadius: 4, paddingHorizontal: 3 },

  // Contraindiction bubble (amber, distinct from red-flag)
  contraindictionBubble: {
    alignSelf: "flex-start", maxWidth: "92%",
    borderRadius: 16, borderTopLeftRadius: 4,
    borderWidth: 1.5, padding: 12, gap: 8,
  },
  contraindictionHeader: { flexDirection: "row", alignItems: "center", gap: 7 },
  contraindictionIconBox: { width: 26, height: 26, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  contraindictionTitle: { fontSize: 13, fontFamily: "Inter_700Bold", flex: 1 },
  contraindictionFooter: { flexDirection: "row", alignItems: "flex-start", gap: 5, borderTopWidth: 1, paddingTop: 8 },
  contraindictionNote: { fontSize: 11, fontFamily: "Inter_500Medium", flex: 1, lineHeight: 16 },

  inputBar: { borderTopWidth: 1, paddingHorizontal: 14, paddingTop: 10 },
  inputWrap: { flexDirection: "row", alignItems: "flex-end", borderRadius: 14, borderWidth: 1, paddingLeft: 14, paddingRight: 6, paddingVertical: 6, gap: 8 },
  textInput: { flex: 1, fontSize: 14, lineHeight: 20, maxHeight: 100, paddingVertical: 4 },
  sendBtn: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
});
