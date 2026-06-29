import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
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
    const result = await register({
      fullName: fullName.trim(),
      username: username.trim(),
      email: email.trim(),
      dateOfBirth: dob.trim(),
      bloodType,
      password,
    });
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
      <StatusBar barStyle="dark-content" />
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: topPad + 20, paddingBottom: bottomPad + 32 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          hitSlop={12}
        >
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>

        <View style={styles.header}>
          <View style={[styles.logoWrap, { backgroundColor: colors.primary }]}>
            <MaterialCommunityIcons name="account-plus" size={28} color="#fff" />
          </View>
          <Text style={[styles.heading, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
            Create Account
          </Text>
          <Text style={[styles.subheading, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
            Register as a new patient
          </Text>
        </View>

        <View style={styles.form}>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>PERSONAL DETAILS</Text>

          <Field icon="user" placeholder="Full Name" value={fullName} onChangeText={(t) => { setFullName(t); setError(""); }} colors={colors} />
          <Field icon="at-sign" placeholder="Username" value={username} onChangeText={(t) => { setUsername(t); setError(""); }} colors={colors} autoCapitalize="none" />
          <Field icon="mail" placeholder="Email (optional)" value={email} onChangeText={setEmail} colors={colors} autoCapitalize="none" keyboardType="email-address" />
          <Field icon="calendar" placeholder="Date of Birth (DD/MM/YYYY)" value={dob} onChangeText={setDob} colors={colors} keyboardType="numbers-and-punctuation" />

          <Text style={[styles.sectionLabel, { color: colors.mutedForeground, marginTop: 8 }]}>BLOOD TYPE</Text>
          <View style={[styles.bloodGrid, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {BLOOD_TYPES.map((bt) => {
              const active = bloodType === bt;
              return (
                <TouchableOpacity
                  key={bt}
                  activeOpacity={0.75}
                  onPress={() => { Haptics.selectionAsync(); setBloodType(bt); }}
                  style={[
                    styles.bloodChip,
                    { backgroundColor: active ? colors.primary : "transparent" },
                  ]}
                >
                  <Text
                    style={[
                      styles.bloodChipText,
                      {
                        color: active ? "#fff" : colors.mutedForeground,
                        fontFamily: active ? "Inter_600SemiBold" : "Inter_400Regular",
                      },
                    ]}
                  >
                    {bt}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={[styles.sectionLabel, { color: colors.mutedForeground, marginTop: 8 }]}>SECURITY</Text>

          <View style={[styles.inputWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="lock" size={18} color={colors.mutedForeground} />
            <TextInput
              style={[styles.input, { color: colors.foreground, fontFamily: "Inter_400Regular" }]}
              placeholder="Password (min. 6 characters)"
              placeholderTextColor={colors.mutedForeground}
              value={password}
              onChangeText={(t) => { setPassword(t); setError(""); }}
              secureTextEntry={!showPass}
            />
            <TouchableOpacity onPress={() => setShowPass((v) => !v)} hitSlop={8}>
              <Feather name={showPass ? "eye-off" : "eye"} size={18} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>

          <View style={[styles.inputWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="lock" size={18} color={colors.mutedForeground} />
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

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleRegister}
            disabled={loading}
            style={[styles.btn, { backgroundColor: colors.primary, opacity: loading ? 0.7 : 1 }]}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={[styles.btnText, { fontFamily: "Inter_600SemiBold" }]}>Create Account</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>Already have an account? </Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={[styles.footerLink, { color: colors.primary, fontFamily: "Inter_600SemiBold" }]}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

function Field({
  icon, placeholder, value, onChangeText, colors, autoCapitalize, keyboardType,
}: any) {
  return (
    <View style={[styles.inputWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Feather name={icon} size={18} color={colors.mutedForeground} />
      <TextInput
        style={[styles.input, { color: colors.foreground, fontFamily: "Inter_400Regular" }]}
        placeholder={placeholder}
        placeholderTextColor={colors.mutedForeground}
        value={value}
        onChangeText={onChangeText}
        autoCapitalize={autoCapitalize ?? "words"}
        keyboardType={keyboardType ?? "default"}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: 24 },
  backBtn: { marginBottom: 16 },
  header: { alignItems: "center", marginBottom: 28 },
  logoWrap: { width: 56, height: 56, borderRadius: 16, alignItems: "center", justifyContent: "center", marginBottom: 12 },
  heading: { fontSize: 24, letterSpacing: -0.5, marginBottom: 4 },
  subheading: { fontSize: 14 },
  form: { gap: 12 },
  sectionLabel: { fontSize: 11, fontFamily: "Inter_600SemiBold", letterSpacing: 1.2, marginBottom: -4, marginLeft: 2 },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  input: { flex: 1, fontSize: 15 },
  bloodGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    borderRadius: 14,
    borderWidth: 1,
    padding: 6,
    gap: 6,
  },
  bloodChip: { paddingHorizontal: 18, paddingVertical: 9, borderRadius: 9 },
  bloodChipText: { fontSize: 14 },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
  },
  errorText: { fontSize: 13, flex: 1 },
  btn: { borderRadius: 14, paddingVertical: 16, alignItems: "center", marginTop: 4 },
  btnText: { color: "#fff", fontSize: 16 },
  footer: { flexDirection: "row", justifyContent: "center", marginTop: 24 },
  footerText: { fontSize: 14 },
  footerLink: { fontSize: 14 },
});
