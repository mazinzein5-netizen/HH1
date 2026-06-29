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

function HexLogo({ size = 52 }: { size?: number }) {
  const colors = useColors();
  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <MaterialCommunityIcons name="hexagon-outline" size={size} color={colors.primary} style={StyleSheet.absoluteFill} />
      <MaterialCommunityIcons name="heart-flash" size={size * 0.44} color={colors.primary} />
    </View>
  );
}

export default function LoginScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { login } = useAuth();

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

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: topPad + 40, paddingBottom: bottomPad + 32 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Logo */}
        <View style={styles.logoBlock}>
          <HexLogo size={56} />
          <View>
            <Text style={[styles.appName, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>IbnCeena</Text>
            <Text style={[styles.appEco, { color: colors.primary, fontFamily: "Inter_600SemiBold" }]}>HEALTH ECOSYSTEM</Text>
          </View>
        </View>

        {/* Hero gradient card */}
        <LinearGradient colors={["#0f1560", "#151ea0", "#0f1560"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.heroCard}>
          <Text style={[styles.heroLine1, { fontFamily: "Inter_700Bold" }]}>Secure Patient</Text>
          <Text style={[styles.heroLine2, { color: colors.primaryLight, fontFamily: "Inter_700Bold" }]}>Access Portal.</Text>
        </LinearGradient>

        <View style={styles.formCard}>
          <Text style={[styles.formHeading, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>Sign In</Text>
          <Text style={[styles.formSub, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
            Enter your patient credentials
          </Text>

          <View style={[styles.inputWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
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

          <View style={[styles.inputWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
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

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleLogin}
            disabled={loading}
            style={[styles.btn, { opacity: loading ? 0.7 : 1 }]}
          >
            <LinearGradient colors={["#3055e8", "#4F6EF7"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.btnGrad}>
              {loading ? <ActivityIndicator color="#fff" /> : (
                <Text style={[styles.btnText, { fontFamily: "Inter_600SemiBold" }]}>Sign In</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>New patient? </Text>
            <TouchableOpacity onPress={() => router.push("/(auth)/register")}>
              <Text style={[styles.footerLink, { color: colors.primary, fontFamily: "Inter_600SemiBold" }]}>Register</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: 20, gap: 20 },
  logoBlock: { flexDirection: "row", alignItems: "center", gap: 14 },
  appName: { fontSize: 24, letterSpacing: -0.5 },
  appEco: { fontSize: 10, letterSpacing: 1.4 },
  heroCard: { borderRadius: 18, padding: 24 },
  heroLine1: { fontSize: 24, color: "#fff", letterSpacing: -0.3 },
  heroLine2: { fontSize: 24, letterSpacing: -0.3 },
  formCard: { gap: 12 },
  formHeading: { fontSize: 22, letterSpacing: -0.3 },
  formSub: { fontSize: 14, marginBottom: 4 },
  inputWrap: { flexDirection: "row", alignItems: "center", borderRadius: 14, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  input: { flex: 1, fontSize: 15 },
  errorBox: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 10, borderWidth: 1, padding: 12 },
  errorText: { fontSize: 13, flex: 1 },
  btn: { borderRadius: 14, overflow: "hidden" },
  btnGrad: { paddingVertical: 16, alignItems: "center" },
  btnText: { color: "#fff", fontSize: 16 },
  footer: { flexDirection: "row", justifyContent: "center", marginTop: 8 },
  footerText: { fontSize: 14 },
  footerLink: { fontSize: 14 },
});
