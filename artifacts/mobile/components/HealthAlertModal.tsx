import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useHealthMonitor } from "@/context/HealthMonitorContext";
import { callEmergencyServices, EMERGENCY_NUMBER } from "@/utils/healthShare";

/**
 * Full-screen danger-signal escalation alert (pilot mode only — this modal
 * only ever renders when HealthMonitorContext raises an incident, which
 * cannot happen with the pilot flag off).
 *
 * Counts down from 30 s. When the countdown ends, the emergency-call
 * confirmation dialog is opened — there is never an automatic call without
 * a visible confirmation step.
 */

const COUNTDOWN_SECONDS = 30;

export default function HealthAlertModal() {
  const { activeIncident, dismissIncident } = useHealthMonitor();
  const [secondsLeft, setSecondsLeft] = useState(COUNTDOWN_SECONDS);
  const promptedRef = useRef(false);
  const pulse = useRef(new Animated.Value(1)).current;

  const visible = !!activeIncident;

  useEffect(() => {
    if (!visible) return;
    setSecondsLeft(COUNTDOWN_SECONDS);
    promptedRef.current = false;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.12, duration: 600, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
        Animated.timing(pulse, { toValue: 1, duration: 600, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
      ]),
    );
    loop.start();

    const timer = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          if (!promptedRef.current) {
            promptedRef.current = true;
            // Countdown elapsed with no response — open the call confirmation.
            callEmergencyServices();
          }
          return 0;
        }
        return s - 1;
      });
    }, 1000);

    return () => {
      clearInterval(timer);
      loop.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, activeIncident?.id]);

  if (!activeIncident) return null;

  const critical = activeIncident.severity === "critical";
  const accent = critical ? "#ef4444" : "#f59e0b";

  function handleImOk() {
    Haptics.selectionAsync();
    dismissIncident("ok");
  }

  function handleCallNow() {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
    dismissIncident("escalated");
    callEmergencyServices();
  }

  function handleHealthCard() {
    dismissIncident("escalated");
    router.push("/(app)/(tabs)/profile");
  }

  return (
    <Modal visible transparent animationType="fade" onRequestClose={handleImOk}>
      <LinearGradient
        colors={critical ? ["#3b0a0a", "#1a0505"] : ["#3b2506", "#1a1005"]}
        style={styles.root}
      >
        <Animated.View style={[styles.iconWrap, { borderColor: accent, transform: [{ scale: pulse }] }]}>
          <MaterialCommunityIcons
            name={activeIncident.signal === "fall" ? "human-handsdown" : "heart-pulse"}
            size={54}
            color={accent}
          />
        </Animated.View>

        <Text style={[styles.title, { color: accent }]}>{activeIncident.title}</Text>
        <Text style={styles.detail}>
          {activeIncident.aiExplanation ?? activeIncident.detail}
        </Text>
        <Text style={styles.source}>
          Detected by {activeIncident.source}
          {activeIncident.aiSeverity ? ` · AI assessment: ${activeIncident.aiSeverity}` : ""}
        </Text>

        <View style={[styles.countdownRing, { borderColor: accent }]}>
          <Text style={[styles.countdownNum, { color: accent }]}>{secondsLeft}</Text>
          <Text style={styles.countdownLabel}>seconds</Text>
        </View>
        <Text style={styles.countdownHint}>
          {secondsLeft > 0
            ? `If you don't respond, we'll ask to call ${EMERGENCY_NUMBER} for you.`
            : `Please confirm the emergency call, or tap "I'm OK".`}
        </Text>

        <TouchableOpacity style={[styles.callBtn, { backgroundColor: "#ef4444" }]} onPress={handleCallNow} activeOpacity={0.85}>
          <Feather name="phone-call" size={20} color="#fff" />
          <Text style={styles.callBtnText}>Call for help now ({EMERGENCY_NUMBER})</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.okBtn} onPress={handleImOk} activeOpacity={0.85}>
          <Feather name="check-circle" size={20} color="#22c55e" />
          <Text style={styles.okBtnText}>I'm OK</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.cardLink} onPress={handleHealthCard} activeOpacity={0.7}>
          <MaterialCommunityIcons name="shield-account" size={16} color="rgba(255,255,255,0.75)" />
          <Text style={styles.cardLinkText}>Open my Emergency Health Card</Text>
        </TouchableOpacity>
      </LinearGradient>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: "center", justifyContent: "center", padding: 28, gap: 14 },
  iconWrap: {
    width: 110, height: 110, borderRadius: 55, borderWidth: 3,
    alignItems: "center", justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  title: { fontSize: 26, fontFamily: "Inter_700Bold", textAlign: "center", letterSpacing: -0.5 },
  detail: { fontSize: 15, lineHeight: 22, color: "rgba(255,255,255,0.9)", textAlign: "center", fontFamily: "Inter_400Regular" },
  source: { fontSize: 12, color: "rgba(255,255,255,0.55)", textAlign: "center", fontFamily: "Inter_400Regular" },

  countdownRing: {
    width: 96, height: 96, borderRadius: 48, borderWidth: 3,
    alignItems: "center", justifyContent: "center", marginTop: 6,
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  countdownNum: { fontSize: 34, fontFamily: "Inter_700Bold" },
  countdownLabel: { fontSize: 10, color: "rgba(255,255,255,0.6)", fontFamily: "Inter_400Regular" },
  countdownHint: { fontSize: 12, color: "rgba(255,255,255,0.65)", textAlign: "center", fontFamily: "Inter_400Regular" },

  callBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10,
    borderRadius: 16, paddingVertical: 16, alignSelf: "stretch", marginTop: 10,
  },
  callBtnText: { color: "#fff", fontSize: 16, fontFamily: "Inter_700Bold" },
  okBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10,
    borderRadius: 16, paddingVertical: 16, alignSelf: "stretch",
    borderWidth: 1.5, borderColor: "#22c55e88", backgroundColor: "rgba(34,197,94,0.1)",
  },
  okBtnText: { color: "#22c55e", fontSize: 16, fontFamily: "Inter_700Bold" },
  cardLink: { flexDirection: "row", alignItems: "center", gap: 7, marginTop: 6, padding: 8 },
  cardLinkText: { color: "rgba(255,255,255,0.75)", fontSize: 13, fontFamily: "Inter_600SemiBold", textDecorationLine: "underline" },
});
