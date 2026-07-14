import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import HoneycombWallpaper from "@/components/HoneycombWallpaper";
import ThemedStatusBar from "@/components/ThemedStatusBar";
import { useAppMode } from "@/context/AppModeContext";
import { useLogoTheme } from "@/context/LogoThemeContext";
import { useColors } from "@/hooks/useColors";
import {
  type Appointment,
  clinicianMeta,
  formatApptDate,
  listAppointments,
  reminderLabel,
} from "@/utils/telemedicineStore";

export default function TelemedicinePortalScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { prefs } = useLogoTheme();
  const { pilotMode } = useAppMode();
  const topPad = Platform.OS === "web" ? 0 : insets.top;

  const [appointments, setAppointments] = useState<Appointment[]>([]);

  useEffect(() => {
    if (!pilotMode) router.replace("/(app)/consultation");
  }, [pilotMode]);

  useFocusEffect(
    useCallback(() => {
      listAppointments().then(setAppointments);
    }, [])
  );

  if (!pilotMode) return null;

  const upcoming = appointments.filter((a) => a.status === "upcoming");
  const past = appointments.filter((a) => a.status !== "upcoming");

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ThemedStatusBar />
      <HoneycombWallpaper density={prefs.density} />

      <View style={[styles.header, { paddingTop: topPad + 12, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <Feather name="arrow-left" size={20} color={colors.foreground} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>Telemedicine Portal</Text>
          <Text style={[styles.headerSub, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
            Pilot programme · IbnCeena Telemedicine
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <LinearGradient colors={["#0f1840", "#0d0d1a"]} style={styles.heroCard}>
          <MaterialCommunityIcons name="video" size={36} color="#22c55e" />
          <Text style={[styles.heroTitle, { color: "#fff", fontFamily: "Inter_700Bold" }]}>
            Video Consultations
          </Text>
          <Text style={[styles.heroSub, { color: "rgba(255,255,255,0.6)", fontFamily: "Inter_400Regular" }]}>
            Book a video consultation, prepare your handover pack, and join your session from the virtual waiting room. Appointments are stored only on this device.
          </Text>
        </LinearGradient>

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => { Haptics.selectionAsync(); router.push("/(app)/telemedicine/book"); }}
        >
          <LinearGradient colors={["#0a2818", "#22c55e"]} style={styles.bookBtn}>
            <MaterialCommunityIcons name="calendar-plus" size={20} color="#fff" />
            <Text style={[styles.bookBtnText, { fontFamily: "Inter_700Bold" }]}>Book a Video Consultation</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Reminders */}
        {upcoming.length > 0 && (
          <>
            <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>REMINDERS</Text>
            {upcoming.map((a) => (
              <View key={`rem-${a.id}`} style={[styles.reminderRow, { backgroundColor: colors.card, borderColor: colors.gold + "44" }]}>
                <MaterialCommunityIcons name="bell-ring-outline" size={18} color={colors.gold} />
                <Text style={[styles.reminderText, { color: colors.foreground, fontFamily: "Inter_500Medium" }]}>
                  {clinicianMeta(a.clinicianType).label}: {reminderLabel(a)}
                </Text>
              </View>
            ))}
          </>
        )}

        {/* Upcoming appointments */}
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>UPCOMING APPOINTMENTS</Text>
        {upcoming.length === 0 && (
          <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <MaterialCommunityIcons name="calendar-blank-outline" size={26} color={colors.mutedForeground} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              No upcoming appointments. Book a video consultation to get started.
            </Text>
          </View>
        )}
        {upcoming.map((a) => {
          const meta = clinicianMeta(a.clinicianType);
          return (
            <TouchableOpacity
              key={a.id}
              activeOpacity={0.85}
              onPress={() => { Haptics.selectionAsync(); router.push({ pathname: "/(app)/telemedicine/appointment", params: { id: a.id } }); }}
              style={[styles.apptCard, { backgroundColor: colors.card, borderColor: meta.color + "55" }]}
            >
              <View style={[styles.apptIcon, { backgroundColor: meta.color + "22" }]}>
                <MaterialCommunityIcons name={meta.icon as never} size={24} color={meta.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.apptTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>{meta.label}</Text>
                <Text style={[styles.apptSub, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]} numberOfLines={1}>
                  {a.reason || meta.subtitle}
                </Text>
                <Text style={[styles.apptWhen, { color: meta.color, fontFamily: "Inter_600SemiBold" }]}>
                  {formatApptDate(a.dateISO)} · {a.time}
                </Text>
              </View>
              <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
            </TouchableOpacity>
          );
        })}

        {/* Past appointments */}
        {past.length > 0 && (
          <>
            <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>PAST & CANCELLED</Text>
            {past.map((a) => {
              const meta = clinicianMeta(a.clinicianType);
              return (
                <TouchableOpacity
                  key={a.id}
                  activeOpacity={0.85}
                  onPress={() => router.push({ pathname: "/(app)/telemedicine/appointment", params: { id: a.id } })}
                  style={[styles.apptCard, { backgroundColor: colors.card, borderColor: colors.border, opacity: 0.75 }]}
                >
                  <View style={[styles.apptIcon, { backgroundColor: colors.background }]}>
                    <MaterialCommunityIcons
                      name={a.status === "completed" ? "check-circle-outline" : "close-circle-outline"}
                      size={22}
                      color={a.status === "completed" ? "#22c55e" : colors.mutedForeground}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.apptTitle, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>{meta.label}</Text>
                    <Text style={[styles.apptSub, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                      {formatApptDate(a.dateISO)} · {a.time} · {a.status === "completed" ? "Completed" : "Cancelled"}
                    </Text>
                  </View>
                  <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
                </TouchableOpacity>
              );
            })}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", gap: 14, paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 1 },
  backBtn: { padding: 6 },
  headerTitle: { fontSize: 17, letterSpacing: -0.3 },
  headerSub: { fontSize: 11, marginTop: 2 },
  scroll: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 100, gap: 14 },
  heroCard: { borderRadius: 20, padding: 22, gap: 10, alignItems: "center" },
  heroTitle: { fontSize: 20, letterSpacing: -0.4, textAlign: "center" },
  heroSub: { fontSize: 13, lineHeight: 20, textAlign: "center" },
  bookBtn: { borderRadius: 14, paddingVertical: 16, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10 },
  bookBtnText: { color: "#fff", fontSize: 15 },
  sectionLabel: { fontSize: 10, fontFamily: "Inter_600SemiBold", letterSpacing: 1.4, marginTop: 4 },
  reminderRow: { flexDirection: "row", alignItems: "center", gap: 10, borderRadius: 12, borderWidth: 1, padding: 12 },
  reminderText: { fontSize: 13, flex: 1 },
  emptyCard: { borderRadius: 14, borderWidth: 1, padding: 20, alignItems: "center", gap: 8 },
  emptyText: { fontSize: 13, textAlign: "center", lineHeight: 19 },
  apptCard: { flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 14, borderWidth: 1.5, padding: 14 },
  apptIcon: { width: 48, height: 48, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  apptTitle: { fontSize: 14 },
  apptSub: { fontSize: 12, marginTop: 2 },
  apptWhen: { fontSize: 12, marginTop: 4 },
});
