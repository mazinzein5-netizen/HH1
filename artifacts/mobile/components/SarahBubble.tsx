/**
 * SarahBubble — compact, voice-first speech bubble for Sarah.
 *
 * Unlike the full ChatBot modal, this is a small non-blocking bubble pinned
 * above the tab bar: the user can keep scrolling and navigating while the
 * conversation continues in voice. Sarah's latest reply shows as text in the
 * bubble and is spoken aloud; the mic button keeps the conversation going.
 */
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Speech from "expo-speech";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PILOT_ACTIVATION_CODE, useAppMode } from "@/context/AppModeContext";
import { usePatient } from "@/context/PatientContext";
import { useColors } from "@/hooks/useColors";
import { useVoiceInput } from "@/hooks/useVoiceInput";
import { buildAppContext, detectIntent, runTool } from "@/utils/companionTools";

interface Msg {
  role: "user" | "assistant";
  content: string;
}

function toSpeakable(text: string): string {
  return text
    .replace(/[*_#`>]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export default function SarahBubble({
  visible,
  onClose,
  onExpand,
}: {
  visible: boolean;
  onClose: () => void;
  onExpand: () => void;
}) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { pilotMode } = useAppMode();
  const { data: patient } = usePatient();

  const [history, setHistory] = useState<Msg[]>([]);
  const [display, setDisplay] = useState<string>(
    "Hi, I'm Sarah. Tap the mic and talk to me — you can keep using the app while we chat."
  );
  const [status, setStatus] = useState<"idle" | "listening" | "thinking">("idle");

  const voice = useVoiceInput({
    onInterim: (t) => t && setDisplay(t),
    onFinal: (t) => {
      setStatus("idle");
      if (t) send(t);
    },
    onError: (msg) => {
      setStatus("idle");
      Alert.alert("Voice", msg);
    },
  });

  const speak = (text: string) => {
    try {
      Speech.stop();
      Speech.speak(toSpeakable(text), { language: "en-IE", rate: 0.95 });
    } catch {}
  };

  async function send(text: string) {
    setDisplay(text);
    setStatus("thinking");
    const next: Msg[] = [...history, { role: "user" as const, content: text }];
    try {
      // On-device tools first (prescriptions, history, appointments…)
      const intent = detectIntent(text);
      if (intent) {
        const result = await runTool(intent, patient);
        setHistory([...next, { role: "assistant", content: result.reply }]);
        setDisplay(result.reply);
        speak(result.reply);
        setStatus("idle");
        return;
      }
      const domain = process.env.EXPO_PUBLIC_DOMAIN;
      const appContext = await buildAppContext();
      const res = await fetch(`https://${domain}/api/ai/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: next.slice(-8),
          appContext,
          ...(pilotMode ? { pilotCode: PILOT_ACTIVATION_CODE } : {}),
        }),
      });
      const data = await res.json().catch(() => ({}));
      const reply: string =
        res.ok && data.message
          ? String(data.message)
          : "I couldn't reach my thinking just now — please try again in a moment.";
      setHistory([...next, { role: "assistant", content: reply }]);
      setDisplay(reply);
      speak(reply);
    } catch {
      const fallback = "I couldn't connect just now — please check your connection and try again.";
      setDisplay(fallback);
      speak(fallback);
    } finally {
      setStatus("idle");
    }
  }

  function toggleMic() {
    if (voice.listening) {
      voice.stop();
      return;
    }
    try {
      Speech.stop();
    } catch {}
    setStatus("listening");
    voice.start();
  }

  const visibleRef = useRef(visible);
  visibleRef.current = visible;
  useEffect(() => {
    if (!visible) {
      try {
        Speech.stop();
      } catch {}
      voice.cancel();
      setStatus("idle");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  if (!visible) return null;

  const bottom = (Platform.OS === "web" ? 34 : insets.bottom) + 64 + 64;

  return (
    <View style={[styles.wrap, { bottom }]} pointerEvents="box-none">
      <View style={[styles.bubble, { backgroundColor: colors.card, borderColor: colors.gold + "55" }]}>
        <View style={styles.headRow}>
          <View style={styles.headLeft}>
            <Image
              source={require("@/assets/images/bee-mascot.png")}
              style={{ width: 22, height: 22 }}
              resizeMode="contain"
              accessibilityIgnoresInvertColors
            />
            <Text style={[styles.name, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>Sarah</Text>
            {status !== "idle" && (
              <Text style={[styles.status, { color: colors.gold, fontFamily: "Inter_500Medium" }]}>
                {status === "listening" ? "listening…" : "thinking…"}
              </Text>
            )}
          </View>
          <View style={styles.headBtns}>
            <TouchableOpacity onPress={onExpand} style={styles.iconBtn} accessibilityLabel="Open full chat">
              <Feather name="maximize-2" size={14} color={colors.mutedForeground} />
            </TouchableOpacity>
            <TouchableOpacity onPress={onClose} style={styles.iconBtn} accessibilityLabel="Close">
              <Feather name="x" size={15} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView style={styles.textScroll} showsVerticalScrollIndicator={false}>
          <Text style={[styles.text, { color: colors.foreground, fontFamily: "Inter_400Regular" }]}>
            {display}
          </Text>
        </ScrollView>

        <View style={styles.micRow}>
          {status === "thinking" ? (
            <ActivityIndicator size="small" color={colors.gold} />
          ) : (
            <TouchableOpacity
              onPress={toggleMic}
              activeOpacity={0.8}
              style={[
                styles.micBtn,
                {
                  backgroundColor: voice.listening ? "#E5294E" : colors.gold,
                },
              ]}
              accessibilityLabel={voice.listening ? "Stop listening" : "Talk to Sarah"}
            >
              <MaterialCommunityIcons
                name={voice.listening ? "stop" : "microphone"}
                size={19}
                color="#fff"
              />
            </TouchableOpacity>
          )}
          <Text style={[styles.hint, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
            {voice.listening ? "Tap to finish" : "Tap the mic and speak"}
          </Text>
        </View>

        {/* speech-bubble tail pointing towards the bee */}
        <View style={[styles.tail, { borderTopColor: colors.card }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    right: 10,
    left: 10,
    alignItems: "flex-end",
    zIndex: 9998,
  },
  bubble: {
    width: 250,
    maxWidth: "92%",
    borderRadius: 18,
    borderWidth: 1,
    padding: 12,
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  headRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  headLeft: { flexDirection: "row", alignItems: "center", gap: 5 },
  name: { fontSize: 13 },
  status: { fontSize: 11 },
  headBtns: { flexDirection: "row", gap: 4 },
  iconBtn: { padding: 4 },
  textScroll: { maxHeight: 110 },
  text: { fontSize: 13, lineHeight: 19 },
  micRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  micBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  hint: { fontSize: 11, flex: 1 },
  tail: {
    position: "absolute",
    bottom: -9,
    right: 22,
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 10,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
  },
});
