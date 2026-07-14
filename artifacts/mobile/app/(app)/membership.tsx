import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";
import {
  IdentityRecord,
  STATUS_META,
  attachIdDocument,
  captureSelfie,
  getIdentity,
  verificationStatus,
} from "@/utils/identityStore";
import {
  InsuranceDetails,
  METHOD_META,
  MembershipPlan,
  MembershipRecord,
  PLAN_META,
  PaymentMethod,
  getMembership,
  getTrialInfo,
  makeReference,
  saveMembership,
} from "@/utils/membershipStore";

export default function MembershipScreen() {
  const colors = useColors();
  const { user } = useAuth();

  const [identity, setIdentity] = useState<IdentityRecord | null>(null);
  const [membership, setMembership] = useState<MembershipRecord | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState<"selfie" | "id" | "confirm" | null>(null);
  const [editing, setEditing] = useState(false);

  const [plan, setPlan] = useState<MembershipPlan>("essential");
  const [method, setMethod] = useState<PaymentMethod>("online");
  const [insurer, setInsurer] = useState("");
  const [policyNumber, setPolicyNumber] = useState("");
  const [memberId, setMemberId] = useState("");
  const [error, setError] = useState("");

  const userId = user?.id ?? "unknown";
  const isGuest = !!user?.isGuest;
  const trial = getTrialInfo(user?.createdAt ?? new Date().toISOString());
  const vStatus = verificationStatus(identity);
  const verified = vStatus === "pending_review";
  const statusMeta = STATUS_META[vStatus];

  const refresh = useCallback(async () => {
    const [idRec, mem] = await Promise.all([getIdentity(userId), getMembership(userId)]);
    setIdentity(idRec);
    setMembership(mem);
    if (mem) {
      setPlan(mem.plan);
      setMethod(mem.method);
      setInsurer(mem.insurance?.provider ?? "");
      setPolicyNumber(mem.insurance?.policyNumber ?? "");
      setMemberId(mem.insurance?.memberId ?? "");
    }
    setLoaded(true);
  }, [userId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function handleSelfie() {
    Haptics.selectionAsync();
    try {
      setBusy("selfie");
      const rec = await captureSelfie(userId);
      if (rec) {
        setIdentity(rec);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (e: any) {
      Alert.alert("Selfie", e?.message ?? "Could not open the camera. Please try again.");
    } finally {
      setBusy(null);
    }
  }

  async function handleIdDoc() {
    Haptics.selectionAsync();
    try {
      setBusy("id");
      const rec = await attachIdDocument(userId);
      if (rec) {
        setIdentity(rec);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch {
      Alert.alert("Photo ID", "Could not attach that file. Please try again.");
    } finally {
      setBusy(null);
    }
  }

  async function handleConfirm() {
    setError("");
    if (!verified) {
      setError("Please complete identity verification (Step 1) first.");
      return;
    }
    let insurance: InsuranceDetails | undefined;
    if (method === "insurance") {
      if (!insurer.trim() || !policyNumber.trim()) {
        setError("Please enter your insurer name and policy number.");
        return;
      }
      insurance = {
        provider: insurer.trim(),
        policyNumber: policyNumber.trim(),
        memberId: memberId.trim() || undefined,
      };
    }
    try {
      setBusy("confirm");
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const rec: MembershipRecord = {
        userId,
        plan,
        method,
        insurance,
        reference: membership?.reference ?? makeReference(),
        status: "pending",
        chosenAt: new Date().toISOString(),
      };
      await saveMembership(rec);
      setMembership(rec);
      setEditing(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      setError("Could not save your membership choice. Please try again.");
    } finally {
      setBusy(null);
    }
  }

  function paymentInstructions(rec: MembershipRecord): string {
    switch (rec.method) {
      case "online":
        return "Online card payment activates with the pilot programme. Keep your reference — you can also settle it at any partner HIVE node.";
      case "insurance":
        return `Your ${rec.insurance?.provider ?? "insurer"} details are saved on this device. Staff at your HIVE node will confirm cover using your reference.`;
      case "cash":
        return "Show this reference at any partner HIVE node and pay in cash. Your membership activates on the spot.";
    }
  }

  const sectionTitle = (step: string, title: string) => (
    <View style={styles.sectionHead}>
      <View style={[styles.stepBadge, { backgroundColor: colors.glassPrimary, borderColor: colors.primary }]}>
        <Text style={[styles.stepBadgeText, { color: colors.primary, fontFamily: "Inter_700Bold" }]}>{step}</Text>
      </View>
      <Text style={[styles.sectionTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>{title}</Text>
    </View>
  );

  if (!loaded) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background, alignItems: "center", justifyContent: "center" }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  const showChooser = !membership || editing;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Status card */}
        <LinearGradient
          colors={["#1F2937", "#111827"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.statusCard}
        >
          <View style={styles.statusTop}>
            <MaterialCommunityIcons
              name={membership ? (PLAN_META[membership.plan].icon as any) : "gift-outline"}
              size={26}
              color="#D4A017"
            />
            <View style={{ flex: 1 }}>
              <Text style={[styles.statusTitle, { fontFamily: "Inter_700Bold" }]}>
                {isGuest
                  ? "Demo account"
                  : membership
                    ? PLAN_META[membership.plan].label
                    : trial.expired
                      ? "Free trial ended"
                      : "Free Trial"}
              </Text>
              <Text style={[styles.statusSub, { fontFamily: "Inter_400Regular" }]}>
                {isGuest
                  ? "Create your own account to start a free trial."
                  : membership
                    ? membership.status === "active"
                      ? "Membership active"
                      : `Awaiting payment · ${METHOD_META[membership.method].label}`
                    : trial.expired
                      ? "Choose a membership below to keep full access."
                      : `${trial.daysLeft} day${trial.daysLeft === 1 ? "" : "s"} left — every account starts free.`}
              </Text>
            </View>
          </View>
          {membership ? (
            <View style={styles.refBox}>
              <Text style={[styles.refLabel, { fontFamily: "Inter_600SemiBold" }]}>PAYMENT REFERENCE</Text>
              <Text style={[styles.refValue, { fontFamily: "Inter_700Bold" }]}>{membership.reference}</Text>
              <Text style={[styles.refHint, { fontFamily: "Inter_400Regular" }]}>
                {paymentInstructions(membership)}
              </Text>
            </View>
          ) : null}
        </LinearGradient>

        {isGuest ? (
          <View style={[styles.card, { backgroundColor: colors.glass, borderColor: colors.glassBorder }]}>
            <View style={styles.vStatusRow}>
              <MaterialCommunityIcons name="account-alert-outline" size={18} color={colors.gold} />
              <Text style={[styles.vStatusText, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
                You're browsing the demo
              </Text>
            </View>
            <Text style={[styles.cardBody, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              Identity verification and membership are personal to your own account. Create one to start your
              free 30-day trial — then add your selfie and photo ID and choose how you'd like to pay.
            </Text>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => { Haptics.selectionAsync(); router.push("/(auth)/register"); }}
            >
              <LinearGradient colors={["#C9860A", "#D4A017", "#C9860A"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.confirmBtn}>
                <Text style={[styles.confirmText, { fontFamily: "Inter_700Bold" }]}>Create My Account</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        ) : (
        <>
        {/* Step 1 — identity verification */}
        {sectionTitle("1", "Verify your identity")}
        <View style={[styles.card, { backgroundColor: colors.glass, borderColor: colors.glassBorder }]}>
          <View style={styles.vStatusRow}>
            <MaterialCommunityIcons name={statusMeta.icon as any} size={18} color={statusMeta.hex} />
            <Text style={[styles.vStatusText, { color: statusMeta.hex, fontFamily: "Inter_600SemiBold" }]}>
              {statusMeta.label}
            </Text>
          </View>
          <Text style={[styles.cardBody, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
            Membership needs identity verification: add a selfie and a photo ID (passport, driving licence or
            public services card). Both stay on this device — staff verify them in person at your HIVE node.
          </Text>

          <View style={styles.vRow}>
            <MaterialCommunityIcons
              name={identity?.selfieUri ? "check-circle" : "camera-account"}
              size={22}
              color={identity?.selfieUri ? "#047857" : colors.mutedForeground}
            />
            <View style={{ flex: 1 }}>
              <Text style={[styles.vRowTitle, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>Selfie</Text>
              <Text style={[styles.vRowSub, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                {identity?.selfieUri ? "Added" : Platform.OS === "web" ? "Upload a clear photo of your face" : "Take a clear photo of your face"}
              </Text>
            </View>
            <TouchableOpacity
              onPress={handleSelfie}
              disabled={busy !== null}
              style={[styles.vBtn, { backgroundColor: colors.glassPrimary, borderColor: colors.primary }]}
            >
              {busy === "selfie"
                ? <ActivityIndicator size="small" color={colors.primary} />
                : <Text style={[styles.vBtnText, { color: colors.primary, fontFamily: "Inter_600SemiBold" }]}>
                    {identity?.selfieUri ? "Retake" : Platform.OS === "web" ? "Upload" : "Take"}
                  </Text>}
            </TouchableOpacity>
          </View>

          <View style={styles.vRow}>
            <MaterialCommunityIcons
              name={identity?.idDocUri ? "check-circle" : "card-account-details-outline"}
              size={22}
              color={identity?.idDocUri ? "#047857" : colors.mutedForeground}
            />
            <View style={{ flex: 1 }}>
              <Text style={[styles.vRowTitle, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>Photo ID</Text>
              <Text style={[styles.vRowSub, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]} numberOfLines={1}>
                {identity?.idDocName ?? "Passport, driving licence or PSC"}
              </Text>
            </View>
            <TouchableOpacity
              onPress={handleIdDoc}
              disabled={busy !== null}
              style={[styles.vBtn, { backgroundColor: colors.glassPrimary, borderColor: colors.primary }]}
            >
              {busy === "id"
                ? <ActivityIndicator size="small" color={colors.primary} />
                : <Text style={[styles.vBtnText, { color: colors.primary, fontFamily: "Inter_600SemiBold" }]}>
                    {identity?.idDocUri ? "Replace" : "Upload"}
                  </Text>}
            </TouchableOpacity>
          </View>
        </View>

        {/* Step 2 — membership */}
        {sectionTitle("2", "Choose your membership")}
        {!verified ? (
          <View style={[styles.lockCard, { backgroundColor: colors.glass, borderColor: colors.glassBorder }]}>
            <MaterialCommunityIcons name="lock-outline" size={18} color={colors.mutedForeground} />
            <Text style={[styles.lockText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              Complete Step 1 first — membership needs identity verification. Your free trial keeps working in the meantime.
            </Text>
          </View>
        ) : showChooser ? (
          <View style={{ gap: 10 }}>
            {(Object.keys(PLAN_META) as MembershipPlan[]).map((p) => {
              const meta = PLAN_META[p];
              const active = plan === p;
              return (
                <TouchableOpacity
                  key={p}
                  activeOpacity={0.8}
                  onPress={() => { Haptics.selectionAsync(); setPlan(p); }}
                  style={[styles.planCard, {
                    backgroundColor: active ? colors.glassPrimary : colors.glass,
                    borderColor: active ? colors.primary : colors.glassBorder,
                    borderWidth: active ? 1.5 : 1,
                  }]}
                >
                  <MaterialCommunityIcons name={meta.icon as any} size={24} color={active ? colors.primary : colors.mutedForeground} />
                  <View style={{ flex: 1 }}>
                    <View style={styles.planTop}>
                      <Text style={[styles.planName, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>{meta.label}</Text>
                      <Text style={[styles.planPrice, { color: active ? colors.primary : colors.mutedForeground, fontFamily: "Inter_700Bold" }]}>{meta.price}</Text>
                    </View>
                    <Text style={[styles.planBlurb, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>{meta.blurb}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}

            <Text style={[styles.payLabel, { color: colors.mutedForeground, fontFamily: "Inter_600SemiBold" }]}>HOW WOULD YOU LIKE TO PAY?</Text>
            {(Object.keys(METHOD_META) as PaymentMethod[]).map((m) => {
              const meta = METHOD_META[m];
              const active = method === m;
              return (
                <TouchableOpacity
                  key={m}
                  activeOpacity={0.8}
                  onPress={() => { Haptics.selectionAsync(); setMethod(m); setError(""); }}
                  style={[styles.methodCard, {
                    backgroundColor: active ? colors.glassPrimary : colors.glass,
                    borderColor: active ? colors.primary : colors.glassBorder,
                    borderWidth: active ? 1.5 : 1,
                  }]}
                >
                  <MaterialCommunityIcons name={meta.icon as any} size={22} color={active ? colors.primary : colors.mutedForeground} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.methodName, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>{meta.label}</Text>
                    <Text style={[styles.methodBlurb, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>{meta.blurb}</Text>
                  </View>
                  <MaterialCommunityIcons
                    name={active ? "radiobox-marked" : "radiobox-blank"}
                    size={20}
                    color={active ? colors.primary : colors.mutedForeground}
                  />
                </TouchableOpacity>
              );
            })}

            {method === "insurance" ? (
              <View style={[styles.card, { backgroundColor: colors.glass, borderColor: colors.glassBorder, gap: 10 }]}>
                <Text style={[styles.methodName, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>Insurance details</Text>
                <TextInput
                  style={[styles.input, { color: colors.foreground, borderColor: colors.glassBorder, fontFamily: "Inter_400Regular" }]}
                  placeholder="Insurer (e.g. VHI, Laya, Irish Life Health)"
                  placeholderTextColor={colors.mutedForeground}
                  value={insurer}
                  onChangeText={(t) => { setInsurer(t); setError(""); }}
                />
                <TextInput
                  style={[styles.input, { color: colors.foreground, borderColor: colors.glassBorder, fontFamily: "Inter_400Regular" }]}
                  placeholder="Policy number"
                  placeholderTextColor={colors.mutedForeground}
                  value={policyNumber}
                  onChangeText={(t) => { setPolicyNumber(t); setError(""); }}
                  autoCapitalize="characters"
                />
                <TextInput
                  style={[styles.input, { color: colors.foreground, borderColor: colors.glassBorder, fontFamily: "Inter_400Regular" }]}
                  placeholder="Member ID (optional)"
                  placeholderTextColor={colors.mutedForeground}
                  value={memberId}
                  onChangeText={setMemberId}
                  autoCapitalize="characters"
                />
                <Text style={[styles.cardBody, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                  Saved only on this device. Your HIVE node confirms cover with your insurer.
                </Text>
              </View>
            ) : null}

            {error ? (
              <View style={[styles.errorBox, { backgroundColor: colors.emergencyBg, borderColor: colors.emergencyBorder }]}>
                <MaterialCommunityIcons name="alert-circle-outline" size={16} color={colors.emergency} />
                <Text style={[styles.errorText, { color: colors.emergency, fontFamily: "Inter_400Regular" }]}>{error}</Text>
              </View>
            ) : null}

            <TouchableOpacity activeOpacity={0.85} onPress={handleConfirm} disabled={busy !== null}>
              <LinearGradient colors={["#C9860A", "#D4A017", "#C9860A"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.confirmBtn}>
                {busy === "confirm"
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={[styles.confirmText, { fontFamily: "Inter_700Bold" }]}>
                      {membership ? "Update Membership" : "Confirm Membership"}
                    </Text>}
              </LinearGradient>
            </TouchableOpacity>
            {editing ? (
              <TouchableOpacity onPress={() => { setEditing(false); refresh(); }} style={styles.cancelLink}>
                <Text style={[styles.cancelText, { color: colors.mutedForeground, fontFamily: "Inter_600SemiBold" }]}>Cancel</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        ) : (
          <View style={[styles.card, { backgroundColor: colors.glass, borderColor: colors.glassBorder }]}>
            <Text style={[styles.cardBody, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              {PLAN_META[membership!.plan].label} · {PLAN_META[membership!.plan].price} · {METHOD_META[membership!.method].label}
            </Text>
            <TouchableOpacity
              onPress={() => { Haptics.selectionAsync(); setEditing(true); }}
              style={[styles.vBtn, { backgroundColor: colors.glassPrimary, borderColor: colors.primary, alignSelf: "flex-start" }]}
            >
              <Text style={[styles.vBtnText, { color: colors.primary, fontFamily: "Inter_600SemiBold" }]}>Change plan or payment</Text>
            </TouchableOpacity>
          </View>
        )}
        </>
        )}

        {/* Zero-Server note */}
        <View style={styles.privacyRow}>
          <MaterialCommunityIcons name="cellphone-lock" size={15} color={colors.mutedForeground} />
          <Text style={[styles.privacyText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
            Your selfie, ID and insurance details never leave this device. No card details are entered in the app.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { padding: 16, paddingBottom: 48, gap: 12 },
  statusCard: { borderRadius: 18, padding: 18, gap: 14 },
  statusTop: { flexDirection: "row", alignItems: "center", gap: 12 },
  statusTitle: { color: "#FFFFFF", fontSize: 19 },
  statusSub: { color: "rgba(255,255,255,0.75)", fontSize: 13, marginTop: 2, lineHeight: 18 },
  refBox: { backgroundColor: "rgba(255,255,255,0.08)", borderRadius: 12, padding: 12, gap: 4 },
  refLabel: { color: "rgba(255,255,255,0.6)", fontSize: 10, letterSpacing: 1.2 },
  refValue: { color: "#D4A017", fontSize: 20, letterSpacing: 1 },
  refHint: { color: "rgba(255,255,255,0.75)", fontSize: 12, lineHeight: 17, marginTop: 2 },
  sectionHead: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 6 },
  stepBadge: { width: 26, height: 26, borderRadius: 13, borderWidth: 1.5, alignItems: "center", justifyContent: "center" },
  stepBadgeText: { fontSize: 13 },
  sectionTitle: { fontSize: 17 },
  card: { borderRadius: 16, borderWidth: 1, padding: 14, gap: 12 },
  cardBody: { fontSize: 13, lineHeight: 19 },
  vStatusRow: { flexDirection: "row", alignItems: "center", gap: 7 },
  vStatusText: { fontSize: 13 },
  vRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  vRowTitle: { fontSize: 15 },
  vRowSub: { fontSize: 12.5, marginTop: 1 },
  vBtn: { borderRadius: 10, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 8 },
  vBtnText: { fontSize: 13 },
  lockCard: { flexDirection: "row", alignItems: "flex-start", gap: 10, borderRadius: 16, borderWidth: 1, padding: 14 },
  lockText: { flex: 1, fontSize: 13, lineHeight: 19 },
  planCard: { flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 16, padding: 14 },
  planTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  planName: { fontSize: 15.5 },
  planPrice: { fontSize: 13.5 },
  planBlurb: { fontSize: 12.5, lineHeight: 17, marginTop: 2 },
  payLabel: { fontSize: 10.5, letterSpacing: 1.3, marginTop: 8 },
  methodCard: { flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 16, padding: 14 },
  methodName: { fontSize: 14.5 },
  methodBlurb: { fontSize: 12.5, lineHeight: 17, marginTop: 2 },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11, fontSize: 14.5 },
  errorBox: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 10, borderWidth: 1, padding: 12 },
  errorText: { fontSize: 13, flex: 1 },
  confirmBtn: { borderRadius: 14, paddingVertical: 16, alignItems: "center", marginTop: 4 },
  confirmText: { color: "#fff", fontSize: 16 },
  cancelLink: { alignItems: "center", paddingVertical: 8 },
  cancelText: { fontSize: 14 },
  privacyRow: { flexDirection: "row", alignItems: "flex-start", gap: 8, paddingHorizontal: 4, marginTop: 4 },
  privacyText: { flex: 1, fontSize: 12, lineHeight: 17 },
});
