import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
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
import { useAppMode } from "@/context/AppModeContext";
import { useColors } from "@/hooks/useColors";
import { saveGeneratedTextDocument } from "@/utils/documentsStore";
import {
  type Appointment,
  clinicianMeta,
  formatApptDate,
  getAppointment,
  updateAppointment,
} from "@/utils/telemedicineStore";
import { getVideoProvider, type SessionState, type VideoSessionProvider } from "@/utils/videoProvider";

type Phase = "waiting" | "call" | "note";

export default function SessionScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { pilotMode } = useAppMode();
  const { id } = useLocalSearchParams<{ id: string }>();
  const topPad = Platform.OS === "web" ? 0 : insets.top;

  const [appt, setAppt] = useState<Appointment | null>(null);
  const [phase, setPhase] = useState<Phase>("waiting");
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const providerRef = useRef<VideoSessionProvider | null>(null);

  useEffect(() => {
    if (!pilotMode) router.replace("/(app)/consultation");
  }, [pilotMode]);

  useEffect(() => {
    if (!id) return;
    let mounted = true;
    getAppointment(id).then((a) => {
      if (!mounted) return;
      setAppt(a);
      if (!a) return;
      const provider = getVideoProvider();
      providerRef.current = provider;
      provider.join(a.id, {
        onStateChange: (s: SessionState) => {
          if (!mounted) return;
          if (s === "connected") {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setPhase("call");
          }
        },
      });
    });
    return () => {
      mounted = false;
      providerRef.current?.leave();
      providerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (!pilotMode || !appt) return null;

  const meta = clinicianMeta(appt.clinicianType);
  const attachedCount =
    (appt.attachments.healthCardSummary ? 1 : 0) +
    (appt.attachments.symptomSummary ? 1 : 0) +
    appt.attachments.documentIds.length;

  function endCall() {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert("End Consultation?", "This will end the video appointment.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "End Call",
        style: "destructive",
        onPress: () => {
          providerRef.current?.leave();
          setPhase("note");
        },
      },
    ]);
  }

  async function finish() {
    if (!appt || saving) return;
    setSaving(true);
    const trimmed = note.trim();
    const noteBody = [
      "TELEMEDICINE CONSULTATION SUMMARY",
      "",
      `Clinician: ${meta.label}`,
      `Appointment: ${formatApptDate(appt.dateISO)} at ${appt.time}`,
      `Reason: ${appt.reason || meta.subtitle}`,
      "",
      trimmed || "No notes recorded.",
      "",
      "Recorded by the patient in the HIVE COMPANION app (pilot programme). Not a clinical record.",
    ].join("\n");
    try {
      await saveGeneratedTextDocument(
        `Consultation note — ${meta.label} ${appt.dateISO}`,
        noteBody,
        { category: "report", source: "other" }
      );
      await updateAppointment(appt.id, { status: "completed", sessionNote: trimmed || undefined });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace("/(app)/telemedicine");
    } catch {
      setSaving(false);
      Alert.alert("Unable to save note", "Please try again.");
    }
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ThemedStatusBar />

      <View style={[styles.header, { paddingTop: topPad + 12, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={phase === "call" ? endCall : () => router.back()}
          style={styles.backBtn}
          activeOpacity={0.7}
        >
          <Feather name={phase === "call" ? "x" : "arrow-left"} size={20} color={phase === "call" ? colors.accent : colors.foreground} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
            {phase === "waiting" ? "Virtual Waiting Room" : phase === "call" ? "Live Session" : "Session Summary"}
          </Text>
          <Text style={[styles.headerSub, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
            {phase === "waiting" ? "Connecting to clinician..." : phase === "call" ? "● Live session active" : "Save a note for your records"}
          </Text>
        </View>
        {phase === "call" && (
          <View style={[styles.liveBadge, { backgroundColor: "#0a2818", borderColor: "#22c55e55" }]}>
            <View style={[styles.liveDot, { backgroundColor: "#22c55e" }]} />
            <Text style={[styles.liveBadgeText, { color: "#22c55e", fontFamily: "Inter_600SemiBold" }]}>LIVE</Text>
          </View>
        )}
      </View>

      {/* ── WAITING ROOM ── */}
      {phase === "waiting" && (
        <View style={styles.waitingScreen}>
          <LinearGradient colors={["#0f1840", "#0d0d1a"]} style={styles.waitingCard}>
            <View style={styles.avatarRing}>
              <View style={[styles.avatar, { backgroundColor: meta.color + "33" }]}>
                <MaterialCommunityIcons name={meta.icon as never} size={48} color={meta.color} />
              </View>
            </View>
            <Text style={[styles.waitingTitle, { color: "#fff", fontFamily: "Inter_700Bold" }]}>
              Connecting you to a{"\n"}{meta.label}
            </Text>
            <Text style={[styles.waitingSub, { color: "rgba(255,255,255,0.5)", fontFamily: "Inter_400Regular" }]}>
              {formatApptDate(appt.dateISO)} at {appt.time}
            </Text>
            <View style={[styles.handoverChip, { backgroundColor: "#22c55e18", borderColor: "#22c55e44" }]}>
              <MaterialCommunityIcons name="paperclip" size={14} color="#22c55e" />
              <Text style={[styles.handoverText, { color: "#22c55e", fontFamily: "Inter_500Medium" }]}>
                {attachedCount > 0
                  ? `${attachedCount} handover item${attachedCount === 1 ? "" : "s"} shared with your clinician`
                  : "No handover items attached"}
              </Text>
            </View>
            {appt.interpreterRequested && (
              <View style={[styles.handoverChip, { backgroundColor: "rgba(201,134,10,0.14)", borderColor: "rgba(201,134,10,0.4)" }]}>
                <MaterialCommunityIcons name="translate" size={14} color={colors.gold} />
                <Text style={[styles.handoverText, { color: colors.gold, fontFamily: "Inter_500Medium" }]}>
                  Interpreter requested for this session
                </Text>
              </View>
            )}
            <View style={styles.waitingDots}>
              {[0, 1, 2].map((i) => (
                <View key={i} style={[styles.waitingDot, { backgroundColor: meta.color, opacity: 0.4 + i * 0.3 }]} />
              ))}
            </View>
          </LinearGradient>
        </View>
      )}

      {/* ── IN-SESSION ── */}
      {phase === "call" && (
        <View style={styles.callScreen}>
          <LinearGradient colors={["#0f1a5a", "#060d30"]} style={styles.remoteVideo}>
            <View style={styles.remoteAvatarWrap}>
              <View style={[styles.remoteAvatar, { backgroundColor: meta.color + "33" }]}>
                <MaterialCommunityIcons name={meta.icon as never} size={64} color={meta.color} />
              </View>
              <Text style={[styles.remoteName, { color: "#fff", fontFamily: "Inter_700Bold" }]}>
                Dr. Sarah O'Brien
              </Text>
              <Text style={[styles.remoteRole, { color: "rgba(255,255,255,0.5)", fontFamily: "Inter_400Regular" }]}>
                {meta.label} · IbnCeena Network
              </Text>
            </View>
            {attachedCount > 0 && (
              <View style={[styles.attachBadge, { backgroundColor: "rgba(0,0,0,0.5)" }]}>
                <MaterialCommunityIcons name="paperclip" size={14} color="#22c55e" />
                <Text style={[styles.attachBadgeText, { color: "#fff", fontFamily: "Inter_500Medium" }]}>
                  Handover pack shared
                </Text>
              </View>
            )}
          </LinearGradient>

          <View style={styles.selfView}>
            <LinearGradient colors={["#16162a", "#0d0d1a"]} style={styles.selfVideoBox}>
              {camOn
                ? <MaterialCommunityIcons name="account" size={32} color={colors.mutedForeground} />
                : <MaterialCommunityIcons name="video-off" size={22} color={colors.mutedForeground} />
              }
            </LinearGradient>
          </View>

          <View style={[styles.callControls, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
            <TouchableOpacity
              onPress={() => { Haptics.selectionAsync(); providerRef.current?.setMicEnabled(!micOn); setMicOn(!micOn); }}
              style={[styles.controlBtn, { backgroundColor: micOn ? colors.background : "#4a0f0f" }]}
            >
              <MaterialCommunityIcons name={micOn ? "microphone" : "microphone-off"} size={24} color={micOn ? colors.foreground : colors.accent} />
              <Text style={[styles.controlLabel, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>{micOn ? "Mute" : "Unmute"}</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={endCall} style={styles.endCallBtn}>
              <LinearGradient colors={["#c0392b", "#e74c3c"]} style={styles.endCallGradient}>
                <MaterialCommunityIcons name="phone-hangup" size={28} color="#fff" />
              </LinearGradient>
              <Text style={[styles.controlLabel, { color: colors.accent, fontFamily: "Inter_400Regular" }]}>End</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => { Haptics.selectionAsync(); providerRef.current?.setCameraEnabled(!camOn); setCamOn(!camOn); }}
              style={[styles.controlBtn, { backgroundColor: camOn ? colors.background : "#4a0f0f" }]}
            >
              <MaterialCommunityIcons name={camOn ? "video" : "video-off"} size={24} color={camOn ? colors.foreground : colors.accent} />
              <Text style={[styles.controlLabel, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>{camOn ? "Camera" : "Off"}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* ── POST-SESSION NOTE ── */}
      {phase === "note" && (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <ScrollView contentContainerStyle={styles.noteScroll} keyboardShouldPersistTaps="handled">
            <LinearGradient colors={["#0f1840", "#0d0d1a"]} style={styles.noteHero}>
              <MaterialCommunityIcons name="check-decagram" size={32} color="#22c55e" />
              <Text style={[styles.noteHeroTitle, { color: "#fff", fontFamily: "Inter_700Bold" }]}>Session Ended</Text>
              <Text style={[styles.noteHeroSub, { color: "rgba(255,255,255,0.6)", fontFamily: "Inter_400Regular" }]}>
                Add a short note about what was discussed. It will be saved to your Documents for your own records.
              </Text>
            </LinearGradient>

            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder="e.g. Advised to continue physio exercises, review again in 4 weeks…"
              placeholderTextColor={colors.mutedForeground}
              multiline
              style={[styles.noteInput, {
                backgroundColor: colors.card,
                borderColor: colors.border,
                color: colors.foreground,
                fontFamily: "Inter_400Regular",
              }]}
            />

            <TouchableOpacity activeOpacity={0.85} onPress={finish} disabled={saving} style={{ opacity: saving ? 0.5 : 1 }}>
              <LinearGradient colors={["#0a2818", "#22c55e"]} style={styles.saveBtn}>
                <MaterialCommunityIcons name="content-save-check" size={20} color="#fff" />
                <Text style={[styles.saveBtnText, { fontFamily: "Inter_700Bold" }]}>Save Note & Finish</Text>
              </LinearGradient>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", gap: 14, paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 1 },
  backBtn: { padding: 6 },
  headerTitle: { fontSize: 17, letterSpacing: -0.3 },
  headerSub: { fontSize: 11, marginTop: 2 },
  liveBadge: { flexDirection: "row", alignItems: "center", gap: 5, borderRadius: 12, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 5 },
  liveDot: { width: 7, height: 7, borderRadius: 4 },
  liveBadgeText: { fontSize: 11, letterSpacing: 0.5 },
  waitingScreen: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32 },
  waitingCard: { borderRadius: 24, padding: 36, alignItems: "center", gap: 14, width: "100%" },
  avatarRing: { padding: 8, borderRadius: 70, borderWidth: 2, borderColor: "rgba(255,255,255,0.1)" },
  avatar: { width: 100, height: 100, borderRadius: 50, alignItems: "center", justifyContent: "center" },
  waitingTitle: { fontSize: 20, textAlign: "center", letterSpacing: -0.3 },
  waitingSub: { fontSize: 13, textAlign: "center" },
  handoverChip: { flexDirection: "row", alignItems: "center", gap: 6, borderRadius: 20, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 6 },
  handoverText: { fontSize: 12 },
  waitingDots: { flexDirection: "row", gap: 10, marginTop: 6 },
  waitingDot: { width: 10, height: 10, borderRadius: 5 },
  callScreen: { flex: 1 },
  remoteVideo: { flex: 1, alignItems: "center", justifyContent: "center", position: "relative" },
  remoteAvatarWrap: { alignItems: "center", gap: 12 },
  remoteAvatar: { width: 120, height: 120, borderRadius: 60, alignItems: "center", justifyContent: "center" },
  remoteName: { fontSize: 22, letterSpacing: -0.3 },
  remoteRole: { fontSize: 13 },
  attachBadge: { position: "absolute", top: 20, left: 20, flexDirection: "row", alignItems: "center", gap: 6, borderRadius: 12, padding: 10 },
  attachBadgeText: { fontSize: 12 },
  selfView: { position: "absolute", top: 80, right: 16 },
  selfVideoBox: { width: 90, height: 120, borderRadius: 12, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.2)" },
  callControls: { flexDirection: "row", alignItems: "center", justifyContent: "space-around", paddingVertical: 20, paddingHorizontal: 30, borderTopWidth: 1 },
  controlBtn: { alignItems: "center", gap: 5, borderRadius: 14, padding: 14 },
  controlLabel: { fontSize: 11 },
  endCallBtn: { alignItems: "center", gap: 5 },
  endCallGradient: { width: 64, height: 64, borderRadius: 32, alignItems: "center", justifyContent: "center" },
  noteScroll: { padding: 16, gap: 14, paddingBottom: 100 },
  noteHero: { borderRadius: 20, padding: 24, gap: 10, alignItems: "center" },
  noteHeroTitle: { fontSize: 19, letterSpacing: -0.4 },
  noteHeroSub: { fontSize: 13, lineHeight: 19, textAlign: "center" },
  noteInput: { borderRadius: 14, borderWidth: 1, padding: 14, minHeight: 140, fontSize: 14, textAlignVertical: "top" },
  saveBtn: { borderRadius: 14, paddingVertical: 16, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10 },
  saveBtnText: { color: "#fff", fontSize: 15 },
});
