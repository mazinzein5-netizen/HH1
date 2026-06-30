import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";

type LogoTheme = "gold-navy" | "blue-mono" | "dark-mono" | "emerald";

const LOGO_THEMES: { key: LogoTheme; label: string; hexColor: string; heartColor: string; bg: string }[] = [
  { key: "gold-navy", label: "Gold & Navy", hexColor: "#C9860A", heartColor: "#4F6EF7", bg: "#0a0a16" },
  { key: "blue-mono", label: "Classic Blue", hexColor: "#4F6EF7", heartColor: "#7B94FA", bg: "#0a0a16" },
  { key: "dark-mono", label: "Platinum Dark", hexColor: "#8891B4", heartColor: "#ffffff", bg: "#0a0a16" },
  { key: "emerald", label: "Emerald Health", hexColor: "#22c55e", heartColor: "#4F6EF7", bg: "#0a0a16" },
];

function LogoPreview({ theme, size = 48 }: { theme: typeof LOGO_THEMES[0]; size?: number }) {
  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center", backgroundColor: theme.bg, borderRadius: 10 }}>
      <MaterialCommunityIcons name="hexagon" size={size * 0.9} color={theme.bg} style={{ position: "absolute" }} />
      <MaterialCommunityIcons name="hexagon-outline" size={size * 0.9} color={theme.hexColor} style={{ position: "absolute" }} />
      <MaterialCommunityIcons name="heart-flash" size={size * 0.4} color={theme.heartColor} />
    </View>
  );
}

const SECTIONS = [
  {
    title: "Account",
    items: [
      { icon: "account-circle" as const, label: "Patient Profile", sub: "Edit name, DOB, blood type", action: "profile" },
      { icon: "bell-outline" as const, label: "Notifications", sub: "Medication reminders, appointments", action: "notifications" },
      { icon: "shield-lock-outline" as const, label: "Privacy & GDPR", sub: "Data storage and sharing preferences", action: "privacy" },
    ],
  },
  {
    title: "Health & Monitoring",
    items: [
      { icon: "watch" as const, label: "Connected Devices", sub: "Manage wearables and health bands", action: "devices" },
      { icon: "chart-line" as const, label: "Health Monitoring", sub: "Full vitals, sleep, ECG, metabolism", action: "monitoring" },
      { icon: "brain" as const, label: "Geriatric & Cognitive", sub: "Cognitive screen and falls risk", action: "geriatric" },
    ],
  },
  {
    title: "Clinical",
    items: [
      { icon: "clipboard-text-outline" as const, label: "Triage History", sub: "Past assessment referral packets", action: "history" },
      { icon: "pill" as const, label: "Medication Kardex", sub: "Full prescriber and prescription records", action: "kardex" },
      { icon: "video-outline" as const, label: "Consultation History", sub: "Past telemedicine appointments", action: "consult-history" },
    ],
  },
  {
    title: "App",
    items: [
      { icon: "information-outline" as const, label: "About IbnCeena", sub: "Version · Legal · Licensing", action: "about" },
      { icon: "help-circle-outline" as const, label: "Help & Support", sub: "FAQs, clinical guidelines, contact", action: "help" },
    ],
  },
];

export default function SettingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const topPad = Platform.OS === "web" ? 0 : insets.top;

  const [logoTheme, setLogoTheme] = useState<LogoTheme>("gold-navy");

  function handleAction(action: string) {
    Haptics.selectionAsync();
    switch (action) {
      case "monitoring":
        router.push("/(app)/monitoring");
        break;
      case "geriatric":
        router.push("/(app)/geriatric");
        break;
      case "devices":
        router.push("/(app)/geriatric");
        break;
      default:
        Alert.alert("Coming Soon", "This feature will be available in a future update.");
    }
  }

  async function handleLogout() {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out", style: "destructive", onPress: async () => {
          await logout();
          router.replace("/(auth)/login");
        }
      },
    ]);
  }

  const currentTheme = LOGO_THEMES.find((t) => t.key === logoTheme)!;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 12, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <Feather name="arrow-left" size={20} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>Settings</Text>
        <MaterialCommunityIcons name="cog" size={22} color={colors.mutedForeground} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* User profile card */}
        <LinearGradient colors={["#0e1560", "#1320a0"]} style={[styles.userCard, { borderColor: colors.glassPrimaryBorder }]}>
          <View style={[styles.userAvatar, { backgroundColor: colors.glassPrimary, borderColor: colors.glassPrimaryBorder }]}>
            <MaterialCommunityIcons name="account" size={32} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.userName, { color: "#fff", fontFamily: "Inter_700Bold" }]}>
              {user?.fullName ?? "Guest Patient"}
            </Text>
            <Text style={[styles.userEmail, { color: "rgba(255,255,255,0.6)", fontFamily: "Inter_400Regular" }]}>
              {user?.isGuest ? "Guest Access — Demo Data" : (user?.email || user?.username || "")}
            </Text>
          </View>
          {user?.isGuest && (
            <TouchableOpacity
              onPress={() => router.push("/(auth)/login")}
              style={[styles.signInBtn, { backgroundColor: colors.glass, borderColor: colors.glassBorder }]}
              activeOpacity={0.8}
            >
              <Text style={[styles.signInText, { color: "#fff", fontFamily: "Inter_600SemiBold" }]}>Sign In</Text>
            </TouchableOpacity>
          )}
        </LinearGradient>

        {/* Logo / Visual Theme Editor */}
        <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.sectionTitleRow}>
            <MaterialCommunityIcons name="palette" size={18} color={colors.gold} />
            <Text style={[styles.sectionTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>Logo & Visual Theme</Text>
          </View>
          <Text style={[styles.sectionSub, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
            Customise the IbnCeena honeycomb logo colours and accent theme.
          </Text>

          {/* Live preview */}
          <View style={[styles.logoPreviewWrap, { backgroundColor: colors.cardElevated, borderColor: colors.border }]}>
            <LogoPreview theme={currentTheme} size={64} />
            <View>
              <Text style={[styles.logoThemeName, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
                {currentTheme.label}
              </Text>
              <Text style={[styles.logoThemeSub, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                Hex: {currentTheme.hexColor} · Heart: {currentTheme.heartColor}
              </Text>
            </View>
          </View>

          {/* Theme selector */}
          <View style={styles.themeGrid}>
            {LOGO_THEMES.map((t) => (
              <TouchableOpacity
                key={t.key}
                activeOpacity={0.85}
                onPress={() => { Haptics.selectionAsync(); setLogoTheme(t.key); }}
                style={[styles.themeChip, {
                  backgroundColor: logoTheme === t.key ? colors.glassPrimary : colors.cardElevated,
                  borderColor: logoTheme === t.key ? colors.primary : colors.border,
                  borderWidth: logoTheme === t.key ? 1.5 : 1,
                }]}
              >
                <LogoPreview theme={t} size={32} />
                <Text style={[styles.themeChipLabel, {
                  color: logoTheme === t.key ? colors.foreground : colors.mutedForeground,
                  fontFamily: logoTheme === t.key ? "Inter_600SemiBold" : "Inter_400Regular",
                }]}>
                  {t.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Settings sections */}
        {SECTIONS.map((section) => (
          <View key={section.title} style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionGroupLabel, { color: colors.mutedForeground }]}>{section.title.toUpperCase()}</Text>
            {section.items.map((item, i) => (
              <TouchableOpacity
                key={item.action}
                activeOpacity={0.8}
                onPress={() => handleAction(item.action)}
                style={[
                  styles.settingRow,
                  i > 0 && { borderTopWidth: 1, borderTopColor: colors.border },
                ]}
              >
                <View style={[styles.settingIcon, { backgroundColor: colors.cardElevated }]}>
                  <MaterialCommunityIcons name={item.icon} size={18} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.settingLabel, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>{item.label}</Text>
                  <Text style={[styles.settingSub, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>{item.sub}</Text>
                </View>
                <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
              </TouchableOpacity>
            ))}
          </View>
        ))}

        {/* Sign Out */}
        <TouchableOpacity activeOpacity={0.8} onPress={handleLogout}
          style={[styles.logoutBtn, { backgroundColor: colors.emergencyBg, borderColor: colors.emergencyBorder }]}>
          <MaterialCommunityIcons name="logout" size={18} color={colors.accent} />
          <Text style={[styles.logoutText, { color: colors.accent, fontFamily: "Inter_600SemiBold" }]}>Sign Out</Text>
        </TouchableOpacity>

        <Text style={[styles.versionText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
          IbnCeena Health Ecosystem v2.0{"\n"}GDPR Compliant · HSE Approved Framework
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 1 },
  backBtn: { padding: 6 },
  headerTitle: { flex: 1, fontSize: 18, letterSpacing: -0.3 },
  scroll: { padding: 16, gap: 14, paddingBottom: 60 },
  userCard: { borderRadius: 18, borderWidth: 1, padding: 18, flexDirection: "row", alignItems: "center", gap: 14 },
  userAvatar: { width: 56, height: 56, borderRadius: 28, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  userName: { fontSize: 17, letterSpacing: -0.3 },
  userEmail: { fontSize: 12, marginTop: 2 },
  signInBtn: { borderRadius: 10, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 8 },
  signInText: { fontSize: 13 },
  sectionCard: { borderRadius: 18, borderWidth: 1, padding: 16, gap: 12 },
  sectionTitleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  sectionTitle: { fontSize: 16 },
  sectionSub: { fontSize: 12, lineHeight: 18 },
  logoPreviewWrap: { flexDirection: "row", alignItems: "center", gap: 14, borderRadius: 14, borderWidth: 1, padding: 14 },
  logoThemeName: { fontSize: 15 },
  logoThemeSub: { fontSize: 11, marginTop: 2 },
  themeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  themeChip: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 12, padding: 10, width: "47%" },
  themeChipLabel: { fontSize: 12 },
  sectionGroupLabel: { fontSize: 10, fontFamily: "Inter_600SemiBold", letterSpacing: 1.4 },
  settingRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12 },
  settingIcon: { width: 38, height: 38, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  settingLabel: { fontSize: 14 },
  settingSub: { fontSize: 12, marginTop: 1 },
  logoutBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, borderRadius: 14, borderWidth: 1, paddingVertical: 15 },
  logoutText: { fontSize: 15 },
  versionText: { fontSize: 11, textAlign: "center", lineHeight: 18 },
});
