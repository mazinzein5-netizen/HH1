import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";

function HoneycombLogo({ size = 52 }: { size?: number }) {
  const colors = useColors();
  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <MaterialCommunityIcons name="hexagon" size={size} color={colors.background} style={StyleSheet.absoluteFill} />
      <MaterialCommunityIcons name="hexagon-outline" size={size} color={colors.gold} style={StyleSheet.absoluteFill} />
      <MaterialCommunityIcons name="heart-flash" size={size * 0.44} color={colors.primary} />
    </View>
  );
}

function HoneycombBg() {
  const positions = [
    { top: -20, left: -30, size: 110 }, { top: -20, left: 60, size: 90 }, { top: -20, left: 140, size: 110 },
    { top: 50, left: 10, size: 80 },   { top: 50, left: 100, size: 100 },{ top: 50, left: 200, size: 80 },
    { top: 110, left: -20, size: 90 }, { top: 110, left: 70, size: 110 }, { top: 110, left: 160, size: 90 },
  ];
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {positions.map((p, i) => (
        <MaterialCommunityIcons
          key={i}
          name="hexagon-outline"
          size={p.size}
          color="rgba(201,134,10,0.06)"
          style={{ position: "absolute", top: p.top, left: p.left }}
        />
      ))}
    </View>
  );
}

export default function LoginScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { login, loginAsGuest } = useAuth();

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
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: topPad + 28, paddingBottom: bottomPad + 32 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Honeycomb hero area */}
        <View style={[styles.heroArea, { backgroundColor: colors.goldBg, borderColor: colors.goldBorder }]}>
          <HoneycombBg />
          <View style={styles.logoRow}>
            <HoneycombLogo size={58} />
            <View>
              <Text style={[styles.appName, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>IbnCeena</Text>
              <Text style={[styles.appEco, { color: colors.gold, fontFamily: "Inter_600SemiBold" }]}>HEALTH ECOSYSTEM</Text>
            </View>
          </View>
          <Text style={[styles.heroTagline, { color: "rgba(255,255,255,0.85)", fontFamily: "Inter_700Bold" }]}>
            Secure Patient{"\n"}
            <Text style={{ color: colors.goldLight }}>Access Portal.</Text>
          </Text>
          <Text style={[styles.heroSub, { color: "rgba(255,255,255,0.5)", fontFamily: "Inter_400Regular" }]}>
            Clinical-grade triage · Emergency health card · Telemedicine
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
            <MaterialCommunityIcons name="incognito" size={18} color={colors.mutedForeground} />
            <Text style={[styles.guestText, { color: colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>
              Continue as Guest — Demo Patient
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.disclaimer, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
          IbnCeena Health Ecosystem · GDPR Compliant · HSE Approved Framework
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: 20, gap: 20 },
  heroArea: { borderRadius: 22, padding: 28, gap: 14, overflow: "hidden", borderWidth: 1 },
  logoRow: { flexDirection: "row", alignItems: "center", gap: 14 },
  appName: { fontSize: 24, letterSpacing: -0.5 },
  appEco: { fontSize: 10, letterSpacing: 1.6 },
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
