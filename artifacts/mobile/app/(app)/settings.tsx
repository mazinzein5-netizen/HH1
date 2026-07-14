import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppMode } from "@/context/AppModeContext";
import { useAuth } from "@/context/AuthContext";
import HoneycombWallpaper from "@/components/HoneycombWallpaper";
import ThemedStatusBar from "@/components/ThemedStatusBar";
import Toast from "@/components/Toast";
import { useLogoTheme } from "@/context/LogoThemeContext";
import { ThemeMode, useTheme } from "@/context/ThemeContext";
import { useColors } from "@/hooks/useColors";
import {
  BiometricSupport,
  disableBiometricLogin,
  enableBiometricLogin,
  getBiometricLogin,
  getBiometricSupport,
  promptBiometric,
} from "@/utils/biometricAuth";

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
      { icon: "card-account-details-outline" as const, label: "Membership & Verification", sub: "Free trial, plans, ID verification, payment", action: "membership" },
      { icon: "bell-outline" as const, label: "Notifications", sub: "Medication reminders, appointments", action: "notifications" },
      { icon: "shield-lock-outline" as const, label: "Privacy & GDPR", sub: "How your data is stored and protected", action: "privacy" },
    ],
  },
  {
    title: "Health & Monitoring",
    items: [
      { icon: "watch" as const, label: "Connected Devices", sub: "Manage wearables and health bands", action: "devices" },
      { icon: "chart-line" as const, label: "Health Monitoring", sub: "Full vitals, sleep, ECG, metabolism", action: "monitoring" },
      { icon: "brain" as const, label: "Memory & Wellbeing", sub: "Wellbeing check and falls awareness", action: "geriatric" },
    ],
  },
  {
    title: "My Records",
    items: [
      { icon: "clipboard-text-outline" as const, label: "Intake History", sub: "Past questionnaire summaries", action: "history" },
      { icon: "pill" as const, label: "Medication Kardex", sub: "Full prescriber and prescription records", action: "kardex" },
      { icon: "video-outline" as const, label: "Consultation History", sub: "Past video appointments", action: "consult-history" },
      { icon: "translate" as const, label: "Live Interpreter", sub: "Book an interpreter for medical & legal appointments", action: "interpreter" },
    ],
  },
  {
    title: "App",
    items: [
      { icon: "information-outline" as const, label: "About HIVE COMPANION", sub: "Version · Legal · Licensing", action: "about" },
      { icon: "help-circle-outline" as const, label: "Help & Support", sub: "FAQs, health guides, contact", action: "help" },
    ],
  },
];

const COMING_SOON: { icon: React.ComponentProps<typeof MaterialCommunityIcons>["name"]; title: string; body: string }[] = [
  { icon: "microphone-outline", title: "Voice Health Companion", body: "Talk to the app in your own language and keep your records up to date hands-free." },
  { icon: "watch-variant", title: "Wearable Wellness Alerts", body: "Connect your watch or ring for gentle wellness notifications for you and your family." },
  { icon: "video-outline", title: "Video Consultations", body: "Book and join video appointments with your care team, right from the app." },
];

export default function SettingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const { prefs } = useLogoTheme();
  const { mode, setMode, isDark } = useTheme();
  const { pilotMode, activatePilot, deactivatePilot, deleteAllData } = useAppMode();
  const topPad = Platform.OS === "web" ? 0 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [pilotModalVisible, setPilotModalVisible] = useState(false);
  const [pilotCode, setPilotCode] = useState("");
  const [pilotError, setPilotError] = useState("");
  const [bioSupport, setBioSupport] = useState<BiometricSupport | null>(null);
  const [bioEnabled, setBioEnabled] = useState(false);

  useEffect(() => {
    (async () => {
      const [support, record] = await Promise.all([getBiometricSupport(), getBiometricLogin()]);
      setBioSupport(support);
      setBioEnabled(!!record && record.userId === user?.id);
    })();
  }, [user?.id]);

  const bioAllowed = !!bioSupport?.available && !user?.isGuest;

  function biometricSub(): string {
    if (user?.isGuest) return "Sign in to your own account to use this.";
    if (!bioSupport) return "Checking what this device supports…";
    if (bioSupport.available) return `Unlock the app with ${bioSupport.label} instead of your password.`;
    switch (bioSupport.reason) {
      case "web":          return "Works on your phone — Face ID or fingerprint.";
      case "not-enrolled": return "First set up Face ID or a fingerprint in your phone's own settings.";
      default:             return "This device doesn't support biometric sign-in.";
    }
  }

  async function handleBiometricToggle(next: boolean) {
    if (!bioAllowed || !user) return;
    Haptics.selectionAsync();
    if (next) {
      const passed = await promptBiometric(`Confirm ${bioSupport!.label} to enable quick sign-in`, "Cancel");
      if (!passed) return;
      const firstName = (user.fullName || user.username).trim().split(/\s+/)[0];
      await enableBiometricLogin(user.id, firstName);
      setBioEnabled(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setToastMessage(`You can now sign in with ${bioSupport!.label}`);
      setToastVisible(true);
    } else {
      await disableBiometricLogin();
      setBioEnabled(false);
      setToastMessage("Biometric sign-in turned off");
      setToastVisible(true);
    }
  }

  function handleAction(action: string) {
    Haptics.selectionAsync();
    switch (action) {
      case "monitoring":      router.push("/(app)/monitoring");        break;
      case "geriatric":       router.push("/(app)/geriatric");         break;
      case "devices":         router.push("/(app)/smart-devices");     break;
      case "privacy":         router.push("/(app)/privacy-policy");    break;
      case "interpreter":     router.push("/(app)/interpreter");       break;
      case "notifications":   router.push("/(app)/notifications");     break;
      case "history":         router.push("/(app)/intake-history");    break;
      case "kardex":          router.push("/(app)/kardex");            break;
      case "consult-history": router.push("/(app)/consult-history");   break;
      case "about":           router.push("/(app)/about");             break;
      case "help":            router.push("/(app)/help");              break;
      case "profile":         router.push("/(app)/(tabs)/profile");    break;
      case "membership":      router.push("/(app)/membership");        break;
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

  function handleDeleteAllData() {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert(
      "Delete All My Data",
      "This permanently erases everything this app has stored on your device — profile, records, questionnaire history, and preferences. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete Everything",
          style: "destructive",
          onPress: async () => {
            await logout();
            await deleteAllData();
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          },
        },
      ],
    );
  }

  function handleVersionLongPress() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    if (pilotMode) {
      Alert.alert("Pilot Programme", "Pilot programme access is active on this device.", [
        { text: "Keep Active", style: "cancel" },
        {
          text: "Deactivate",
          style: "destructive",
          onPress: async () => {
            await deactivatePilot();
            setToastMessage("Pilot programme deactivated");
            setToastVisible(true);
          },
        },
      ]);
    } else {
      setPilotCode("");
      setPilotError("");
      setPilotModalVisible(true);
    }
  }

  async function handlePilotSubmit() {
    const ok = await activatePilot(pilotCode);
    if (ok) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setPilotModalVisible(false);
      setToastMessage("Pilot programme activated");
      setToastVisible(true);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setPilotError("Invalid access code");
    }
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

        {/* Security */}
        <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionGroupLabel, { color: colors.mutedForeground }]}>SECURITY</Text>
          <View style={styles.settingRow}>
            <View style={[styles.settingIcon, { backgroundColor: colors.cardElevated }]}>
              <MaterialCommunityIcons name={bioSupport?.icon ?? "fingerprint"} size={18} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.settingLabel, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
                Biometric Sign-In
              </Text>
              <Text style={[styles.settingSub, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                {biometricSub()}
              </Text>
            </View>
            <Switch
              value={bioEnabled}
              onValueChange={handleBiometricToggle}
              disabled={!bioAllowed}
              trackColor={{ false: colors.border, true: colors.gold }}
              thumbColor="#fff"
            />
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

        {/* What's Coming */}
        <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.goldBorder }]}>
          <View style={styles.sectionTitleRow}>
            <MaterialCommunityIcons name="rocket-launch-outline" size={18} color={colors.gold} />
            <Text style={[styles.sectionTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>What's Coming</Text>
          </View>
          <Text style={[styles.sectionSub, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
            New features arriving in upcoming updates.
          </Text>
          {COMING_SOON.map((item, i) => (
            <View
              key={item.title}
              style={[styles.comingRow, i > 0 && { borderTopWidth: 1, borderTopColor: colors.border }]}
            >
              <View style={[styles.settingIcon, { backgroundColor: colors.glassGold }]}>
                <MaterialCommunityIcons name={item.icon} size={18} color={colors.gold} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.settingLabel, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>{item.title}</Text>
                <Text style={[styles.settingSub, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>{item.body}</Text>
              </View>
              <View style={[styles.soonBadge, { backgroundColor: colors.glassGold, borderColor: colors.goldBorder }]}>
                <Text style={[styles.soonBadgeText, { color: colors.gold, fontFamily: "Inter_600SemiBold" }]}>SOON</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Data & Privacy */}
        <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionGroupLabel, { color: colors.mutedForeground }]}>YOUR DATA</Text>
          <View style={[styles.dataStatement, { backgroundColor: colors.glass, borderColor: colors.glassBorder }]}>
            <MaterialCommunityIcons name="cellphone-lock" size={17} color={colors.mutedForeground} />
            <Text style={[styles.dataStatementText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              All of your health information is stored only on this device. Nothing is uploaded to a server.
            </Text>
          </View>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleDeleteAllData}
            style={[styles.deleteBtn, { backgroundColor: colors.emergencyBg, borderColor: colors.emergencyBorder }]}
          >
            <MaterialCommunityIcons name="delete-forever" size={18} color={colors.emergency} />
            <Text style={[styles.deleteBtnText, { color: colors.emergency, fontFamily: "Inter_600SemiBold" }]}>
              Delete All My Data
            </Text>
          </TouchableOpacity>
        </View>

        {/* Sign Out */}
        <TouchableOpacity activeOpacity={0.8} onPress={handleLogout}
          style={[styles.logoutBtn, { backgroundColor: colors.emergencyBg, borderColor: colors.emergencyBorder }]}>
          <MaterialCommunityIcons name="logout" size={18} color={colors.accent} />
          <Text style={[styles.logoutText, { color: colors.accent, fontFamily: "Inter_600SemiBold" }]}>Sign Out</Text>
        </TouchableOpacity>

        <TouchableOpacity activeOpacity={1} onLongPress={handleVersionLongPress} delayLongPress={1200}>
          <Text style={[styles.versionText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
            HIVE COMPANION : Patient Portal v2.0 · IbnCeena Ltd.{"\n"}
            <Text style={{ color: isDark ? "#E8590C" : "#C2410C", fontFamily: "Inter_500Medium" }}>
              Not a medical device — for information and administrative use only.
            </Text>
            {pilotMode ? "\nPilot programme active" : ""}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Hidden pilot activation modal */}
      <Modal visible={pilotModalVisible} transparent animationType="fade" onRequestClose={() => setPilotModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <MaterialCommunityIcons name="key-variant" size={26} color={colors.gold} />
            <Text style={[styles.modalTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
              Pilot Programme Access
            </Text>
            <Text style={[styles.modalSub, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              Enter the access code provided by your pilot site coordinator.
            </Text>
            <TextInput
              style={[styles.modalInput, {
                color: colors.foreground,
                backgroundColor: colors.background,
                borderColor: pilotError ? colors.emergency : colors.border,
                fontFamily: "Inter_500Medium",
              }]}
              placeholder="Access code"
              placeholderTextColor={colors.mutedForeground}
              value={pilotCode}
              onChangeText={(t) => { setPilotCode(t); setPilotError(""); }}
              autoCapitalize="characters"
              autoCorrect={false}
              onSubmitEditing={handlePilotSubmit}
            />
            {pilotError ? (
              <Text style={[styles.modalError, { color: colors.emergency, fontFamily: "Inter_400Regular" }]}>{pilotError}</Text>
            ) : null}
            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setPilotModalVisible(false)}
                style={[styles.modalBtn, { backgroundColor: colors.cardElevated, borderColor: colors.border }]}
              >
                <Text style={[styles.modalBtnText, { color: colors.mutedForeground, fontFamily: "Inter_600SemiBold" }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handlePilotSubmit}
                style={[styles.modalBtn, { backgroundColor: colors.glassGold, borderColor: colors.goldBorder }]}
              >
                <Text style={[styles.modalBtnText, { color: colors.gold, fontFamily: "Inter_600SemiBold" }]}>Activate</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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
  comingRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12 },
  soonBadge: { borderRadius: 8, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 4 },
  soonBadgeText: { fontSize: 9, letterSpacing: 1 },
  dataStatement: { flexDirection: "row", alignItems: "center", gap: 10, borderRadius: 12, borderWidth: 1, padding: 12 },
  dataStatementText: { fontSize: 12.5, lineHeight: 18, flex: 1 },
  deleteBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 12, borderWidth: 1, paddingVertical: 13 },
  deleteBtnText: { fontSize: 14 },
  logoutBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, borderRadius: 14, borderWidth: 1, paddingVertical: 15 },
  logoutText: { fontSize: 15 },
  versionText: { fontSize: 11, textAlign: "center", lineHeight: 18 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", alignItems: "center", justifyContent: "center", padding: 24 },
  modalCard: { width: "100%", maxWidth: 380, borderRadius: 18, borderWidth: 1, padding: 22, alignItems: "center", gap: 10 },
  modalTitle: { fontSize: 17, letterSpacing: -0.3 },
  modalSub: { fontSize: 13, lineHeight: 19, textAlign: "center" },
  modalInput: { width: "100%", borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, textAlign: "center", letterSpacing: 1 },
  modalError: { fontSize: 12 },
  modalBtnRow: { flexDirection: "row", gap: 10, marginTop: 6, width: "100%" },
  modalBtn: { flex: 1, borderRadius: 12, borderWidth: 1, paddingVertical: 13, alignItems: "center" },
  modalBtnText: { fontSize: 14 },
});
