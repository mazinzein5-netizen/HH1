import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  Alert,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  Appointment,
  clinicianMeta,
  formatApptDate,
  listAppointments,
  reminderLabel,
} from "@/utils/telemedicineStore";
import { useAppMode } from "@/context/AppModeContext";
import { useColors } from "@/hooks/useColors";

type MapTarget = { key: string; label: string; query: string; icon: React.ComponentProps<typeof MaterialCommunityIcons>["name"]; color: string };

const MAP_TARGETS: MapTarget[] = [
  { key: "pharmacy", label: "Pharmacies", query: "pharmacy near me", icon: "mortar-pestle-plus", color: "#22c55e" },
  { key: "gp", label: "GP Surgeries", query: "GP surgery near me", icon: "doctor", color: "#4F6EF7" },
  { key: "hospital", label: "Hospitals & A&E", query: "hospital emergency department near me", icon: "hospital-building", color: "#E5294E" },
];

async function openMapsSearch(query: string): Promise<void> {
  // Ask for location so the maps app can centre on the user. The search still
  // works if permission is declined — maps will just use its own location.
  let coords: { latitude: number; longitude: number } | null = null;
  if (Platform.OS !== "web") {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === "granted") {
        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        coords = pos.coords;
      }
    } catch {
      coords = null;
    }
  }

  const q = encodeURIComponent(query);
  let url: string;
  if (Platform.OS === "ios") {
    url = coords
      ? `maps://?q=${q}&sll=${coords.latitude},${coords.longitude}`
      : `maps://?q=${q}`;
  } else if (Platform.OS === "android") {
    url = coords
      ? `geo:${coords.latitude},${coords.longitude}?q=${q}`
      : `geo:0,0?q=${q}`;
  } else {
    url = `https://www.google.com/maps/search/?api=1&query=${q}`;
  }

  try {
    await Linking.openURL(url);
  } catch {
    // Fall back to the universal web URL.
    const fallback = `https://www.google.com/maps/search/?api=1&query=${q}`;
    Linking.openURL(fallback).catch(() => {
      Alert.alert("Maps unavailable", "We couldn't open a maps app on this device.");
    });
  }
}

export default function CommsCenterScreen() {
  const colors = useColors();
  const { pilotMode } = useAppMode();
  const [appts, setAppts] = useState<Appointment[]>([]);

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      (async () => {
        const all = await listAppointments();
        if (alive) {
          setAppts(all.filter((a) => a.status === "upcoming").slice(0, 5));
        }
      })();
      return () => {
        alive = false;
      };
    }, [])
  );

  const comms = [
    {
      key: "sarah",
      label: "Talk to Sarah",
      sub: "Your health companion — ask anything",
      icon: "account-voice" as const,
      color: "#a78bfa",
      onPress: () => router.push("/(app)/companion"),
      show: pilotMode,
    },
    {
      key: "notifications",
      label: "Notifications & Reminders",
      sub: "Medication and appointment reminders",
      icon: "bell-ring" as const,
      color: "#D4A017",
      onPress: () => router.push("/(app)/notifications"),
      show: true,
    },
    {
      key: "interpreter",
      label: "Live Interpreter",
      sub: "Book confidential interpreting support",
      icon: "translate" as const,
      color: "#06b6d4",
      onPress: () => router.push("/(app)/interpreter"),
      show: true,
    },
  ].filter((c) => c.show);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={styles.scroll}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Appointments ── */}
      <View style={styles.sectionHead}>
        <Text style={[styles.sectionHeading, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
          Upcoming Appointments
        </Text>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => router.push(pilotMode ? "/(app)/telemedicine/book" : "/(app)/consultation")}
          style={[styles.bookBtn, { backgroundColor: "#4F6EF722", borderColor: "#4F6EF766" }]}
        >
          <Feather name="plus" size={14} color="#4F6EF7" />
          <Text style={[styles.bookBtnText, { color: "#4F6EF7", fontFamily: "Inter_600SemiBold" }]}>Book</Text>
        </TouchableOpacity>
      </View>

      {appts.length === 0 ? (
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <MaterialCommunityIcons name="calendar-blank-outline" size={26} color={colors.mutedForeground} />
          <Text style={[styles.emptyTitle, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
            No upcoming appointments
          </Text>
          <Text style={[styles.emptySub, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
            {pilotMode
              ? "Book a video consultation and it will appear here with reminders."
              : "Appointments you arrange will appear here with reminders."}
          </Text>
        </View>
      ) : (
        appts.map((a) => {
          const meta = clinicianMeta(a.clinicianType);
          return (
            <TouchableOpacity
              key={a.id}
              activeOpacity={0.85}
              onPress={() => router.push(pilotMode ? "/(app)/telemedicine" : "/(app)/consultation")}
              style={[styles.apptRow, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <View style={[styles.apptIcon, { backgroundColor: meta.color + "20" }]}>
                <MaterialCommunityIcons name={meta.icon as never} size={20} color={meta.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.apptTitle, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
                  {meta.label}
                </Text>
                <Text style={[styles.apptSub, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]} numberOfLines={1}>
                  {formatApptDate(a.dateISO)} at {a.time}
                  {a.reason ? ` · ${a.reason}` : ""}
                </Text>
              </View>
              <Text style={[styles.apptWhen, { color: meta.color, fontFamily: "Inter_600SemiBold" }]}>
                {reminderLabel(a)}
              </Text>
            </TouchableOpacity>
          );
        })
      )}

      {/* ── Communications ── */}
      <Text style={[styles.sectionHeading, { color: colors.foreground, fontFamily: "Inter_700Bold", marginTop: 22 }]}>
        Communications
      </Text>
      {comms.map((c) => (
        <TouchableOpacity
          key={c.key}
          activeOpacity={0.85}
          onPress={c.onPress}
          style={[styles.apptRow, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <View style={[styles.apptIcon, { backgroundColor: c.color + "20" }]}>
            <MaterialCommunityIcons name={c.icon} size={20} color={c.color} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.apptTitle, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>{c.label}</Text>
            <Text style={[styles.apptSub, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>{c.sub}</Text>
          </View>
          <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
        </TouchableOpacity>
      ))}

      {/* ── Find near you (maps) ── */}
      <Text style={[styles.sectionHeading, { color: colors.foreground, fontFamily: "Inter_700Bold", marginTop: 22 }]}>
        Find Near You
      </Text>
      <Text style={[styles.mapNote, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
        Opens your maps app. We'll ask for your location once so results are centred on you — nothing is stored or shared.
      </Text>
      <View style={styles.mapRow}>
        {MAP_TARGETS.map((t) => (
          <TouchableOpacity
            key={t.key}
            activeOpacity={0.85}
            onPress={() => openMapsSearch(t.query)}
            style={[styles.mapBtn, { backgroundColor: t.color + "16", borderColor: t.color + "44" }]}
          >
            <MaterialCommunityIcons name={t.icon} size={24} color={t.color} />
            <Text style={[styles.mapBtnText, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
              {t.label}
            </Text>
            <View style={styles.mapOpenRow}>
              <Feather name="map-pin" size={11} color={t.color} />
              <Text style={[styles.mapOpen, { color: t.color, fontFamily: "Inter_600SemiBold" }]}>Open Map</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => router.push("/(app)/pharmacies")}
        style={[styles.apptRow, { backgroundColor: colors.card, borderColor: colors.border, marginTop: 12 }]}
      >
        <View style={[styles.apptIcon, { backgroundColor: "#22c55e20" }]}>
          <MaterialCommunityIcons name="map-search" size={20} color="#22c55e" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.apptTitle, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
            Pharmacy Finder
          </Text>
          <Text style={[styles.apptSub, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
            Search pharmacies inside the app and share your prescription
          </Text>
        </View>
        <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 16, paddingBottom: 40, gap: 10 },

  sectionHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  sectionHeading: { fontSize: 17, letterSpacing: -0.3 },
  bookBtn: { flexDirection: "row", alignItems: "center", gap: 5, borderRadius: 100, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 7 },
  bookBtnText: { fontSize: 13 },

  card: { borderRadius: 16, borderWidth: 1, padding: 20, alignItems: "center", gap: 6 },
  emptyTitle: { fontSize: 14 },
  emptySub: { fontSize: 12.5, lineHeight: 18, textAlign: "center" },

  apptRow: { flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 14, borderWidth: 1, padding: 14 },
  apptIcon: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  apptTitle: { fontSize: 14 },
  apptSub: { fontSize: 12, marginTop: 2 },
  apptWhen: { fontSize: 11.5, maxWidth: 90, textAlign: "right" },

  mapNote: { fontSize: 12, lineHeight: 17, marginTop: -2 },
  mapRow: { flexDirection: "row", gap: 10 },
  mapBtn: { flex: 1, borderRadius: 14, borderWidth: 1, padding: 12, gap: 6, alignItems: "flex-start" },
  mapBtnText: { fontSize: 12.5, lineHeight: 16 },
  mapOpenRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  mapOpen: { fontSize: 11 },
});
