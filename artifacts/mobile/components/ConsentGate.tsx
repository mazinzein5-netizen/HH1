import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import HiveLogo from "@/components/HiveLogo";
import HoneycombWallpaper from "@/components/HoneycombWallpaper";
import PrivacyPolicyContent from "@/components/PrivacyPolicyContent";
import ThemedStatusBar from "@/components/ThemedStatusBar";
import { useAppMode } from "@/context/AppModeContext";
import { useLogoTheme } from "@/context/LogoThemeContext";
import { useColors } from "@/hooks/useColors";

const CONSENT_POINTS = [
  {
    icon: "cellphone-lock" as const,
    title: "Your data stays on this device",
    body: "Everything you enter is stored only on your phone. Nothing is uploaded to a server.",
  },
  {
    icon: "share-variant" as const,
    title: "You control all sharing",
    body: "Information leaves the app only when you choose to share it — for example, with your GP.",
  },
  {
    icon: "delete-forever" as const,
    title: "Delete everything, any time",
    body: "A \"Delete all my data\" option in Settings permanently erases all stored information.",
  },
];

export default function ConsentGate() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { prefs } = useLogoTheme();
  const { acceptConsent } = useAppMode();
  const [showPolicy, setShowPolicy] = useState(false);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  async function handleAccept() {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await acceptConsent();
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ThemedStatusBar />
      <HoneycombWallpaper density={prefs.density} />
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: topPad + 28, paddingBottom: bottomPad + 28 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.logoRow}>
          <HiveLogo
            size={34}
            goldIntensity={prefs.goldIntensity}
            depth={prefs.depth}
            textWeight={prefs.textWeight}
            showText
          />
        </View>

        <Text style={[styles.title, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
          Welcome to{"\n"}
          <Text style={{ color: colors.goldLight }}>HIVE COMPANION : Patient Portal</Text>
        </Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
          Before you begin, please review how this app works and how your information is handled.
        </Text>

        {/* Not a medical device disclaimer */}
        <View style={[styles.disclaimerCard, { backgroundColor: colors.goldBg, borderColor: colors.goldBorder }]}>
          <MaterialCommunityIcons name="information" size={20} color={colors.gold} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.disclaimerTitle, { color: colors.goldLight, fontFamily: "Inter_700Bold" }]}>
              Not a medical device
            </Text>
            <Text style={[styles.disclaimerBody, { color: "rgba(255,255,255,0.75)", fontFamily: "Inter_400Regular" }]}>
              This app is for information and administrative use only. It does not diagnose or treat any
              condition and does not replace professional medical advice. If you are worried about your
              health, contact your GP — or call 112 in an emergency.
            </Text>
          </View>
        </View>

        {/* GDPR consent points */}
        {CONSENT_POINTS.map((p) => (
          <View key={p.title} style={[styles.pointCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.pointIcon, { backgroundColor: colors.glassPrimary, borderColor: colors.glassPrimaryBorder }]}>
              <MaterialCommunityIcons name={p.icon} size={20} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.pointTitle, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
                {p.title}
              </Text>
              <Text style={[styles.pointBody, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                {p.body}
              </Text>
            </View>
          </View>
        ))}

        {/* Privacy policy expander */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => { Haptics.selectionAsync(); setShowPolicy((v) => !v); }}
          style={[styles.policyToggle, { backgroundColor: colors.glass, borderColor: colors.glassBorder }]}
        >
          <MaterialCommunityIcons name="shield-lock-outline" size={17} color={colors.mutedForeground} />
          <Text style={[styles.policyToggleText, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
            {showPolicy ? "Hide Privacy Policy" : "Read the full Privacy Policy"}
          </Text>
          <MaterialCommunityIcons
            name={showPolicy ? "chevron-up" : "chevron-down"}
            size={18}
            color={colors.mutedForeground}
          />
        </TouchableOpacity>

        {showPolicy && (
          <View style={[styles.policyBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <PrivacyPolicyContent />
          </View>
        )}

        <TouchableOpacity activeOpacity={0.85} onPress={handleAccept}>
          <LinearGradient
            colors={["#C9860A", "#D4A017", "#C9860A"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.acceptBtn}
          >
            <Text style={[styles.acceptText, { fontFamily: "Inter_700Bold" }]}>I Understand & Agree</Text>
          </LinearGradient>
        </TouchableOpacity>

        <Text style={[styles.footnote, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
          By continuing you confirm you have read the disclaimer above and consent to the app storing
          your information locally on this device, as described in the Privacy Policy.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: 20, gap: 14 },
  logoRow: { alignItems: "flex-start", marginBottom: 4 },
  title: { fontSize: 24, letterSpacing: -0.5, lineHeight: 32 },
  subtitle: { fontSize: 14, lineHeight: 21, marginBottom: 4 },
  disclaimerCard: { flexDirection: "row", gap: 12, borderRadius: 16, borderWidth: 1, padding: 16 },
  disclaimerTitle: { fontSize: 14, marginBottom: 4 },
  disclaimerBody: { fontSize: 12.5, lineHeight: 19 },
  pointCard: { flexDirection: "row", gap: 12, borderRadius: 14, borderWidth: 1, padding: 14, alignItems: "flex-start" },
  pointIcon: { width: 38, height: 38, borderRadius: 10, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  pointTitle: { fontSize: 14 },
  pointBody: { fontSize: 12.5, lineHeight: 18, marginTop: 2 },
  policyToggle: { flexDirection: "row", alignItems: "center", gap: 10, borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 13 },
  policyToggleText: { fontSize: 13.5, flex: 1 },
  policyBox: { borderRadius: 14, borderWidth: 1, padding: 16 },
  acceptBtn: { borderRadius: 14, paddingVertical: 16, alignItems: "center", marginTop: 4 },
  acceptText: { color: "#fff", fontSize: 16 },
  footnote: { fontSize: 11, lineHeight: 16, textAlign: "center" },
});
