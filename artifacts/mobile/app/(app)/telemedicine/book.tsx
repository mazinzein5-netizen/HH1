import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
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
import { listGps, type GPRecord } from "@/utils/gpStore";
import {
  type AppointmentMode,
  CLINICIAN_TYPES,
  type ClinicianType,
  createAppointment,
} from "@/utils/telemedicineStore";

const TIME_SLOTS = ["09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30"];

function nextDays(count: number): { iso: string; label: string }[] {
  const out: { iso: string; label: string }[] = [];
  const now = new Date();
  for (let i = 0; i < count; i++) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const label =
      i === 0 ? "Today" : i === 1 ? "Tomorrow" : d.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" });
    out.push({ iso, label });
  }
  return out;
}

export default function BookConsultationScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { prefs } = useLogoTheme();
  const { pilotMode } = useAppMode();
  const topPad = Platform.OS === "web" ? 0 : insets.top;

  const [clinicianType, setClinicianType] = useState<ClinicianType | null>(null);
  const [mode, setMode] = useState<AppointmentMode>("video");
  const [partnerGps, setPartnerGps] = useState<GPRecord[]>([]);
  const [gpId, setGpId] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [dateISO, setDateISO] = useState<string | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [allowance, setAllowance] = useState<Allowance | null>(null);

  const { user } = useAuth();
  const userId = user?.id ?? "unknown";

  const loadAllowance = useCallback(async () => {
    setAllowance(await getAllowance(userId, "consultations"));
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      loadAllowance();
      listGps().then((gps) => setPartnerGps(gps.filter((g) => g.isPartner)));
    }, [loadAllowance]),
  );

  const days = useMemo(() => nextDays(7), []);

  useEffect(() => {
    if (!pilotMode) router.replace("/(app)/consultation");
  }, [pilotMode]);
  if (!pilotMode) return null;

  const canConfirm = !!clinicianType && !!dateISO && !!time && !saving;

  async function confirm() {
    if (!clinicianType || !dateISO || !time) return;
    setSaving(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (allowance && allowance.remaining > 0 && !isUnlimited(allowance)) {
      try {
        await recordUsage(userId, "consultations");
      } catch {}
    }
    const chosenGp = partnerGps.find((g) => g.id === gpId) ?? null;
    const appt = await createAppointment({
      clinicianType,
      reason: reason.trim(),
      dateISO,
      time,
      mode,
      ...(chosenGp ? { gpId: chosenGp.id, gpName: chosenGp.name || chosenGp.practice } : {}),
    });
    router.replace({ pathname: "/(app)/telemedicine/appointment", params: { id: appt.id } });
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ThemedStatusBar />
      <HoneycombWallpaper density={prefs.density} />

      <View style={[styles.header, { paddingTop: topPad + 12, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <Feather name="arrow-left" size={20} color={colors.foreground} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>Book an Appointment</Text>
          <Text style={[styles.headerSub, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
            Video or in-person — choose a clinician, reason, and time
          </Text>
        </View>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>1 · CLINICIAN TYPE</Text>
          {CLINICIAN_TYPES.map((c) => (
            <TouchableOpacity
              key={c.key}
              activeOpacity={0.85}
              onPress={() => { Haptics.selectionAsync(); setClinicianType(c.key); }}
              style={[styles.consultCard, {
                backgroundColor: clinicianType === c.key ? c.color + "18" : colors.card,
                borderColor: clinicianType === c.key ? c.color : colors.border,
              }]}
            >
              <View style={[styles.consultIcon, { backgroundColor: c.color + "22" }]}>
                <MaterialCommunityIcons name={c.icon as never} size={24} color={c.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.consultLabel, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>{c.label}</Text>
                <Text style={[styles.consultSub, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>{c.subtitle}</Text>
              </View>
              {clinicianType === c.key && <MaterialCommunityIcons name="check-circle" size={20} color={c.color} />}
            </TouchableOpacity>
          ))}

          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>2 · APPOINTMENT TYPE</Text>
          <View style={styles.chipWrap}>
            {([
              { key: "video" as const, label: "Video consultation", icon: "video" },
              { key: "in_person" as const, label: "In-person visit", icon: "hospital-building" },
            ]).map((m) => (
              <TouchableOpacity
                key={m.key}
                activeOpacity={0.85}
                onPress={() => { Haptics.selectionAsync(); setMode(m.key); }}
                style={[styles.chip, {
                  flexDirection: "row", alignItems: "center", gap: 6,
                  backgroundColor: mode === m.key ? "#0f1a5a" : colors.card,
                  borderColor: mode === m.key ? colors.primary : colors.border,
                }]}
              >
                <MaterialCommunityIcons name={m.icon as never} size={15} color={mode === m.key ? "#fff" : colors.mutedForeground} />
                <Text style={[styles.chipText, { color: mode === m.key ? "#fff" : colors.foreground, fontFamily: "Inter_500Medium" }]}>
                  {m.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>3 · YOUR GP (OPTIONAL)</Text>
          {partnerGps.length === 0 ? (
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => { Haptics.selectionAsync(); router.push("/(app)/my-gps"); }}
              style={[styles.consultCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <View style={[styles.consultIcon, { backgroundColor: colors.gold + "22" }]}>
                <MaterialCommunityIcons name="account-plus" size={24} color={colors.gold} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.consultLabel, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>No partner GP saved yet</Text>
                <Text style={[styles.consultSub, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                  Add your GPs in “My GPs & Practices” — partner GPs can be booked directly here.
                </Text>
              </View>
              <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
            </TouchableOpacity>
          ) : (
            <View style={styles.chipWrap}>
              {partnerGps.map((g) => {
                const selected = gpId === g.id;
                return (
                  <TouchableOpacity
                    key={g.id}
                    activeOpacity={0.85}
                    onPress={() => { Haptics.selectionAsync(); setGpId(selected ? null : g.id); }}
                    style={[styles.chip, {
                      backgroundColor: selected ? "#0f1a5a" : colors.card,
                      borderColor: selected ? colors.primary : colors.border,
                    }]}
                  >
                    <Text style={[styles.chipText, { color: selected ? "#fff" : colors.foreground, fontFamily: "Inter_500Medium" }]}>
                      {g.name || g.practice}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>4 · REASON FOR CONSULTATION</Text>
          <TextInput
            value={reason}
            onChangeText={setReason}
            placeholder="e.g. Neck pain follow-up, medication review…"
            placeholderTextColor={colors.mutedForeground}
            multiline
            style={[styles.reasonInput, {
              backgroundColor: colors.card,
              borderColor: colors.border,
              color: colors.foreground,
              fontFamily: "Inter_400Regular",
            }]}
          />

          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>5 · DATE</Text>
          <View style={styles.chipWrap}>
            {days.map((d) => (
              <TouchableOpacity
                key={d.iso}
                activeOpacity={0.85}
                onPress={() => { Haptics.selectionAsync(); setDateISO(d.iso); }}
                style={[styles.chip, {
                  backgroundColor: dateISO === d.iso ? "#0f1a5a" : colors.card,
                  borderColor: dateISO === d.iso ? colors.primary : colors.border,
                }]}
              >
                <Text style={[styles.chipText, { color: dateISO === d.iso ? "#fff" : colors.foreground, fontFamily: "Inter_500Medium" }]}>
                  {d.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>6 · TIME</Text>
          <View style={styles.chipWrap}>
            {TIME_SLOTS.map((t) => (
              <TouchableOpacity
                key={t}
                activeOpacity={0.85}
                onPress={() => { Haptics.selectionAsync(); setTime(t); }}
                style={[styles.chip, {
                  backgroundColor: time === t ? "#0f1a5a" : colors.card,
                  borderColor: time === t ? colors.primary : colors.border,
                }]}
              >
                <Text style={[styles.chipText, { color: time === t ? "#fff" : colors.foreground, fontFamily: "Inter_500Medium" }]}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {allowance && (
            <View style={[styles.coverageRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <MaterialCommunityIcons
                name={allowance.remaining > 0 || isUnlimited(allowance) ? "shield-check" : "shield-alert-outline"}
                size={18}
                color={allowance.remaining > 0 || isUnlimited(allowance) ? "#22c55e" : colors.gold}
              />
              <Text style={[styles.coverageText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                {isUnlimited(allowance)
                  ? `${TIER_LABEL[allowance.tier]}: unlimited consultations included.`
                  : allowance.limit === 0
                    ? `${TIER_LABEL[allowance.tier]}: consultations billed at ${OVERAGE_LABEL[allowance.tier]}.`
                    : allowance.remaining > 0
                      ? `${TIER_LABEL[allowance.tier]}: ${allowance.remaining} of ${allowance.limit} free consultation${allowance.limit === 1 ? "" : "s"} left this month.`
                      : `${TIER_LABEL[allowance.tier]}: monthly free allowance used — this consultation is billed at ${OVERAGE_LABEL[allowance.tier]}.`}
              </Text>
            </View>
          )}

          <TouchableOpacity activeOpacity={0.85} onPress={confirm} disabled={!canConfirm} style={{ opacity: canConfirm ? 1 : 0.4 }}>
            <LinearGradient colors={["#0a2818", "#22c55e"]} style={styles.confirmBtn}>
              <MaterialCommunityIcons name="calendar-check" size={20} color="#fff" />
              <Text style={[styles.confirmBtnText, { fontFamily: "Inter_700Bold" }]}>Confirm Booking</Text>
            </LinearGradient>
          </TouchableOpacity>

          <Text style={[styles.footNote, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
            Pilot programme: appointments are stored only on this device. Your booking is confirmed immediately, and the clinic will contact you within 1 working day if the slot needs to change. After booking you can attach your health card, symptom summary, and prescription for the clinician.
          </Text>
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
  consultCard: { flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 14, borderWidth: 1.5, padding: 14 },
  consultIcon: { width: 48, height: 48, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  consultLabel: { fontSize: 14 },
  consultSub: { fontSize: 12, marginTop: 2 },
  reasonInput: { borderRadius: 14, borderWidth: 1, padding: 14, minHeight: 76, fontSize: 14, textAlignVertical: "top" },
  chipWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { borderRadius: 20, borderWidth: 1.5, paddingHorizontal: 14, paddingVertical: 9 },
  chipText: { fontSize: 13 },
  coverageRow: { flexDirection: "row", alignItems: "flex-start", gap: 10, borderRadius: 12, borderWidth: 1, padding: 12, marginTop: 4 },
  coverageText: { flex: 1, fontSize: 12.5, lineHeight: 18 },
  confirmBtn: { borderRadius: 14, paddingVertical: 16, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, marginTop: 8 },
  confirmBtnText: { color: "#fff", fontSize: 15 },
  footNote: { fontSize: 11, lineHeight: 17, textAlign: "center", marginTop: 4 },
});
