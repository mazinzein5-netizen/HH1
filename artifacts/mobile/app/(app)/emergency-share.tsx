import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as Location from "expo-location";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import QRCode from "react-native-qrcode-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ThemedStatusBar from "@/components/ThemedStatusBar";
import { useAuth } from "@/context/AuthContext";
import { usePatient } from "@/context/PatientContext";
import { useSmartDevices } from "@/context/SmartDevicesContext";
import { useColors } from "@/hooks/useColors";
import { getPlanTier } from "@/utils/entitlements";
import {
  ActiveShare,
  buildEmergencyPayload,
  CaretakerLink,
  createEmergencyShare,
  emergencyQrPayload,
  getActiveShare,
  getCaretakerLink,
  pushCaretakerSnapshot,
  revokeEmergencyShare,
  startCaretakerSharing,
  stopCaretakerSharing,
} from "@/utils/emergencyShare";
import { readingsFromDevice } from "@/utils/healthMonitor";

const TTL_OPTIONS = [
  { label: "1 hour", minutes: 60 },
  { label: "4 hours", minutes: 240 },
  { label: "24 hours", minutes: 1440 },
];

/** Push GPS + latest vitals to the caretaker link every 60 seconds. */
const PUSH_INTERVAL_MS = 60_000;

function timeLeft(expiresAt: string): string {
  const ms = new Date(expiresAt).getTime() - Date.now();
  if (ms <= 0) return "expired";
  const mins = Math.round(ms / 60_000);
  if (mins < 60) return `${mins} min left`;
  const h = Math.floor(mins / 60);
  return `${h} h ${mins % 60} min left`;
}

export default function EmergencyShareScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { data } = usePatient();
  const { devices } = useSmartDevices();
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const [consented, setConsented] = useState(false);
  const [ttl, setTtl] = useState(60);
  const [share, setShare] = useState<ActiveShare | null>(null);
  const [busy, setBusy] = useState(false);
  const [, forceTick] = useState(0);

  const [redTier, setRedTier] = useState(false);
  const [link, setLink] = useState<CaretakerLink | null>(null);
  const [linkBusy, setLinkBusy] = useState(false);
  const devicesRef = useRef(devices);
  devicesRef.current = devices;
  const linkRef = useRef<CaretakerLink | null>(null);
  linkRef.current = link;

  useEffect(() => {
    getActiveShare().then(setShare);
    getCaretakerLink().then(setLink);
    getPlanTier(user?.id ?? "unknown").then((t) => setRedTier(t === "red"));
    const tick = setInterval(() => forceTick((n) => n + 1), 30_000);
    return () => clearInterval(tick);
  }, [user?.id]);

  // ── Caretaker snapshot pusher ──
  const pushSnapshot = useCallback(async () => {
    const l = linkRef.current;
    if (!l) return;
    const vitals: { hr?: number; spo2?: number; glucose?: number; ecg?: string } = {};
    for (const d of devicesRef.current) {
      for (const r of readingsFromDevice(d)) {
        if (r.signal === "hr") vitals.hr = r.value;
        else if (r.signal === "spo2") vitals.spo2 = r.value;
        else if (r.signal === "glucose") vitals.glucose = r.value;
        else if (r.signal === "ecg") vitals.ecg = r.raw ?? (r.value >= 1 ? "Abnormal" : "Normal");
      }
    }
    let location: { lat: number; lng: number; accuracyM?: number } | undefined;
    try {
      const perm = await Location.getForegroundPermissionsAsync();
      if (perm.granted) {
        const pos = await Location.getLastKnownPositionAsync({});
        const fix = pos ?? (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }));
        if (fix) {
          location = {
            lat: fix.coords.latitude,
            lng: fix.coords.longitude,
            ...(fix.coords.accuracy != null ? { accuracyM: Math.round(fix.coords.accuracy) } : {}),
          };
        }
      }
    } catch {
      // location unavailable — vitals still go through
    }
    if (!location && Object.keys(vitals).length === 0) return;
    try {
      await pushCaretakerSnapshot(l, { ...(location ? { location } : {}), ...(Object.keys(vitals).length ? { vitals } : {}) });
    } catch {
      // transient network failure — next interval retries
    }
  }, []);

  useEffect(() => {
    if (!link) return;
    pushSnapshot();
    const iv = setInterval(pushSnapshot, PUSH_INTERVAL_MS);
    return () => clearInterval(iv);
  }, [link, pushSnapshot]);

  // ── Actions ──
  async function handleGenerate() {
    if (!consented) return;
    setBusy(true);
    try {
      const payload = buildEmergencyPayload(data, user?.fullName);
      const fresh = await createEmergencyShare(payload, ttl);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShare(fresh);
    } catch {
      Alert.alert("Couldn't create the share", "Please check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  async function handleRevoke() {
    if (!share) return;
    setBusy(true);
    try {
      await revokeEmergencyShare(share);
      setShare(null);
      setConsented(false);
    } finally {
      setBusy(false);
    }
  }

  async function handleStartCaretaker() {
    setLinkBusy(true);
    try {
      const perm = await Location.requestForegroundPermissionsAsync();
      if (!perm.granted && Platform.OS !== "web") {
        Alert.alert(
          "Location permission",
          "Without location access your caretaker will only see vital signs, not your position. You can enable it later in Settings."
        );
      }
      const label = (user?.fullName ?? "").split(" ")[0] || "Patient";
      const fresh = await startCaretakerSharing(label);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setLink(fresh);
    } catch {
      Alert.alert("Couldn't start sharing", "Please check your connection and try again.");
    } finally {
      setLinkBusy(false);
    }
  }

  async function handleStopCaretaker() {
    if (!link) return;
    setLinkBusy(true);
    try {
      await stopCaretakerSharing(link);
      setLink(null);
    } finally {
      setLinkBusy(false);
    }
  }

  const activeMeds = data.kardex.filter((k) => k.status === "active").length;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ThemedStatusBar />
      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: bottomPad + 32 }]} showsVerticalScrollIndicator={false}>
        {/* Intro */}
        <View style={[styles.introBox, { backgroundColor: "rgba(220,38,38,0.07)", borderColor: "rgba(220,38,38,0.3)" }]}>
          <MaterialCommunityIcons name="shield-alert" size={22} color="#dc2626" />
          <Text style={[styles.introText, { color: colors.foreground, fontFamily: "Inter_400Regular" }]}>
            In an emergency, a doctor or first responder can see your allergies, conditions and medication list
            through the HIVE Emergency Portal — but only with a code you generate here, and only until it expires.
          </Text>
        </View>

        {/* ── Emergency share ── */}
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>EMERGENCY SHARE</Text>

        {share ? (
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: "rgba(220,38,38,0.4)" }]}>
            <Text style={[styles.shareTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>Active share code</Text>
            <Text style={[styles.shareCode, { color: "#dc2626", fontFamily: "Inter_700Bold" }]}>{share.code}</Text>
            <View style={styles.qrWrap}>
              <View style={styles.qrBox}>
                <QRCode value={emergencyQrPayload(share)} size={160} backgroundColor="#ffffff" color="#111111" />
              </View>
            </View>
            <Text style={[styles.shareMeta, { color: colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>
              {timeLeft(share.expiresAt)} · expires {new Date(share.expiresAt).toLocaleTimeString("en-IE", { hour: "2-digit", minute: "2-digit" })}
            </Text>
            <Text style={[styles.shareHint, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              Show this code or QR to the healthcare worker. They enter it at the HIVE Emergency Portal.
              The share deletes itself when the time runs out.
            </Text>
            <TouchableOpacity
              style={[styles.dangerBtn, { borderColor: "rgba(220,38,38,0.5)" }]}
              onPress={handleRevoke}
              disabled={busy}
              activeOpacity={0.8}
            >
              {busy ? <ActivityIndicator size="small" color="#dc2626" /> : (
                <>
                  <Feather name="x-circle" size={16} color="#dc2626" />
                  <Text style={[styles.dangerBtnText, { color: "#dc2626", fontFamily: "Inter_600SemiBold" }]}>Stop sharing now</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.cardBody, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              What will be shared: {data.allergies.length} drug {data.allergies.length === 1 ? "allergy" : "allergies"} (always shown first),
              your conditions, and {activeMeds} current {activeMeds === 1 ? "medication" : "medications"} in order.
              Nothing is stored after the share expires.
            </Text>

            <Text style={[styles.fieldLabel, { color: colors.mutedForeground, fontFamily: "Inter_600SemiBold" }]}>SHARE FOR</Text>
            <View style={styles.ttlRow}>
              {TTL_OPTIONS.map((o) => (
                <TouchableOpacity
                  key={o.minutes}
                  onPress={() => { Haptics.selectionAsync(); setTtl(o.minutes); }}
                  style={[
                    styles.ttlBtn,
                    {
                      backgroundColor: ttl === o.minutes ? "rgba(220,38,38,0.12)" : colors.secondary,
                      borderColor: ttl === o.minutes ? "rgba(220,38,38,0.5)" : colors.border,
                    },
                  ]}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.ttlText, { color: ttl === o.minutes ? "#dc2626" : colors.mutedForeground, fontFamily: "Inter_600SemiBold" }]}>
                    {o.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.consentRow}>
              <Switch
                value={consented}
                onValueChange={(v) => { Haptics.selectionAsync(); setConsented(v); }}
                trackColor={{ true: "#dc2626" }}
              />
              <Text style={[styles.consentText, { color: colors.foreground, fontFamily: "Inter_500Medium" }]}>
                I consent to my health summary being available to healthcare workers who have this code, until it expires or I stop it.
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.primaryBtn, { backgroundColor: consented ? "#dc2626" : colors.secondary }]}
              onPress={handleGenerate}
              disabled={!consented || busy}
              activeOpacity={0.85}
            >
              {busy ? <ActivityIndicator size="small" color="#fff" /> : (
                <>
                  <MaterialCommunityIcons name="qrcode" size={18} color={consented ? "#fff" : colors.mutedForeground} />
                  <Text style={[styles.primaryBtnText, { color: consented ? "#fff" : colors.mutedForeground, fontFamily: "Inter_700Bold" }]}>
                    Generate emergency code
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* ── Caretaker sharing ── */}
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground, marginTop: 20 }]}>CARETAKER SHARING</Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: link ? "rgba(201,134,10,0.45)" : colors.border }]}>
          {!redTier && !link ? (
            <View style={styles.lockedRow}>
              <MaterialCommunityIcons name="lock-outline" size={20} color={colors.mutedForeground} />
              <Text style={[styles.cardBody, { color: colors.mutedForeground, fontFamily: "Inter_400Regular", flex: 1 }]}>
                Live location and vital-sign sharing with your care team is part of the Red Geriatric Pack.
                You can upgrade in Membership.
              </Text>
            </View>
          ) : link ? (
            <>
              <Text style={[styles.shareTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>Sharing with your caretaker</Text>
              <Text style={[styles.shareCode, { color: "#C9860A", fontFamily: "Inter_700Bold" }]}>{link.linkCode}</Text>
              <Text style={[styles.shareHint, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                Give this link code to your caretaker or nursing team. While sharing is on, your phone sends your
                location and latest vital signs about once a minute. Only the most recent update is kept, and it all
                stops the moment you press stop.
              </Text>
              <TouchableOpacity
                style={[styles.dangerBtn, { borderColor: "rgba(220,38,38,0.5)" }]}
                onPress={handleStopCaretaker}
                disabled={linkBusy}
                activeOpacity={0.8}
              >
                {linkBusy ? <ActivityIndicator size="small" color="#dc2626" /> : (
                  <>
                    <Feather name="x-circle" size={16} color="#dc2626" />
                    <Text style={[styles.dangerBtnText, { color: "#dc2626", fontFamily: "Inter_600SemiBold" }]}>Stop caretaker sharing</Text>
                  </>
                )}
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={[styles.cardBody, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                As a Red Geriatric Pack member you can let a trusted caretaker (for example nursing-home staff) see
                your live location and latest vital signs on the HIVE Emergency Portal. This is entirely optional,
                and you can stop it at any time.
              </Text>
              <TouchableOpacity
                style={[styles.primaryBtn, { backgroundColor: "#C9860A" }]}
                onPress={handleStartCaretaker}
                disabled={linkBusy}
                activeOpacity={0.85}
              >
                {linkBusy ? <ActivityIndicator size="small" color="#fff" /> : (
                  <>
                    <MaterialCommunityIcons name="account-heart" size={18} color="#fff" />
                    <Text style={[styles.primaryBtnText, { color: "#fff", fontFamily: "Inter_700Bold" }]}>Start caretaker sharing</Text>
                  </>
                )}
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Privacy footer */}
        <View style={[styles.privacyBox, { backgroundColor: colors.secondary }]}>
          <MaterialCommunityIcons name="shield-lock-outline" size={16} color={colors.mutedForeground} />
          <Text style={[styles.privacyText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
            Zero-Server privacy: your data lives on this phone. Shares pass through the HIVE relay only in memory,
            are never written to a database, and vanish automatically when they expire or you revoke them.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: 20, paddingTop: 16 },
  introBox: { flexDirection: "row", gap: 10, borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 18, alignItems: "flex-start" },
  introText: { fontSize: 13.5, lineHeight: 20, flex: 1 },
  sectionLabel: { fontSize: 11, fontFamily: "Inter_600SemiBold", letterSpacing: 1.2, marginBottom: 10, marginLeft: 2 },
  card: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 12 },
  cardBody: { fontSize: 13.5, lineHeight: 20 },
  fieldLabel: { fontSize: 11, letterSpacing: 1 },
  ttlRow: { flexDirection: "row", gap: 8 },
  ttlBtn: { flex: 1, borderRadius: 10, borderWidth: 1, paddingVertical: 10, alignItems: "center" },
  ttlText: { fontSize: 13 },
  consentRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  consentText: { fontSize: 13, lineHeight: 19, flex: 1 },
  primaryBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 12, paddingVertical: 14 },
  primaryBtnText: { fontSize: 15 },
  dangerBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 12, borderWidth: 1.5, paddingVertical: 12 },
  dangerBtnText: { fontSize: 14 },
  shareTitle: { fontSize: 15 },
  shareCode: { fontSize: 26, letterSpacing: 2, textAlign: "center" },
  qrWrap: { alignItems: "center" },
  qrBox: { backgroundColor: "#ffffff", padding: 12, borderRadius: 12 },
  shareMeta: { fontSize: 12.5, textAlign: "center" },
  shareHint: { fontSize: 12.5, lineHeight: 18 },
  lockedRow: { flexDirection: "row", gap: 10, alignItems: "flex-start" },
  privacyBox: { flexDirection: "row", gap: 8, borderRadius: 12, padding: 12, marginTop: 18, alignItems: "flex-start" },
  privacyText: { fontSize: 12, lineHeight: 17, flex: 1 },
});
