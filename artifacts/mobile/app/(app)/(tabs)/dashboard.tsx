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

function HexLogo({ size = 40, color = "#4F6EF7" }: { size?: number; color?: string }) {
  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <MaterialCommunityIcons
        name="hexagon-outline"
        size={size}
        color={color}
        style={StyleSheet.absoluteFill}
      />
      <MaterialCommunityIcons name="heart-flash" size={size * 0.44} color={color} />
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
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: topPad + 16, paddingBottom: bottomPad + 16 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <HexLogo size={40} color={colors.primary} />
          <View>
            <Text style={[styles.appName, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
              IbnCeena
            </Text>
            <Text style={[styles.appEco, { color: colors.primary, fontFamily: "Inter_600SemiBold" }]}>
              HEALTH ECOSYSTEM
            </Text>
          </View>
          <View style={styles.navLinks}>
            <TouchableOpacity onPress={() => router.push("/(app)/(tabs)/triage")} activeOpacity={0.7}>
              <Text style={[styles.navLink, { color: colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>
                Health{"\n"}Hive
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push("/(app)/(tabs)/profile")} activeOpacity={0.7}>
              <Text style={[styles.navLink, { color: colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>
                Health{"\n"}Card
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Hero Card */}
        <LinearGradient
          colors={["#111a6e", "#1a268c", "#121870"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          {/* Hex watermark */}
          <View style={styles.heroWatermark} pointerEvents="none">
            <MaterialCommunityIcons name="hexagon-outline" size={220} color="rgba(255,255,255,0.04)" />
          </View>
          <View style={styles.heroWatermark2} pointerEvents="none">
            <MaterialCommunityIcons name="hexagon-outline" size={160} color="rgba(255,255,255,0.04)" />
          </View>

          <View style={styles.heroContent}>
            <Text style={[styles.heroTitle1, { fontFamily: "Inter_700Bold" }]}>Objective Triage.</Text>
            <Text style={[styles.heroTitle2, { color: colors.primaryLight, fontFamily: "Inter_700Bold" }]}>
              Absolute Security.
            </Text>
            <Text style={[styles.heroBody, { fontFamily: "Inter_400Regular" }]}>
              Bridging the gap between primary care and specialized treatment. Generating verified clinical
              metrics for MSK pathways and providing instant, life-saving data access for first responders.
            </Text>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => router.push("/(app)/(tabs)/triage")}
              style={styles.heroCta}
            >
              <MaterialCommunityIcons name="clipboard-text" size={17} color="#fff" />
              <Text style={[styles.heroCtaText, { fontFamily: "Inter_600SemiBold" }]}>
                Start Triage Flow
              </Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* Health Hive Section */}
        <TouchableOpacity
          activeOpacity={0.88}
          onPress={() => router.push("/(app)/(tabs)/triage")}
          style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <View style={[styles.sectionIcon, { backgroundColor: "#0f1a5a" }]}>
            <MaterialCommunityIcons name="waveform" size={22} color={colors.primary} />
          </View>
          <Text style={[styles.sectionTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
            Health Hive Triage
          </Text>
          <Text style={[styles.sectionBody, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
            Digital triage for Neck, Back, Knee, and Hip chronic pain. Generates verified Oxford, ODI, and
            mJOA scores with GP referral generation.
          </Text>
          <View style={styles.sectionLink}>
            <Text style={[styles.sectionLinkText, { color: colors.primary, fontFamily: "Inter_600SemiBold" }]}>
              Explore Pathways
            </Text>
            <Feather name="chevron-right" size={14} color={colors.primary} />
          </View>
        </TouchableOpacity>

        {/* Health Card Section */}
        <TouchableOpacity
          activeOpacity={0.88}
          onPress={() => router.push("/(app)/(tabs)/profile")}
          style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <View style={[styles.sectionIcon, { backgroundColor: "#2a0f12" }]}>
            <MaterialCommunityIcons name="shield-alert" size={22} color={colors.accent} />
          </View>
          <Text style={[styles.sectionTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
            Health Card Portal
          </Text>
          <Text style={[styles.sectionBody, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
            Emergency QR access to medications and history. Features a geriatric safety package with falls
            detection and automatic GPS help call.
          </Text>
          <View style={styles.sectionLink}>
            <Text style={[styles.sectionLinkText, { color: colors.accent, fontFamily: "Inter_600SemiBold" }]}>
              View Portal
            </Text>
            <Feather name="chevron-right" size={14} color={colors.accent} />
          </View>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: 16, gap: 14 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  appName: { fontSize: 16, letterSpacing: -0.3 },
  appEco: { fontSize: 9, letterSpacing: 1.4 },
  navLinks: { flexDirection: "row", gap: 16, marginLeft: "auto" },
  navLink: { fontSize: 12, textAlign: "center", lineHeight: 17 },
  heroCard: {
    borderRadius: 20,
    overflow: "hidden",
    padding: 24,
    minHeight: 280,
  },
  heroWatermark: {
    position: "absolute",
    right: -50,
    top: -40,
    opacity: 1,
  },
  heroWatermark2: {
    position: "absolute",
    right: 20,
    bottom: -30,
    opacity: 1,
  },
  heroContent: { gap: 12, zIndex: 1 },
  heroTitle1: { fontSize: 30, color: "#FFFFFF", letterSpacing: -0.5, lineHeight: 36 },
  heroTitle2: { fontSize: 30, letterSpacing: -0.5, lineHeight: 36, marginTop: -4 },
  heroBody: { fontSize: 14, color: "rgba(255,255,255,0.75)", lineHeight: 22, marginTop: 4 },
  heroCta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    alignSelf: "flex-start",
    backgroundColor: "rgba(0,0,0,0.55)",
    borderRadius: 100,
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginTop: 8,
  },
  heroCtaText: { color: "#FFFFFF", fontSize: 15 },
  sectionCard: { borderRadius: 18, borderWidth: 1, padding: 20, gap: 10 },
  sectionIcon: { width: 46, height: 46, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  sectionTitle: { fontSize: 18, letterSpacing: -0.3 },
  sectionBody: { fontSize: 13, lineHeight: 20 },
  sectionLink: { flexDirection: "row", alignItems: "center", gap: 4 },
  sectionLinkText: { fontSize: 14 },
});
