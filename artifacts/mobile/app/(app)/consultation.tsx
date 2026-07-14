import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect } from "react";
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

/**
 * Consultation entry point.
 * - Pilot mode: redirects to the full Telemedicine Portal.
 * - Clean (store) build: shows only the "coming soon" teaser and
 *   administrative scheduling links (interpreter booking).
 */
export default function ConsultationScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { prefs } = useLogoTheme();
  const { pilotMode } = useAppMode();
  const topPad = Platform.OS === "web" ? 0 : insets.top;

  useEffect(() => {
    if (pilotMode) router.replace("/(app)/telemedicine");
  }, [pilotMode]);

  if (pilotMode) return null;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ThemedStatusBar />
      <HoneycombWallpaper density={prefs.density} />

      <View style={[styles.header, { paddingTop: topPad + 12, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <Feather name="arrow-left" size={20} color={colors.foreground} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>Consultations</Text>
          <Text style={[styles.headerSub, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
            IbnCeena Telemedicine
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Coming soon teaser */}
        <LinearGradient colors={["#0f1840", "#0d0d1a"]} style={styles.heroCard}>
          <MaterialCommunityIcons name="video" size={40} color="#22c55e" />
          <View style={[styles.soonChip, { backgroundColor: "#22c55e22", borderColor: "#22c55e44" }]}>
            <Text style={[styles.soonChipText, { color: "#22c55e", fontFamily: "Inter_600SemiBold" }]}>COMING SOON</Text>
          </View>
          <Text style={[styles.heroTitle, { color: "#fff", fontFamily: "Inter_700Bold" }]}>
            Video Consultations
          </Text>
          <Text style={[styles.heroSub, { color: "rgba(255,255,255,0.6)", fontFamily: "Inter_400Regular" }]}>
            Booking video appointments with clinicians is coming to the app soon. In the meantime, you can arrange interpreter support for your existing appointments below.
          </Text>
        </LinearGradient>

        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>APPOINTMENT SUPPORT</Text>

        {/* Interpreter booking (administrative scheduling) */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => { Haptics.selectionAsync(); router.push("/(app)/interpreter"); }}
          style={[styles.interpreterCard, { backgroundColor: colors.card, borderColor: colors.gold + "44" }]}
        >
          <View style={[styles.interpreterIcon, { backgroundColor: colors.gold + "1e" }]}>
            <MaterialCommunityIcons name="translate" size={24} color={colors.gold} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.interpreterTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
              Book a Live Interpreter
            </Text>
            <Text style={[styles.interpreterSub, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              Professional, confidential interpreters for medical and legal consultations and appointments.
            </Text>
          </View>
          <Feather name="chevron-right" size={18} color={colors.gold} />
        </TouchableOpacity>
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
  heroCard: { borderRadius: 20, padding: 24, gap: 12, alignItems: "center" },
  soonChip: { borderRadius: 16, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 5 },
  soonChipText: { fontSize: 11, letterSpacing: 1.2 },
  heroTitle: { fontSize: 22, letterSpacing: -0.5, textAlign: "center" },
  heroSub: { fontSize: 13, lineHeight: 20, textAlign: "center" },
  sectionLabel: { fontSize: 10, fontFamily: "Inter_600SemiBold", letterSpacing: 1.4 },
  interpreterCard: { flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 14, borderWidth: 1.5, padding: 14 },
  interpreterIcon: { width: 48, height: 48, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  interpreterTitle: { fontSize: 14 },
  interpreterSub: { fontSize: 12, marginTop: 2, lineHeight: 17 },
});
