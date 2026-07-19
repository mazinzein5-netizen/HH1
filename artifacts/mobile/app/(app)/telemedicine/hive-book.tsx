import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
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
import HoneycombWallpaper from "@/components/HoneycombWallpaper";
import ThemedStatusBar from "@/components/ThemedStatusBar";
import { useAppMode } from "@/context/AppModeContext";
import { useAuth } from "@/context/AuthContext";
import { useLogoTheme } from "@/context/LogoThemeContext";
import { useColors } from "@/hooks/useColors";
import {
  Allowance,
  OVERAGE_LABEL,
  TIER_LABEL,
  getAllowance,
  isUnlimited,
  recordUsage,
} from "@/utils/entitlements";
import {
  bookHiveSlot,
  type HivePractitioner,
  type HiveSlot,
  listHivePractitioners,
  listHiveSlots,
  nextDateForDay,
} from "@/utils/hiveBookingApi";
import { createAppointment, type ClinicianType } from "@/utils/telemedicineStore";

function clinicianTypeForRole(role: string): ClinicianType {
  const r = role.toLowerCase();
  if (r.includes("physio")) return "physio";
  if (r.includes("neuro")) return "neuro";
  if (r.includes("geriatric")) return "geriatric";
  if (r.includes("ortho") || r.includes("specialist")) return "ortho";
  return "gp";
}

export default function HiveBookScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { prefs } = useLogoTheme();
  const { pilotMode } = useAppMode();
  const { user } = useAuth();
  const topPad = Platform.OS === "web" ? 0 : insets.top;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [practitioners, setPractitioners] = useState<HivePractitioner[]>([]);
  const [selected, setSelected] = useState<HivePractitioner | null>(null);
  const [slots, setSlots] = useState<HiveSlot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotId, setSlotId] = useState<string | null>(null);
  const [patientName, setPatientName] = useState(user?.fullName ?? "");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [allowance, setAllowance] = useState<Allowance | null>(null);

  const userId = user?.id ?? "unknown";

  const loadAllowance = useCallback(async () => {
    try {
      setAllowance(await getAllowance(userId, "consultations"));
    } catch {}
  }, [userId]);

  const loadPractitioners = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setPractitioners(await listHivePractitioners());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not reach the HIVE booking service.");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadPractitioners();
      loadAllowance();
    }, [loadPractitioners, loadAllowance]),
  );

  useEffect(() => {
    if (!pilotMode) router.replace("/(app)/consultation");
  }, [pilotMode]);
  if (!pilotMode) return null;

  async function openPractitioner(p: HivePractitioner) {
    Haptics.selectionAsync();
    setSelected(p);
    setSlotId(null);
    setSlots([]);
    setSlotsLoading(true);
    setError(null);
    try {
      const data = await listHiveSlots(p.id);
      setSlots(data.slots);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load availability.");
    } finally {
      setSlotsLoading(false);
    }
  }

  const canConfirm = !!selected && !!slotId && patientName.trim().length > 0 && !saving;

  async function confirm() {
    if (!selected || !slotId) return;
    const slot = slots.find((s) => s.id === slotId);
    if (!slot) return;
    setSaving(true);
    setError(null);
    try {
      const booking = await bookHiveSlot({
        practitionerId: selected.id,
        slotId,
        patientName: patientName.trim(),
        reason: reason.trim() || undefined,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      // Count this consultation against the card's monthly free allowance.
      if (allowance && allowance.tier !== "blue" && allowance.remaining > 0 && !isUnlimited(allowance)) {
        try {
          await recordUsage(userId, "consultations");
        } catch {}
      }
      const appt = await createAppointment({
        clinicianType: clinicianTypeForRole(selected.role),
        reason: reason.trim()
          ? `${reason.trim()} — ${booking.kind} consultation with ${selected.fullName}`
          : `${booking.kind === "audio" ? "Audio" : "Video"} consultation with ${selected.fullName}`,
        dateISO: booking.date ?? booking.slot.date ?? nextDateForDay(slot.day),
        time: slot.start,
        mode: "video",
        gpName: selected.fullName,
      });
      router.replace({ pathname: "/(app)/telemedicine/appointment", params: { id: appt.id } });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Booking failed — please try again.");
      // Refresh slots in case the slot was just taken.
      if (selected) {
        try {
          const data = await listHiveSlots(selected.id);
          setSlots(data.slots);
          setSlotId(null);
        } catch {}
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ThemedStatusBar />
      <HoneycombWallpaper density={prefs.density} />

      <View style={[styles.header, { paddingTop: topPad + 12, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={() => (selected ? setSelected(null) : router.back())}
          style={styles.backBtn}
          activeOpacity={0.7}
        >
          <Feather name="arrow-left" size={20} color={colors.foreground} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
            Book a HIVE Practitioner
          </Text>
          <Text style={[styles.headerSub, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
            {selected ? selected.fullName : "Browse open video & audio consultation slots"}
          </Text>
        </View>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {error && (
            <View style={[styles.errorCard, { borderColor: "#ef444455", backgroundColor: "#ef444411" }]}>
              <MaterialCommunityIcons name="alert-circle-outline" size={18} color="#ef4444" />
              <Text style={[styles.errorText, { color: colors.foreground, fontFamily: "Inter_400Regular" }]}>{error}</Text>
            </View>
          )}

          {!selected && (
            <>
              <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>PRACTITIONERS ACCEPTING HIVE BOOKINGS</Text>
              {loading ? (
                <View style={styles.centerBox}>
                  <ActivityIndicator color={colors.primary} />
                </View>
              ) : practitioners.length === 0 ? (
                <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <MaterialCommunityIcons name="calendar-search" size={26} color={colors.mutedForeground} />
                  <Text style={[styles.emptyText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                    No practitioners have published open slots right now. Please check back soon — practitioners enable automated HIVE booking from their portal.
                  </Text>
                  <TouchableOpacity onPress={loadPractitioners} activeOpacity={0.8}>
                    <Text style={[styles.retryText, { color: colors.primary, fontFamily: "Inter_600SemiBold" }]}>Refresh</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                practitioners.map((p) => (
                  <TouchableOpacity
                    key={p.id}
                    activeOpacity={0.85}
                    onPress={() => openPractitioner(p)}
                    style={[styles.pracCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                  >
                    <View style={[styles.pracIcon, { backgroundColor: "#4F6EF722" }]}>
                      <MaterialCommunityIcons name="doctor" size={24} color="#4F6EF7" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                        <Text style={[styles.pracName, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>{p.fullName}</Text>
                        {p.verified && <MaterialCommunityIcons name="check-decagram" size={15} color="#22c55e" />}
                      </View>
                      <Text style={[styles.pracSub, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]} numberOfLines={1}>
                        {p.role}{p.workplace ? ` · ${p.workplace}` : ""}
                      </Text>
                      <Text style={[styles.pracSlots, { color: "#22c55e", fontFamily: "Inter_600SemiBold" }]}>
                        {p.openSlots} open slot{p.openSlots === 1 ? "" : "s"}
                        {p.videoConsultations && p.audioConsultations
                          ? " · video & audio"
                          : p.videoConsultations
                            ? " · video"
                            : " · audio"}
                      </Text>
                    </View>
                    <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
                  </TouchableOpacity>
                ))
              )}
            </>
          )}

          {selected && (
            <>
              <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>1 · PICK AN OPEN SLOT</Text>
              {slotsLoading ? (
                <View style={styles.centerBox}>
                  <ActivityIndicator color={colors.primary} />
                </View>
              ) : slots.filter((s) => !s.taken).length === 0 ? (
                <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Text style={[styles.emptyText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                    All of this practitioner's slots are currently booked.
                  </Text>
                </View>
              ) : (
                slots.map((s) => {
                  const isSel = slotId === s.id;
                  return (
                    <TouchableOpacity
                      key={s.id}
                      disabled={s.taken}
                      activeOpacity={0.85}
                      onPress={() => { Haptics.selectionAsync(); setSlotId(s.id); }}
                      style={[styles.slotCard, {
                        backgroundColor: isSel ? "#0f1a5a" : colors.card,
                        borderColor: isSel ? colors.primary : colors.border,
                        opacity: s.taken ? 0.45 : 1,
                      }]}
                    >
                      <MaterialCommunityIcons
                        name={s.kind === "audio" ? "phone" : "video"}
                        size={18}
                        color={isSel ? "#fff" : s.kind === "audio" ? "#f59e0b" : "#22c55e"}
                      />
                      <Text style={[styles.slotText, { color: isSel ? "#fff" : colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
                        {s.day} · {s.start}–{s.end}
                      </Text>
                      <Text style={[styles.slotKind, { color: isSel ? "rgba(255,255,255,0.7)" : colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                        {s.taken ? "Booked" : s.kind === "audio" ? "Audio call" : "Video call"}
                      </Text>
                    </TouchableOpacity>
                  );
                })
              )}

              <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>2 · YOUR NAME</Text>
              <TextInput
                value={patientName}
                onChangeText={setPatientName}
                placeholder="Full name for the practitioner's diary"
                placeholderTextColor={colors.mutedForeground}
                style={[styles.input, {
                  backgroundColor: colors.card, borderColor: colors.border,
                  color: colors.foreground, fontFamily: "Inter_400Regular",
                }]}
              />

              <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>3 · REASON (OPTIONAL)</Text>
              <TextInput
                value={reason}
                onChangeText={setReason}
                placeholder="e.g. Knee pain follow-up…"
                placeholderTextColor={colors.mutedForeground}
                multiline
                style={[styles.input, {
                  minHeight: 70, textAlignVertical: "top",
                  backgroundColor: colors.card, borderColor: colors.border,
                  color: colors.foreground, fontFamily: "Inter_400Regular",
                }]}
              />

              {allowance && (
                <View style={[styles.coverageRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <MaterialCommunityIcons
                    name={allowance.tier !== "blue" && (allowance.remaining > 0 || isUnlimited(allowance)) ? "shield-check" : "shield-alert-outline"}
                    size={18}
                    color={allowance.tier !== "blue" && (allowance.remaining > 0 || isUnlimited(allowance)) ? "#22c55e" : colors.gold}
                  />
                  <Text style={[styles.coverageText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                    {allowance.tier === "blue"
                      ? `${TIER_LABEL.blue}: consultations are billed at ${OVERAGE_LABEL.blue}, settled at your HIVE node.`
                      : isUnlimited(allowance)
                        ? `${TIER_LABEL[allowance.tier]}: unlimited consultations included.`
                        : allowance.remaining > 0
                          ? `${TIER_LABEL[allowance.tier]}: ${allowance.remaining} of ${allowance.limit} free consultation${allowance.limit === 1 ? "" : "s"} left this month.`
                          : `${TIER_LABEL[allowance.tier]}: monthly free allowance used — this consultation is billed at ${OVERAGE_LABEL[allowance.tier]}.`}
                  </Text>
                </View>
              )}

              {allowance && !isUnlimited(allowance) && (allowance.tier === "blue" || allowance.remaining === 0) && (
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => { Haptics.selectionAsync(); router.push("/(app)/membership"); }}
                  style={[styles.upgradeBtn, { borderColor: "#D4A017", backgroundColor: "#D4A0171a" }]}
                >
                  <MaterialCommunityIcons name="crown-outline" size={17} color="#D4A017" />
                  <Text style={[styles.upgradeBtnText, { color: "#D4A017", fontFamily: "Inter_600SemiBold" }]}>
                    {allowance.tier === "blue"
                      ? "Upgrade your card for free consultations each month"
                      : "Upgrade or manage your card for more each month"}
                  </Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity activeOpacity={0.85} onPress={confirm} disabled={!canConfirm} style={{ opacity: canConfirm ? 1 : 0.4 }}>
                <LinearGradient colors={["#0a2818", "#22c55e"]} style={styles.confirmBtn}>
                  {saving ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <MaterialCommunityIcons name="calendar-check" size={20} color="#fff" />
                      <Text style={[styles.confirmBtnText, { fontFamily: "Inter_700Bold" }]}>Confirm Booking</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              <Text style={[styles.footNote, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                Pilot programme: your name and reason are sent to this practitioner's HIVE diary so they can prepare for the consultation. The appointment is also saved on this device.
              </Text>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", gap: 14, paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 1 },
  backBtn: { padding: 6 },
  headerTitle: { fontSize: 17, letterSpacing: -0.3 },
  headerSub: { fontSize: 11, marginTop: 2 },
  scroll: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 100, gap: 12 },
  sectionLabel: { fontSize: 10, fontFamily: "Inter_600SemiBold", letterSpacing: 1.4, marginTop: 6 },
  centerBox: { paddingVertical: 30, alignItems: "center" },
  errorCard: { flexDirection: "row", alignItems: "flex-start", gap: 8, borderRadius: 12, borderWidth: 1, padding: 12 },
  errorText: { flex: 1, fontSize: 12.5, lineHeight: 18 },
  emptyCard: { borderRadius: 14, borderWidth: 1, padding: 20, alignItems: "center", gap: 10 },
  emptyText: { fontSize: 13, textAlign: "center", lineHeight: 19 },
  retryText: { fontSize: 13 },
  pracCard: { flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 14, borderWidth: 1.5, padding: 14 },
  pracIcon: { width: 48, height: 48, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  pracName: { fontSize: 14 },
  pracSub: { fontSize: 12, marginTop: 2 },
  pracSlots: { fontSize: 12, marginTop: 4 },
  slotCard: { flexDirection: "row", alignItems: "center", gap: 10, borderRadius: 12, borderWidth: 1.5, paddingHorizontal: 14, paddingVertical: 12 },
  slotText: { fontSize: 13.5, flex: 1 },
  slotKind: { fontSize: 12 },
  input: { borderRadius: 14, borderWidth: 1, padding: 14, fontSize: 14 },
  coverageRow: { flexDirection: "row", alignItems: "flex-start", gap: 10, borderRadius: 12, borderWidth: 1, padding: 12, marginTop: 4 },
  coverageText: { flex: 1, fontSize: 12.5, lineHeight: 18 },
  upgradeBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 12, borderWidth: 1, paddingVertical: 12, paddingHorizontal: 14 },
  upgradeBtnText: { fontSize: 13 },
  confirmBtn: { borderRadius: 14, paddingVertical: 16, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, marginTop: 8 },
  confirmBtnText: { color: "#fff", fontSize: 15 },
  footNote: { fontSize: 11, lineHeight: 17, textAlign: "center", marginTop: 4 },
});
