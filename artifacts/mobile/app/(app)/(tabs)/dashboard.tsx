import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useMemo, useRef, useState } from "react";
import {
  Animated,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import ThemedStatusBar from "@/components/ThemedStatusBar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import HexIcon from "@/components/HexIcon";
import HiveCardBg from "@/components/HoneycombCardBg";
import HiveLogo from "@/components/HiveLogo";
import HoneycombWallpaper from "@/components/HoneycombWallpaper";
import { useAppMode } from "@/context/AppModeContext";
import { useLogoTheme } from "@/context/LogoThemeContext";
import { useSmartDevices } from "@/context/SmartDevicesContext";
import { useColors } from "@/hooks/useColors";

const HEADER_SCROLL_DISTANCE = 48;

type HiveItem = {
  key: string;
  label: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
  color: string;
  route: string;
  title: string;
  body: string;
  linkText: string;
  pilotOnly?: boolean;
};

export default function DashboardScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { prefs } = useLogoTheme();
  const { pilotMode } = useAppMode();
  const { connectedCount, vitalsSummary } = useSmartDevices();
  const liveVitals = vitalsSummary.filter((v) => v.available).slice(0, 2);
  const topPad    = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 + 68 : insets.bottom + 64;

  const scrollY = useRef(new Animated.Value(0)).current;
  const [expandedKey, setExpandedKey] = useState<string | null>(null);

  const headerBgOpacity = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE],
    outputRange: [1, 0.25],
    extrapolate: "clamp",
  });

  const headerBorderOpacity = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE],
    outputRange: [1, 0.25],
    extrapolate: "clamp",
  });

  const HEADER_HEIGHT = 64;
  const HEADER_TOP = topPad;

  const items: HiveItem[] = useMemo(() => {
    const all: HiveItem[] = [
      {
        key: "companion",
        label: "Sarah",
        icon: "account-voice",
        color: "#a78bfa",
        route: "/(app)/companion",
        title: "HIVE Companion",
        body: "Talk with Sarah, your voice companion. Ask about medicines, pain, and health — explained patiently in plain English. Includes the Clinician Translator.",
        linkText: "Start Talking",
        pilotOnly: true,
      },
      {
        key: "comms",
        label: "Comms & Appts",
        icon: "calendar-clock",
        color: "#4F6EF7",
        route: "/(app)/comms-center",
        title: "Communications & Appointments",
        body: "Your appointments, messages, and reminders in one centre — with maps to find pharmacies, GP surgeries, and hospitals near you.",
        linkText: "Open Centre",
      },
      {
        key: "consult",
        label: pilotMode ? "Telemedicine" : "Consultations",
        icon: "video",
        color: "#22c55e",
        route: pilotMode ? "/(app)/telemedicine" : "/(app)/consultation",
        title: pilotMode ? "Telemedicine Portal" : "Consultations",
        body: pilotMode
          ? "Book a video consultation, prepare your handover pack, and join your session with your GP, Physiotherapist, or Specialist."
          : "Video consultations are coming soon. Arrange interpreter support for your appointments in the meantime.",
        linkText: pilotMode ? "Open Portal" : "Learn More",
      },
      {
        key: "healthcard",
        label: "Health Card",
        icon: "shield-account",
        color: "#E5294E",
        route: "/(app)/(tabs)/profile",
        title: "Health Card Portal",
        body: "Emergency QR access to medications and history. Membership grade card, smart device vitals, and falls detection.",
        linkText: "View Portal",
      },
      {
        key: "emergency",
        label: "Emergency Share",
        icon: "shield-alert",
        color: "#dc2626",
        route: "/(app)/emergency-share",
        title: "Emergency Share",
        body: "Give doctors or first responders a time-limited code to see your allergies and medications — only with your consent.",
        linkText: "Open Emergency Share",
      },
      {
        key: "history",
        label: "Medical History",
        icon: "clipboard-pulse",
        color: "#D4A017",
        route: "/(app)/medical-history",
        title: "My Medical History",
        body: "Your conditions, past treatments, and health records — all in one clear place.",
        linkText: "Open Medical History",
      },
      {
        key: "rx",
        label: "Prescriptions",
        icon: "pill",
        color: "#f59e0b",
        route: "/(app)/documents",
        title: "My Prescription Portal",
        body: "Your current prescription and reports — email, print, or hand them to a pharmacy, and find one nearby.",
        linkText: "Open Prescription Portal",
      },
      {
        key: "interpreter",
        label: "Interpreter",
        icon: "translate",
        color: "#06b6d4",
        route: "/(app)/interpreter",
        title: "Live Interpreter",
        body: "Book a professional, confidential interpreter for medical and legal consultations and appointments — in your language.",
        linkText: "Book an Interpreter",
      },
      {
        key: "devices",
        label: "Smart Devices",
        icon: "devices",
        color: "#10b981",
        route: "/(app)/smart-devices",
        title: "Smart Devices",
        body: "Wearables, smart rings, and fitness bands. Live vitals, falls detection, and activity monitoring.",
        linkText: "Manage Devices",
      },
      {
        key: "geriatric",
        label: "Wellbeing",
        icon: "brain",
        color: "#c084fc",
        route: "/(app)/geriatric",
        title: "Memory & Wellbeing",
        body: "Memory and wellbeing check-ins, falls awareness questions, and smart device monitoring for live vitals.",
        linkText: "Open Check-In",
      },
    ];
    return all.filter((i) => !i.pilotOnly || pilotMode);
  }, [pilotMode]);

  // Honeycomb formation: alternating rows of 3 and 2 hexagons.
  const rows: HiveItem[][] = useMemo(() => {
    const out: HiveItem[][] = [];
    let i = 0;
    let three = true;
    while (i < items.length) {
      const take = three ? 3 : 2;
      out.push(items.slice(i, i + take));
      i += take;
      three = !three;
    }
    return out;
  }, [items]);

  const expanded = items.find((i) => i.key === expandedKey) ?? null;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ThemedStatusBar backgroundColor="transparent" translucent />
      <HoneycombWallpaper density={prefs.density} />

      {/* ── Fixed transparent-on-scroll header ── */}
      <View
        style={[
          styles.headerWrap,
          { top: HEADER_TOP, height: HEADER_HEIGHT },
        ]}
        pointerEvents="box-none"
      >
        <Animated.View
          style={[
            StyleSheet.absoluteFillObject,
            {
              backgroundColor: colors.card,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: colors.border,
              opacity: headerBgOpacity,
              marginHorizontal: 16,
            },
          ]}
        />
        <Animated.View
          style={[
            styles.headerContent,
            { opacity: Animated.add(0.55, Animated.multiply(headerBorderOpacity, 0.45)) },
          ]}
        >
          <HiveLogo
            size={22}
            goldIntensity={prefs.goldIntensity}
            depth={prefs.depth}
            textWeight={prefs.textWeight}
            showText={false}
          />
          <View style={{ flex: 1 }}>
            <Text style={[styles.appName, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>HIVE COMPANION</Text>
            <Text style={[styles.appEco, { color: colors.gold, fontFamily: "Inter_600SemiBold" }]}>PATIENT PORTAL</Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push("/(app)/settings")}
            activeOpacity={0.7}
            style={[styles.menuBtn, { backgroundColor: colors.glass, borderColor: colors.glassBorder }]}
          >
            <Feather name="menu" size={18} color={colors.foreground} />
          </TouchableOpacity>
        </Animated.View>
      </View>

      <Animated.ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: HEADER_TOP + HEADER_HEIGHT + 14, paddingBottom: bottomPad + 16 },
        ]}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        {/* Hero Card — HIVE logo + honeycomb */}
        <View style={styles.heroOuter}>
          <LinearGradient colors={["#0e1560", "#1320a0", "#0a0e55"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.heroCard}>
            <HoneycombWallpaper density={prefs.density} />
            <View style={[styles.goldAccentBar, { backgroundColor: colors.gold }]} />
            <View style={styles.heroLogoRow}>
              <HiveLogo
                size={34}
                goldIntensity={prefs.goldIntensity}
                depth={prefs.depth}
                textWeight={prefs.textWeight}
                showText
              />
            </View>
            <View style={styles.heroContent}>
              <Text style={[styles.heroTitle1, { fontFamily: "Inter_700Bold" }]}>Organised Records.</Text>
              <Text style={[styles.heroTitle2, { color: "#D4A017", fontFamily: "Inter_700Bold" }]}>Absolute Security.</Text>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => router.push("/(app)/body-map")}
                style={[styles.heroCta, { backgroundColor: "rgba(0,0,0,0.45)", borderColor: colors.gold + "55" }]}
              >
                <MaterialCommunityIcons name="hand-heart" size={17} color={colors.gold} />
                <Text style={[styles.heroCtaText, { fontFamily: "Inter_600SemiBold", color: "#D4A017" }]}>Do you have pain?</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>

        {/* ── The Hive: honeycomb formation of large 3D icons ── */}
        <View style={styles.hiveWrap}>
          <HiveCardBg />
          {rows.map((row, rIdx) => (
            <View
              key={rIdx}
              style={[styles.hiveRow, rIdx > 0 && styles.hiveRowOverlap]}
            >
              {row.map((item) => (
                <HexIcon
                  key={item.key}
                  icon={item.icon}
                  label={item.label}
                  color={item.color}
                  active={expandedKey === item.key}
                  badge={item.key === "devices" && connectedCount > 0}
                  labelColor={colors.mutedForeground}
                  onPress={() =>
                    setExpandedKey((k) => (k === item.key ? null : item.key))
                  }
                />
              ))}
            </View>
          ))}
          <Text style={[styles.hiveHint, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
            Tap a hexagon to see more
          </Text>
        </View>

        {/* ── Expanded card for the selected hexagon ── */}
        {expanded && (
          <View
            style={[
              styles.sectionCard,
              { backgroundColor: colors.card, borderColor: expanded.color + "55" },
            ]}
          >
            <HiveCardBg gradientColors={[expanded.color + "1A", "rgba(0,0,0,0.12)", "transparent"]} />
            <View style={styles.expandHead}>
              <View style={[styles.sectionIcon, { backgroundColor: expanded.color + "22", borderColor: expanded.color + "55", borderWidth: 1 }]}>
                <MaterialCommunityIcons name={expanded.icon} size={22} color={expanded.color} />
              </View>
              <TouchableOpacity
                onPress={() => setExpandedKey(null)}
                activeOpacity={0.7}
                style={[styles.closeBtn, { backgroundColor: colors.glass, borderColor: colors.glassBorder }]}
                accessibilityLabel="Close"
              >
                <Feather name="x" size={16} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>
            <Text style={[styles.sectionTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
              {expanded.title}
            </Text>
            <Text style={[styles.sectionBody, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              {expanded.body}
            </Text>

            {expanded.key === "devices" && (
              <View style={{ gap: 10 }}>
                <View style={[styles.deviceBadge, { alignSelf: "flex-start", backgroundColor: connectedCount > 0 ? "#22c55e22" : colors.background, borderColor: connectedCount > 0 ? "#22c55e55" : colors.border }]}>
                  <View style={[styles.deviceDot, { backgroundColor: connectedCount > 0 ? "#22c55e" : colors.mutedForeground }]} />
                  <Text style={[styles.deviceBadgeText, { color: connectedCount > 0 ? "#22c55e" : colors.mutedForeground, fontFamily: "Inter_600SemiBold" }]}>
                    {connectedCount > 0 ? `${connectedCount} Connected` : "No Devices"}
                  </Text>
                </View>
                {liveVitals.length > 0 && (
                  <View style={styles.vitalsRow}>
                    {liveVitals.map((v) => (
                      <View
                        key={v.key}
                        style={[styles.vitalChip, { backgroundColor: "#22c55e14", borderColor: "#22c55e33" }]}
                      >
                        <Text style={[styles.vitalValue, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
                          {v.value}
                        </Text>
                        <Text style={[styles.vitalLabel, { color: colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>
                          {v.label} {v.unit !== "today" ? `· ${v.unit}` : ""}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            )}

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => router.push(expanded.route as never)}
              style={[styles.openBtn, { backgroundColor: expanded.color + "22", borderColor: expanded.color + "66" }]}
            >
              <Text style={[styles.sectionLinkText, { color: expanded.color, fontFamily: "Inter_600SemiBold" }]}>
                {expanded.linkText}
              </Text>
              <Feather name="chevron-right" size={15} color={expanded.color} />
            </TouchableOpacity>
          </View>
        )}
      </Animated.ScrollView>

    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: 16, gap: 14 },

  headerWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    zIndex: 10,
    justifyContent: "center",
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 28,
    height: "100%",
  },
  appName: { fontSize: 16, letterSpacing: -0.3 },
  appEco: { fontSize: 9, letterSpacing: 1.6 },
  menuBtn: { borderRadius: 10, borderWidth: 1, padding: 8 },

  heroOuter: { borderRadius: 22, overflow: "hidden" },
  heroCard: { borderRadius: 22, overflow: "hidden", padding: 24, minHeight: 210 },
  goldAccentBar: { position: "absolute", top: 0, left: 0, right: 0, height: 2.5, opacity: 0.85 },
  heroLogoRow: { marginBottom: 14, zIndex: 1 },
  heroContent: { gap: 12, zIndex: 1 },
  heroTitle1: { fontSize: 28, color: "#FFFFFF", letterSpacing: -0.5, lineHeight: 34 },
  heroTitle2: { fontSize: 28, letterSpacing: -0.5, lineHeight: 34, marginTop: -4 },
  heroCta: { flexDirection: "row", alignItems: "center", gap: 9, alignSelf: "flex-start", borderRadius: 100, borderWidth: 1, paddingHorizontal: 20, paddingVertical: 12, marginTop: 4 },
  heroCtaText: { fontSize: 15 },

  hiveWrap: { paddingVertical: 10, borderRadius: 22, overflow: "hidden" },
  hiveRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
  },
  hiveRowOverlap: { marginTop: -18 },
  hiveHint: { textAlign: "center", fontSize: 11.5, marginTop: 10, opacity: 0.8 },

  sectionCard: { borderRadius: 18, borderWidth: 1, padding: 20, gap: 10, overflow: "hidden" },
  sectionIcon: { width: 46, height: 46, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  sectionTitle: { fontSize: 18, letterSpacing: -0.3 },
  sectionBody: { fontSize: 13, lineHeight: 20 },
  sectionLinkText: { fontSize: 14 },

  expandHead: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" },
  closeBtn: { borderRadius: 10, borderWidth: 1, padding: 7 },
  openBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 12,
    marginTop: 4,
  },

  deviceBadge: { flexDirection: "row", alignItems: "center", gap: 6, borderRadius: 20, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 5 },
  deviceDot: { width: 7, height: 7, borderRadius: 4 },
  deviceBadgeText: { fontSize: 12 },

  vitalsRow: { flexDirection: "row", gap: 10, marginTop: 2 },
  vitalChip: { flex: 1, borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 10, gap: 2 },
  vitalValue: { fontSize: 20, letterSpacing: -0.4 },
  vitalLabel: { fontSize: 11, letterSpacing: 0.2 },
});
