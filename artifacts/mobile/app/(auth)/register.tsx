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

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: topPad + 20, paddingBottom: bottomPad + 32 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} hitSlop={12}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>

        <Text style={[styles.heading, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>Create Account</Text>
        <Text style={[styles.subheading, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
          Register as a new IbnCeena patient
        </Text>

        <View style={styles.form}>
          <Label colors={colors}>PERSONAL DETAILS</Label>
          <Field icon="user" placeholder="Full Name" value={fullName} onChangeText={(t: string) => { setFullName(t); setError(""); }} colors={colors} />
          <Field icon="at-sign" placeholder="Username" value={username} onChangeText={(t: string) => { setUsername(t); setError(""); }} colors={colors} autoCapitalize="none" />
          <Field icon="mail" placeholder="Email (optional)" value={email} onChangeText={setEmail} colors={colors} autoCapitalize="none" keyboardType="email-address" />
          <Field icon="calendar" placeholder="Date of Birth (DD/MM/YYYY)" value={dob} onChangeText={setDob} colors={colors} keyboardType="numbers-and-punctuation" />

          <Label colors={colors} style={{ marginTop: 4 }}>BLOOD TYPE</Label>
          <View style={[styles.bloodGrid, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {BLOOD_TYPES.map((bt) => {
              const active = bloodType === bt;
              return (
                <TouchableOpacity key={bt} activeOpacity={0.75} onPress={() => { Haptics.selectionAsync(); setBloodType(bt); }}
                  style={[styles.bloodChip, { backgroundColor: active ? colors.primary : "transparent" }]}>
                  <Text style={[styles.bloodChipText, { color: active ? "#fff" : colors.mutedForeground, fontFamily: active ? "Inter_600SemiBold" : "Inter_400Regular" }]}>{bt}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Label colors={colors} style={{ marginTop: 4 }}>SECURITY</Label>
          <View style={[styles.inputWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="lock" size={17} color={colors.mutedForeground} />
            <TextInput style={[styles.input, { color: colors.foreground, fontFamily: "Inter_400Regular" }]}
              placeholder="Password (min. 6 characters)" placeholderTextColor={colors.mutedForeground}
              value={password} onChangeText={(t) => { setPassword(t); setError(""); }} secureTextEntry={!showPass} />
            <TouchableOpacity onPress={() => setShowPass((v) => !v)} hitSlop={8}>
              <Feather name={showPass ? "eye-off" : "eye"} size={17} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>
          <View style={[styles.inputWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="lock" size={17} color={colors.mutedForeground} />
            <TextInput style={[styles.input, { color: colors.foreground, fontFamily: "Inter_400Regular" }]}
              placeholder="Confirm Password" placeholderTextColor={colors.mutedForeground}
              value={confirmPassword} onChangeText={(t) => { setConfirmPassword(t); setError(""); }}
              secureTextEntry={!showPass} returnKeyType="done" onSubmitEditing={handleRegister} />
          </View>

          {error ? (
            <View style={[styles.errorBox, { backgroundColor: colors.emergencyBg, borderColor: colors.emergencyBorder }]}>
              <Feather name="alert-circle" size={14} color={colors.emergency} />
              <Text style={[styles.errorText, { color: colors.emergency, fontFamily: "Inter_400Regular" }]}>{error}</Text>
            </View>
          ) : null}

          <TouchableOpacity activeOpacity={0.85} onPress={handleRegister} disabled={loading} style={[styles.btn, { opacity: loading ? 0.7 : 1 }]}>
            <LinearGradient colors={["#3055e8", "#4F6EF7"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.btnGrad}>
              {loading ? <ActivityIndicator color="#fff" /> : (
                <Text style={[styles.btnText, { fontFamily: "Inter_600SemiBold" }]}>Create Account</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>Already registered? </Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={[styles.footerLink, { color: colors.primary, fontFamily: "Inter_600SemiBold" }]}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

function Label({ children, colors, style }: any) {
  return <Text style={[{ fontSize: 10, fontFamily: "Inter_600SemiBold", letterSpacing: 1.4, color: colors.mutedForeground, marginBottom: -4 }, style]}>{children}</Text>;
}

function Field({ icon, placeholder, value, onChangeText, colors, autoCapitalize, keyboardType }: any) {
  return (
    <View style={[styles.inputWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Feather name={icon} size={17} color={colors.mutedForeground} />
      <TextInput style={[styles.input, { color: colors.foreground, fontFamily: "Inter_400Regular" }]}
        placeholder={placeholder} placeholderTextColor={colors.mutedForeground}
        value={value} onChangeText={onChangeText}
        autoCapitalize={autoCapitalize ?? "words"}
        keyboardType={keyboardType ?? "default"} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: 20, gap: 12 },
  backBtn: { marginBottom: 4 },
  heading: { fontSize: 26, letterSpacing: -0.5 },
  subheading: { fontSize: 14, marginBottom: 4 },
  form: { gap: 10 },
  inputWrap: { flexDirection: "row", alignItems: "center", borderRadius: 14, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  input: { flex: 1, fontSize: 15 },
  bloodGrid: { flexDirection: "row", flexWrap: "wrap", borderRadius: 14, borderWidth: 1, padding: 6, gap: 6 },
  bloodChip: { paddingHorizontal: 18, paddingVertical: 9, borderRadius: 9 },
  bloodChipText: { fontSize: 14 },
  errorBox: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 10, borderWidth: 1, padding: 12 },
  errorText: { fontSize: 13, flex: 1 },
  btn: { borderRadius: 14, overflow: "hidden" },
  btnGrad: { paddingVertical: 16, alignItems: "center" },
  btnText: { color: "#fff", fontSize: 16 },
  footer: { flexDirection: "row", justifyContent: "center", marginTop: 4 },
  footerText: { fontSize: 14 },
  footerLink: { fontSize: 14 },
});
