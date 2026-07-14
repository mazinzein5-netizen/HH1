/**
 * Sign Language Modal — camera-based input for Queen B.
 * Uses expo-camera to show a live camera view while the patient signs.
 * The patient taps "I've finished signing" to submit a transcription note,
 * or uses the text field to type what they signed if auto-recognition
 * is not yet available on this device.
 */
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { CameraView, CameraType, useCameraPermissions } from "expo-camera";
import React, { useState } from "react";
import {
  ActivityIndicator,
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

export default function SignLanguageModal({ visible, onClose, onSubmit }: Props) {
  const colors  = useColors();
  const insets  = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing]   = useState<CameraType>("front");
  const [typed, setTyped]     = useState("");
  const [phase, setPhase]     = useState<"idle" | "watching" | "transcribe">("idle");

  function handleRequestPerm() { requestPermission(); }

  function handleStartSigning() { setPhase("watching"); }

  function handleDone() { setPhase("transcribe"); }

  function handleSubmit() {
    const text = typed.trim();
    if (!text) return;
    onSubmit(text);
    setTyped("");
    setPhase("idle");
    onClose();
  }

  function handleClose() {
    setTyped("");
    setPhase("idle");
    onClose();
  }

  const bottomPad = Platform.OS === "ios" ? insets.bottom : 16;

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={handleClose} />
        <View style={[styles.sheet, { backgroundColor: colors.background, paddingBottom: bottomPad }]}>
          {/* Header */}
          <View style={styles.dragHandle} />
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View style={[styles.headerIcon, { backgroundColor: "rgba(79,70,229,0.12)", borderColor: "rgba(79,70,229,0.3)" }]}>
              <MaterialCommunityIcons name="hand-wave" size={20} color="#4f46e5" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.title, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>Sign Language Mode</Text>
              <Text style={[styles.subtitle, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                Queen B is watching — sign to her
              </Text>
            </View>
            <TouchableOpacity onPress={handleClose} style={styles.closeBtn} activeOpacity={0.7}>
              <MaterialCommunityIcons name="close" size={20} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>

          {/* Permission not granted */}
          {!permission?.granted && (
            <View style={styles.permBox}>
              <MaterialCommunityIcons name="camera-off" size={48} color={colors.mutedForeground} />
              <Text style={[styles.permTitle, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
                Camera access needed
              </Text>
              <Text style={[styles.permText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                Queen B needs to see your hands to understand your signs. Your camera is only used locally — nothing is sent anywhere.
              </Text>
              <TouchableOpacity
                style={[styles.permBtn, { backgroundColor: "#4f46e5" }]}
                onPress={handleRequestPerm}
                activeOpacity={0.85}
              >
                <MaterialCommunityIcons name="camera" size={18} color="#fff" />
                <Text style={[styles.permBtnText, { fontFamily: "Inter_700Bold" }]}>Allow Camera</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Camera view */}
          {permission?.granted && phase !== "transcribe" && (
            <View style={styles.cameraContainer}>
              <CameraView style={styles.camera} facing={facing}>
                {/* Overlay */}
                <View style={styles.cameraOverlay}>
                  {phase === "watching" && (
                    <View style={[styles.watchingBadge, { backgroundColor: "rgba(79,70,229,0.85)" }]}>
                      <ActivityIndicator size="small" color="#fff" />
                      <Text style={[styles.watchingText, { fontFamily: "Inter_600SemiBold" }]}>
                        Queen B is watching…
                      </Text>
                    </View>
                  )}
                  {/* Flip camera button */}
                  <TouchableOpacity
                    style={[styles.flipBtn, { backgroundColor: "rgba(0,0,0,0.45)" }]}
                    onPress={() => setFacing((f) => (f === "front" ? "back" : "front"))}
                    activeOpacity={0.8}
                  >
                    <MaterialCommunityIcons name="camera-flip-outline" size={22} color="#fff" />
                  </TouchableOpacity>
                </View>
              </CameraView>

              {/* Controls below camera */}
              <View style={styles.camControls}>
                {phase === "idle" && (
                  <>
                    <Text style={[styles.camHint, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                      Position your hands in view, then tap Start Signing
                    </Text>
                    <TouchableOpacity
                      style={[styles.primaryBtn, { backgroundColor: "#4f46e5" }]}
                      onPress={handleStartSigning}
                      activeOpacity={0.85}
                    >
                      <MaterialCommunityIcons name="hand-wave" size={20} color="#fff" />
                      <Text style={[styles.primaryBtnText, { fontFamily: "Inter_700Bold" }]}>Start Signing</Text>
                    </TouchableOpacity>
                  </>
                )}
                {phase === "watching" && (
                  <>
                    <Text style={[styles.camHint, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                      Sign your message clearly — take your time. Tap Done when finished.
                    </Text>
                    <TouchableOpacity
                      style={[styles.primaryBtn, { backgroundColor: "#16a34a" }]}
                      onPress={handleDone}
                      activeOpacity={0.85}
                    >
                      <MaterialCommunityIcons name="check-circle" size={20} color="#fff" />
                      <Text style={[styles.primaryBtnText, { fontFamily: "Inter_700Bold" }]}>I've Finished Signing</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </View>
          )}

          {/* Transcription phase */}
          {permission?.granted && phase === "transcribe" && (
            <View style={styles.transcribeBox}>
              <View style={[styles.transHintBox, { backgroundColor: "rgba(79,70,229,0.08)", borderColor: "rgba(79,70,229,0.25)" }]}>
                <MaterialCommunityIcons name="information-outline" size={16} color="#4f46e5" />
                <Text style={[styles.transHint, { color: "#4f46e5", fontFamily: "Inter_500Medium" }]}>
                  Type what you just signed so Queen B can respond to it. Automated sign recognition is coming soon.
                </Text>
              </View>

              <Text style={[styles.transLabel, { color: colors.mutedForeground, fontFamily: "Inter_600SemiBold" }]}>
                WHAT DID YOU SIGN?
              </Text>
              <View style={[styles.inputWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <TextInput
                  style={[styles.textInput, { color: colors.foreground, fontFamily: "Inter_400Regular" }]}
                  placeholder="Type what you signed here…"
                  placeholderTextColor={colors.mutedForeground}
                  value={typed}
                  onChangeText={setTyped}
                  multiline
                  autoFocus
                />
              </View>

              <View style={styles.transActions}>
                <TouchableOpacity
                  style={[styles.secondaryBtn, { borderColor: colors.border }]}
                  onPress={() => setPhase("idle")}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.secondaryBtnText, { color: colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>Sign Again</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.primaryBtn, { backgroundColor: typed.trim() ? "#C9860A" : colors.border, flex: 1 }]}
                  onPress={handleSubmit}
                  disabled={!typed.trim()}
                  activeOpacity={0.85}
                >
                  <MaterialCommunityIcons name="bee" size={18} color="#fff" />
                  <Text style={[styles.primaryBtnText, { fontFamily: "Inter_700Bold" }]}>Send to Queen B</Text>
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
  overlay:   { flex: 1, justifyContent: "flex-end" },
  backdrop:  { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.55)" },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: "hidden" },
  dragHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: "rgba(0,0,0,0.15)", alignSelf: "center", marginTop: 10, marginBottom: 8 },
  header: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 1 },
  headerIcon: { width: 40, height: 40, borderRadius: 12, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 16, letterSpacing: -0.2 },
  subtitle: { fontSize: 11.5, marginTop: 1 },
  closeBtn: { padding: 6 },

  // Permission
  permBox: { alignItems: "center", padding: 32, gap: 14 },
  permTitle: { fontSize: 18, textAlign: "center" },
  permText: { fontSize: 14, lineHeight: 21, textAlign: "center" },
  permBtn: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 14, paddingHorizontal: 24, paddingVertical: 14 },
  permBtnText: { color: "#fff", fontSize: 15 },

  // Camera
  cameraContainer: { gap: 0 },
  camera: { height: 300 },
  cameraOverlay: { flex: 1, alignItems: "center", justifyContent: "flex-end", padding: 16, gap: 8 },
  watchingBadge: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8 },
  watchingText: { color: "#fff", fontSize: 13 },
  flipBtn: { position: "absolute", top: 12, right: 12, width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  camControls: { padding: 16, gap: 12, alignItems: "center" },
  camHint: { fontSize: 13.5, lineHeight: 20, textAlign: "center" },
  primaryBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 14, paddingHorizontal: 24, paddingVertical: 14, alignSelf: "stretch" },
  primaryBtnText: { color: "#fff", fontSize: 15 },

  // Transcribe
  transcribeBox: { padding: 16, gap: 14 },
  transHintBox: { flexDirection: "row", alignItems: "flex-start", gap: 9, borderRadius: 12, borderWidth: 1, padding: 12 },
  transHint: { fontSize: 13, lineHeight: 19, flex: 1 },
  transLabel: { fontSize: 10.5, letterSpacing: 1.2 },
  inputWrap: { borderRadius: 14, borderWidth: 1, padding: 12 },
  textInput: { fontSize: 14, lineHeight: 21, minHeight: 80 },
  transActions: { flexDirection: "row", gap: 10 },
  secondaryBtn: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, alignItems: "center", justifyContent: "center" },
  secondaryBtnText: { fontSize: 14 },
});
