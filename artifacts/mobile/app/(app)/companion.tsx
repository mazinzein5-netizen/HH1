/**
 * HIVE Companion — pilot-only voice-first AI companion for older patients.
 * Very large text, high contrast, big tap targets, slow pacing.
 * Voice loop: speech recognition (web) → api-server companion brain
 * (with supervisor guardrail) → text-to-speech reply.
 */
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Speech from "expo-speech";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ThemedStatusBar from "@/components/ThemedStatusBar";
import { PILOT_ACTIVATION_CODE, useAppMode } from "@/context/AppModeContext";
import { useColors } from "@/hooks/useColors";
import { useVoiceInput, type VoiceInput } from "@/hooks/useVoiceInput";
import { callEmergencyServices, EMERGENCY_NUMBER } from "@/utils/healthShare";
import {
  getCompanionMemory,
  mergeCompanionMemory,
  type CompanionMemory,
} from "@/utils/companionMemory";

interface Msg {
  role: "user" | "assistant";
  content: string;
  supervised?: boolean;
}

function toSpeakable(text: string): string {
  return text
    .replace(/【[^】]*】/g, "")
    .replace(/[*_#`]/g, "")
    .replace(/⚠️\s*RED FLAG:/gi, "This is important. ")
    .replace(/\s+/g, " ")
    .trim();
}

function isRedFlag(content: string) {
  return content.trimStart().startsWith("⚠️");
}

export default function CompanionScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { pilotMode } = useAppMode();

  const [messages, setMessages] = useState<Msg[]>([]);
  const [loading, setLoading] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [handsFree, setHandsFree] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState("");
  const [typedInput, setTypedInput] = useState("");
  const [showTyping, setShowTyping] = useState(false);

  const memoryRef = useRef<CompanionMemory | null>(null);
  const handsFreeRef = useRef(handsFree);
  handsFreeRef.current = handsFree;
  const loadingRef = useRef(loading);
  loadingRef.current = loading;
  const messagesRef = useRef(messages);
  messagesRef.current = messages;
  const scrollRef = useRef<ScrollView>(null);
  const mountedRef = useRef(true);

  // ── Voice input: web SpeechRecognition / native mic → transcription ──
  const voiceRef = useRef<VoiceInput | null>(null);
  const voice = useVoiceInput({
    onInterim: setLiveTranscript,
    onFinal: (t) => {
      setLiveTranscript("");
      if (t) {
        sendMessage(t);
      } else if (handsFreeRef.current && mountedRef.current && !loadingRef.current) {
        // Nothing heard — keep listening in hands-free mode
        setTimeout(() => {
          if (handsFreeRef.current && mountedRef.current && !loadingRef.current) {
            voiceRef.current?.start();
          }
        }, 600);
      }
    },
    onError: (msg) => {
      setLiveTranscript("");
      setHandsFree(false);
      setShowTyping(true);
      Alert.alert("Voice", msg);
    },
  });
  voiceRef.current = voice;
  const listening = voice.listening;

  // ── Pilot gate ──
  useEffect(() => {
    if (!pilotMode) router.replace("/(app)/(tabs)/dashboard");
  }, [pilotMode]);

  // ── Load memory + greet on mount ──
  useEffect(() => {
    mountedRef.current = true;
    (async () => {
      const mem = await getCompanionMemory();
      memoryRef.current = mem;
      const name = mem.name ? `, ${mem.name}` : "";
      const returning = mem.topics.length > 0;
      const greeting = returning
        ? `Hello again${name}. It's lovely to talk with you. Last time we spoke about ${mem.topics[mem.topics.length - 1]?.toLowerCase()}. Would you like to carry on with that, or is something else on your mind today?`
        : `Hello${name}. I'm your HIVE Companion. You can press the big button and just talk to me — ask me anything about your health, your medicines, or aches and pains, and I'll explain it in plain English. What would you like to talk about?`;
      if (mountedRef.current) {
        setMessages([{ role: "assistant", content: greeting, supervised: true }]);
        speakText(greeting);
      }
    })();
    return () => {
      mountedRef.current = false;
      try { Speech.stop(); } catch {}
      // Voice capture cleans itself up on unmount (useVoiceInput effect)
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function speakText(text: string) {
    try {
      Speech.stop();
      setSpeaking(true);
      Speech.speak(toSpeakable(text), {
        language: "en-IE",
        rate: 0.88, // slower pacing for older listeners
        onDone: () => {
          setSpeaking(false);
          // Hands-free: resume listening after the companion finishes speaking
          if (handsFreeRef.current && mountedRef.current) startListening();
        },
        onStopped: () => setSpeaking(false),
        onError: () => setSpeaking(false),
      });
    } catch {
      setSpeaking(false);
    }
  }

  function repeatLastAnswer() {
    const last = [...messagesRef.current].reverse().find((m) => m.role === "assistant");
    if (last) speakText(last.content);
  }

  // ── Voice controls (shared cross-platform hook) ──
  function startListening() {
    const v = voiceRef.current;
    if (loadingRef.current || !v || v.listening || v.transcribing) return;
    try { Speech.stop(); } catch {}
    setSpeaking(false);
    v.start();
  }

  /** Stop capturing. finalize=true sends what was heard; false discards it. */
  function stopListening(finalize = true) {
    if (finalize) voiceRef.current?.stop();
    else voiceRef.current?.cancel();
    setLiveTranscript("");
  }

  function toggleHandsFree() {
    setHandsFree((v) => {
      const next = !v;
      if (next) {
        startListening();
      } else {
        stopListening(false);
      }
      return next;
    });
  }

  function onPushToTalk() {
    if (listening) {
      stopListening(true);
    } else {
      setHandsFree(false);
      startListening();
    }
  }

  // ── Send a turn to the companion brain ──
  async function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loadingRef.current) return;

    const userMsg: Msg = { role: "user", content: trimmed };
    const next = [...messagesRef.current, userMsg];
    setMessages(next);
    setLoading(true);

    const domain = process.env.EXPO_PUBLIC_DOMAIN;
    const body = JSON.stringify({
      pilotCode: PILOT_ACTIVATION_CODE,
      messages: next.map(({ role, content }) => ({ role, content })),
      memory: memoryRef.current ?? undefined,
    });

    // Always-there companion: quietly retry transient hiccups before
    // falling back, so a brief network blip doesn't end the conversation.
    try {
      let data: {
        message?: string;
        supervised?: boolean;
        memoryUpdates?: Parameters<typeof mergeCompanionMemory>[0];
      } | null = null;

      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          const res = await fetch(`https://${domain}/api/ai/companion`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body,
          });
          if (res.ok) {
            data = await res.json();
            break;
          }
          if (![429, 500, 502, 503, 504].includes(res.status)) break;
        } catch {
          // Network error — retry
        }
        if (attempt < 2) await new Promise((r) => setTimeout(r, 700 * (attempt + 1)));
      }

      if (data?.message) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: data!.message!, supervised: data!.supervised },
        ]);
        speakText(data.message);
        if (data.memoryUpdates) {
          memoryRef.current = await mergeCompanionMemory(data.memoryUpdates);
        }
      } else {
        const fallback =
          "I'm still right here with you — I just couldn't hear from my helpers for a moment. Take a breath, and let's try that again together in a few seconds.";
        setMessages((prev) => [...prev, { role: "assistant", content: fallback, supervised: true }]);
        speakText(fallback);
      }
    } finally {
      setLoading(false);
    }
  }

  function handleTypedSend() {
    const text = typedInput.trim();
    if (!text) return;
    setTypedInput("");
    sendMessage(text);
  }

  const hasRedFlag = messages.some((m) => m.role === "assistant" && isRedFlag(m.content));
  const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant");
  const unsupervised = lastAssistant ? lastAssistant.supervised === false : false;

  if (!pilotMode) return null;

  const topPad = Platform.OS === "web" ? 24 : insets.top;
  const bottomPad = Platform.OS === "web" ? 20 : Math.max(insets.bottom, 12);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ThemedStatusBar backgroundColor="transparent" translucent />

      {/* ── Header ── */}
      <View style={[styles.header, { paddingTop: topPad + 8, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.headerBtn, { borderColor: colors.border, backgroundColor: colors.card }]}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="arrow-left" size={26} color={colors.foreground} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
            Companion
          </Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
            <MaterialCommunityIcons
              name={unsupervised ? "shield-alert-outline" : "shield-check"}
              size={13}
              color={unsupervised ? "#d97706" : "#22c55e"}
            />
            <Text
              style={[
                styles.headerSub,
                { color: unsupervised ? "#d97706" : "#22c55e", fontFamily: "Inter_600SemiBold" },
              ]}
            >
              {unsupervised ? "Safety check unavailable" : "Safety-supervised"}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={() => router.push("/(app)/translator")}
          style={[styles.headerBtn, { borderColor: colors.border, backgroundColor: colors.card }]}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="swap-horizontal" size={24} color={colors.gold} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => router.push("/(app)/companion-memory")}
          style={[styles.headerBtn, { borderColor: colors.border, backgroundColor: colors.card }]}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="brain" size={24} color="#a78bfa" />
        </TouchableOpacity>
      </View>

      {/* ── Emergency banner on red flags ── */}
      {hasRedFlag && (
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={callEmergencyServices}
          style={[styles.redFlagBanner, { backgroundColor: colors.emergencyBg, borderColor: colors.emergency }]}
        >
          <MaterialCommunityIcons name="phone-alert" size={26} color={colors.emergency} />
          <Text style={[styles.redFlagText, { color: colors.emergency, fontFamily: "Inter_700Bold" }]}>
            This sounds urgent. Tap here to call {EMERGENCY_NUMBER} now.
          </Text>
        </TouchableOpacity>
      )}

      {/* ── Conversation ── */}
      <ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        contentContainerStyle={styles.messageList}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
        showsVerticalScrollIndicator={false}
      >
        {messages.map((m, i) =>
          m.role === "assistant" ? (
            <View
              key={i}
              style={[
                styles.botBubble,
                {
                  backgroundColor: isRedFlag(m.content) ? colors.emergencyBg : colors.card,
                  borderColor: isRedFlag(m.content) ? colors.emergency : colors.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.botText,
                  {
                    color: isRedFlag(m.content) ? colors.emergency : colors.foreground,
                    fontFamily: "Inter_500Medium",
                  },
                ]}
              >
                {m.content}
              </Text>
            </View>
          ) : (
            <View key={i} style={[styles.userBubble, { backgroundColor: colors.primary }]}>
              <Text style={[styles.userText, { fontFamily: "Inter_500Medium" }]}>{m.content}</Text>
            </View>
          )
        )}
        {loading && (
          <View style={[styles.botBubble, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <ActivityIndicator size="small" color={colors.gold} />
              <Text style={[styles.thinkingText, { color: colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>
                Thinking…
              </Text>
            </View>
          </View>
        )}
        {listening && (
          <View style={[styles.listeningCard, { borderColor: "#dc2626", backgroundColor: "rgba(220,38,38,0.08)" }]}>
            <MaterialCommunityIcons name="microphone" size={24} color="#dc2626" />
            <Text style={[styles.listeningText, { color: "#dc2626", fontFamily: "Inter_600SemiBold" }]}>
              {liveTranscript || "I'm listening — take your time…"}
            </Text>
          </View>
        )}
        {voice.transcribing && (
          <View style={[styles.listeningCard, { borderColor: colors.gold, backgroundColor: "rgba(245,197,24,0.08)" }]}>
            <ActivityIndicator size="small" color={colors.gold} />
            <Text style={[styles.listeningText, { color: colors.gold, fontFamily: "Inter_600SemiBold" }]}>
              One moment — writing down what you said…
            </Text>
          </View>
        )}
      </ScrollView>

      {/* ── Controls ── */}
      <View style={[styles.controls, { borderTopColor: colors.border, paddingBottom: bottomPad }]}>
        {/* Secondary row */}
        <View style={styles.secondaryRow}>
          <TouchableOpacity
            onPress={repeatLastAnswer}
            activeOpacity={0.75}
            style={[styles.secondaryBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <MaterialCommunityIcons name="replay" size={24} color={colors.gold} />
            <Text style={[styles.secondaryText, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
              Say it again
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={toggleHandsFree}
            activeOpacity={0.75}
            style={[
              styles.secondaryBtn,
              {
                backgroundColor: handsFree ? "rgba(34,197,94,0.14)" : colors.card,
                borderColor: handsFree ? "#22c55e" : colors.border,
              },
            ]}
          >
            <MaterialCommunityIcons
              name={handsFree ? "account-voice" : "account-voice"}
              size={24}
              color={handsFree ? "#22c55e" : colors.mutedForeground}
            />
            <Text
              style={[
                styles.secondaryText,
                { color: handsFree ? "#22c55e" : colors.foreground, fontFamily: "Inter_600SemiBold" },
              ]}
            >
              {handsFree ? "Hands-free on" : "Hands-free"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setShowTyping((v) => !v)}
            activeOpacity={0.75}
            style={[styles.secondaryBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <MaterialCommunityIcons name="keyboard-outline" size={24} color={colors.mutedForeground} />
            <Text style={[styles.secondaryText, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
              Type
            </Text>
          </TouchableOpacity>
        </View>

        {/* Typing row (optional) */}
        {showTyping && (
          <View style={[styles.typeRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <TextInput
              style={[styles.typeInput, { color: colors.foreground, fontFamily: "Inter_500Medium" }]}
              placeholder="Type your question here…"
              placeholderTextColor={colors.mutedForeground}
              value={typedInput}
              onChangeText={setTypedInput}
              multiline
              maxLength={600}
            />
            <TouchableOpacity
              onPress={handleTypedSend}
              disabled={!typedInput.trim() || loading}
              style={[styles.typeSend, { backgroundColor: typedInput.trim() && !loading ? colors.gold : colors.border }]}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="send" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        )}

        {/* Big push-to-talk button */}
        <TouchableOpacity
          onPress={onPushToTalk}
          activeOpacity={0.85}
          style={[
            styles.talkBtn,
            {
              backgroundColor: listening ? "#dc2626" : colors.gold,
              shadowColor: listening ? "#dc2626" : colors.gold,
            },
          ]}
        >
          <MaterialCommunityIcons
            name={listening ? "stop" : voice.transcribing ? "ear-hearing" : speaking ? "volume-high" : "microphone"}
            size={44}
            color="#fff"
          />
          <Text style={[styles.talkBtnText, { fontFamily: "Inter_700Bold" }]}>
            {listening
              ? "I'm listening — tap when done"
              : voice.transcribing
                ? "One moment…"
                : speaking
                  ? "Speaking… tap to talk"
                  : "Tap and speak to me"}
          </Text>
        </TouchableOpacity>

        <Text style={[styles.footNote, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
          I explain and support — your own care team makes medical decisions with you.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerBtn: {
    width: 48,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { fontSize: 24, letterSpacing: -0.3 },
  headerSub: { fontSize: 13 },

  redFlagBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 2,
    borderRadius: 16,
    padding: 16,
    margin: 14,
    marginBottom: 0,
  },
  redFlagText: { fontSize: 18, lineHeight: 25, flex: 1 },

  messageList: { padding: 16, gap: 14, paddingBottom: 24 },
  botBubble: {
    alignSelf: "flex-start",
    maxWidth: "94%",
    borderRadius: 20,
    borderTopLeftRadius: 6,
    borderWidth: 1.5,
    padding: 18,
  },
  botText: { fontSize: 21, lineHeight: 32 },
  userBubble: {
    alignSelf: "flex-end",
    maxWidth: "88%",
    borderRadius: 20,
    borderBottomRightRadius: 6,
    padding: 16,
  },
  userText: { fontSize: 20, lineHeight: 29, color: "#fff" },
  thinkingText: { fontSize: 18 },

  listeningCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 2,
    borderRadius: 16,
    padding: 16,
  },
  listeningText: { fontSize: 19, lineHeight: 27, flex: 1 },

  controls: { borderTopWidth: 1, paddingHorizontal: 16, paddingTop: 12, gap: 12 },
  secondaryRow: { flexDirection: "row", gap: 10 },
  secondaryBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    borderWidth: 1.5,
    borderRadius: 16,
    paddingVertical: 12,
  },
  secondaryText: { fontSize: 14 },

  typeRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    borderWidth: 1.5,
    borderRadius: 18,
    paddingLeft: 16,
    paddingRight: 8,
    paddingVertical: 8,
    gap: 8,
  },
  typeInput: { flex: 1, fontSize: 19, lineHeight: 27, maxHeight: 120, paddingVertical: 6 },
  typeSend: { width: 52, height: 52, borderRadius: 14, alignItems: "center", justifyContent: "center" },

  talkBtn: {
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 24,
    paddingVertical: 22,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  talkBtnText: { color: "#fff", fontSize: 19, textAlign: "center", paddingHorizontal: 12 },

  footNote: { fontSize: 13, lineHeight: 18, textAlign: "center" },
});
