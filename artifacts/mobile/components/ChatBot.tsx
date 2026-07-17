import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Speech from "expo-speech";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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
import SignLanguageModal from "@/components/SignLanguageModal";
import { PILOT_ACTIVATION_CODE, useAppMode } from "@/context/AppModeContext";
import { usePatient } from "@/context/PatientContext";
import { useColors } from "@/hooks/useColors";
import { useVoiceInput } from "@/hooks/useVoiceInput";
import {
  callEmergencyServices,
  EMERGENCY_NUMBER,
  formatPatientCard,
  shareWithHealthServices,
} from "@/utils/healthShare";
import {
  getMemoryPermission,
  setMemoryPermission,
  saveSession,
  getLastSession,
  relativeDate,
  type MemorySession,
} from "@/utils/chatMemory";

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
    "Hi there 🐝 I'm Sarah — your companion on this health journey.\n\nFirst things first — how are you feeling right now, in yourself? Not just physically, but how are you doing today?",
};

const CLEAN_GREETING: ChatMessage = {
  role: "assistant",
  content:
    "Hi there 🐝 I'm Sarah — I'm here as your companion. Think of me as a warm friend who's walked this road before and wants to help you feel a little less alone on yours.\n\nI won't give medical advice — your doctor is the right person for that — but I can listen, help you make sense of things, and be here with you.\n\nHow are you feeling today?",
};

const PAIN_HELPER_GREETING: ChatMessage = {
  role: "assistant",
  content:
    "Hi there 🐝 I'm Sarah. I can hear that something's not quite right, and I want to help.\n\nLet's take it gently. Tell me, in your own words — what's been bothering you? There's no rush, and nothing is too small to mention.",
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

  // ── Voice input (web SpeechRecognition / native mic + transcription) ──
  const voice = useVoiceInput({
    onInterim: (t) => setInput(t),
    onFinal: (t) => {
      setInput("");
      if (t) sendMessage(t);
    },
    onError: (msg) => Alert.alert("Voice", msg),
  });
  const isListening = voice.listening;

  // ── Sign language camera ──
  const [showSignLang, setShowSignLang] = useState(false);

  // ── Conversation memory ──
  const [showMemoryPrompt, setShowMemoryPrompt] = useState(false);
  const [showRecallBanner, setShowRecallBanner] = useState(false);
  const [lastSession, setLastSession]           = useState<MemorySession | null>(null);
  const memoryAskedRef  = useRef(false);
  const messagesRef     = useRef(messages);
  messagesRef.current   = messages;
  const topicRef        = useRef<string | undefined>(undefined);

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

  // ── Voice input toggle — tap to talk, tap again (or pause) to finish ──
  function toggleVoiceInput() {
    if (isListening) {
      voice.stop();
      return;
    }
    try { Speech.stop(); } catch {}
    voice.start();
  }

  // ── Sign language submit ──
  function handleSignSubmit(text: string) {
    setShowSignLang(false);
    if (text.trim()) sendMessage(text.trim());
  }

  useEffect(() => {
    if (!visible) {
      try { Speech.stop(); } catch {}
      // Stop voice capture if active
      voice.cancel();
      // Save session to memory on close (if conversation happened)
      const msgs = messagesRef.current;
      if (msgs.length > 1) {
        saveSession(
          msgs.map((m) => ({ role: m.role, content: m.content })),
          topicRef.current
        );
      }
    }
    return () => { try { Speech.stop(); } catch {} };
  }, [visible]);

  // ── Memory: permission check + recall on open ───────────────────────────────
  useEffect(() => {
    if (!visible || memoryAskedRef.current) return;
    memoryAskedRef.current = true;

    (async () => {
      const perm = await getMemoryPermission();
      if (perm === null) {
        // First time ever — ask permission
        setShowMemoryPrompt(true);
      } else if (perm === true) {
        // Already permitted — check for a previous session to recall
        const last = await getLastSession();
        if (last && last.messages.filter((m) => m.role === "user").length > 0) {
          setLastSession(last);
          setShowRecallBanner(true);
        }
      }
    })();
  }, [visible]);

  // Reset memory flag when closed (allow re-check on next open)
  useEffect(() => {
    if (!visible) { memoryAskedRef.current = false; setShowRecallBanner(false); setLastSession(null); }
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

  // Seed the bot when opened from the pain pathway / condition education
  useEffect(() => {
    if (visible && seedContext && !loading && seededRef.current !== seedContext) {
      seededRef.current = seedContext;
      // Capture first ~40 chars as topic for memory
      topicRef.current = seedContext.slice(0, 40);
      sendMessage(seedContext);
    }
    if (!visible) { seededRef.current = undefined; topicRef.current = undefined; }
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

    const domain = process.env.EXPO_PUBLIC_DOMAIN;
    const body = JSON.stringify({
      messages: nextMessages.map(({ role, content }) => ({ role, content })),
      pilotCode: pilotMode ? PILOT_ACTIVATION_CODE : undefined,
      mode: painHelper ? "painDescribe" : undefined,
      // Always send patient context so Sarah can detect interactions in real-time
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
    });

    // Always-there companion: retry transient failures with a short backoff
    // before falling back, so a network blip doesn't end the conversation.
    try {
      let reply: string | null = null;
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          const res = await fetch(`https://${domain}/api/ai/chat`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body,
          });
          if (res.ok) {
            const data = await res.json();
            if (data.message) reply = data.message;
            break;
          }
          // Retry only transient server-side statuses
          if (![429, 500, 502, 503, 504].includes(res.status)) break;
        } catch {
          // Network error — retry
        }
        if (attempt < 2) await new Promise((r) => setTimeout(r, 700 * (attempt + 1)));
      }

      if (reply) {
        setMessages((prev) => [...prev, { role: "assistant", content: reply! }]);
        speak(reply);
      } else {
        const fallback =
          "I'm still right here with you 🐝 — I just couldn't reach my hive for a moment. Give it a few seconds and say that again, and if it keeps happening, it's worth checking your internet connection.";
        setMessages((prev) => [...prev, { role: "assistant", content: fallback }]);
        speak(fallback);
      }
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
      .map((m) => `${m.role === "user" ? "Patient" : "Sarah"}: ${m.content}`)
      .join("\n\n");

    const body = [
      formatPatientCard(patient),
      "",
      painHelper ? "PAIN DESCRIPTION CONVERSATION" : pilotMode ? "PAIN ASSESSMENT CONVERSATION" : "GUIDELINE INFORMATION CONVERSATION",
      "",
      transcript || "No conversation recorded yet.",
    ].join("\n");

    shareWithHealthServices(
      painHelper || pilotMode ? "Sarah — Clinical Handover Summary" : "Sarah — Conversation Summary",
      body,
    );
  }

  function handleClear() {
    setMessages([greeting]);
    setInput("");
    seededRef.current = undefined;
    topicRef.current  = undefined;
    proactiveCheckedRef.current = false;
    setShowRecallBanner(false);
  }

  function handleRecallSession() {
    if (!lastSession) return;
    setShowRecallBanner(false);
    // Inject last session messages (excluding greeting) after current greeting
    const recalled = lastSession.messages.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));
    const recallNote: ChatMessage = {
      role: "assistant",
      content: `I remember we spoke ${relativeDate(lastSession.date)}. I've loaded our previous conversation so we can continue where we left off.`,
    };
    setMessages([greeting, recallNote, ...recalled]);
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
                    Sarah
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

            {/* Memory recall banner */}
            {showRecallBanner && lastSession && (
              <View style={[styles.recallBanner, { backgroundColor: "rgba(201,134,10,0.08)", borderColor: "rgba(201,134,10,0.35)" }]}>
                <MaterialCommunityIcons name="brain" size={16} color="#C9860A" />
                <Text style={[styles.recallText, { color: "#C9860A", fontFamily: "Inter_500Medium" }]}>
                  I remember we spoke {relativeDate(lastSession.date)}
                  {lastSession.topic ? ` about "${lastSession.topic}"` : ""}.
                </Text>
                <TouchableOpacity
                  style={[styles.recallBtn, { backgroundColor: "rgba(201,134,10,0.18)" }]}
                  onPress={handleRecallSession}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.recallBtnText, { color: "#C9860A", fontFamily: "Inter_700Bold" }]}>Continue</Text>
                </TouchableOpacity>
                <TouchableOpacity hitSlop={10} onPress={() => setShowRecallBanner(false)}>
                  <MaterialCommunityIcons name="close" size={14} color="#C9860A" />
                </TouchableOpacity>
              </View>
            )}

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
              {/* Accessory row: mic, sign language */}
              <View style={styles.inputAccessRow}>
                {/* Microphone — voice input */}
                <TouchableOpacity
                  onPress={toggleVoiceInput}
                  activeOpacity={0.75}
                  disabled={voice.transcribing}
                  style={[
                    styles.accessBtn,
                    {
                      backgroundColor: isListening ? "rgba(220,38,38,0.12)" : voice.transcribing ? "rgba(201,134,10,0.1)" : colors.card,
                      borderColor: isListening ? "#dc2626" : voice.transcribing ? "#C9860A" : colors.border,
                    },
                  ]}
                >
                  {voice.transcribing ? (
                    <ActivityIndicator size={16} color="#C9860A" />
                  ) : (
                    <MaterialCommunityIcons
                      name={isListening ? "microphone" : "microphone-outline"}
                      size={18}
                      color={isListening ? "#dc2626" : colors.mutedForeground}
                    />
                  )}
                  <Text style={[styles.accessBtnText, { color: isListening ? "#dc2626" : voice.transcribing ? "#C9860A" : colors.mutedForeground, fontFamily: isListening || voice.transcribing ? "Inter_700Bold" : "Inter_400Regular" }]}>
                    {voice.transcribing ? "One moment…" : isListening ? "Listening…" : "Voice"}
                  </Text>
                </TouchableOpacity>

                {/* Sign language camera */}
                <TouchableOpacity
                  onPress={() => setShowSignLang(true)}
                  activeOpacity={0.75}
                  style={[styles.accessBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
                >
                  <MaterialCommunityIcons name="hand-wave-outline" size={18} color="#4f46e5" />
                  <Text style={[styles.accessBtnText, { color: "#4f46e5", fontFamily: "Inter_500Medium" }]}>Sign Language</Text>
                </TouchableOpacity>
              </View>

              <View style={[styles.inputWrap, { backgroundColor: colors.card, borderColor: isListening ? "#dc2626" : colors.border }]}>
                <TextInput
                  style={[styles.textInput, { color: colors.foreground, fontFamily: "Inter_400Regular" }]}
                  placeholder={
                    isListening
                      ? "Listening — speak now…"
                      : painHelper || pilotMode
                        ? "Describe your pain or ask a question…"
                        : "Ask about a medication, guideline, or health topic…"
                  }
                  placeholderTextColor={isListening ? "#dc2626" : colors.mutedForeground}
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

      {/* ── Sign Language Modal ──────────────────────────────────────────────── */}
      <SignLanguageModal
        visible={showSignLang}
        onClose={() => setShowSignLang(false)}
        onSubmit={handleSignSubmit}
      />

      {/* ── Memory permission prompt ─────────────────────────────────────────── */}
      <Modal visible={showMemoryPrompt} transparent animationType="fade" onRequestClose={() => { setShowMemoryPrompt(false); setMemoryPermission(false); }}>
        <View style={styles.promptOverlay}>
          <View style={[styles.promptCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.promptIconBox, { backgroundColor: "rgba(201,134,10,0.12)" }]}>
              <MaterialCommunityIcons name="brain" size={28} color="#C9860A" />
            </View>
            <Text style={[styles.promptTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
              Remember Our Conversations?
            </Text>
            <Text style={[styles.promptBody, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              Sarah can remember what we talk about so she can pick up where we left off next time.{"\n\n"}
              Everything is stored only on your device — nothing is sent anywhere. You can turn this off at any time in Settings.
            </Text>
            <View style={styles.promptActions}>
              <TouchableOpacity
                style={[styles.promptBtn, { backgroundColor: colors.secondary, borderColor: colors.border }]}
                onPress={() => { setMemoryPermission(false); setShowMemoryPrompt(false); }}
                activeOpacity={0.85}
              >
                <Text style={[styles.promptBtnText, { color: colors.mutedForeground, fontFamily: "Inter_600SemiBold" }]}>No Thanks</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.promptBtn, { backgroundColor: "#C9860A" }]}
                onPress={() => { setMemoryPermission(true); setShowMemoryPrompt(false); }}
                activeOpacity={0.85}
              >
                <MaterialCommunityIcons name="check" size={16} color="#fff" />
                <Text style={[styles.promptBtnText, { color: "#fff", fontFamily: "Inter_700Bold" }]}>Allow Memory</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  inputAccessRow: { flexDirection: "row", gap: 8, marginBottom: 8 },
  accessBtn: { flexDirection: "row", alignItems: "center", gap: 5, borderWidth: 1, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 7 },
  accessBtnText: { fontSize: 12.5 },
  inputWrap: { flexDirection: "row", alignItems: "flex-end", borderRadius: 14, borderWidth: 1, paddingLeft: 14, paddingRight: 6, paddingVertical: 6, gap: 8 },
  textInput: { flex: 1, fontSize: 14, lineHeight: 20, maxHeight: 100, paddingVertical: 4 },
  sendBtn: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },

  // Memory recall banner
  recallBanner: { flexDirection: "row", alignItems: "center", gap: 8, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 9, marginHorizontal: 14, marginBottom: 4 },
  recallText: { fontSize: 12, flex: 1, lineHeight: 17 },
  recallBtn: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  recallBtnText: { fontSize: 12 },

  // Memory permission prompt
  promptOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.55)", alignItems: "center", justifyContent: "center", padding: 24 },
  promptCard: { borderRadius: 20, borderWidth: 1, padding: 24, gap: 14, width: "100%", maxWidth: 360, alignItems: "center" },
  promptIconBox: { width: 60, height: 60, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  promptTitle: { fontSize: 18, textAlign: "center" },
  promptBody: { fontSize: 13.5, lineHeight: 21, textAlign: "center" },
  promptActions: { flexDirection: "row", gap: 10, width: "100%" },
  promptBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, borderRadius: 13, paddingVertical: 13, borderWidth: 1 },
  promptBtnText: { fontSize: 14 },
});
