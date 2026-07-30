/**
 * Clinician Translator — pilot-only, two directions:
 *  1. Clinical → Plain: paste/dictate a clinical letter or terms, get plain English.
 *  2. My words → Clinical: describe symptoms, get an SBAR-style summary for the GP.
 */
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Speech from "expo-speech";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
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
import { shareWithHealthServices } from "@/utils/healthShare";

type Direction = "toPlain" | "toClinical";

export default function TranslatorScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { pilotMode } = useAppMode();

  const [direction, setDirection] = useState<Direction>("toPlain");
  const [input, setInput] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (!pilotMode) router.replace("/(app)/(tabs)/dashboard");
  }, [pilotMode]);

  useEffect(() => {
    return () => {
      try { Speech.stop(); } catch {}
      if (recognitionRef.current) { try { recognitionRef.current.stop(); } catch {} }
    };
  }, []);

  function switchDirection(d: Direction) {
    if (d === direction) return;
    setDirection(d);
    setInput("");
    setResult("");
  }

  function toggleDictation() {
    if (listening) {
      try { recognitionRef.current?.stop(); } catch {}
      recognitionRef.current = null;
      setListening(false);
      return;
    }
    if (Platform.OS !== "web") {
      Alert.alert("Dictation", "Dictation works fully in the installed app. In this preview, please type or paste the text.");
      return;
    }
    const Win = window as any;
    const SR = Win.SpeechRecognition ?? Win.webkitSpeechRecognition;
    if (!SR) {
      Alert.alert("Not supported", "This browser doesn't support dictation. Please type or paste the text.");
      return;
    }
    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = "en-IE";
    rec.onresult = (event: any) => {
      const transcript = (Array.from(event.results) as any[])
        .map((r: any) => r[0].transcript as string)
        .join("");
      setInput(transcript);
    };
    rec.onend = () => { setListening(false); recognitionRef.current = null; };
    rec.onerror = () => { setListening(false); recognitionRef.current = null; };
    recognitionRef.current = rec;
    rec.start();
    setListening(true);
  }

  async function handleTranslate() {
    const text = input.trim();
    if (!text || loading) return;
    setLoading(true);
    setResult("");
    try {
      const domain = process.env.EXPO_PUBLIC_DOMAIN;
      const res = await fetch(`https://${domain}/api/ai/translate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pilotCode: PILOT_ACTIVATION_CODE, direction, text }),
      });
      if (res.ok) {
        const data = (await res.json()) as { result?: string };
        setResult(data.result ?? "");
      } else {
        Alert.alert("Sorry", "I couldn't translate that just now. Please try again in a moment.");
      }
    } catch {
      Alert.alert("Sorry", "I couldn't connect. Please check your internet and try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleReadAloud() {
    if (!result) return;
    try {
      Speech.stop();
      Speech.speak(result.replace(/\s+/g, " ").trim(), { language: "en-IE", rate: 0.88 });
    } catch {}
  }

  function handleShare() {
    if (!result) return;
    shareWithHealthServices(
      direction === "toClinical"
        ? "HIVE Companion — Clinical Summary (Patient-Reported)"
        : "HIVE Companion — Plain-English Explanation",
      result
    );
  }

  if (!pilotMode) return null;

  const topPad = Platform.OS === "web" ? 24 : insets.top;
  const bottomPad = Platform.OS === "web" ? 20 : Math.max(insets.bottom, 12);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ThemedStatusBar backgroundColor="transparent" translucent />

      <View style={[styles.header, { paddingTop: topPad + 8, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.headerBtn, { borderColor: colors.border, backgroundColor: colors.card }]}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="arrow-left" size={26} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
          Clinician Translator
        </Text>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: bottomPad + 24 }]} showsVerticalScrollIndicator={false}>
          {/* Direction picker */}
          <View style={styles.dirRow}>
            <TouchableOpacity
              onPress={() => switchDirection("toPlain")}
              activeOpacity={0.85}
              style={[
                styles.dirCard,
                {
                  backgroundColor: direction === "toPlain" ? "rgba(201,134,10,0.14)" : colors.card,
                  borderColor: direction === "toPlain" ? colors.gold : colors.border,
                },
              ]}
            >
              <MaterialCommunityIcons name="file-document-outline" size={28} color={direction === "toPlain" ? colors.gold : colors.mutedForeground} />
              <Text style={[styles.dirTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
                Explain a letter
              </Text>
              <Text style={[styles.dirSub, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                Doctor's words → plain English
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => switchDirection("toClinical")}
              activeOpacity={0.85}
              style={[
                styles.dirCard,
                {
                  backgroundColor: direction === "toClinical" ? "rgba(201,134,10,0.14)" : colors.card,
                  borderColor: direction === "toClinical" ? colors.gold : colors.border,
                },
              ]}
            >
              <MaterialCommunityIcons name="account-voice" size={28} color={direction === "toClinical" ? colors.gold : colors.mutedForeground} />
              <Text style={[styles.dirTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
                Summary for my GP
              </Text>
              <Text style={[styles.dirSub, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                My words → clinical summary
              </Text>
            </TouchableOpacity>
          </View>

          {/* Input */}
          <View style={[styles.inputCard, { backgroundColor: colors.card, borderColor: listening ? "#dc2626" : colors.border }]}>
            <TextInput
              style={[styles.textInput, { color: colors.foreground, fontFamily: "Inter_500Medium" }]}
              placeholder={
                direction === "toPlain"
                  ? "Paste or dictate the letter, results, or medical terms here…"
                  : "Tell me in your own words what's been going on — where it hurts, when it started, how it feels…"
              }
              placeholderTextColor={colors.mutedForeground}
              value={input}
              onChangeText={setInput}
              multiline
              textAlignVertical="top"
            />
            <View style={styles.inputActions}>
              <TouchableOpacity
                onPress={toggleDictation}
                activeOpacity={0.75}
                style={[
                  styles.dictateBtn,
                  {
                    backgroundColor: listening ? "rgba(220,38,38,0.12)" : colors.background,
                    borderColor: listening ? "#dc2626" : colors.border,
                  },
                ]}
              >
                <MaterialCommunityIcons name={listening ? "microphone" : "microphone-outline"} size={22} color={listening ? "#dc2626" : colors.mutedForeground} />
                <Text style={[styles.dictateText, { color: listening ? "#dc2626" : colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
                  {listening ? "Listening… tap to stop" : "Dictate"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleTranslate}
                disabled={!input.trim() || loading}
                activeOpacity={0.85}
                style={[styles.translateBtn, { backgroundColor: input.trim() && !loading ? colors.gold : colors.border }]}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <MaterialCommunityIcons name="swap-horizontal" size={22} color="#fff" />
                )}
                <Text style={[styles.translateText, { fontFamily: "Inter_700Bold" }]}>
                  {loading ? "Working…" : "Translate"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Result */}
          {result !== "" && (
            <View style={[styles.resultCard, { backgroundColor: colors.card, borderColor: colors.gold + "66" }]}>
              <View style={styles.resultHead}>
                <MaterialCommunityIcons
                  name={direction === "toClinical" ? "clipboard-text-outline" : "lightbulb-on-outline"}
                  size={22}
                  color={colors.gold}
                />
                <Text style={[styles.resultTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
                  {direction === "toClinical" ? "Summary for your care team" : "In plain English"}
                </Text>
              </View>
              <Text style={[styles.resultText, { color: colors.foreground, fontFamily: "Inter_500Medium" }]}>
                {result}
              </Text>
              <View style={styles.resultActions}>
                <TouchableOpacity
                  onPress={handleReadAloud}
                  activeOpacity={0.8}
                  style={[styles.resultBtn, { backgroundColor: colors.background, borderColor: colors.border }]}
                >
                  <MaterialCommunityIcons name="volume-high" size={22} color={colors.gold} />
                  <Text style={[styles.resultBtnText, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
                    Read aloud
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleShare}
                  activeOpacity={0.8}
                  style={[styles.resultBtn, { backgroundColor: "rgba(201,134,10,0.14)", borderColor: colors.gold + "66" }]}
                >
                  <MaterialCommunityIcons name="share-variant" size={22} color={colors.gold} />
                  <Text style={[styles.resultBtnText, { color: colors.gold, fontFamily: "Inter_700Bold" }]}>
                    Share / Send
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          <Text style={[styles.footNote, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
            Translations help you communicate — they are not medical advice and are not clinically verified.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
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

  scroll: { padding: 16, gap: 14 },

  dirRow: { flexDirection: "row", gap: 12 },
  dirCard: {
    flex: 1,
    alignItems: "center",
    gap: 6,
    borderWidth: 2,
    borderRadius: 18,
    padding: 16,
  },
  dirTitle: { fontSize: 16, textAlign: "center" },
  dirSub: { fontSize: 12.5, textAlign: "center", lineHeight: 17 },

  inputCard: { borderWidth: 1.5, borderRadius: 18, padding: 14, gap: 12 },
  textInput: { fontSize: 19, lineHeight: 28, minHeight: 140, maxHeight: 260 },
  inputActions: { flexDirection: "row", gap: 10 },
  dictateBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1.5,
    borderRadius: 14,
    paddingVertical: 14,
  },
  dictateText: { fontSize: 15 },
  translateBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 14,
    paddingVertical: 14,
  },
  translateText: { color: "#fff", fontSize: 16 },

  resultCard: { borderWidth: 1.5, borderRadius: 18, padding: 18, gap: 12 },
  resultHead: { flexDirection: "row", alignItems: "center", gap: 10 },
  resultTitle: { fontSize: 18, flex: 1 },
  resultText: { fontSize: 19, lineHeight: 30 },
  resultActions: { flexDirection: "row", gap: 10, marginTop: 4 },
  resultBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1.5,
    borderRadius: 14,
    paddingVertical: 14,
  },
  resultBtnText: { fontSize: 15 },

  footNote: { fontSize: 13, lineHeight: 18, textAlign: "center", paddingHorizontal: 12 },
});
