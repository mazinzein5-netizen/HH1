/**
 * Sign Language Modal — camera-based input for Sarah.
 * Uses browser getUserMedia on web (works in Expo Web preview).
 * Graceful native fallback — full camera available in the installed app.
 */
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";

interface Props {
  visible: boolean;
  onClose: () => void;
  onSubmit: (text: string) => void;
}

// ── Web camera view using getUserMedia ────────────────────────────────────────

function WebCameraView({ facing }: { facing: "user" | "environment" }) {
  const videoRef   = useRef<any>(null);
  const streamRef  = useRef<any>(null);

  const startCamera = useCallback(async () => {
    try {
      const stream = await (navigator as any).mediaDevices?.getUserMedia({
        video: { facingMode: facing },
      });
      if (!stream) return;
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
    } catch {
      // permission denied or not available
    }
  }, [facing]);

  useEffect(() => {
    startCamera();
    return () => {
      streamRef.current?.getTracks?.().forEach((t: any) => t.stop());
      streamRef.current = null;
    };
  }, [startCamera]);

  // React Native Web renders React.createElement calls as real HTML elements
  return React.createElement("video", {
    ref: videoRef,
    playsInline: true,
    muted: true,
    autoPlay: true,
    style: {
      width: "100%",
      height: 280,
      objectFit: "cover" as any,
      display: "block",
      borderRadius: 0,
      backgroundColor: "#000",
    },
  });
}

// ── Native placeholder ─────────────────────────────────────────────────────────

function NativeCameraPlaceholder({ colors }: { colors: ReturnType<typeof useColors> }) {
  return (
    <View style={[native.box, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <MaterialCommunityIcons name="camera-outline" size={48} color={colors.mutedForeground} />
      <Text style={[native.title, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
        Camera available in the app
      </Text>
      <Text style={[native.body, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
        Install the HIVE Companion app on your device to use the live sign language camera. In this preview, type your message in the box below.
      </Text>
    </View>
  );
}

const native = StyleSheet.create({
  box: { margin: 16, borderRadius: 16, borderWidth: 1, padding: 28, alignItems: "center", gap: 12 },
  title: { fontSize: 16, textAlign: "center" },
  body: { fontSize: 13, lineHeight: 20, textAlign: "center" },
});

// ── Main modal ─────────────────────────────────────────────────────────────────

type Phase = "idle" | "watching" | "transcribe";

export default function SignLanguageModal({ visible, onClose, onSubmit }: Props) {
  const colors  = useColors();
  const insets  = useSafeAreaInsets();
  const [facing, setFacing] = useState<"user" | "environment">("user");
  const [typed,  setTyped]  = useState("");
  const [phase,  setPhase]  = useState<Phase>("idle");

  // Stop camera stream on close
  useEffect(() => {
    if (!visible) { setPhase("idle"); setTyped(""); }
  }, [visible]);

  function handleDone()  { setPhase("transcribe"); }
  function handleClose() { setTyped(""); setPhase("idle"); onClose(); }
  function handleSubmit() {
    const text = typed.trim();
    if (!text) return;
    onSubmit(text);
    setTyped("");
    setPhase("idle");
    onClose();
  }

  const bottomPad = Platform.OS === "ios" ? insets.bottom : 16;
  const isWeb     = Platform.OS === "web";

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={handleClose} />
        <View style={[styles.sheet, { backgroundColor: colors.background, paddingBottom: bottomPad }]}>

          {/* Drag handle */}
          <View style={[styles.dragHandle, { backgroundColor: colors.border }]} />

          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View style={[styles.headerIcon, { backgroundColor: "rgba(79,70,229,0.12)", borderColor: "rgba(79,70,229,0.3)" }]}>
              <MaterialCommunityIcons name="hand-wave" size={20} color="#4f46e5" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.title, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>Sign Language Mode</Text>
              <Text style={[styles.subtitle, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                {isWeb ? "Sarah is watching — sign to her" : "Available in the installed app"}
              </Text>
            </View>
            <TouchableOpacity onPress={handleClose} style={styles.closeBtn} activeOpacity={0.7}>
              <MaterialCommunityIcons name="close" size={20} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>

          {/* Camera / placeholder */}
          {phase !== "transcribe" && (
            <View>
              {isWeb ? (
                <View style={{ position: "relative" }}>
                  <WebCameraView facing={facing} />
                  {/* Flip button */}
                  <TouchableOpacity
                    style={styles.flipBtn}
                    onPress={() => setFacing((f) => (f === "user" ? "environment" : "user"))}
                    activeOpacity={0.8}
                  >
                    <MaterialCommunityIcons name="camera-flip-outline" size={20} color="#fff" />
                  </TouchableOpacity>
                  {/* Watching badge */}
                  {phase === "watching" && (
                    <View style={styles.watchBadge}>
                      <View style={styles.watchDot} />
                      <Text style={[styles.watchText, { fontFamily: "Inter_600SemiBold" }]}>Watching…</Text>
                    </View>
                  )}
                </View>
              ) : (
                <NativeCameraPlaceholder colors={colors} />
              )}

              {/* Controls */}
              <View style={styles.controls}>
                <Text style={[styles.hint, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                  {phase === "idle"
                    ? isWeb ? "Position your hands in view, then tap Start Signing" : "Type what you want to say below"
                    : "Sign clearly — take your time. Tap Done when finished."}
                </Text>
                {phase === "idle" ? (
                  <TouchableOpacity
                    style={[styles.primaryBtn, { backgroundColor: "#4f46e5" }]}
                    onPress={isWeb ? () => setPhase("watching") : () => setPhase("transcribe")}
                    activeOpacity={0.85}
                  >
                    <MaterialCommunityIcons name="hand-wave" size={18} color="#fff" />
                    <Text style={[styles.primaryBtnText, { fontFamily: "Inter_700Bold" }]}>
                      {isWeb ? "Start Signing" : "Type My Message"}
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={[styles.primaryBtn, { backgroundColor: "#16a34a" }]}
                    onPress={handleDone}
                    activeOpacity={0.85}
                  >
                    <MaterialCommunityIcons name="check-circle" size={18} color="#fff" />
                    <Text style={[styles.primaryBtnText, { fontFamily: "Inter_700Bold" }]}>I've Finished Signing</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}

          {/* Transcription phase */}
          {phase === "transcribe" && (
            <View style={styles.transcribeBox}>
              {isWeb && (
                <View style={[styles.transHint, { backgroundColor: "rgba(79,70,229,0.08)", borderColor: "rgba(79,70,229,0.25)" }]}>
                  <MaterialCommunityIcons name="information-outline" size={15} color="#4f46e5" />
                  <Text style={[styles.transHintText, { color: "#4f46e5", fontFamily: "Inter_500Medium" }]}>
                    Type what you just signed — Sarah will respond to it. Automated sign recognition is coming soon.
                  </Text>
                </View>
              )}
              <Text style={[styles.transLabel, { color: colors.mutedForeground, fontFamily: "Inter_600SemiBold" }]}>
                {isWeb ? "WHAT DID YOU SIGN?" : "YOUR MESSAGE"}
              </Text>
              <View style={[styles.inputBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <TextInput
                  style={[styles.textInput, { color: colors.foreground, fontFamily: "Inter_400Regular" }]}
                  placeholder={isWeb ? "Type what you signed here…" : "Type your message…"}
                  placeholderTextColor={colors.mutedForeground}
                  value={typed}
                  onChangeText={setTyped}
                  multiline
                  autoFocus
                />
              </View>
              <View style={styles.transActions}>
                {isWeb && (
                  <TouchableOpacity
                    style={[styles.secondaryBtn, { borderColor: colors.border }]}
                    onPress={() => setPhase("idle")}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.secondaryBtnText, { color: colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>Sign Again</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={[styles.primaryBtn, { backgroundColor: typed.trim() ? "#C9860A" : colors.border, flex: 1 }]}
                  onPress={handleSubmit}
                  disabled={!typed.trim()}
                  activeOpacity={0.85}
                >
                  <MaterialCommunityIcons name="bee" size={18} color="#fff" />
                  <Text style={[styles.primaryBtnText, { fontFamily: "Inter_700Bold" }]}>Send to Sarah</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay:  { flex: 1, justifyContent: "flex-end" },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.55)" },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: "hidden" },
  dragHandle: { width: 40, height: 4, borderRadius: 2, alignSelf: "center", marginTop: 10, marginBottom: 8 },
  header: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 1 },
  headerIcon: { width: 40, height: 40, borderRadius: 12, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 16, letterSpacing: -0.2 },
  subtitle: { fontSize: 11.5, marginTop: 1 },
  closeBtn: { padding: 6 },
  // Camera overlay elements
  flipBtn: { position: "absolute", top: 10, right: 10, width: 38, height: 38, borderRadius: 11, backgroundColor: "rgba(0,0,0,0.45)", alignItems: "center", justifyContent: "center" },
  watchBadge: { position: "absolute", bottom: 10, alignSelf: "center", flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "rgba(220,38,38,0.85)", borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6 },
  watchDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#fff" },
  watchText: { color: "#fff", fontSize: 12 },
  // Controls
  controls: { padding: 16, gap: 12, alignItems: "center" },
  hint: { fontSize: 13, lineHeight: 19, textAlign: "center" },
  primaryBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 14, paddingHorizontal: 24, paddingVertical: 13, alignSelf: "stretch" },
  primaryBtnText: { color: "#fff", fontSize: 15 },
  // Transcription
  transcribeBox: { padding: 16, gap: 12 },
  transHint: { flexDirection: "row", alignItems: "flex-start", gap: 8, borderRadius: 12, borderWidth: 1, padding: 11 },
  transHintText: { fontSize: 12.5, lineHeight: 18, flex: 1 },
  transLabel: { fontSize: 10.5, letterSpacing: 1.2 },
  inputBox: { borderRadius: 14, borderWidth: 1, padding: 12 },
  textInput: { fontSize: 14, lineHeight: 21, minHeight: 70 },
  transActions: { flexDirection: "row", gap: 10 },
  secondaryBtn: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 13, alignItems: "center", justifyContent: "center" },
  secondaryBtnText: { fontSize: 14 },
});
