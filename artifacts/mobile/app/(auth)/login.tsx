import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import ThemedStatusBar from "@/components/ThemedStatusBar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import HiveLogo from "@/components/HiveLogo";
import HoneycombWallpaper from "@/components/HoneycombWallpaper";
import { useAuth } from "@/context/AuthContext";
import { useLogoTheme } from "@/context/LogoThemeContext";
import { useColors } from "@/hooks/useColors";
import { useTheme } from "@/context/ThemeContext";

export default function LoginScreen() {
  const colors = useColors();
  const { isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { login, loginAsGuest } = useAuth();
  const { prefs } = useLogoTheme();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  async function handleLogin() {
    if (!username.trim() || !password) { setError("Please enter your username and password."); return; }
    setError(""); setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const result = await login(username.trim(), password);
    setLoading(false);
    if (!result.success) {
      setError(result.error ?? "Login failed");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace("/(app)/(tabs)/dashboard");
    }
  }

  async function handleGuest() {
    Haptics.selectionAsync();
    await loginAsGuest();
    router.replace("/(app)/(tabs)/dashboard");
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ThemedStatusBar />
      <HoneycombWallpaper density={prefs.density} />
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: topPad + 28, paddingBottom: bottomPad + 32 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Honeycomb hero area */}
        <View style={[styles.heroArea, { backgroundColor: colors.goldBg, borderColor: colors.goldBorder }]}>
          <HoneycombWallpaper density={prefs.density} />
          <View style={styles.logoRow}>
            <HiveLogo
              size={36}
              goldIntensity={prefs.goldIntensity}
              depth={prefs.depth}
              textWeight={prefs.textWeight}
              showText
            />
          </View>
          <Text style={[styles.heroTagline, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
            Secure Patient{"\n"}
            <Text style={{ color: colors.goldLight }}>Access Portal.</Text>
          </Text>
          <Text style={[styles.heroSub, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
            Health questionnaires · Emergency health card · Secure records
          </Text>
        </View>

        {/* Form */}
        <View style={styles.formSection}>
          <Text style={[styles.formHeading, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>Sign In</Text>
          <Text style={[styles.formSub, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
            Enter your patient credentials
          </Text>

          <View style={[styles.inputWrap, { backgroundColor: colors.glass, borderColor: colors.glassBorder }]}>
            <Feather name="user" size={17} color={colors.mutedForeground} />
            <TextInput
              style={[styles.input, { color: colors.foreground, fontFamily: "Inter_400Regular" }]}
              placeholder="Username"
              placeholderTextColor={colors.mutedForeground}
              value={username}
              onChangeText={(t) => { setUsername(t); setError(""); }}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
            />
          </View>

          <View style={[styles.inputWrap, { backgroundColor: colors.glass, borderColor: colors.glassBorder }]}>
            <Feather name="lock" size={17} color={colors.mutedForeground} />
            <TextInput
              style={[styles.input, { color: colors.foreground, fontFamily: "Inter_400Regular" }]}
              placeholder="Password"
              placeholderTextColor={colors.mutedForeground}
              value={password}
              onChangeText={(t) => { setPassword(t); setError(""); }}
              secureTextEntry={!showPass}
              returnKeyType="done"
              onSubmitEditing={handleLogin}
            />
            <TouchableOpacity onPress={() => setShowPass((v) => !v)} hitSlop={8}>
              <Feather name={showPass ? "eye-off" : "eye"} size={17} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>

          {error ? (
            <View style={[styles.errorBox, { backgroundColor: colors.emergencyBg, borderColor: colors.emergencyBorder }]}>
              <Feather name="alert-circle" size={14} color={colors.emergency} />
              <Text style={[styles.errorText, { color: colors.emergency, fontFamily: "Inter_400Regular" }]}>{error}</Text>
            </View>
          ) : null}

          <TouchableOpacity activeOpacity={0.85} onPress={handleLogin} disabled={loading} style={{ opacity: loading ? 0.7 : 1 }}>
            <LinearGradient colors={["#C9860A", "#D4A017", "#C9860A"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.btn}>
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={[styles.btnText, { fontFamily: "Inter_700Bold" }]}>Sign In</Text>
              }
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>New patient? </Text>
            <TouchableOpacity onPress={() => router.push("/(auth)/register")}>
              <Text style={[styles.footerLink, { color: colors.goldLight, fontFamily: "Inter_600SemiBold" }]}>Register</Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.divider, { borderTopColor: colors.border }]}>
            <Text style={[styles.dividerText, { backgroundColor: colors.background, color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              or
            </Text>
          </View>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleGuest}
            style={[styles.guestBtn, { backgroundColor: colors.glass, borderColor: colors.glassBorder }]}
          >
            <Feather name="user" size={18} color={colors.mutedForeground} />
            <Text style={[styles.guestText, { color: colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>
              Continue as Guest — Demo Patient
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.disclaimer, { color: isDark ? "#E8590C" : "#C2410C", fontFamily: "Inter_500Medium" }]}>
          HIVE COMPANION · GDPR Compliant · Not a medical device — for information and administrative use only
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: 20, gap: 20 },
  heroArea: { borderRadius: 22, padding: 28, gap: 14, overflow: "hidden", borderWidth: 1 },
  logoRow: { alignItems: "flex-start" },
  heroTagline: { fontSize: 26, letterSpacing: -0.5, lineHeight: 34 },
  heroSub: { fontSize: 12, lineHeight: 18 },
  formSection: { gap: 12 },
  formHeading: { fontSize: 22, letterSpacing: -0.3 },
  formSub: { fontSize: 14, marginBottom: 4 },
  inputWrap: { flexDirection: "row", alignItems: "center", borderRadius: 14, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  input: { flex: 1, fontSize: 15 },
  errorBox: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 10, borderWidth: 1, padding: 12 },
  errorText: { fontSize: 13, flex: 1 },
  btn: { borderRadius: 14, paddingVertical: 16, alignItems: "center" },
  btnText: { color: "#fff", fontSize: 16 },
  footer: { flexDirection: "row", justifyContent: "center" },
  footerText: { fontSize: 14 },
  footerLink: { fontSize: 14 },
  divider: { borderTopWidth: 1, alignItems: "center", marginVertical: 4 },
  dividerText: { marginTop: -9, paddingHorizontal: 12, fontSize: 12 },
  guestBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, borderRadius: 14, borderWidth: 1, paddingVertical: 14 },
  guestText: { fontSize: 14 },
  disclaimer: { fontSize: 11, textAlign: "center", lineHeight: 16 },
});
