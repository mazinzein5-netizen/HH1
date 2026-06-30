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

const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];

function HoneycombLogo({ size = 44 }: { size?: number }) {
  const colors = useColors();
  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <MaterialCommunityIcons name="hexagon" size={size} color={colors.background} style={StyleSheet.absoluteFill} />
      <MaterialCommunityIcons name="hexagon-outline" size={size} color={colors.gold} style={StyleSheet.absoluteFill} />
      <MaterialCommunityIcons name="heart-flash" size={size * 0.44} color={colors.primary} />
    </View>
  );
}

export default function RegisterScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { register } = useAuth();

  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [dob, setDob] = useState("");
  const [bloodType, setBloodType] = useState("O+");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  async function handleRegister() {
    setError("");
    if (!fullName.trim()) return setError("Full name is required.");
    if (!username.trim()) return setError("Username is required.");
    if (!password) return setError("Password is required.");
    if (password !== confirmPassword) return setError("Passwords do not match.");
    if (password.length < 6) return setError("Password must be at least 6 characters.");
    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const result = await register({ fullName: fullName.trim(), username: username.trim(), email: email.trim(), dateOfBirth: dob.trim(), bloodType, password });
    setLoading(false);
    if (!result.success) {
      setError(result.error ?? "Registration failed");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace("/(app)/(tabs)/dashboard");
    }
  }

  const sectionLabel = (txt: string) => (
    <Text style={{ fontSize: 10, fontFamily: "Inter_600SemiBold", letterSpacing: 1.4, color: colors.mutedForeground }}>{txt}</Text>
  );

  const field = (icon: string, placeholder: string, value: string, onChange: (t: string) => void, opts?: any) => (
    <View style={[styles.inputWrap, { backgroundColor: colors.glass, borderColor: colors.glassBorder }]}>
      <Feather name={icon as any} size={17} color={colors.mutedForeground} />
      <TextInput
        style={[styles.input, { color: colors.foreground, fontFamily: "Inter_400Regular" }]}
        placeholder={placeholder}
        placeholderTextColor={colors.mutedForeground}
        value={value}
        onChangeText={(t) => { onChange(t); setError(""); }}
        autoCapitalize={opts?.autoCapitalize ?? "words"}
        keyboardType={opts?.keyboardType ?? "default"}
      />
    </View>
  );

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: topPad + 16, paddingBottom: bottomPad + 32 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={12} style={[styles.backBtn, { backgroundColor: colors.glass, borderColor: colors.glassBorder }]}>
            <Feather name="arrow-left" size={18} color={colors.foreground} />
          </TouchableOpacity>
          <HoneycombLogo size={40} />
          <View>
            <Text style={[styles.appName, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>IbnCeena</Text>
            <Text style={[styles.appEco, { color: colors.gold, fontFamily: "Inter_600SemiBold" }]}>HEALTH ECOSYSTEM</Text>
          </View>
        </View>

        <Text style={[styles.heading, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>Create Account</Text>
        <Text style={[styles.subheading, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
          Register as a new IbnCeena patient — all data stored securely on your device.
        </Text>

        {sectionLabel("PERSONAL DETAILS")}
        {field("user", "Full Name", fullName, setFullName)}
        {field("at-sign", "Username", username, setUsername, { autoCapitalize: "none" })}
        {field("mail", "Email (optional)", email, setEmail, { autoCapitalize: "none", keyboardType: "email-address" })}
        {field("calendar", "Date of Birth (DD/MM/YYYY)", dob, setDob, { keyboardType: "numbers-and-punctuation" })}

        {sectionLabel("BLOOD TYPE")}
        <View style={[styles.bloodGrid, { backgroundColor: colors.glass, borderColor: colors.glassBorder }]}>
          {BLOOD_TYPES.map((bt) => {
            const active = bloodType === bt;
            return (
              <TouchableOpacity
                key={bt}
                activeOpacity={0.75}
                onPress={() => { Haptics.selectionAsync(); setBloodType(bt); }}
                style={[styles.bloodChip, {
                  backgroundColor: active ? colors.glassPrimary : "transparent",
                  borderWidth: active ? 1.5 : 0,
                  borderColor: active ? colors.primary : "transparent",
                }]}
              >
                <Text style={[styles.bloodChipText, { color: active ? colors.primary : colors.mutedForeground, fontFamily: active ? "Inter_700Bold" : "Inter_400Regular" }]}>
                  {bt}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {sectionLabel("SECURITY")}
        <View style={[styles.inputWrap, { backgroundColor: colors.glass, borderColor: colors.glassBorder }]}>
          <Feather name="lock" size={17} color={colors.mutedForeground} />
          <TextInput
            style={[styles.input, { color: colors.foreground, fontFamily: "Inter_400Regular" }]}
            placeholder="Password (min. 6 characters)"
            placeholderTextColor={colors.mutedForeground}
            value={password}
            onChangeText={(t) => { setPassword(t); setError(""); }}
            secureTextEntry={!showPass}
          />
          <TouchableOpacity onPress={() => setShowPass((v) => !v)} hitSlop={8}>
            <Feather name={showPass ? "eye-off" : "eye"} size={17} color={colors.mutedForeground} />
          </TouchableOpacity>
        </View>
        <View style={[styles.inputWrap, { backgroundColor: colors.glass, borderColor: colors.glassBorder }]}>
          <Feather name="lock" size={17} color={colors.mutedForeground} />
          <TextInput
            style={[styles.input, { color: colors.foreground, fontFamily: "Inter_400Regular" }]}
            placeholder="Confirm Password"
            placeholderTextColor={colors.mutedForeground}
            value={confirmPassword}
            onChangeText={(t) => { setConfirmPassword(t); setError(""); }}
            secureTextEntry={!showPass}
            returnKeyType="done"
            onSubmitEditing={handleRegister}
          />
        </View>

        {error ? (
          <View style={[styles.errorBox, { backgroundColor: colors.emergencyBg, borderColor: colors.emergencyBorder }]}>
            <Feather name="alert-circle" size={14} color={colors.emergency} />
            <Text style={[styles.errorText, { color: colors.emergency, fontFamily: "Inter_400Regular" }]}>{error}</Text>
          </View>
        ) : null}

        <TouchableOpacity activeOpacity={0.85} onPress={handleRegister} disabled={loading} style={{ opacity: loading ? 0.7 : 1 }}>
          <LinearGradient colors={["#C9860A", "#D4A017", "#C9860A"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.btn}>
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={[styles.btnText, { fontFamily: "Inter_700Bold" }]}>Create Patient Account</Text>
            }
          </LinearGradient>
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>Already registered? </Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={[styles.footerLink, { color: colors.goldLight, fontFamily: "Inter_600SemiBold" }]}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: 20, gap: 12 },
  header: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 4 },
  backBtn: { borderRadius: 10, borderWidth: 1, padding: 8 },
  appName: { fontSize: 18, letterSpacing: -0.4 },
  appEco: { fontSize: 9, letterSpacing: 1.5 },
  heading: { fontSize: 26, letterSpacing: -0.5 },
  subheading: { fontSize: 13, lineHeight: 19, marginBottom: 4 },
  inputWrap: { flexDirection: "row", alignItems: "center", borderRadius: 14, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  input: { flex: 1, fontSize: 15 },
  bloodGrid: { flexDirection: "row", flexWrap: "wrap", borderRadius: 14, borderWidth: 1, padding: 6, gap: 6 },
  bloodChip: { paddingHorizontal: 18, paddingVertical: 9, borderRadius: 9 },
  bloodChipText: { fontSize: 14 },
  errorBox: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 10, borderWidth: 1, padding: 12 },
  errorText: { fontSize: 13, flex: 1 },
  btn: { borderRadius: 14, paddingVertical: 16, alignItems: "center" },
  btnText: { color: "#fff", fontSize: 16 },
  footer: { flexDirection: "row", justifyContent: "center", marginTop: 4 },
  footerText: { fontSize: 14 },
  footerLink: { fontSize: 14 },
});
