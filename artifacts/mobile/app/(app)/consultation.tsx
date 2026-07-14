import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import ThemedStatusBar from "@/components/ThemedStatusBar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import HoneycombWallpaper from "@/components/HoneycombWallpaper";
import { useAuth } from "@/context/AuthContext";
import { useLogoTheme } from "@/context/LogoThemeContext";
import { useColors } from "@/hooks/useColors";
import { Allowance, getAllowance, recordUsage } from "@/utils/entitlements";

type ConsultState = "booking" | "waiting" | "call";
type ConsultType = "gp" | "physio" | "ortho" | "neuro" | "geriatric";

const CONSULT_TYPES: { key: ConsultType; label: string; subtitle: string; icon: keyof typeof MaterialCommunityIcons.glyphMap; color: string; wait: string }[] = [
  { key: "gp", label: "General Practitioner", subtitle: "Primary care consultation", icon: "doctor", color: "#4F6EF7", wait: "~12 min" },
  { key: "physio", label: "Physiotherapist", subtitle: "MSK & rehabilitation", icon: "human-handsup", color: "#22c55e", wait: "~8 min" },
  { key: "ortho", label: "Orthopaedic Specialist", subtitle: "Bone, joint & spine", icon: "bone", color: "#f59e0b", wait: "~25 min" },
  { key: "neuro", label: "Neurology", subtitle: "Cervical myelopathy & nerve pain", icon: "brain", color: "#a78bfa", wait: "~30 min" },
  { key: "geriatric", label: "Geriatric Medicine", subtitle: "Elder care & memory support", icon: "human-cane", color: "#E5294E", wait: "~18 min" },
];

const MOOD_OPTIONS = [
  { emoji: "😊", label: "Good", value: 4 },
  { emoji: "😐", label: "Okay", value: 3 },
  { emoji: "😟", label: "Anxious", value: 2 },
  { emoji: "😢", label: "Distressed", value: 1 },
];

export default function ConsultationScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { prefs } = useLogoTheme();
  const topPad = Platform.OS === "web" ? 0 : insets.top;

  const { user } = useAuth();
  const userId = user?.id ?? "unknown";

  const [state, setState] = useState<ConsultState>("booking");
  const [selectedType, setSelectedType] = useState<ConsultType | null>(null);
  const [selectedMood, setSelectedMood] = useState<number | null>(null);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [allowance, setAllowance] = useState<Allowance | null>(null);

  const loadAllowance = useCallback(async () => {
    setAllowance(await getAllowance(userId, "consultations"));
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      loadAllowance();
    }, [loadAllowance])
  );

  const consult = CONSULT_TYPES.find((c) => c.key === selectedType);

  function startBooking(type: ConsultType) {
    Haptics.selectionAsync();
    setSelectedType(type);
  }

  async function confirmBooking() {
    if (!selectedType) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    // Count against the Gold Card's free monthly consultations when covered.
    if (allowance?.tier === "gold" && allowance.remaining > 0) {
      try {
        await recordUsage(userId, "consultations");
        loadAllowance();
      } catch {}
    }
    setState("waiting");
    setTimeout(() => {
      setState("call");
    }, 3000);
  }

  function endCall() {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert("End Consultation?", "This will end the live video appointment.", [
      { text: "Cancel", style: "cancel" },
      { text: "End Call", style: "destructive", onPress: () => router.back() },
    ]);
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ThemedStatusBar />
      <HoneycombWallpaper density={prefs.density} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 12, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={state === "call" ? endCall : () => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <Feather name={state === "call" ? "x" : "arrow-left"} size={20} color={state === "call" ? colors.accent : colors.foreground} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>Live Consultation</Text>
          <Text style={[styles.headerSub, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
            {state === "booking" ? "IbnCeena Telemedicine" : state === "waiting" ? "Connecting to clinician..." : "● Live session active"}
          </Text>
        </View>
        {state === "call" && (
          <View style={[styles.liveBadge, { backgroundColor: "#0a2818", borderColor: "#22c55e55" }]}>
            <View style={[styles.liveDot, { backgroundColor: "#22c55e" }]} />
            <Text style={[styles.liveBadgeText, { color: "#22c55e", fontFamily: "Inter_600SemiBold" }]}>LIVE</Text>
          </View>
        )}
      </View>

      {/* ── BOOKING STATE ── */}
      {state === "booking" && (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <LinearGradient colors={["#0f1840", "#0d0d1a"]} style={styles.heroCard}>
            <MaterialCommunityIcons name="video" size={40} color="#22c55e" />
            <Text style={[styles.heroTitle, { color: "#fff", fontFamily: "Inter_700Bold" }]}>
              HiEmotion Telemedicine
            </Text>
            <Text style={[styles.heroSub, { color: "rgba(255,255,255,0.6)", fontFamily: "Inter_400Regular" }]}>
              Connect instantly with a qualified clinician. Appointments are encrypted, GDPR-compliant, and linked to your Health Card record.
            </Text>
            <View style={styles.featureRow}>
              {["End-to-end encrypted", "GDPR compliant", "Linked to Health Card"].map((f) => (
                <View key={f} style={[styles.featureChip, { backgroundColor: "#22c55e22", borderColor: "#22c55e33" }]}>
                  <MaterialCommunityIcons name="check-circle" size={12} color="#22c55e" />
                  <Text style={[styles.featureText, { color: "#22c55e", fontFamily: "Inter_500Medium" }]}>{f}</Text>
                </View>
              ))}
            </View>
          </LinearGradient>

          <View style={[styles.moodCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.moodTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
              How are you feeling today?
            </Text>
            <Text style={[styles.moodSub, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              HiEmotion wellbeing check — helps the clinician prepare for your call.
            </Text>
            <View style={styles.moodRow}>
              {MOOD_OPTIONS.map((m) => (
                <TouchableOpacity
                  key={m.value}
                  activeOpacity={0.85}
                  onPress={() => { Haptics.selectionAsync(); setSelectedMood(m.value); }}
                  style={[styles.moodBtn, {
                    backgroundColor: selectedMood === m.value ? "#0f1a5a" : colors.background,
                    borderColor: selectedMood === m.value ? colors.primary : colors.border,
                  }]}
                >
                  <Text style={styles.moodEmoji}>{m.emoji}</Text>
                  <Text style={[styles.moodLabel, { color: selectedMood === m.value ? "#FFFFFF" : colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>
                    {m.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>SELECT APPOINTMENT TYPE</Text>

          {CONSULT_TYPES.map((c) => (
            <TouchableOpacity
              key={c.key}
              activeOpacity={0.85}
              onPress={() => startBooking(c.key)}
              style={[styles.consultCard, {
                backgroundColor: selectedType === c.key ? c.color + "18" : colors.card,
                borderColor: selectedType === c.key ? c.color : colors.border,
              }]}
            >
              <View style={[styles.consultIcon, { backgroundColor: c.color + "22" }]}>
                <MaterialCommunityIcons name={c.icon} size={24} color={c.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.consultLabel, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>{c.label}</Text>
                <Text style={[styles.consultSub, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>{c.subtitle}</Text>
              </View>
              <View style={styles.waitBadge}>
                <Text style={[styles.waitText, { color: c.color, fontFamily: "Inter_500Medium" }]}>{c.wait}</Text>
              </View>
            </TouchableOpacity>
          ))}

          {/* Live interpreter entry point */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => { Haptics.selectionAsync(); router.push("/(app)/interpreter"); }}
            style={[styles.interpreterCard, { backgroundColor: colors.card, borderColor: colors.gold + "44" }]}
          >
            <View style={[styles.interpreterIcon, { backgroundColor: colors.gold + "1e" }]}>
              <MaterialCommunityIcons name="translate" size={24} color={colors.gold} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.interpreterTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
                Book a Live Interpreter
              </Text>
              <Text style={[styles.interpreterSub, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                Professional, confidential interpreters for medical and legal consultations and appointments.
              </Text>
            </View>
            <Feather name="chevron-right" size={18} color={colors.gold} />
          </TouchableOpacity>

          {/* Coverage note */}
          {allowance ? (
            <View style={[styles.coverageRow, {
              backgroundColor: allowance.tier === "gold" && allowance.remaining > 0 ? "#D4A0171a" : colors.card,
              borderColor: allowance.tier === "gold" && allowance.remaining > 0 ? "#D4A01755" : colors.border,
            }]}>
              <MaterialCommunityIcons
                name={allowance.tier === "gold" ? "crown-outline" : "card-account-details-star-outline"}
                size={18}
                color={allowance.tier === "gold" ? "#D4A017" : "#2563EB"}
              />
              <Text style={[styles.coverageText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                {allowance.tier === "gold"
                  ? allowance.remaining > 0
                    ? `Covered by your Gold Card — ${allowance.used} of ${allowance.limit} free consultations used this month.`
                    : `You've used your ${allowance.limit} free Gold consultations this month — this appointment is at the standard rate, settled at your HIVE node.`
                  : "On the Blue Card, consultations are at the standard rate, settled at your HIVE node. The Gold Card includes 3 free consultations a month."}
              </Text>
            </View>
          ) : null}

          {selectedType && (
            <TouchableOpacity activeOpacity={0.85} onPress={confirmBooking}>
              <LinearGradient colors={["#0a2818", "#22c55e"]} style={styles.confirmBtn}>
                <MaterialCommunityIcons name="video" size={20} color="#fff" />
                <Text style={[styles.confirmBtnText, { fontFamily: "Inter_700Bold" }]}>
                  Start {CONSULT_TYPES.find(c => c.key === selectedType)?.label} Appointment
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </ScrollView>
      )}

      {/* ── WAITING STATE ── */}
      {state === "waiting" && (
        <View style={styles.waitingScreen}>
          <LinearGradient colors={["#0f1840", "#0d0d1a"]} style={styles.waitingCard}>
            <View style={styles.avatarRing}>
              <View style={[styles.avatar, { backgroundColor: consult?.color + "33" }]}>
                <MaterialCommunityIcons name={consult?.icon ?? "doctor"} size={48} color={consult?.color ?? "#4F6EF7"} />
              </View>
            </View>
            <Text style={[styles.waitingTitle, { color: "#fff", fontFamily: "Inter_700Bold" }]}>
              Connecting you to a{"\n"}{consult?.label}
            </Text>
            <Text style={[styles.waitingSub, { color: "rgba(255,255,255,0.5)", fontFamily: "Inter_400Regular" }]}>
              Estimated wait: {consult?.wait}
            </Text>
            <View style={styles.waitingDots}>
              {[0, 1, 2].map((i) => (
                <View key={i} style={[styles.waitingDot, { backgroundColor: consult?.color ?? "#4F6EF7", opacity: 0.4 + i * 0.3 }]} />
              ))}
            </View>
          </LinearGradient>
        </View>
      )}

      {/* ── CALL STATE ── */}
      {state === "call" && (
        <View style={styles.callScreen}>
          <LinearGradient colors={["#0f1a5a", "#060d30"]} style={styles.remoteVideo}>
            <View style={styles.remoteAvatarWrap}>
              <View style={[styles.remoteAvatar, { backgroundColor: consult?.color + "33" }]}>
                <MaterialCommunityIcons name={consult?.icon ?? "doctor"} size={64} color={consult?.color ?? "#4F6EF7"} />
              </View>
              <Text style={[styles.remoteName, { color: "#fff", fontFamily: "Inter_700Bold" }]}>
                Dr. Sarah O'Brien
              </Text>
              <Text style={[styles.remoteRole, { color: "rgba(255,255,255,0.5)", fontFamily: "Inter_400Regular" }]}>
                {consult?.label} · IbnCeena Network
              </Text>
            </View>

            {selectedMood !== null && (
              <View style={[styles.emotionBadge, { backgroundColor: "rgba(0,0,0,0.5)" }]}>
                <Text style={styles.emotionEmoji}>{MOOD_OPTIONS.find(m => m.value === selectedMood)?.emoji}</Text>
                <Text style={[styles.emotionLabel, { color: "#fff", fontFamily: "Inter_500Medium" }]}>
                  {MOOD_OPTIONS.find(m => m.value === selectedMood)?.label} — HiEmotion
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
            <TouchableOpacity onPress={() => { Haptics.selectionAsync(); setMicOn(!micOn); }} style={[styles.controlBtn, { backgroundColor: micOn ? colors.background : "#4a0f0f" }]}>
              <MaterialCommunityIcons name={micOn ? "microphone" : "microphone-off"} size={24} color={micOn ? colors.foreground : colors.accent} />
              <Text style={[styles.controlLabel, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>{micOn ? "Mute" : "Unmute"}</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={endCall} style={styles.endCallBtn}>
              <LinearGradient colors={["#c0392b", "#e74c3c"]} style={styles.endCallGradient}>
                <MaterialCommunityIcons name="phone-hangup" size={28} color="#fff" />
              </LinearGradient>
              <Text style={[styles.controlLabel, { color: colors.accent, fontFamily: "Inter_400Regular" }]}>End</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => { Haptics.selectionAsync(); setCamOn(!camOn); }} style={[styles.controlBtn, { backgroundColor: camOn ? colors.background : "#4a0f0f" }]}>
              <MaterialCommunityIcons name={camOn ? "video" : "video-off"} size={24} color={camOn ? colors.foreground : colors.accent} />
              <Text style={[styles.controlLabel, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>{camOn ? "Camera" : "Off"}</Text>
            </TouchableOpacity>
          </View>
        </View>
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
  scroll: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 100, gap: 14 },
  heroCard: { borderRadius: 20, padding: 24, gap: 12, alignItems: "center" },
  heroTitle: { fontSize: 22, letterSpacing: -0.5, textAlign: "center" },
  heroSub: { fontSize: 13, lineHeight: 20, textAlign: "center" },
  featureRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, justifyContent: "center" },
  featureChip: { flexDirection: "row", alignItems: "center", gap: 5, borderRadius: 20, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 5 },
  featureText: { fontSize: 11 },
  moodCard: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 10 },
  moodTitle: { fontSize: 15 },
  moodSub: { fontSize: 12, lineHeight: 18 },
  moodRow: { flexDirection: "row", gap: 8 },
  moodBtn: { flex: 1, borderRadius: 12, borderWidth: 1.5, padding: 10, alignItems: "center", gap: 5 },
  moodEmoji: { fontSize: 24 },
  moodLabel: { fontSize: 11 },
  sectionLabel: { fontSize: 10, fontFamily: "Inter_600SemiBold", letterSpacing: 1.4 },
  consultCard: { flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 14, borderWidth: 1.5, padding: 14 },
  consultIcon: { width: 48, height: 48, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  consultLabel: { fontSize: 14 },
  consultSub: { fontSize: 12, marginTop: 2 },
  waitBadge: { alignItems: "flex-end" },
  waitText: { fontSize: 12 },
  interpreterCard: { flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 14, borderWidth: 1.5, padding: 14 },
  interpreterIcon: { width: 48, height: 48, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  interpreterTitle: { fontSize: 14 },
  interpreterSub: { fontSize: 12, marginTop: 2, lineHeight: 17 },
  confirmBtn: { borderRadius: 14, paddingVertical: 16, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10 },
  confirmBtnText: { color: "#fff", fontSize: 15 },
  coverageRow: { flexDirection: "row", alignItems: "flex-start", gap: 10, borderRadius: 12, borderWidth: 1, padding: 12 },
  coverageText: { flex: 1, fontSize: 12.5, lineHeight: 18 },
  waitingScreen: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32 },
  waitingCard: { borderRadius: 24, padding: 40, alignItems: "center", gap: 16, width: "100%" },
  avatarRing: { padding: 8, borderRadius: 70, borderWidth: 2, borderColor: "rgba(255,255,255,0.1)" },
  avatar: { width: 100, height: 100, borderRadius: 50, alignItems: "center", justifyContent: "center" },
  waitingTitle: { fontSize: 20, textAlign: "center", letterSpacing: -0.3 },
  waitingSub: { fontSize: 13, textAlign: "center" },
  waitingDots: { flexDirection: "row", gap: 10, marginTop: 8 },
  waitingDot: { width: 10, height: 10, borderRadius: 5 },
  callScreen: { flex: 1 },
  remoteVideo: { flex: 1, alignItems: "center", justifyContent: "center", position: "relative" },
  remoteAvatarWrap: { alignItems: "center", gap: 12 },
  remoteAvatar: { width: 120, height: 120, borderRadius: 60, alignItems: "center", justifyContent: "center" },
  remoteName: { fontSize: 22, letterSpacing: -0.3 },
  remoteRole: { fontSize: 13 },
  emotionBadge: { position: "absolute", top: 20, left: 20, flexDirection: "row", alignItems: "center", gap: 6, borderRadius: 12, padding: 10 },
  emotionEmoji: { fontSize: 20 },
  emotionLabel: { fontSize: 12 },
  selfView: { position: "absolute", top: 80, right: 16 },
  selfVideoBox: { width: 90, height: 120, borderRadius: 12, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.2)" },
  callControls: { flexDirection: "row", alignItems: "center", justifyContent: "space-around", paddingVertical: 20, paddingHorizontal: 30, borderTopWidth: 1 },
  controlBtn: { alignItems: "center", gap: 5, borderRadius: 14, padding: 14 },
  controlLabel: { fontSize: 11 },
  endCallBtn: { alignItems: "center", gap: 5 },
  endCallGradient: { width: 64, height: 64, borderRadius: 32, alignItems: "center", justifyContent: "center" },
});
