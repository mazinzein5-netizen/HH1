import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState } from "react";
import Slider from "@react-native-community/slider";
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
import HiveLogo from "@/components/HiveLogo";
import HoneycombWallpaper from "@/components/HoneycombWallpaper";
import Toast from "@/components/Toast";
import { DensityLevel, DepthLevel, TextWeightLevel, useLogoTheme } from "@/context/LogoThemeContext";
import { useColors } from "@/hooks/useColors";

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

function PickerRow<T extends string>({
  label,
  options,
  value,
  onSelect,
  activeColor,
}: {
  label: string;
  options: T[];
  value: T;
  onSelect: (v: T) => void;
  activeColor: string;
}) {
  const colors = useColors();
  return (
    <View style={styles.pickerRow}>
      <Text style={[styles.pickerLabel, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>{label}</Text>
      <View style={styles.pickerChips}>
        {options.map((opt) => (
          <TouchableOpacity
            key={opt}
            activeOpacity={0.8}
            onPress={() => { Haptics.selectionAsync(); onSelect(opt); }}
            style={[styles.pickerChip, {
              backgroundColor: value === opt ? activeColor + "22" : colors.cardElevated,
              borderColor: value === opt ? activeColor : colors.border,
              borderWidth: value === opt ? 1.5 : 1,
            }]}
          >
            <Text style={[styles.pickerChipText, {
              color: value === opt ? activeColor : colors.mutedForeground,
              fontFamily: value === opt ? "Inter_600SemiBold" : "Inter_400Regular",
            }]}>
              {opt}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

export default function SettingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const { prefs, setGoldIntensity, setDepth, setDensity, setTextWeight } = useLogoTheme();
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
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
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

        {/* HIVE Logo & Visual Theme Editor */}
        <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.sectionTitleRow}>
            <MaterialCommunityIcons name="palette" size={18} color={colors.gold} />
            <Text style={[styles.sectionTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>Logo & Visual Theme</Text>
          </View>
          <Text style={[styles.sectionSub, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
            Customise the HIVE honeycomb logo and background theme.
          </Text>

          {/* Live preview */}
          <View style={[styles.logoPreviewWrap, { backgroundColor: colors.cardElevated, borderColor: colors.goldBorder }]}>
            <HiveLogo
              size={40}
              goldIntensity={prefs.goldIntensity}
              depth={prefs.depth}
              textWeight={prefs.textWeight}
              showText
            />
          </View>

          {/* Gold Intensity Slider */}
          <View style={styles.sliderRow}>
            <Text style={[styles.pickerLabel, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              Gold Intensity
            </Text>
            <View style={styles.sliderTrack}>
              <Text style={[styles.sliderEndLabel, { color: colors.honey, fontFamily: "Inter_400Regular" }]}>Amber</Text>
              <View style={styles.sliderWrap}>
                <Slider
                  style={{ flex: 1, height: 36 }}
                  minimumValue={0}
                  maximumValue={1}
                  step={0.05}
                  value={prefs.goldIntensity}
                  onValueChange={(v) => setGoldIntensity(v)}
                  minimumTrackTintColor={colors.goldBright}
                  maximumTrackTintColor={colors.border}
                  thumbTintColor={colors.gold}
                />
              </View>
              <Text style={[styles.sliderEndLabel, { color: colors.goldBright, fontFamily: "Inter_400Regular" }]}>Vivid</Text>
            </View>
          </View>

          {/* 3D Depth picker */}
          <PickerRow<DepthLevel>
            label="3D Depth"
            options={["Flat", "Subtle", "Strong"]}
            value={prefs.depth}
            onSelect={setDepth}
            activeColor={colors.gold}
          />

          {/* Honeycomb Density picker */}
          <PickerRow<DensityLevel>
            label="Honeycomb Density"
            options={["Sparse", "Medium", "Dense"]}
            value={prefs.density}
            onSelect={setDensity}
            activeColor={colors.goldLight}
          />

          {/* Text Weight picker */}
          <PickerRow<TextWeightLevel>
            label="Text Weight"
            options={["Bold", "Black", "Condensed"]}
            value={prefs.textWeight}
            onSelect={setTextWeight}
            activeColor={colors.goldBright}
          />
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
  logoPreviewWrap: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 100,
    overflow: "hidden",
  },
  sliderRow: { gap: 8 },
  sliderTrack: { flexDirection: "row", alignItems: "center", gap: 8 },
  sliderEndLabel: { fontSize: 11, minWidth: 36, textAlign: "center" },
  sliderWrap: { flex: 1 },
  pickerRow: { gap: 8 },
  pickerLabel: { fontSize: 12, letterSpacing: 0.3 },
  pickerChips: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  pickerChip: { borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8 },
  pickerChipText: { fontSize: 13 },
  sectionGroupLabel: { fontSize: 10, fontFamily: "Inter_600SemiBold", letterSpacing: 1.4 },
  settingRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12 },
  settingIcon: { width: 38, height: 38, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  settingLabel: { fontSize: 14 },
  settingSub: { fontSize: 12, marginTop: 1 },
  logoutBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, borderRadius: 14, borderWidth: 1, paddingVertical: 15 },
  logoutText: { fontSize: 15 },
  versionText: { fontSize: 11, textAlign: "center", lineHeight: 18 },
});
