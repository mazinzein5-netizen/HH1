/**
 * HIVE Companion — pilot-only voice-first AI companion for older patients.
 * Very large text, high contrast, big tap targets, slow pacing.
 * Voice loop: speech recognition (web) → api-server companion brain
 * (with supervisor guardrail) → text-to-speech reply.
 */
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
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
import { usePatient } from "@/context/PatientContext";
import { useColors } from "@/hooks/useColors";
import { useVoiceInput, type VoiceInput } from "@/hooks/useVoiceInput";
import { callEmergencyServices, EMERGENCY_NUMBER, shareWithHealthServices } from "@/utils/healthShare";
import {
  getCompanionMemory,
  mergeCompanionMemory,
  type CompanionMemory,
} from "@/utils/companionMemory";
import {
  buildSarahAppContext,
  buildSarahCard,
  detectSarahIntent,
  type SarahCard,
} from "@/utils/sarahTools";
import { listAppointments, type Appointment } from "@/utils/telemedicineStore";

interface Msg {
  role: "user" | "assistant";
  content: string;
  supervised?: boolean;
  /** On-device data card shown alongside Sarah's reply. */
  card?: SarahCard;
  /** Special interactive blocks for the GP-letter flow. */
  letterOffer?: boolean;
  letterText?: string;
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
  const { data: patientData } = usePatient();
  const params = useLocalSearchParams<{ triage?: string; urgency?: string; ts?: string }>();

  const [messages, setMessages] = useState<Msg[]>([]);
  const [loading, setLoading] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [handsFree, setHandsFree] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState("");
  const [typedInput, setTypedInput] = useState("");
  const [showTyping, setShowTyping] = useState(false);

  const memoryRef = useRef<CompanionMemory | null>(null);
  const patientRef = useRef(patientData);
  patientRef.current = patientData;
  const triageRef = useRef<{ summary: string; urgency: string } | null>(null);
  const [draftingLetter, setDraftingLetter] = useState(false);
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

      // A triage handoff greeting is handled by the params-reactive effect
      // below; skip the generic greeting when one is arriving.
      if (typeof params.triage === "string" && params.triage.trim()) return;

      const greeting = returning
        ? `Hello again${name}, it's Sarah. It's lovely to talk with you. Last time we spoke about ${mem.topics[mem.topics.length - 1]?.toLowerCase()}. Would you like to carry on with that, or is something else on your mind today?`
        : `Hello${name}, I'm Sarah — your companion here in the HIVE. You can press the big button and just talk to me. Ask me anything about your health or your medicines, or ask me to show your prescriptions, your appointments, or to book one — I'll take you right there. What would you like to talk about?`;
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

  // ── Triage handoff (reactive: re-fires when a new questionnaire result
  // arrives, keyed by its `ts` freshness param) ──
  const processedTriageTsRef = useRef<string | null>(null);
  useEffect(() => {
    const triageSummary = typeof params.triage === "string" && params.triage.trim() ? params.triage.trim() : null;
    if (!triageSummary) return;
    const ts = typeof params.ts === "string" ? params.ts : "";
    if (processedTriageTsRef.current === ts) return;
    processedTriageTsRef.current = ts;

    triageRef.current = {
      summary: triageSummary,
      urgency: params.urgency === "urgent" ? "urgent" : "routine",
    };
    const name = memoryRef.current?.name ? `, ${memoryRef.current.name}` : "";
    const urgent = triageRef.current.urgency === "urgent";
    const greeting = urgent
      ? `Hello${name}, I'm Sarah. I've seen your questionnaire result, and because of the answers you gave, this is something a doctor should look at urgently — within the next day or two, or call 112 if things get worse. If you'd like, I can write a short letter to your GP about it right now — it only goes anywhere if you approve it and share it yourself. Shall I draft it?`
      : `Hello${name}, I'm Sarah. Well done for completing that questionnaire — that takes care and patience. Based on your result, it would be worth having your GP look at this within the next couple of weeks. If you'd like, I can write a short letter to your GP for you — you'd read it first, and nothing is sent unless you choose to share it. Shall I draft it?`;
    setMessages((prev) => [
      ...prev.map((m) => ({ ...m, letterOffer: false })),
      { role: "assistant" as const, content: greeting, supervised: true, letterOffer: true },
    ]);
    speakText(greeting);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.triage, params.urgency, params.ts]);

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
    let next = [...messagesRef.current, userMsg];
    setMessages(next);
    setLoading(true);

    // On-device tool layer: fetch local data for the request, show it as a
    // card, and let Sarah talk the patient through it. Data stays on-device;
    // only a compact text summary rides along with the AI request.
    let appointments: Appointment[] = [];
    try {
      appointments = await listAppointments();
    } catch {}
    let card: SarahCard | null = null;
    const intent = detectSarahIntent(trimmed);
    if (intent) {
      card = buildSarahCard(intent, patientRef.current, appointments);
    }
    const appContext = buildSarahAppContext(
      patientRef.current,
      appointments,
      card,
      triageRef.current?.summary ?? null
    );

    const domain = process.env.EXPO_PUBLIC_DOMAIN;
    const body = JSON.stringify({
      pilotCode: PILOT_ACTIVATION_CODE,
      messages: next.map(({ role, content }) => ({ role, content })),
      memory: memoryRef.current ?? undefined,
      appContext: appContext || undefined,
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
          { role: "assistant", content: data!.message!, supervised: data!.supervised, card: card ?? undefined },
        ]);
        speakText(data.message);
        if (data.memoryUpdates) {
          memoryRef.current = await mergeCompanionMemory(data.memoryUpdates);
        }
      } else {
        const fallback =
          "I'm still right here with you — I just couldn't hear from my helpers for a moment. Take a breath, and let's try that again together in a few seconds.";
        setMessages((prev) => [...prev, { role: "assistant", content: fallback, supervised: true, card: card ?? undefined }]);
        speakText(fallback);
      }
    } finally {
      setLoading(false);
    }
  }

  // ── GP letter flow (post-questionnaire, always with consent) ──
  async function draftGpLetter() {
    const triage = triageRef.current;
    if (!triage || draftingLetter) return;
    setDraftingLetter(true);
    setMessages((prev) => prev.map((m) => ({ ...m, letterOffer: false })));
    const domain = process.env.EXPO_PUBLIC_DOMAIN;
    try {
      const res = await fetch(`https://${domain}/api/ai/gp-letter`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pilotCode: PILOT_ACTIVATION_CODE,
          resultSummary: triage.summary,
          urgency: triage.urgency,
        }),
      });
      const data = res.ok ? ((await res.json()) as { letter?: string }) : null;
      if (data?.letter) {
        const intro =
          "Here's the letter I've drafted for your GP. Have a read through it — if you're happy, tap Share to send it however suits you. Nothing goes anywhere without you.";
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: intro, supervised: true, letterText: data.letter },
        ]);
        speakText(intro);
        // Letter drafted — stop carrying the triage context into later turns.
        triageRef.current = null;
      } else {
        const oops =
          "I'm sorry — I couldn't put the letter together just now. We can try again in a moment, or you can use the Send to Health Services button on your questionnaire result instead.";
        setMessages((prev) => [...prev, { role: "assistant", content: oops, supervised: true }]);
        speakText(oops);
      }
    } catch {
      const oops =
        "I'm sorry — I couldn't put the letter together just now. We can try again in a moment.";
      setMessages((prev) => [...prev, { role: "assistant", content: oops, supervised: true }]);
      speakText(oops);
    } finally {
      setDraftingLetter(false);
    }
  }

  function declineGpLetter() {
    triageRef.current = null;
    setMessages((prev) => prev.map((m) => ({ ...m, letterOffer: false })));
    const reply =
      "Of course — no letter, no bother. It's all saved on your phone if you change your mind. Now, is there anything about the result you'd like me to explain, or anything else on your mind?";
    setMessages((prev) => [...prev, { role: "assistant", content: reply, supervised: true }]);
    speakText(reply);
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
            Sarah
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

              {/* On-device data card (Sarah's tool layer) */}
              {m.card && (
                <View style={[styles.toolCard, { backgroundColor: colors.background, borderColor: colors.goldBorder ?? colors.border }]}>
                  <View style={styles.toolCardHeader}>
                    <MaterialCommunityIcons name={m.card.icon as any} size={22} color={colors.gold} />
                    <Text style={[styles.toolCardTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
                      {m.card.title}
                    </Text>
                  </View>
                  {m.card.lines.map((line, li) => (
                    <Text key={li} style={[styles.toolCardLine, { color: colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>
                      {line}
                    </Text>
                  ))}
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => router.push(m.card!.route as any)}
                    style={[styles.toolCardBtn, { backgroundColor: colors.gold }]}
                  >
                    <Text style={[styles.toolCardBtnText, { fontFamily: "Inter_700Bold" }]}>
                      {m.card.routeLabel}
                    </Text>
                    <MaterialCommunityIcons name="arrow-right" size={20} color="#fff" />
                  </TouchableOpacity>
                </View>
              )}

              {/* GP letter offer buttons */}
              {m.letterOffer && (
                <View style={styles.letterBtnRow}>
                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={draftGpLetter}
                    disabled={draftingLetter}
                    style={[styles.letterBtn, { backgroundColor: colors.gold }]}
                  >
                    <MaterialCommunityIcons name="email-edit" size={22} color="#fff" />
                    <Text style={[styles.letterBtnText, { fontFamily: "Inter_700Bold" }]}>
                      Yes, draft the letter
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={declineGpLetter}
                    disabled={draftingLetter}
                    style={[styles.letterBtn, { backgroundColor: colors.card, borderWidth: 1.5, borderColor: colors.border }]}
                  >
                    <Text style={[styles.letterBtnText, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
                      No thanks
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Drafted GP letter */}
              {m.letterText && (
                <View style={[styles.toolCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <View style={styles.toolCardHeader}>
                    <MaterialCommunityIcons name="email-outline" size={22} color={colors.gold} />
                    <Text style={[styles.toolCardTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
                      Letter to your GP
                    </Text>
                  </View>
                  <Text style={[styles.letterBody, { color: colors.foreground, fontFamily: "Inter_400Regular" }]}>
                    {m.letterText}
                  </Text>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => shareWithHealthServices("Letter to my GP", m.letterText!)}
                    style={[styles.toolCardBtn, { backgroundColor: "#1fa35c" }]}
                  >
                    <MaterialCommunityIcons name="share-variant" size={20} color="#fff" />
                    <Text style={[styles.toolCardBtnText, { fontFamily: "Inter_700Bold" }]}>
                      Share this letter
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
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

  toolCard: { marginTop: 14, borderWidth: 1.5, borderRadius: 16, padding: 14, gap: 8 },
  toolCardHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  toolCardTitle: { fontSize: 18, flex: 1 },
  toolCardLine: { fontSize: 17, lineHeight: 25 },
  toolCardBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 6,
  },
  toolCardBtnText: { color: "#fff", fontSize: 17 },
  letterBtnRow: { flexDirection: "row", gap: 10, marginTop: 14 },
  letterBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 14,
    paddingVertical: 16,
  },
  letterBtnText: { color: "#fff", fontSize: 16, textAlign: "center" },
  letterBody: { fontSize: 16, lineHeight: 24 },
});
