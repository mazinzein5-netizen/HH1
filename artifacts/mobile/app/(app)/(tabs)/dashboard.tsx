import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useRef } from "react";
import {
  Animated,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import ThemedStatusBar from "@/components/ThemedStatusBar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import HiveCardBg from "@/components/HoneycombCardBg";
import HiveLogo from "@/components/HiveLogo";
import HoneycombWallpaper from "@/components/HoneycombWallpaper";
import { useHiveBot } from "@/context/HiveBotContext";
import { useLogoTheme } from "@/context/LogoThemeContext";
import { useSmartDevices } from "@/context/SmartDevicesContext";
import { useColors } from "@/hooks/useColors";

const HEADER_SCROLL_DISTANCE = 48;

export default function DashboardScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { prefs } = useLogoTheme();
  const hiveBot   = useHiveBot();
  const { connectedCount, devices } = useSmartDevices();
  const liveVitals = devices.filter((d) => d.connected).slice(0, 2);
  const topPad    = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 + 68 : insets.bottom + 64;

  const scrollY = useRef(new Animated.Value(0)).current;

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
            <Text style={[styles.appName, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>HIVE INTAKE</Text>
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
              <Text style={[styles.heroTitle2, { color: colors.goldLight, fontFamily: "Inter_700Bold" }]}>Absolute Security.</Text>
              <Text style={[styles.heroBody, { fontFamily: "Inter_400Regular" }]}>
                Keep your health information organised, complete standardised questionnaires to share with your GP, and give first responders instant access to your emergency health card.
              </Text>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => router.push("/(app)/(tabs)/triage")}
                style={[styles.heroCta, { backgroundColor: "rgba(0,0,0,0.45)", borderColor: colors.gold + "55" }]}
              >
                <MaterialCommunityIcons name="clipboard-text" size={17} color={colors.gold} />
                <Text style={[styles.heroCtaText, { fontFamily: "Inter_600SemiBold", color: colors.goldLight }]}>Start Health Questionnaire</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>

        {/* HIVE Bot card */}
        <TouchableOpacity
          activeOpacity={0.88}
          onPress={() => hiveBot.open()}
          style={[styles.sectionCard, { borderColor: colors.gold + "44" }]}
        >
          <LinearGradient colors={["#1a1200", "#2a1e00"]} style={StyleSheet.absoluteFillObject} borderRadius={18} />
          <HiveCardBg gradientColors={["rgba(201,134,10,0.18)", "rgba(0,0,0,0.10)", "transparent"]} />
          <View style={[styles.sectionIcon, { backgroundColor: "rgba(201,134,10,0.18)", borderColor: "rgba(201,134,10,0.4)", borderWidth: 1 }]}>
            <MaterialCommunityIcons name="robot-happy" size={22} color={colors.gold} />
          </View>
          <Text style={[styles.sectionTitle, { color: "#fff", fontFamily: "Inter_700Bold" }]}>HIVE Bot</Text>
          <Text style={[styles.sectionBody, { color: "rgba(255,255,255,0.6)", fontFamily: "Inter_400Regular" }]}>
            Look up HSE and NICE health guideline information in plain English, any time.
          </Text>
          <View style={styles.sectionLink}>
            <View style={[styles.liveDot, { backgroundColor: colors.goldBright }]} />
            <Text style={[styles.sectionLinkText, { color: colors.goldLight, fontFamily: "Inter_600SemiBold" }]}>Ask HIVE Bot</Text>
            <Feather name="chevron-right" size={14} color={colors.goldLight} />
          </View>
        </TouchableOpacity>

        {/* Live Consultation */}
        <TouchableOpacity activeOpacity={0.88} onPress={() => router.push("/(app)/consultation")}>
          <LinearGradient colors={["#071a10", "#0a2818"]} style={[styles.sectionCard, { borderColor: "#22c55e33" }]}>
            <HiveCardBg gradientColors={["rgba(139,94,0,0.14)", "rgba(0,0,0,0.22)", "transparent"]} />
            <View style={[styles.sectionIcon, { backgroundColor: "rgba(34,197,94,0.15)", borderColor: "rgba(34,197,94,0.3)", borderWidth: 1 }]}>
              <MaterialCommunityIcons name="video" size={22} color="#22c55e" />
            </View>
            <Text style={[styles.sectionTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>Live Consultation</Text>
            <Text style={[styles.sectionBody, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              Book or join a HiEmotion telemedicine appointment with your GP, Physiotherapist, or Specialist.
            </Text>
            <View style={styles.sectionLink}>
              <View style={[styles.liveDot, { backgroundColor: "#22c55e" }]} />
              <Text style={[styles.sectionLinkText, { color: "#22c55e", fontFamily: "Inter_600SemiBold" }]}>Book Now</Text>
              <Feather name="chevron-right" size={14} color="#22c55e" />
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {/* Health Questionnaires */}
        <TouchableOpacity
          activeOpacity={0.88}
          onPress={() => router.push("/(app)/(tabs)/triage")}
          style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <HiveCardBg />
          <View style={[styles.sectionIcon, { backgroundColor: colors.glassPrimary, borderColor: colors.glassPrimaryBorder, borderWidth: 1 }]}>
            <MaterialCommunityIcons name="waveform" size={22} color={colors.primary} />
          </View>
          <Text style={[styles.sectionTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>Health Questionnaires</Text>
          <Text style={[styles.sectionBody, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
            Standardised questionnaires — ODI (Lumbar), mJOA (Cervical), Oxford Hip & Knee — with a summary you can share with your GP.
          </Text>
          <View style={styles.sectionLink}>
            <Text style={[styles.sectionLinkText, { color: colors.primary, fontFamily: "Inter_600SemiBold" }]}>Open Questionnaires</Text>
            <Feather name="chevron-right" size={14} color={colors.primary} />
          </View>
        </TouchableOpacity>

        {/* Health Card */}
        <TouchableOpacity
          activeOpacity={0.88}
          onPress={() => router.push("/(app)/(tabs)/profile")}
          style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <HiveCardBg />
          <View style={[styles.sectionIcon, { backgroundColor: colors.emergencyBg, borderColor: colors.emergencyBorder + "88", borderWidth: 1 }]}>
            <MaterialCommunityIcons name="shield-account" size={22} color={colors.accent} />
          </View>
          <Text style={[styles.sectionTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>Health Card Portal</Text>
          <Text style={[styles.sectionBody, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
            Emergency QR access to medications and history. Membership grade card, smart device vitals, and falls detection.
          </Text>
          <View style={styles.sectionLink}>
            <Text style={[styles.sectionLinkText, { color: colors.accent, fontFamily: "Inter_600SemiBold" }]}>View Portal</Text>
            <Feather name="chevron-right" size={14} color={colors.accent} />
          </View>
        </TouchableOpacity>

        {/* Smart Devices shortcut */}
        <TouchableOpacity
          activeOpacity={0.88}
          onPress={() => router.push("/(app)/smart-devices")}
          style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: "#22c55e33" }]}
        >
          <HiveCardBg gradientColors={["rgba(34,197,94,0.10)", "rgba(0,0,0,0.12)", "transparent"]} />
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <View style={[styles.sectionIcon, { backgroundColor: "rgba(34,197,94,0.12)", borderColor: "rgba(34,197,94,0.28)", borderWidth: 1 }]}>
              <MaterialCommunityIcons name="devices" size={22} color="#22c55e" />
            </View>
            <View style={[styles.deviceBadge, { backgroundColor: connectedCount > 0 ? "#22c55e22" : "rgba(255,255,255,0.06)", borderColor: connectedCount > 0 ? "#22c55e55" : "rgba(255,255,255,0.12)" }]}>
              <View style={[styles.deviceDot, { backgroundColor: connectedCount > 0 ? "#22c55e" : "rgba(255,255,255,0.25)" }]} />
              <Text style={[styles.deviceBadgeText, { color: connectedCount > 0 ? "#22c55e" : colors.mutedForeground, fontFamily: "Inter_600SemiBold" }]}>
                {connectedCount > 0 ? `${connectedCount} Connected` : "No Devices"}
              </Text>
            </View>
          </View>
          <Text style={[styles.sectionTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>Smart Devices</Text>
          <Text style={[styles.sectionBody, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
            Wearables, smart rings, and fitness bands. Live vitals, falls detection, and activity monitoring.
          </Text>
          {liveVitals.length > 0 && (
            <View style={styles.vitalsRow}>
              {liveVitals.map((d) => (
                <View
                  key={d.id}
                  style={[styles.vitalChip, { backgroundColor: "#22c55e14", borderColor: "#22c55e33" }]}
                >
                  <Text style={[styles.vitalValue, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
                    {d.reading}
                  </Text>
                  <Text style={[styles.vitalLabel, { color: colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>
                    {d.readingLabel}
                  </Text>
                </View>
              ))}
            </View>
          )}
          <View style={styles.sectionLink}>
            <Text style={[styles.sectionLinkText, { color: "#22c55e", fontFamily: "Inter_600SemiBold" }]}>Manage Devices</Text>
            <Feather name="chevron-right" size={14} color="#22c55e" />
          </View>
        </TouchableOpacity>

        {/* Geriatric */}
        <TouchableOpacity
          activeOpacity={0.88}
          onPress={() => router.push("/(app)/geriatric")}
          style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <HiveCardBg />
          <View style={[styles.sectionIcon, { backgroundColor: "rgba(167,139,250,0.12)", borderColor: "rgba(167,139,250,0.25)", borderWidth: 1 }]}>
            <MaterialCommunityIcons name="brain" size={22} color="#a78bfa" />
          </View>
          <Text style={[styles.sectionTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>Memory & Wellbeing</Text>
          <Text style={[styles.sectionBody, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
            Memory and wellbeing check-ins, falls awareness questions, and smart device monitoring for live vitals.
          </Text>
          <View style={styles.sectionLink}>
            <Text style={[styles.sectionLinkText, { color: "#a78bfa", fontFamily: "Inter_600SemiBold" }]}>Open Check-In</Text>
            <Feather name="chevron-right" size={14} color="#a78bfa" />
          </View>
        </TouchableOpacity>
      </Animated.ScrollView>

      {/* ── HIVE Bot floating action button ── */}
      <TouchableOpacity
        activeOpacity={0.88}
        onPress={() => hiveBot.open()}
        style={[styles.fab, { bottom: bottomPad + 16 }]}
      >
        <LinearGradient
          colors={["#C9860A", "#D4A017", "#8B5E00"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.fabGradient}
        >
          <MaterialCommunityIcons name="robot-happy" size={22} color="#fff" />
          <Text style={[styles.fabLabel, { fontFamily: "Inter_700Bold" }]}>HIVE Bot</Text>
        </LinearGradient>
      </TouchableOpacity>
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
  heroCard: { borderRadius: 22, overflow: "hidden", padding: 24, minHeight: 330 },
  goldAccentBar: { position: "absolute", top: 0, left: 0, right: 0, height: 2.5, opacity: 0.85 },
  heroLogoRow: { marginBottom: 14, zIndex: 1 },
  heroContent: { gap: 12, zIndex: 1 },
  heroTitle1: { fontSize: 30, color: "#FFFFFF", letterSpacing: -0.5, lineHeight: 36 },
  heroTitle2: { fontSize: 30, letterSpacing: -0.5, lineHeight: 36, marginTop: -4 },
  heroBody: { fontSize: 13.5, color: "rgba(255,255,255,0.72)", lineHeight: 22, marginTop: 4 },
  heroCta: { flexDirection: "row", alignItems: "center", gap: 9, alignSelf: "flex-start", borderRadius: 100, borderWidth: 1, paddingHorizontal: 20, paddingVertical: 12, marginTop: 8 },
  heroCtaText: { fontSize: 15 },

  sectionCard: { borderRadius: 18, borderWidth: 1, padding: 20, gap: 10, overflow: "hidden" },
  sectionIcon: { width: 46, height: 46, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  sectionTitle: { fontSize: 18, letterSpacing: -0.3 },
  sectionBody: { fontSize: 13, lineHeight: 20 },
  sectionLink: { flexDirection: "row", alignItems: "center", gap: 5 },
  sectionLinkText: { fontSize: 14 },
  liveDot: { width: 7, height: 7, borderRadius: 4 },

  deviceBadge: { flexDirection: "row", alignItems: "center", gap: 6, borderRadius: 20, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 5 },
  deviceDot: { width: 7, height: 7, borderRadius: 4 },
  deviceBadgeText: { fontSize: 12 },

  vitalsRow: { flexDirection: "row", gap: 10, marginTop: 2 },
  vitalChip: { flex: 1, borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 10, gap: 2 },
  vitalValue: { fontSize: 20, letterSpacing: -0.4 },
  vitalLabel: { fontSize: 11, letterSpacing: 0.2 },

  fab: {
    position: "absolute",
    right: 20,
    zIndex: 20,
    borderRadius: 30,
    shadowColor: "#C9860A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 12,
  },
  fabGradient: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 30,
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  fabLabel: { color: "#fff", fontSize: 14 },
});
