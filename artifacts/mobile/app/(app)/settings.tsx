import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";
import HoneycombWallpaper from "@/components/HoneycombWallpaper";
import ThemedStatusBar from "@/components/ThemedStatusBar";
import Toast from "@/components/Toast";
import { useLogoTheme } from "@/context/LogoThemeContext";
import { ThemeMode, useTheme } from "@/context/ThemeContext";
import { useColors } from "@/hooks/useColors";

const THEME_OPTIONS: { mode: ThemeMode; label: string; icon: "white-balance-sunny" | "moon-waning-crescent" | "cellphone-cog" }[] = [
  { mode: "light", label: "Light", icon: "white-balance-sunny" },
  { mode: "dark", label: "Dark", icon: "moon-waning-crescent" },
  { mode: "system", label: "System", icon: "cellphone-cog" },
];

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
  const { prefs } = useLogoTheme();
  const { mode, setMode } = useTheme();
  const topPad = Platform.OS === "web" ? 0 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

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
        router.push("/(app)/smart-devices");
        break;
      default:
        setToastMessage("Coming soon — available in a future update");
        setToastVisible(true);
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

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ThemedStatusBar />
      <HoneycombWallpaper density={prefs.density} />

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

        {/* Appearance */}
        <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.sectionTitleRow}>
            <MaterialCommunityIcons name="theme-light-dark" size={18} color={colors.gold} />
            <Text style={[styles.sectionTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>Appearance</Text>
          </View>
          <Text style={[styles.sectionSub, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
            Choose a light or dark colour theme, or match your device.
          </Text>

          <View style={styles.themeRow}>
            {THEME_OPTIONS.map((opt) => {
              const active = mode === opt.mode;
              return (
                <TouchableOpacity
                  key={opt.mode}
                  activeOpacity={0.85}
                  onPress={() => { Haptics.selectionAsync(); setMode(opt.mode); }}
                  style={[styles.themeChip, {
                    backgroundColor: active ? colors.glassGold : colors.cardElevated,
                    borderColor: active ? colors.gold : colors.border,
                    borderWidth: active ? 1.5 : 1,
                  }]}
                >
                  <MaterialCommunityIcons
                    name={opt.icon}
                    size={22}
                    color={active ? colors.gold : colors.mutedForeground}
                  />
                  <Text style={[styles.themeChipText, {
                    color: active ? colors.gold : colors.mutedForeground,
                    fontFamily: active ? "Inter_600SemiBold" : "Inter_400Regular",
                  }]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
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

      <Toast
        message={toastMessage}
        visible={toastVisible}
        onHide={() => setToastVisible(false)}
        iconName="clock-outline"
        iconColor="#D4A017"
        bottomOffset={bottomPad + 16}
      />
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
  themeRow: { flexDirection: "row", gap: 10 },
  themeChip: { flex: 1, borderRadius: 14, paddingVertical: 16, alignItems: "center", justifyContent: "center", gap: 8 },
  themeChipText: { fontSize: 13, letterSpacing: 0.2 },
  sectionGroupLabel: { fontSize: 10, fontFamily: "Inter_600SemiBold", letterSpacing: 1.4 },
  settingRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12 },
  settingIcon: { width: 38, height: 38, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  settingLabel: { fontSize: 14 },
  settingSub: { fontSize: 12, marginTop: 1 },
  logoutBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, borderRadius: 14, borderWidth: 1, paddingVertical: 15 },
  logoutText: { fontSize: 15 },
  versionText: { fontSize: 11, textAlign: "center", lineHeight: 18 },
});
