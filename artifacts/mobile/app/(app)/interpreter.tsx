import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
  Alert,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import HoneycombWallpaper from "@/components/HoneycombWallpaper";
import { useAuth } from "@/context/AuthContext";
import { useLogoTheme } from "@/context/LogoThemeContext";
import { useColors } from "@/hooks/useColors";
import { Allowance, OVERAGE_LABEL, TIER_LABEL, getAllowance, recordUsage } from "@/utils/entitlements";
import {
  addBooking,
  cancelBooking,
  confirmBooking,
  formatBookingDate,
  formatBookingTime,
  INTERPRETER_LANGUAGES,
  InterpreterBooking,
  InterpreterMode,
  InterpreterService,
  listBookings,
  removeBooking,
  sendBookingRequestEmail,
  SERVICE_TYPES,
  serviceLabel,
} from "@/utils/interpreterStore";

const TIME_SLOTS = [
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "12:00", "12:30", "14:00", "14:30", "15:00", "15:30",
  "16:00", "16:30", "17:00", "17:30",
];

function nextDays(count: number): Date[] {
  const days: Date[] = [];
  const start = new Date();
  for (let i = 1; i <= count; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    days.push(d);
  }
  return days;
}

export default function InterpreterScreen() {
  const colors = useColors();
  const { prefs } = useLogoTheme();
  const { user } = useAuth();

  const days = useMemo(() => nextDays(14), []);

  const [language, setLanguage] = useState<string | null>(null);
  const [langModal, setLangModal] = useState(false);
  const [service, setService] = useState<InterpreterService | null>(null);
  const [dayIndex, setDayIndex] = useState<number | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const [mode, setMode] = useState<InterpreterMode>("in-person");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [bookings, setBookings] = useState<InterpreterBooking[]>([]);
  const [allowance, setAllowance] = useState<Allowance | null>(null);

  const userId = user?.id ?? "unknown";

  const refresh = useCallback(async () => {
    const [list, allw] = await Promise.all([listBookings(), getAllowance(userId, "interpreter")]);
    setBookings(list);
    setAllowance(allw);
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const canSubmit = !!language && !!service && dayIndex !== null && !!time;

  async function submit() {
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const day = days[dayIndex!];
      const [hh, mm] = time!.split(":").map((n) => parseInt(n, 10));
      const dateTime = new Date(day);
      dateTime.setHours(hh, mm, 0, 0);

      // Covered by the card's monthly allowance?
      const covered = !!allowance && allowance.tier !== "blue" && allowance.remaining > 0;

      const booking = await addBooking({
        language: language!,
        service: service!,
        dateTime: dateTime.toISOString(),
        mode,
        notes: notes.trim() || undefined,
      });
      if (covered) {
        try { await recordUsage(userId, "interpreter"); } catch {}
      }
      await refresh();
      await sendBookingRequestEmail(booking, user?.fullName);

      setLanguage(null);
      setService(null);
      setDayIndex(null);
      setTime(null);
      setNotes("");
      Alert.alert(
        "Request saved",
        "Your booking request is in My Bookings below. Send the pre-filled email to your interpreter service to confirm it."
      );
    } catch {
      Alert.alert("Something went wrong", "Your request could not be created. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function onCancelBooking(b: InterpreterBooking) {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert(
      "Cancel this booking?",
      "This marks the request as cancelled on your device. If you already emailed the interpreter service, please let them know too.",
      [
        { text: "Keep it", style: "cancel" },
        {
          text: "Cancel booking",
          style: "destructive",
          onPress: async () => setBookings(await cancelBooking(b.id)),
        },
      ]
    );
  }

  function onRemoveBooking(b: InterpreterBooking) {
    Alert.alert("Remove from list?", "This deletes the request from your device.", [
      { text: "Keep", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => setBookings(await removeBooking(b.id)),
      },
    ]);
  }

  const statusStyle = (status: InterpreterBooking["status"]) => {
    switch (status) {
      case "confirmed":
        return { color: "#22c55e", bg: "#22c55e1e", border: "#22c55e44", label: "Confirmed" };
      case "cancelled":
        return { color: colors.mutedForeground, bg: "rgba(128,128,128,0.12)", border: "rgba(128,128,128,0.3)", label: "Cancelled" };
      default:
        return { color: colors.gold, bg: colors.gold + "1e", border: colors.gold + "44", label: "Pending" };
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <HoneycombWallpaper density={prefs.density} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <LinearGradient colors={["#1a1204", "#0d0d1a"]} style={styles.heroCard}>
          <MaterialCommunityIcons name="translate" size={38} color={colors.gold} />
          <Text style={[styles.heroTitle, { color: "#fff", fontFamily: "Inter_700Bold" }]}>
            Book a Live Interpreter
          </Text>
          <Text style={[styles.heroSub, { color: "rgba(255,255,255,0.65)", fontFamily: "Inter_400Regular" }]}>
            Professional, confidential interpreters for medical and legal consultations and appointments — in person or by phone and video.
          </Text>
          <View style={[styles.assureChip, { backgroundColor: colors.gold + "1c", borderColor: colors.gold + "3c" }]}>
            <MaterialCommunityIcons name="shield-check" size={13} color={colors.gold} />
            <Text style={[styles.assureText, { color: colors.goldLight, fontFamily: "Inter_500Medium" }]}>
              Qualified interpreters bound by strict confidentiality
            </Text>
          </View>
        </LinearGradient>

        {/* Language */}
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>LANGUAGE</Text>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => { Haptics.selectionAsync(); setLangModal(true); }}
          style={[styles.dropdown, { backgroundColor: colors.card, borderColor: language ? colors.gold : colors.border }]}
        >
          <MaterialCommunityIcons name="translate" size={20} color={language ? colors.gold : colors.mutedForeground} />
          <Text
            style={[
              styles.dropdownText,
              { color: language ? colors.foreground : colors.mutedForeground, fontFamily: language ? "Inter_600SemiBold" : "Inter_400Regular" },
            ]}
          >
            {language ?? "Choose a language"}
          </Text>
          <Feather name="chevron-down" size={18} color={colors.mutedForeground} />
        </TouchableOpacity>

        {/* Service type */}
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>TYPE OF APPOINTMENT</Text>
        {SERVICE_TYPES.map((s) => (
          <TouchableOpacity
            key={s.key}
            activeOpacity={0.85}
            onPress={() => { Haptics.selectionAsync(); setService(s.key); }}
            style={[styles.serviceCard, {
              backgroundColor: service === s.key ? colors.gold + "14" : colors.card,
              borderColor: service === s.key ? colors.gold : colors.border,
            }]}
          >
            <View style={[styles.serviceIcon, { backgroundColor: colors.gold + "1e" }]}>
              <MaterialCommunityIcons
                name={s.key === "medical" ? "stethoscope" : s.key === "legal" ? "scale-balance" : "account-multiple"}
                size={22}
                color={colors.gold}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.serviceLabel, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>{s.label}</Text>
              <Text style={[styles.serviceSub, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>{s.sub}</Text>
            </View>
            <MaterialCommunityIcons
              name={service === s.key ? "radiobox-marked" : "radiobox-blank"}
              size={22}
              color={service === s.key ? colors.gold : colors.mutedForeground}
            />
          </TouchableOpacity>
        ))}

        {/* Date */}
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>DATE</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          {days.map((d, i) => {
            const selected = dayIndex === i;
            return (
              <TouchableOpacity
                key={d.toISOString()}
                activeOpacity={0.85}
                onPress={() => { Haptics.selectionAsync(); setDayIndex(i); }}
                style={[styles.dayChip, {
                  backgroundColor: selected ? colors.gold + "1e" : colors.card,
                  borderColor: selected ? colors.gold : colors.border,
                }]}
              >
                <Text style={[styles.dayChipTop, { color: selected ? colors.gold : colors.mutedForeground, fontFamily: "Inter_600SemiBold" }]}>
                  {d.toLocaleDateString(undefined, { weekday: "short" })}
                </Text>
                <Text style={[styles.dayChipNum, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
                  {d.getDate()}
                </Text>
                <Text style={[styles.dayChipMonth, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                  {d.toLocaleDateString(undefined, { month: "short" })}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Time */}
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>TIME</Text>
        <View style={styles.timeGrid}>
          {TIME_SLOTS.map((t) => {
            const selected = time === t;
            return (
              <TouchableOpacity
                key={t}
                activeOpacity={0.85}
                onPress={() => { Haptics.selectionAsync(); setTime(t); }}
                style={[styles.timeChip, {
                  backgroundColor: selected ? colors.gold + "1e" : colors.card,
                  borderColor: selected ? colors.gold : colors.border,
                }]}
              >
                <Text style={[styles.timeChipText, {
                  color: selected ? colors.gold : colors.foreground,
                  fontFamily: selected ? "Inter_700Bold" : "Inter_500Medium",
                }]}>
                  {t}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Format */}
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>FORMAT</Text>
        <View style={styles.modeRow}>
          {([
            { key: "in-person" as InterpreterMode, label: "In Person", icon: "account-group" as const },
            { key: "remote" as InterpreterMode, label: "Phone / Video", icon: "phone-in-talk" as const },
          ]).map((m) => {
            const selected = mode === m.key;
            return (
              <TouchableOpacity
                key={m.key}
                activeOpacity={0.85}
                onPress={() => { Haptics.selectionAsync(); setMode(m.key); }}
                style={[styles.modeBtn, {
                  backgroundColor: selected ? colors.gold + "1e" : colors.card,
                  borderColor: selected ? colors.gold : colors.border,
                }]}
              >
                <MaterialCommunityIcons name={m.icon} size={20} color={selected ? colors.gold : colors.mutedForeground} />
                <Text style={[styles.modeText, { color: selected ? colors.gold : colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
                  {m.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Notes */}
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>NOTES (OPTIONAL)</Text>
        <TextInput
          value={notes}
          onChangeText={setNotes}
          placeholder="Anything the interpreter should know — location, dialect, accessibility needs…"
          placeholderTextColor={colors.mutedForeground}
          multiline
          style={[styles.notesInput, {
            backgroundColor: colors.card,
            borderColor: colors.border,
            color: colors.foreground,
            fontFamily: "Inter_400Regular",
          }]}
        />

        {/* Coverage note */}
        {allowance ? (
          <View style={[styles.coverageRow, {
            backgroundColor: allowance.tier !== "blue" && allowance.remaining > 0
              ? (allowance.tier === "red" ? "#E5294E1a" : "#D4A0171a")
              : colors.card,
            borderColor: allowance.tier !== "blue" && allowance.remaining > 0
              ? (allowance.tier === "red" ? "#E5294E55" : "#D4A01755")
              : colors.border,
          }]}>
            <MaterialCommunityIcons
              name={allowance.tier === "red" ? "shield-star" : allowance.tier === "gold" ? "crown-outline" : "card-account-details-star-outline"}
              size={18}
              color={allowance.tier === "red" ? "#E5294E" : allowance.tier === "gold" ? "#D4A017" : "#2563EB"}
            />
            <Text style={[styles.coverageText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              {allowance.tier !== "blue"
                ? allowance.remaining > 0
                  ? `Covered by your ${TIER_LABEL[allowance.tier]} — ${allowance.used} of ${allowance.limit} free sessions used this month.`
                  : `You've used your ${allowance.limit} free sessions this month — this booking is at the ${OVERAGE_LABEL[allowance.tier]}, settled at your HIVE node.`
                : "On the Blue Card, interpreter sessions are at the standard rate, settled at your HIVE node. The Gold Card and the Red Geriatric Safety Pack include 3 free sessions a month."}
            </Text>
          </View>
        ) : null}

        {/* Submit */}
        <TouchableOpacity activeOpacity={0.85} onPress={submit} disabled={!canSubmit || submitting}>
          <LinearGradient
            colors={canSubmit ? ["#8a5c06", "#c9860a"] : ["#3a3a3a", "#2a2a2a"]}
            style={styles.submitBtn}
          >
            <MaterialCommunityIcons name="email-fast-outline" size={20} color="#fff" />
            <Text style={[styles.submitText, { fontFamily: "Inter_700Bold" }]}>
              {submitting ? "Preparing request…" : "Request Interpreter"}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
        <Text style={[styles.zeroServerNote, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
          Your request opens in your own mail app so you can send it to your interpreter service. Booking details are stored only on this device.
        </Text>

        {/* My bookings */}
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground, marginTop: 10 }]}>MY INTERPRETER BOOKINGS</Text>
        {bookings.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <MaterialCommunityIcons name="calendar-blank-outline" size={26} color={colors.mutedForeground} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              No booking requests yet. Your requests will appear here.
            </Text>
          </View>
        ) : (
          bookings.map((b) => {
            const st = statusStyle(b.status);
            return (
              <View key={b.id} style={[styles.bookingCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.bookingTop}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.bookingTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
                      {b.language}
                    </Text>
                    <Text style={[styles.bookingSub, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                      {serviceLabel(b.service)} · {b.mode === "in-person" ? "In person" : "Phone / video"}
                    </Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: st.bg, borderColor: st.border }]}>
                    <Text style={[styles.statusText, { color: st.color, fontFamily: "Inter_600SemiBold" }]}>{st.label}</Text>
                  </View>
                </View>
                <View style={styles.bookingWhenRow}>
                  <Feather name="calendar" size={14} color={colors.mutedForeground} />
                  <Text style={[styles.bookingWhen, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
                    {formatBookingDate(b.dateTime)} · {formatBookingTime(b.dateTime)}
                  </Text>
                </View>
                {!!b.notes && (
                  <Text style={[styles.bookingNotes, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]} numberOfLines={2}>
                    {b.notes}
                  </Text>
                )}
                <View style={styles.bookingActions}>
                  {b.status !== "cancelled" && (
                    <TouchableOpacity
                      style={[styles.bookingActionBtn, { borderColor: colors.border }]}
                      onPress={() => sendBookingRequestEmail(b, user?.fullName)}
                      activeOpacity={0.8}
                    >
                      <Feather name="mail" size={14} color={colors.gold} />
                      <Text style={[styles.bookingActionText, { color: colors.goldLight, fontFamily: "Inter_600SemiBold" }]}>Email again</Text>
                    </TouchableOpacity>
                  )}
                  {b.status === "pending" && (
                    <TouchableOpacity
                      style={[styles.bookingActionBtn, { borderColor: colors.border }]}
                      onPress={async () => {
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                        setBookings(await confirmBooking(b.id));
                      }}
                      activeOpacity={0.8}
                    >
                      <Feather name="check-circle" size={14} color="#22c55e" />
                      <Text style={[styles.bookingActionText, { color: "#22c55e", fontFamily: "Inter_600SemiBold" }]}>Mark confirmed</Text>
                    </TouchableOpacity>
                  )}
                  {b.status === "cancelled" ? (
                    <TouchableOpacity
                      style={[styles.bookingActionBtn, { borderColor: colors.border }]}
                      onPress={() => onRemoveBooking(b)}
                      activeOpacity={0.8}
                    >
                      <Feather name="trash-2" size={14} color={colors.accent} />
                      <Text style={[styles.bookingActionText, { color: colors.accent, fontFamily: "Inter_600SemiBold" }]}>Remove</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={[styles.bookingActionBtn, { borderColor: colors.border }]}
                      onPress={() => onCancelBooking(b)}
                      activeOpacity={0.8}
                    >
                      <Feather name="x-circle" size={14} color={colors.accent} />
                      <Text style={[styles.bookingActionText, { color: colors.accent, fontFamily: "Inter_600SemiBold" }]}>Cancel</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Language modal */}
      <Modal visible={langModal} transparent animationType="slide" onRequestClose={() => setLangModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
                Choose a language
              </Text>
              <TouchableOpacity onPress={() => setLangModal(false)} style={{ padding: 6 }}>
                <Feather name="x" size={20} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 420 }}>
              {INTERPRETER_LANGUAGES.map((l) => (
                <TouchableOpacity
                  key={l}
                  activeOpacity={0.8}
                  onPress={() => { Haptics.selectionAsync(); setLanguage(l); setLangModal(false); }}
                  style={[styles.langRow, { borderBottomColor: colors.border }]}
                >
                  <Text style={[styles.langText, {
                    color: language === l ? colors.gold : colors.foreground,
                    fontFamily: language === l ? "Inter_700Bold" : "Inter_400Regular",
                  }]}>
                    {l}
                  </Text>
                  {language === l && <Feather name="check" size={18} color={colors.gold} />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { padding: 16, paddingBottom: 60, gap: 12 },
  heroCard: { borderRadius: 20, padding: 22, gap: 10, alignItems: "center" },
  heroTitle: { fontSize: 21, letterSpacing: -0.4, textAlign: "center" },
  heroSub: { fontSize: 13.5, lineHeight: 20, textAlign: "center" },
  assureChip: { flexDirection: "row", alignItems: "center", gap: 6, borderRadius: 20, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 6 },
  assureText: { fontSize: 11.5 },
  sectionLabel: { fontSize: 10.5, fontFamily: "Inter_600SemiBold", letterSpacing: 1.4, marginTop: 6 },
  dropdown: { flexDirection: "row", alignItems: "center", gap: 10, borderRadius: 14, borderWidth: 1.5, paddingHorizontal: 14, paddingVertical: 15 },
  dropdownText: { flex: 1, fontSize: 15 },
  serviceCard: { flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 14, borderWidth: 1.5, padding: 14 },
  serviceIcon: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  serviceLabel: { fontSize: 14.5 },
  serviceSub: { fontSize: 12, marginTop: 2 },
  chipRow: { gap: 8, paddingRight: 8 },
  dayChip: { width: 62, borderRadius: 12, borderWidth: 1.5, paddingVertical: 10, alignItems: "center", gap: 2 },
  dayChipTop: { fontSize: 11 },
  dayChipNum: { fontSize: 18 },
  dayChipMonth: { fontSize: 10.5 },
  timeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  timeChip: { borderRadius: 10, borderWidth: 1.5, paddingHorizontal: 14, paddingVertical: 10 },
  timeChipText: { fontSize: 13.5 },
  modeRow: { flexDirection: "row", gap: 10 },
  modeBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 12, borderWidth: 1.5, paddingVertical: 14 },
  modeText: { fontSize: 13.5 },
  notesInput: { borderRadius: 14, borderWidth: 1, padding: 14, minHeight: 80, fontSize: 14, textAlignVertical: "top" },
  submitBtn: { borderRadius: 14, paddingVertical: 17, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, marginTop: 4 },
  submitText: { color: "#fff", fontSize: 15.5 },
  coverageRow: { flexDirection: "row", alignItems: "flex-start", gap: 10, borderRadius: 12, borderWidth: 1, padding: 12, marginTop: 12 },
  coverageText: { flex: 1, fontSize: 12.5, lineHeight: 18 },
  zeroServerNote: { fontSize: 11, lineHeight: 16, textAlign: "center", paddingHorizontal: 10 },
  emptyCard: { borderRadius: 14, borderWidth: 1, padding: 22, alignItems: "center", gap: 8 },
  emptyText: { fontSize: 12.5, textAlign: "center" },
  bookingCard: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 8 },
  bookingTop: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  bookingTitle: { fontSize: 15 },
  bookingSub: { fontSize: 12, marginTop: 2 },
  statusBadge: { borderRadius: 10, borderWidth: 1, paddingHorizontal: 9, paddingVertical: 4 },
  statusText: { fontSize: 11 },
  bookingWhenRow: { flexDirection: "row", alignItems: "center", gap: 7 },
  bookingWhen: { fontSize: 13 },
  bookingNotes: { fontSize: 12, lineHeight: 17 },
  bookingActions: { flexDirection: "row", gap: 10, marginTop: 2 },
  bookingActionBtn: { flexDirection: "row", alignItems: "center", gap: 6, borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 8 },
  bookingActionText: { fontSize: 12.5 },
  modalOverlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.55)" },
  modalSheet: { borderTopLeftRadius: 22, borderTopRightRadius: 22, borderWidth: 1, padding: 18, paddingBottom: 34 },
  modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  modalTitle: { fontSize: 17 },
  langRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 15, borderBottomWidth: 1 },
  langText: { fontSize: 15 },
});
