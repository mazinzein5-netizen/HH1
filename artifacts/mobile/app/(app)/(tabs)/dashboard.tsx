import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React from "react";
import {
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";

function HoneycombLogo({ size = 44 }: { size?: number }) {
  const colors = useColors();
  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <MaterialCommunityIcons name="hexagon" size={size} color={colors.background} style={StyleSheet.absoluteFill} />
      <MaterialCommunityIcons name="hexagon-outline" size={size} color={colors.gold} style={StyleSheet.absoluteFill} />
      <MaterialCommunityIcons name="heart-flash" size={size * 0.44} color={colors.primary} />
    </View>
  );
}

function HoneycombWatermark() {
  const grid = [
    { top: -30, left: -40, size: 130 }, { top: -30, left: 60, size: 100 }, { top: -30, left: 150, size: 130 }, { top: -30, right: -20, size: 100 },
    { top: 50, left: -10, size: 100 }, { top: 50, left: 80, size: 130 }, { top: 50, right: 10, size: 100 },
    { top: 130, left: -40, size: 110 }, { top: 130, left: 60, size: 100 }, { top: 130, right: -30, size: 120 },
    { top: 210, left: 10, size: 90 }, { top: 210, right: 20, size: 110 },
  ];
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {grid.map((p, i) => (
        <MaterialCommunityIcons
          key={i}
          name="hexagon-outline"
          size={p.size}
          color="rgba(201,134,10,0.055)"
          style={{ position: "absolute", top: p.top, left: (p as any).left, right: (p as any).right }}
        />
      ))}
    </View>
  );
}

export default function DashboardScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 + 68 : insets.bottom + 64;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: topPad + 16, paddingBottom: bottomPad + 16 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <HoneycombLogo size={42} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.appName, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>IbnCeena</Text>
            <Text style={[styles.appEco, { color: colors.gold, fontFamily: "Inter_600SemiBold" }]}>HEALTH ECOSYSTEM</Text>
          </View>
          <View style={styles.navLinks}>
            <TouchableOpacity onPress={() => router.push("/(app)/(tabs)/triage")} activeOpacity={0.7}>
              <Text style={[styles.navLink, { color: colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>Health{"\n"}Hive</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push("/(app)/(tabs)/profile")} activeOpacity={0.7}>
              <Text style={[styles.navLink, { color: colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>Health{"\n"}Card</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push("/(app)/settings")}
              activeOpacity={0.7}
              style={[styles.menuBtn, { backgroundColor: colors.glass, borderColor: colors.glassBorder }]}
            >
              <Feather name="menu" size={18} color={colors.foreground} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Hero Card — honeycomb overlay */}
        <View style={styles.heroOuter}>
          <LinearGradient colors={["#0e1560", "#1320a0", "#0a0e55"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.heroCard}>
            <HoneycombWatermark />
            {/* Gold accent bar */}
            <View style={[styles.goldAccentBar, { backgroundColor: colors.gold }]} />
            <View style={styles.heroContent}>
              <Text style={[styles.heroTitle1, { fontFamily: "Inter_700Bold" }]}>Objective Triage.</Text>
              <Text style={[styles.heroTitle2, { color: colors.goldLight, fontFamily: "Inter_700Bold" }]}>Absolute Security.</Text>
              <Text style={[styles.heroBody, { fontFamily: "Inter_400Regular" }]}>
                Bridging the gap between primary care and specialised treatment. Generating verified clinical metrics for MSK pathways and providing instant, life-saving data access for first responders.
              </Text>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => router.push("/(app)/(tabs)/triage")}
                style={[styles.heroCta, { backgroundColor: "rgba(0,0,0,0.45)", borderColor: colors.gold + "55" }]}
              >
                <MaterialCommunityIcons name="clipboard-text" size={17} color={colors.gold} />
                <Text style={[styles.heroCtaText, { fontFamily: "Inter_600SemiBold", color: colors.goldLight }]}>Start Triage Flow</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>

        {/* Live Consultation */}
        <TouchableOpacity activeOpacity={0.88} onPress={() => router.push("/(app)/consultation")}>
          <LinearGradient colors={["#071a10", "#0a2818"]} style={[styles.sectionCard, { borderColor: "#22c55e33" }]}>
            <View style={[styles.sectionIcon, { backgroundColor: "rgba(34,197,94,0.15)", borderColor: "rgba(34,197,94,0.3)", borderWidth: 1 }]}>
              <MaterialCommunityIcons name="video" size={22} color="#22c55e" />
            </View>
            <Text style={[styles.sectionTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>Live Consultation</Text>
            <Text style={[styles.sectionBody, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              Book or join a HiEmotion telemedicine appointment with your GP, Physiotherapist, or Specialist.
            </Text>
            <View style={styles.sectionLink}>
              <View style={styles.liveDot} />
              <Text style={[styles.sectionLinkText, { color: "#22c55e", fontFamily: "Inter_600SemiBold" }]}>Book Now</Text>
              <Feather name="chevron-right" size={14} color="#22c55e" />
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {/* Health Hive */}
        <TouchableOpacity activeOpacity={0.88} onPress={() => router.push("/(app)/(tabs)/triage")}
          style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.sectionIcon, { backgroundColor: colors.glassPrimary, borderColor: colors.glassPrimaryBorder, borderWidth: 1 }]}>
            <MaterialCommunityIcons name="waveform" size={22} color={colors.primary} />
          </View>
          <Text style={[styles.sectionTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>Health Hive Triage</Text>
          <Text style={[styles.sectionBody, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
            Full NICE/HSE-validated clinical scoring — ODI (Lumbar), mJOA (Cervical), Oxford Hip & Knee Scores with GP referral packet.
          </Text>
          <View style={styles.sectionLink}>
            <Text style={[styles.sectionLinkText, { color: colors.primary, fontFamily: "Inter_600SemiBold" }]}>Explore Pathways</Text>
            <Feather name="chevron-right" size={14} color={colors.primary} />
          </View>
        </TouchableOpacity>

        {/* Health Card */}
        <TouchableOpacity activeOpacity={0.88} onPress={() => router.push("/(app)/(tabs)/profile")}
          style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
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

        {/* Geriatric */}
        <TouchableOpacity activeOpacity={0.88} onPress={() => router.push("/(app)/geriatric")}
          style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.sectionIcon, { backgroundColor: "rgba(167,139,250,0.12)", borderColor: "rgba(167,139,250,0.25)", borderWidth: 1 }]}>
            <MaterialCommunityIcons name="brain" size={22} color="#a78bfa" />
          </View>
          <Text style={[styles.sectionTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>Geriatric & Cognitive Care</Text>
          <Text style={[styles.sectionBody, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
            Cognitive decline screening, STRATIFY falls risk assessment, and smart device monitoring for live vitals.
          </Text>
          <View style={styles.sectionLink}>
            <Text style={[styles.sectionLinkText, { color: "#a78bfa", fontFamily: "Inter_600SemiBold" }]}>Open Assessment</Text>
            <Feather name="chevron-right" size={14} color="#a78bfa" />
          </View>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: 16, gap: 14 },
  header: { flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 16, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 12 },
  appName: { fontSize: 16, letterSpacing: -0.3 },
  appEco: { fontSize: 9, letterSpacing: 1.6 },
  navLinks: { flexDirection: "row", gap: 12, alignItems: "center" },
  navLink: { fontSize: 11, textAlign: "center", lineHeight: 16 },
  menuBtn: { borderRadius: 10, borderWidth: 1, padding: 8 },
  heroOuter: { borderRadius: 22, overflow: "hidden" },
  heroCard: { borderRadius: 22, overflow: "hidden", padding: 24, minHeight: 295 },
  goldAccentBar: { position: "absolute", top: 0, left: 0, right: 0, height: 2.5, opacity: 0.85 },
  heroContent: { gap: 12, zIndex: 1, marginTop: 6 },
  heroTitle1: { fontSize: 30, color: "#FFFFFF", letterSpacing: -0.5, lineHeight: 36 },
  heroTitle2: { fontSize: 30, letterSpacing: -0.5, lineHeight: 36, marginTop: -4 },
  heroBody: { fontSize: 13.5, color: "rgba(255,255,255,0.72)", lineHeight: 22, marginTop: 4 },
  heroCta: { flexDirection: "row", alignItems: "center", gap: 9, alignSelf: "flex-start", borderRadius: 100, borderWidth: 1, paddingHorizontal: 20, paddingVertical: 12, marginTop: 8 },
  heroCtaText: { fontSize: 15 },
  sectionCard: { borderRadius: 18, borderWidth: 1, padding: 20, gap: 10 },
  sectionIcon: { width: 46, height: 46, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  sectionTitle: { fontSize: 18, letterSpacing: -0.3 },
  sectionBody: { fontSize: 13, lineHeight: 20 },
  sectionLink: { flexDirection: "row", alignItems: "center", gap: 5 },
  sectionLinkText: { fontSize: 14 },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: "#22c55e" },
});
