import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState } from "react";
import {
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
import { useLogoTheme } from "@/context/LogoThemeContext";
import { useColors } from "@/hooks/useColors";

interface Device {
  id: string;
  name: string;
  brand: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  connected: boolean;
  reading: string;
  readingLabel: string;
  category: "rings" | "bands" | "watches";
}

const INITIAL_DEVICES: Device[] = [
  { id: "oura",    name: "Oura Ring Gen 3",     brand: "Oura",    icon: "ring",         connected: false, reading: "—", readingLabel: "HRV ms",    category: "rings" },
  { id: "xring",   name: "Xiaomi Smart Ring",   brand: "Xiaomi",  icon: "ring",         connected: false, reading: "—", readingLabel: "SpO₂ %",    category: "rings" },
  { id: "sring",   name: "Samsung Galaxy Ring", brand: "Samsung", icon: "ring",         connected: false, reading: "—", readingLabel: "HR bpm",     category: "rings" },
  { id: "miband",  name: "Xiaomi Mi Band 8",    brand: "Xiaomi",  icon: "watch",        connected: false, reading: "—", readingLabel: "Steps",      category: "bands" },
  { id: "huaband", name: "Huawei Band 8",       brand: "Huawei",  icon: "watch",        connected: false, reading: "—", readingLabel: "SpO₂ %",    category: "bands" },
  { id: "honor",   name: "HONOR Band 7",        brand: "HONOR",   icon: "watch",        connected: false, reading: "—", readingLabel: "HR bpm",     category: "bands" },
  { id: "apple",   name: "Apple Watch Series 9",brand: "Apple",   icon: "watch-variant",connected: false, reading: "—", readingLabel: "ECG ready",  category: "watches" },
  { id: "huagt4",  name: "Huawei Watch GT 4",   brand: "Huawei",  icon: "watch-variant",connected: false, reading: "—", readingLabel: "HR bpm",     category: "watches" },
];

const FAKE_READINGS: Record<string, string> = {
  oura: "48", xring: "97", sring: "71",
  miband: "4,830", huaband: "98", honor: "74",
  apple: "Ready", huagt4: "68",
};

const CATEGORY_META: Record<Device["category"], { label: string; icon: keyof typeof MaterialCommunityIcons.glyphMap; color: string }> = {
  rings:   { label: "SMART RINGS",   icon: "ring",         color: "#a78bfa" },
  bands:   { label: "WRIST BANDS",   icon: "watch",        color: "#22c55e" },
  watches: { label: "SMARTWATCHES",  icon: "watch-variant",color: "#4F6EF7" },
};

export default function SmartDevicesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { prefs } = useLogoTheme();
  const topPad = Platform.OS === "web" ? 0 : insets.top;

  const [devices, setDevices] = useState<Device[]>(INITIAL_DEVICES);

  function toggleDevice(id: string) {
    Haptics.selectionAsync();
    setDevices((prev) =>
      prev.map((d) => {
        if (d.id !== id) return d;
        const connected = !d.connected;
        return { ...d, connected, reading: connected ? FAKE_READINGS[id] : "—" };
      })
    );
  }

  const connectedCount = devices.filter((d) => d.connected).length;
  const categories: Device["category"][] = ["rings", "bands", "watches"];

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ThemedStatusBar />
      <HoneycombWallpaper density={prefs.density} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 12, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <Feather name="arrow-left" size={20} color={colors.foreground} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
            Smart Devices
          </Text>
          <Text style={[styles.headerSub, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
            Wearables · Bands · Smart rings
          </Text>
        </View>
        <MaterialCommunityIcons name="devices" size={26} color="#22c55e" />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Hero */}
        <LinearGradient colors={["#0a2818", "#0d0d1a"]} style={styles.hero}>
          <MaterialCommunityIcons name="devices" size={36} color="#22c55e" />
          <Text style={[styles.heroTitle, { color: "#fff", fontFamily: "Inter_700Bold" }]}>Smart Device Hub</Text>
          <Text style={[styles.heroSub, { color: "rgba(255,255,255,0.6)", fontFamily: "Inter_400Regular" }]}>
            Connect wearables for live vitals,{"\n"}fall detection, and activity monitoring
          </Text>
          <View style={[styles.connectedBadge, { backgroundColor: "#22c55e22", borderColor: "#22c55e55" }]}>
            <Text style={[styles.connectedBadgeText, { color: "#22c55e", fontFamily: "Inter_600SemiBold" }]}>
              {connectedCount} / {devices.length} Connected
            </Text>
          </View>
        </LinearGradient>

        {/* Live Readings grid — only when something is connected */}
        {connectedCount > 0 && (
          <>
            <Text style={[styles.groupLabel, { color: colors.mutedForeground }]}>LIVE READINGS</Text>
            <View style={styles.readingsGrid}>
              {[
                { label: "Heart Rate",    value: "72",   unit: "bpm",   icon: "heart-pulse"    as const, color: "#ef4444" },
                { label: "SpO₂",          value: "97",   unit: "%",     icon: "water-percent"  as const, color: "#4F6EF7" },
                { label: "Steps Today",   value: "4,830",unit: "steps", icon: "shoe-sneaker"   as const, color: "#22c55e" },
                { label: "Falls Detected",value: "0",    unit: "today", icon: "alert-circle"   as const, color: "#f59e0b" },
              ].map((r) => (
                <LinearGradient
                  key={r.label}
                  colors={[r.color + "22", r.color + "11"]}
                  style={[styles.readingCard, { borderColor: r.color + "44" }]}
                >
                  <MaterialCommunityIcons name={r.icon} size={22} color={r.color} />
                  <Text style={[styles.readingValue, { color: r.color, fontFamily: "Inter_700Bold" }]}>{r.value}</Text>
                  <Text style={[styles.readingUnit, { color: "rgba(255,255,255,0.5)", fontFamily: "Inter_400Regular" }]}>{r.unit}</Text>
                  <Text style={[styles.readingLabel, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>{r.label}</Text>
                </LinearGradient>
              ))}
            </View>
          </>
        )}

        {/* Device list grouped by category */}
        {categories.map((cat) => {
          const meta = CATEGORY_META[cat];
          const group = devices.filter((d) => d.category === cat);
          return (
            <View key={cat}>
              <View style={styles.categoryHeader}>
                <MaterialCommunityIcons name={meta.icon} size={15} color={meta.color} />
                <Text style={[styles.groupLabel, { color: meta.color, marginBottom: 0, marginLeft: 6 }]}>{meta.label}</Text>
              </View>

              {group.map((d) => (
                <View key={d.id} style={[styles.deviceCard, { backgroundColor: colors.card, borderColor: d.connected ? "#22c55e55" : colors.border }]}>
                  <View style={[styles.deviceIcon, { backgroundColor: d.connected ? "#0a2818" : colors.cardElevated }]}>
                    <MaterialCommunityIcons name={d.icon} size={20} color={d.connected ? "#22c55e" : colors.mutedForeground} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.deviceName, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>{d.name}</Text>
                    <Text style={[styles.deviceBrand, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                      {d.brand} · {d.connected ? `● Connected · ${d.reading} ${d.readingLabel}` : "○ Not paired"}
                    </Text>
                  </View>
                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() => toggleDevice(d.id)}
                    style={[styles.connectBtn, {
                      backgroundColor: d.connected ? "#0a2818" : "#0f1a5a",
                      borderColor: d.connected ? "#22c55e55" : colors.primary + "55",
                    }]}
                  >
                    <Text style={[styles.connectBtnText, { color: d.connected ? "#22c55e" : colors.primary, fontFamily: "Inter_600SemiBold" }]}>
                      {d.connected ? "Disconnect" : "Pair"}
                    </Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          );
        })}

        {/* Fall Detection status card */}
        <View style={[styles.fallCard, { backgroundColor: "#2a1218", borderColor: colors.accent + "55" }]}>
          <MaterialCommunityIcons name="alert-circle" size={20} color={colors.accent} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.fallTitle, { color: colors.accent, fontFamily: "Inter_700Bold" }]}>Fall Detection</Text>
            <Text style={[styles.fallSub, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              {connectedCount > 0
                ? "Active — automatic SOS triggered if fall detected. No falls logged today."
                : "Connect a compatible wearable to enable automatic fall detection and SOS alerting."}
            </Text>
          </View>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row", alignItems: "center", gap: 14,
    paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 1,
  },
  backBtn: { padding: 6 },
  headerTitle: { fontSize: 17, letterSpacing: -0.3 },
  headerSub: { fontSize: 11, marginTop: 2 },
  scroll: { padding: 16, gap: 12, paddingBottom: 40 },

  hero: {
    borderRadius: 18, padding: 24,
    alignItems: "center", gap: 8,
  },
  heroTitle: { fontSize: 20, letterSpacing: -0.5, marginTop: 4 },
  heroSub: { fontSize: 13, textAlign: "center", lineHeight: 20 },
  connectedBadge: {
    marginTop: 8, borderRadius: 20, borderWidth: 1,
    paddingHorizontal: 16, paddingVertical: 6,
  },
  connectedBadgeText: { fontSize: 13 },

  groupLabel: {
    fontSize: 10, fontFamily: "Inter_600SemiBold",
    letterSpacing: 1.4, marginBottom: 8,
  },
  categoryHeader: {
    flexDirection: "row", alignItems: "center",
    marginTop: 8, marginBottom: 4,
  },

  readingsGrid: {
    flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 8,
  },
  readingCard: {
    flex: 1, minWidth: "44%", borderRadius: 14, borderWidth: 1,
    padding: 14, alignItems: "center", gap: 4,
  },
  readingValue: { fontSize: 22, letterSpacing: -0.5 },
  readingUnit: { fontSize: 11 },
  readingLabel: { fontSize: 11, textAlign: "center" },

  deviceCard: {
    flexDirection: "row", alignItems: "center", gap: 12,
    borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 8,
  },
  deviceIcon: {
    width: 42, height: 42, borderRadius: 12,
    alignItems: "center", justifyContent: "center",
  },
  deviceName: { fontSize: 14 },
  deviceBrand: { fontSize: 12, marginTop: 2 },
  connectBtn: {
    borderRadius: 10, borderWidth: 1,
    paddingHorizontal: 14, paddingVertical: 8,
  },
  connectBtnText: { fontSize: 13 },

  fallCard: {
    flexDirection: "row", alignItems: "flex-start", gap: 12,
    borderRadius: 14, borderWidth: 1, padding: 16, marginTop: 4,
  },
  fallTitle: { fontSize: 14, marginBottom: 4 },
  fallSub: { fontSize: 12, lineHeight: 18 },
});
