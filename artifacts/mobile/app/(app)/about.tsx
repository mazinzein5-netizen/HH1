import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React from "react";
import {
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ThemedStatusBar from "@/components/ThemedStatusBar";
import { useColors } from "@/hooks/useColors";

const FEATURES = [
  { icon: "heart-pulse",          color: "#e11d48", label: "Live Health Monitoring",    body: "Real-time vitals, ECG, SpO₂, sleep, and metabolic tracking." },
  { icon: "clipboard-pulse",      color: "#4F6EF7", label: "AI Clinical Intake",        body: "Guided symptom questionnaires with AI triage recommendations." },
  { icon: "pill",                 color: "#22c55e", label: "Medication Management",     body: "Complete kardex, drug interaction flagging, and safety alerts." },
  { icon: "bee",                  color: "#C9860A", label: "Sarah AI Companion",      body: "24/7 intelligent health companion with voice and sign language." },
  { icon: "video",                color: "#0ea5e9", label: "Telemedicine",              body: "Connect instantly with GPs, specialists, and interpreters." },
  { icon: "shield-lock-outline",  color: "#7c3aed", label: "Zero-Server Privacy",       body: "All data stays on your device. Nothing uploaded to any server." },
];

const TEAM = [
  { name: "IbnCeena Ltd.", role: "Product & Engineering" },
  { name: "Developed on Replit", role: "Platform" },
  { name: "HSE Ireland / NICE UK", role: "Clinical Guidelines" },
  { name: "Expo & React Native", role: "Mobile Framework" },
];

export default function AboutScreen() {
  const colors    = useColors();
  const insets    = useSafeAreaInsets();
  const topPad    = Platform.OS === "web" ? 0 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ThemedStatusBar />
      <View style={[styles.header, { paddingTop: topPad + 12, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <Feather name="arrow-left" size={20} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>About HIVE COMPANION</Text>
      </View>

      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: bottomPad + 40 }]} showsVerticalScrollIndicator={false}>

        {/* Hero */}
        <LinearGradient colors={["#0e1560", "#1a0a40"]} style={styles.hero}>
          <View style={[styles.beeLogo, { backgroundColor: "rgba(201,134,10,0.2)", borderColor: "rgba(201,134,10,0.4)" }]}>
            <MaterialCommunityIcons name="bee" size={40} color="#C9860A" />
          </View>
          <Text style={[styles.heroTitle, { color: "#fff", fontFamily: "Inter_700Bold" }]}>HIVE COMPANION</Text>
          <Text style={[styles.heroSub, { color: "rgba(255,255,255,0.6)", fontFamily: "Inter_400Regular" }]}>Patient Portal</Text>
          <View style={[styles.versionBadge, { backgroundColor: "rgba(201,134,10,0.15)", borderColor: "rgba(201,134,10,0.35)" }]}>
            <Text style={[styles.versionText, { color: "#C9860A", fontFamily: "Inter_600SemiBold" }]}>Version 2.0 · Pilot Release</Text>
          </View>
          <Text style={[styles.heroTagline, { color: "rgba(255,255,255,0.45)", fontFamily: "Inter_400Regular" }]}>
            Powered by IbnCeena Ltd.
          </Text>
        </LinearGradient>

        {/* Mission */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>Our Mission</Text>
          <Text style={[styles.cardBody, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
            HIVE COMPANION is a first-of-its-kind patient portal built for elderly and vulnerable patients in Ireland and beyond. It puts clinical-grade tools — safely and accessibly — directly in the hands of patients, so they can understand their health, communicate with care teams, and feel supported every day.
          </Text>
        </View>

        {/* Features */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>What's Inside</Text>
          {FEATURES.map((f) => (
            <View key={f.label} style={[styles.featureRow, { borderBottomColor: colors.border }]}>
              <View style={[styles.featureIcon, { backgroundColor: f.color + "1e" }]}>
                <MaterialCommunityIcons name={f.icon as any} size={20} color={f.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.featureLabel, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>{f.label}</Text>
                <Text style={[styles.featureBody, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>{f.body}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Team */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>Credits</Text>
          {TEAM.map((t, i) => (
            <View key={i} style={[styles.teamRow, i > 0 && { borderTopWidth: 1, borderTopColor: colors.border }]}>
              <Text style={[styles.teamName, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>{t.name}</Text>
              <Text style={[styles.teamRole, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>{t.role}</Text>
            </View>
          ))}
        </View>

        {/* Legal disclaimer */}
        <View style={[styles.card, { backgroundColor: "rgba(220,38,38,0.05)", borderColor: "rgba(220,38,38,0.2)" }]}>
          <View style={styles.disclaimerHeader}>
            <MaterialCommunityIcons name="alert-circle-outline" size={18} color="#dc2626" />
            <Text style={[styles.disclaimerTitle, { color: "#dc2626", fontFamily: "Inter_700Bold" }]}>Medical Disclaimer</Text>
          </View>
          <Text style={[styles.cardBody, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
            HIVE COMPANION is not a medical device and does not provide medical diagnoses or treatment recommendations. All AI-generated content is for informational purposes only. Always consult a qualified healthcare professional for medical advice, diagnosis, or treatment.{"\n\n"}
            In an emergency, call 999 (Ireland) or 112 (EU).
          </Text>
        </View>

        {/* Links */}
        <View style={styles.linksRow}>
          <TouchableOpacity
            style={[styles.linkBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => router.push("/(app)/privacy-policy")}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="shield-lock-outline" size={16} color={colors.primary} />
            <Text style={[styles.linkBtnText, { color: colors.foreground, fontFamily: "Inter_500Medium" }]}>Privacy Policy</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.linkBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => Linking.openURL("mailto:support@ibncena.com")}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="email-outline" size={16} color={colors.primary} />
            <Text style={[styles.linkBtnText, { color: colors.foreground, fontFamily: "Inter_500Medium" }]}>Contact</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 1 },
  backBtn: { padding: 6 },
  headerTitle: { flex: 1, fontSize: 17, letterSpacing: -0.3 },
  scroll: { gap: 14, paddingHorizontal: 16, paddingTop: 16 },
  hero: { borderRadius: 20, padding: 28, alignItems: "center", gap: 8 },
  beeLogo: { width: 72, height: 72, borderRadius: 22, borderWidth: 1, alignItems: "center", justifyContent: "center", marginBottom: 4 },
  heroTitle: { fontSize: 24, letterSpacing: -0.5 },
  heroSub: { fontSize: 14 },
  versionBadge: { borderRadius: 10, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 5, marginTop: 4 },
  versionText: { fontSize: 12 },
  heroTagline: { fontSize: 11, marginTop: 4 },
  card: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 12 },
  cardTitle: { fontSize: 16, letterSpacing: -0.2 },
  cardBody: { fontSize: 13.5, lineHeight: 21 },
  featureRow: { flexDirection: "row", alignItems: "flex-start", gap: 12, paddingVertical: 10, borderBottomWidth: 1 },
  featureIcon: { width: 38, height: 38, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  featureLabel: { fontSize: 13.5 },
  featureBody: { fontSize: 12, lineHeight: 17, marginTop: 2 },
  teamRow: { paddingVertical: 10 },
  teamName: { fontSize: 13.5 },
  teamRole: { fontSize: 12, marginTop: 2 },
  disclaimerHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  disclaimerTitle: { fontSize: 14 },
  linksRow: { flexDirection: "row", gap: 12 },
  linkBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, borderRadius: 13, borderWidth: 1, paddingVertical: 13 },
  linkBtnText: { fontSize: 13.5 },
});
