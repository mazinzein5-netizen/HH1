import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useRef, useState } from "react";
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
import { useSmartDevices } from "@/context/SmartDevicesContext";
import { useLogoTheme } from "@/context/LogoThemeContext";
import { useAppMode } from "@/context/AppModeContext";
import { useHealthMonitor } from "@/context/HealthMonitorContext";
import { availabilityLabel, VENDOR_BRIDGES } from "@/utils/healthBridges";
import { useColors } from "@/hooks/useColors";

type Category = "rings" | "watches" | "cgm";

const CATEGORY_META: Record<Category, {
  label: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  color: string;
  description: string;
}> = {
  rings: {
    label: "SMART RINGS",
    icon: "ring",
    color: "#a78bfa",
    description: "HRV, SpO₂ & skin temperature — early metabolic & dehydration signals",
  },
  watches: {
    label: "HEALTH WEARABLES",
    icon: "watch-variant",
    color: "#4F6EF7",
    description: "ECG, blood pressure & biometric monitoring",
  },
  cgm: {
    label: "GLUCOSE MONITORS",
    icon: "water-percent",
    color: "#f59e0b",
    description: "Continuous glucose — real-time diabetic early warnings",
  },
};

const CATEGORIES: Category[] = ["rings", "watches", "cgm"];

export default function SmartDevicesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { prefs } = useLogoTheme();
  const topPad = Platform.OS === "web" ? 0 : insets.top;

  const { devices, connectedCount, toggleDevice } = useSmartDevices();
  const scrollRef = useRef<ScrollView>(null);
  const categoryYs = useRef<Partial<Record<Category, number>>>({});
  const [highlightedCategory, setHighlightedCategory] = useState<Category | null>(null);
  const highlightTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function goToCategory(cat: Category) {
    Haptics.selectionAsync();
    const y = categoryYs.current[cat];
    if (y != null) {
      scrollRef.current?.scrollTo({ y: Math.max(y - 12, 0), animated: true });
    }
    if (highlightTimer.current) clearTimeout(highlightTimer.current);
    setHighlightedCategory(cat);
    highlightTimer.current = setTimeout(() => setHighlightedCategory(null), 2200);
  }

  const { pilotMode } = useAppMode();
  const {
    monitoringActive,
    alertHistory,
    bridgeStates,
    connectBridge,
    disconnectBridge,
    triggerDemoFall,
    clearHistory,
  } = useHealthMonitor();

  const connected = devices.filter((d) => d.connected);
  const hrDevice = connected.find((d) => d.readingLabel === "HR bpm");
  const spo2Device = connected.find((d) => d.readingLabel === "SpO₂ %");
  const cgmDevice = connected.find((d) => d.category === "cgm");
  const fallDevice = connected.find((d) => d.capabilities.includes("Fall Detection"));

  const liveReadings: {
    label: string;
    value: string;
    unit: string;
    icon: keyof typeof MaterialCommunityIcons.glyphMap;
    color: string;
    hint?: { text: string; category: Category };
  }[] = [
    {
      label: "Heart Rate",
      value: hrDevice ? hrDevice.reading : "—",
      unit: hrDevice ? "bpm" : "no device",
      icon: "heart-pulse",
      color: "#ef4444",
      hint: hrDevice ? undefined : { text: "Pair a smart ring", category: "rings" },
    },
    {
      label: "SpO₂",
      value: spo2Device ? spo2Device.reading : "—",
      unit: spo2Device ? "%" : "no device",
      icon: "water-percent",
      color: "#4F6EF7",
      hint: spo2Device ? undefined : { text: "Pair a wearable", category: "watches" },
    },
    {
      label: "Blood Glucose",
      value: cgmDevice ? cgmDevice.reading : "—",
      unit: cgmDevice ? cgmDevice.readingLabel : "no device",
      icon: "water-percent",
      color: "#f59e0b",
      hint: cgmDevice ? undefined : { text: "Pair a glucose monitor", category: "cgm" },
    },
    {
      label: "Falls Detected",
      value: fallDevice ? "0" : "—",
      unit: fallDevice ? "today" : "no device",
      icon: "alert-circle",
      color: "#22c55e",
      hint: fallDevice ? undefined : { text: "Pair a wearable", category: "watches" },
    },
  ];

  function handleToggle(id: string) {
    Haptics.selectionAsync();
    toggleDevice(id);
  }

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
            ECG · Blood Pressure · CGM · HRV
          </Text>
        </View>
        <MaterialCommunityIcons name="devices" size={26} color="#22c55e" />
      </View>

      <ScrollView ref={scrollRef} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Hero */}
        <LinearGradient colors={["#0a2818", "#0d0d1a"]} style={styles.hero}>
          <MaterialCommunityIcons name="devices" size={36} color="#22c55e" />
          <Text style={[styles.heroTitle, { color: "#fff", fontFamily: "Inter_700Bold" }]}>Smart Device Hub</Text>
          <Text style={[styles.heroSub, { color: "rgba(255,255,255,0.6)", fontFamily: "Inter_400Regular" }]}>
            Health wearables with real-time ECG,{"\n"}BP, glucose, and metabolic monitoring
          </Text>
          <View style={[styles.connectedBadge, { backgroundColor: "#22c55e22", borderColor: "#22c55e55" }]}>
            <Text style={[styles.connectedBadgeText, { color: "#22c55e", fontFamily: "Inter_600SemiBold" }]}>
              {connectedCount} / {devices.length} Connected
            </Text>
          </View>
        </LinearGradient>

        {/* Capability legend */}
        <View style={[styles.legendRow, { borderColor: colors.border }]}>
          {[
            { icon: "heart-pulse"   as const, label: "ECG / Arrhythmia",  color: "#ef4444" },
            { icon: "gauge"         as const, label: "Blood Pressure",     color: "#4F6EF7" },
            { icon: "water-percent" as const, label: "Glucose (CGM)",      color: "#f59e0b" },
            { icon: "thermometer"   as const, label: "Metabolic / Temp",   color: "#a78bfa" },
          ].map((item) => (
            <View key={item.label} style={styles.legendItem}>
              <MaterialCommunityIcons name={item.icon} size={14} color={item.color} />
              <Text style={[styles.legendText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>{item.label}</Text>
            </View>
          ))}
        </View>

        {/* Live Readings grid — only when something is connected */}
        {connectedCount > 0 && (
          <>
            <Text style={[styles.groupLabel, { color: colors.mutedForeground }]}>LIVE READINGS</Text>
            <View style={styles.readingsGrid}>
              {liveReadings.map((r) => (
                <TouchableOpacity
                  key={r.label}
                  activeOpacity={r.hint ? 0.8 : 1}
                  disabled={!r.hint}
                  onPress={r.hint ? () => goToCategory(r.hint!.category) : undefined}
                  style={styles.readingCardWrap}
                >
                  <LinearGradient
                    colors={[r.color + "22", r.color + "11"]}
                    style={[styles.readingCard, { borderColor: r.color + "44" }]}
                  >
                    <MaterialCommunityIcons name={r.icon} size={22} color={r.color} />
                    <Text style={[styles.readingValue, { color: r.color, fontFamily: "Inter_700Bold" }]}>{r.value}</Text>
                    <Text style={[styles.readingUnit, { color: "rgba(255,255,255,0.5)", fontFamily: "Inter_400Regular" }]}>{r.unit}</Text>
                    <Text style={[styles.readingLabel, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>{r.label}</Text>
                    {r.hint && (
                      <View style={[styles.hintPill, { borderColor: CATEGORY_META[r.hint.category].color + "66", backgroundColor: CATEGORY_META[r.hint.category].color + "1a" }]}>
                        <MaterialCommunityIcons
                          name={CATEGORY_META[r.hint.category].icon}
                          size={11}
                          color={CATEGORY_META[r.hint.category].color}
                        />
                        <Text style={[styles.hintText, { color: CATEGORY_META[r.hint.category].color, fontFamily: "Inter_600SemiBold" }]}>
                          {r.hint.text}
                        </Text>
                      </View>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {/* Device list grouped by category */}
        {CATEGORIES.map((cat) => {
          const meta = CATEGORY_META[cat];
          const group = devices.filter((d) => d.category === cat);
          const highlighted = highlightedCategory === cat;
          return (
            <View
              key={cat}
              onLayout={(e) => { categoryYs.current[cat] = e.nativeEvent.layout.y; }}
            >
              <View style={[styles.categoryHeader, {
                borderColor: highlighted ? meta.color : meta.color + "33",
                backgroundColor: highlighted ? meta.color + "26" : meta.color + "0d",
                borderWidth: highlighted ? 2 : 1,
              }]}>
                <MaterialCommunityIcons name={meta.icon} size={15} color={meta.color} />
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text style={[styles.groupLabel, { color: meta.color, marginBottom: 1 }]}>{meta.label}</Text>
                  <Text style={[styles.categoryDesc, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>{meta.description}</Text>
                </View>
              </View>

              {group.map((d) => (
                <View key={d.id} style={[styles.deviceCard, { backgroundColor: colors.card, borderColor: d.connected ? "#22c55e55" : colors.border }]}>
                  <View style={[styles.deviceIcon, { backgroundColor: d.connected ? "#0a2818" : colors.cardElevated }]}>
                    <MaterialCommunityIcons
                      name={d.icon as keyof typeof MaterialCommunityIcons.glyphMap}
                      size={20}
                      color={d.connected ? "#22c55e" : colors.mutedForeground}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.deviceName, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>{d.name}</Text>
                    <Text style={[styles.deviceBrand, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                      {d.brand}
                    </Text>
                    {d.connected ? (
                      <Text style={[styles.deviceReading, { color: "#22c55e", fontFamily: "Inter_600SemiBold" }]}>
                        ● {d.reading} {d.readingLabel}
                      </Text>
                    ) : (
                      <Text style={[styles.deviceCaps, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                        {d.capabilities}
                      </Text>
                    )}
                  </View>
                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() => handleToggle(d.id)}
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
                : "Connect a compatible wearable (Apple Watch, Samsung Galaxy Watch) to enable automatic fall detection and SOS alerting."}
            </Text>
          </View>
        </View>

        {/* ── Health Platform Monitoring — pilot mode only ─────────────────── */}
        {pilotMode && (
          <>
            <Text style={[styles.groupLabel, { color: "#f59e0b", marginTop: 10 }]}>
              HEALTH PLATFORM MONITORING · PILOT
            </Text>

            {/* Monitoring status */}
            <View style={[styles.pilotCard, { backgroundColor: colors.card, borderColor: monitoringActive ? "#22c55e55" : colors.border }]}>
              <MaterialCommunityIcons
                name={monitoringActive ? "shield-check" : "shield-outline"}
                size={22}
                color={monitoringActive ? "#22c55e" : colors.mutedForeground}
              />
              <View style={{ flex: 1 }}>
                <Text style={[styles.pilotCardTitle, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
                  {monitoringActive ? "Monitoring active" : "Monitoring paused"}
                </Text>
                <Text style={[styles.pilotCardBody, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                  {monitoringActive
                    ? "Falls, heart rate, SpO₂, ECG changes and glucose are being watched. A full-screen alert appears if a danger signal is detected."
                    : "Connect at least one device above to start watching for falls and dangerous vital changes."}
                </Text>
              </View>
            </View>

            {/* Platform bridges */}
            {VENDOR_BRIDGES.map((b) => {
              const avail = b.availability();
              const ready = avail === "available";
              const state = bridgeStates[b.id] ?? { connected: false, connecting: false, error: null };
              return (
                <View key={b.id} style={[styles.pilotCard, { backgroundColor: colors.card, borderColor: state.connected ? "#22c55e55" : colors.border }]}>
                  <MaterialCommunityIcons
                    name={b.icon as keyof typeof MaterialCommunityIcons.glyphMap}
                    size={22}
                    color={state.connected || ready ? "#22c55e" : colors.mutedForeground}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.pilotCardTitle, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>{b.name}</Text>
                    <Text style={[styles.pilotCardBody, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>{b.description}</Text>
                    <Text style={[styles.pilotSignals, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                      Signals: {b.signals.map((s) => s.label).join(" · ")}
                    </Text>
                    {state.error && (
                      <Text style={[styles.pilotSignals, { color: "#f59e0b", fontFamily: "Inter_400Regular" }]}>
                        {state.error}
                      </Text>
                    )}
                  </View>
                  {state.connected ? (
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => { disconnectBridge(b.id).catch(() => {}); }}
                      style={[styles.pilotBadge, { borderColor: "#22c55e55", backgroundColor: "#22c55e18" }]}
                    >
                      <Text style={[styles.pilotBadgeText, { color: "#22c55e", fontFamily: "Inter_600SemiBold" }]}>
                        Connected · Disconnect
                      </Text>
                    </TouchableOpacity>
                  ) : ready ? (
                    <TouchableOpacity
                      activeOpacity={0.8}
                      disabled={state.connecting}
                      onPress={() => { connectBridge(b.id).catch(() => {}); }}
                      style={[styles.pilotBadge, { borderColor: "#22c55e55", backgroundColor: "#22c55e18" }]}
                    >
                      <Text style={[styles.pilotBadgeText, { color: "#22c55e", fontFamily: "Inter_600SemiBold" }]}>
                        {state.connecting ? "Connecting…" : "Connect"}
                      </Text>
                    </TouchableOpacity>
                  ) : (
                    <View style={[styles.pilotBadge, { borderColor: colors.border, backgroundColor: "transparent" }]}>
                      <Text style={[styles.pilotBadgeText, { color: colors.mutedForeground, fontFamily: "Inter_600SemiBold" }]}>
                        {availabilityLabel(avail)}
                      </Text>
                    </View>
                  )}
                </View>
              );
            })}

            {/* Demo fall trigger */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                triggerDemoFall();
              }}
              style={[styles.demoBtn, { borderColor: "#ef444455", backgroundColor: "#ef44441a" }]}
            >
              <MaterialCommunityIcons name="human-handsdown" size={18} color="#ef4444" />
              <Text style={[styles.demoBtnText, { color: "#ef4444", fontFamily: "Inter_600SemiBold" }]}>
                Simulate a fall (demo)
              </Text>
            </TouchableOpacity>

            {/* Recent alerts */}
            {alertHistory.length > 0 && (
              <>
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 8 }}>
                  <Text style={[styles.groupLabel, { color: colors.mutedForeground }]}>RECENT ALERTS</Text>
                  <TouchableOpacity onPress={clearHistory} activeOpacity={0.7}>
                    <Text style={[styles.clearLink, { color: colors.mutedForeground, fontFamily: "Inter_600SemiBold" }]}>Clear</Text>
                  </TouchableOpacity>
                </View>
                {alertHistory.slice(0, 10).map((a) => (
                  <View key={a.id} style={[styles.pilotCard, { backgroundColor: colors.card, borderColor: a.severity === "critical" ? "#ef444444" : "#f59e0b44" }]}>
                    <MaterialCommunityIcons
                      name={a.signal === "fall" ? "human-handsdown" : "heart-pulse"}
                      size={20}
                      color={a.severity === "critical" ? "#ef4444" : "#f59e0b"}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.pilotCardTitle, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>{a.title}</Text>
                      <Text style={[styles.pilotCardBody, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                        {a.aiExplanation ?? a.detail}
                      </Text>
                      <Text style={[styles.pilotSignals, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                        {new Date(a.ts).toLocaleString()} · {a.source} ·{" "}
                        {a.status === "ok" ? "Marked OK" : a.status === "escalated" ? "Escalated" : "Active"}
                      </Text>
                    </View>
                  </View>
                ))}
              </>
            )}
          </>
        )}

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

  legendRow: {
    flexDirection: "row", flexWrap: "wrap", gap: 10,
    borderRadius: 12, borderWidth: 1,
    padding: 12,
  },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 5, minWidth: "44%" },
  legendText: { fontSize: 11 },

  groupLabel: {
    fontSize: 10, fontFamily: "Inter_600SemiBold",
    letterSpacing: 1.4, marginBottom: 2,
  },
  categoryHeader: {
    flexDirection: "row", alignItems: "flex-start",
    borderRadius: 10, borderWidth: 1,
    paddingHorizontal: 12, paddingVertical: 10,
    marginTop: 6, marginBottom: 8,
  },
  categoryDesc: { fontSize: 11, lineHeight: 16 },

  readingsGrid: {
    flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 8,
  },
  readingCardWrap: {
    flex: 1, minWidth: "44%",
  },
  readingCard: {
    flex: 1, borderRadius: 14, borderWidth: 1,
    padding: 14, alignItems: "center", gap: 4,
  },
  hintPill: {
    flexDirection: "row", alignItems: "center", gap: 4,
    borderRadius: 20, borderWidth: 1,
    paddingHorizontal: 8, paddingVertical: 3, marginTop: 4,
  },
  hintText: { fontSize: 10 },
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
  deviceBrand: { fontSize: 12, marginTop: 1 },
  deviceCaps: { fontSize: 11, marginTop: 3, lineHeight: 16 },
  deviceReading: { fontSize: 12, marginTop: 3 },
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

  pilotCard: {
    flexDirection: "row", alignItems: "flex-start", gap: 12,
    borderRadius: 14, borderWidth: 1, padding: 14,
  },
  pilotCardTitle: { fontSize: 14 },
  pilotCardBody: { fontSize: 12, lineHeight: 17, marginTop: 2 },
  pilotSignals: { fontSize: 10.5, marginTop: 4 },
  pilotBadge: { borderRadius: 8, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 4 },
  pilotBadgeText: { fontSize: 10 },
  demoBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    borderRadius: 12, borderWidth: 1, paddingVertical: 13,
  },
  demoBtnText: { fontSize: 14 },
  clearLink: { fontSize: 11 },
});
