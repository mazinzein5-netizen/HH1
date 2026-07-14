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
import QRCode from "react-native-qrcode-svg";
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";
import { AllowanceSummary, getAllowanceSummary } from "@/utils/entitlements";
import { MemberCode, getMemberCode, memberQrPayload, regenerateMemberCode } from "@/utils/memberCode";
import {
  IdentityRecord,
  STATUS_META,
  attachIdDocument,
  captureSelfie,
  getIdentity,
  verificationStatus,
} from "@/utils/identityStore";
import {
  BillingCycle,
  InsuranceDetails,
  METHOD_META,
  MembershipRecord,
  PLAN_META,
  PaidTier,
  PaymentMethod,
  PlanTier,
  TIER_PRICING,
  deleteMembership,
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
  const [usage, setUsage] = useState<AllowanceSummary | null>(null);
  const [memberCode, setMemberCode] = useState<MemberCode | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState<"selfie" | "id" | "confirm" | "downgrade" | "qr" | null>(null);
  const [editing, setEditing] = useState(false);

  const [tier, setTier] = useState<PlanTier>("gold");
  const [billing, setBilling] = useState<BillingCycle>("monthly");
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
    const [idRec, mem, summary, code] = await Promise.all([
      getIdentity(userId),
      getMembership(userId),
      getAllowanceSummary(userId),
      getMemberCode(userId),
    ]);
    setIdentity(idRec);
    setMembership(mem);
    setUsage(summary);
    setMemberCode(code);
    if (mem) {
      setTier(mem.plan);
      setBilling(mem.billing);
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

  function handleRegenerateQr() {
    const doIt = async () => {
      try {
        setBusy("qr");
        const fresh = await regenerateMemberCode(userId);
        setMemberCode(fresh);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } finally {
        setBusy(null);
      }
    };
    const msg = "Generate a new QR code? Your current code will stop working.";
    if (Platform.OS === "web") {
      // Alert buttons don't fire on react-native-web
      if (typeof window !== "undefined" && window.confirm(msg)) doIt();
      return;
    }
    Alert.alert("New QR code", msg, [
      { text: "Cancel", style: "cancel" },
      { text: "Generate", onPress: doIt },
    ]);
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

  async function handleConfirmPaid() {
    setError("");
    if (tier === "blue") return;
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
        plan: tier as PaidTier,
        billing,
        method,
        insurance,
        reference: membership?.reference ?? makeReference(),
        status: membership?.status ?? "pending",
        chosenAt: new Date().toISOString(),
      };
      await saveMembership(rec);
      setEditing(false);
      await refresh();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      setError("Could not save your membership choice. Please try again.");
    } finally {
      setBusy(null);
    }
  }

  async function doDowngrade() {
    try {
      setBusy("downgrade");
      await deleteMembership(userId);
      setEditing(false);
      setTier("blue");
      await refresh();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      setError("Could not switch your card. Please try again.");
    } finally {
      setBusy(null);
    }
  }

  function handleDowngrade() {
    const fromLabel = membership ? PLAN_META[membership.plan].label : "your card";
    const message =
      `Switch back to the free Blue Card? You'll go back to 2 pain complaints a month, and consultations and interpreter sessions will be at the standard rate.`;
    if (Platform.OS === "web") {
      // Alert with buttons is not supported on web
      if (window.confirm(message)) doDowngrade();
      return;
    }
    Alert.alert("Switch to Blue Card?", message, [
      { text: `Keep ${fromLabel}`, style: "cancel" },
      { text: "Switch to Blue", style: "destructive", onPress: () => doDowngrade() },
    ]);
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

  const onPaid = !!membership;
  const currentTier: PlanTier = membership?.plan ?? "blue";
  const showChooser = !membership || editing;
  const currentMeta = PLAN_META[currentTier];

  const usageRows = usage
    ? [
        {
          icon: "clipboard-pulse-outline" as const,
          label: "Pain complaints",
          value: Number.isFinite(usage.painComplaints.limit)
            ? `${usage.painComplaints.used} of ${usage.painComplaints.limit} used`
            : `${usage.painComplaints.used} used — unlimited`,
          warn: Number.isFinite(usage.painComplaints.limit) && usage.painComplaints.remaining === 0,
        },
        {
          icon: "video-outline" as const,
          label: "Video consultations",
          value:
            usage.tier !== "blue"
              ? `${usage.consultations.used} of ${usage.consultations.limit} free used`
              : "Standard rate",
          warn: usage.tier !== "blue" && usage.consultations.remaining === 0,
        },
        {
          icon: "translate" as const,
          label: "Interpreter sessions",
          value:
            usage.tier !== "blue"
              ? `${usage.interpreter.used} of ${usage.interpreter.limit} free used`
              : "Standard rate",
          warn: usage.tier !== "blue" && usage.interpreter.remaining === 0,
        },
      ]
    : [];

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Status card */}
        <LinearGradient
          colors={
            currentTier === "red"
              ? ["#4C0519", "#1F2937"]
              : currentTier === "gold"
                ? ["#3B2F0B", "#1F2937"]
                : ["#1E3A8A", "#111827"]
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.statusCard}
        >
          <View style={styles.statusTop}>
            <MaterialCommunityIcons
              name={currentMeta.icon as any}
              size={26}
              color={currentTier === "red" ? "#FDA4AF" : currentTier === "gold" ? "#D4A017" : "#93C5FD"}
            />
            <View style={{ flex: 1 }}>
              <Text style={[styles.statusTitle, { fontFamily: "Inter_700Bold" }]}>
                {isGuest
                  ? "Demo account"
                  : onPaid
                    ? currentMeta.label
                    : trial.expired
                      ? "Blue Card — trial ended"
                      : "Blue Card — Free Trial"}
              </Text>
              <Text style={[styles.statusSub, { fontFamily: "Inter_400Regular" }]}>
                {isGuest
                  ? "Create your own account to start your free Blue Card trial."
                  : onPaid
                    ? membership!.status === "active"
                      ? `${TIER_PRICING[membership!.plan][membership!.billing].price} · Membership active`
                      : `${TIER_PRICING[membership!.plan][membership!.billing].price} · Awaiting payment · ${METHOD_META[membership!.method].label}`
                    : trial.expired
                      ? "Your free trial period has ended — your Blue Card benefits continue. Upgrade to Gold or the Red Geriatric Safety Pack for more each month."
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

        {/* This month's usage */}
        {!isGuest && usage ? (
          <View style={[styles.card, { backgroundColor: colors.glass, borderColor: colors.glassBorder }]}>
            <View style={styles.vStatusRow}>
              <MaterialCommunityIcons name="calendar-month-outline" size={18} color={colors.primary} />
              <Text style={[styles.vStatusText, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
                This month with your {currentMeta.label}
              </Text>
            </View>
            {usageRows.map((row) => (
              <View key={row.label} style={styles.usageRow}>
                <MaterialCommunityIcons name={row.icon as any} size={20} color={colors.mutedForeground} />
                <Text style={[styles.usageLabel, { color: colors.foreground, fontFamily: "Inter_400Regular" }]}>
                  {row.label}
                </Text>
                <Text
                  style={[
                    styles.usageValue,
                    { color: row.warn ? "#DC2626" : colors.mutedForeground, fontFamily: "Inter_600SemiBold" },
                  ]}
                >
                  {row.value}
                </Text>
              </View>
            ))}
            <View style={styles.vStatusRow}>
              <MaterialCommunityIcons name="calendar-refresh-outline" size={14} color={colors.mutedForeground} />
              <Text style={[styles.usageHint, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                Allowances reset on the 1st of every month.
              </Text>
            </View>
          </View>
        ) : null}

        {/* Your member QR */}
        {!isGuest && memberCode ? (
          <View style={[styles.card, { backgroundColor: colors.glass, borderColor: colors.glassBorder }]}>
            <View style={styles.vStatusRow}>
              <MaterialCommunityIcons name="qrcode" size={18} color={colors.primary} />
              <Text style={[styles.vStatusText, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
                Your member QR code
              </Text>
            </View>
            <View style={styles.qrWrap}>
              <View style={styles.qrBox}>
                <QRCode
                  value={memberQrPayload({
                    memberCode,
                    tier: currentTier,
                    fullName: user?.fullName,
                  })}
                  size={132}
                  color={currentTier === "red" ? "#7F1D1D" : currentTier === "gold" ? "#6b4400" : "#1E3A8A"}
                  backgroundColor="#FFFFFF"
                />
              </View>
              <Text style={[styles.qrCodeText, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
                {memberCode.code}
              </Text>
              <Text style={[styles.qrIssued, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                This code is unique to you · issued {memberCode.issuedAt.slice(0, 10)}
              </Text>
            </View>
            <Text style={[styles.cardBody, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              Show this code at any HIVE node — partner GPs, pharmacies and clinics — to check in as a member.
            </Text>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleRegenerateQr}
              disabled={busy !== null}
              style={[styles.qrRegenBtn, { backgroundColor: colors.glassPrimary, borderColor: colors.primary }]}
            >
              {busy === "qr" ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <>
                  <MaterialCommunityIcons name="refresh" size={17} color={colors.primary} />
                  <Text style={[styles.qrRegenText, { color: colors.primary, fontFamily: "Inter_600SemiBold" }]}>
                    Generate a new QR code
                  </Text>
                </>
              )}
            </TouchableOpacity>
            <View style={styles.qrNoteRow}>
              <MaterialCommunityIcons name="mailbox-outline" size={17} color={colors.gold} />
              <Text style={[styles.qrNoteText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                A physical membership card is posted to you on the Gold Card or the Red Geriatric Safety Pack.
                Blue Card members use this digital code.
              </Text>
            </View>
          </View>
        ) : null}

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
              free Blue Card trial — then add your selfie and photo ID if you'd like to upgrade to Gold.
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
            Upgrading to a paid card needs identity verification: add a selfie and a photo ID (passport,
            driving licence or public services card). Both stay on this device — staff verify them in person
            at your HIVE node.
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

        {/* Step 2 — choose your card */}
        {sectionTitle("2", "Choose your card")}
        {showChooser ? (
          <View style={{ gap: 10 }}>
            {(["blue", "gold", "red"] as PlanTier[]).map((t) => {
              const meta = PLAN_META[t];
              const active = tier === t;
              const isCurrent = t === currentTier;
              return (
                <TouchableOpacity
                  key={t}
                  activeOpacity={0.8}
                  onPress={() => { Haptics.selectionAsync(); setTier(t); setError(""); }}
                  style={[styles.planCard, {
                    backgroundColor: active ? colors.glassPrimary : colors.glass,
                    borderColor: active ? meta.accent : colors.glassBorder,
                    borderWidth: active ? 1.5 : 1,
                  }]}
                >
                  <View style={styles.planHead}>
                    <MaterialCommunityIcons name={meta.icon as any} size={24} color={meta.accent} />
                    <View style={{ flex: 1 }}>
                      <View style={styles.planTop}>
                        <Text style={[styles.planName, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
                          {meta.label}
                        </Text>
                        <Text style={[styles.planPrice, { color: meta.accent, fontFamily: "Inter_700Bold" }]}>
                          {t === "blue" ? "Free" : TIER_PRICING[t][billing].price}
                        </Text>
                      </View>
                      <Text style={[styles.planBlurb, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                        {meta.tagline}
                      </Text>
                    </View>
                    <MaterialCommunityIcons
                      name={active ? "radiobox-marked" : "radiobox-blank"}
                      size={20}
                      color={active ? meta.accent : colors.mutedForeground}
                    />
                  </View>
                  {isCurrent ? (
                    <View style={[styles.currentPill, { backgroundColor: meta.accent + "22", borderColor: meta.accent + "55" }]}>
                      <Text style={[styles.currentPillText, { color: meta.accent, fontFamily: "Inter_600SemiBold" }]}>
                        YOUR CURRENT CARD
                      </Text>
                    </View>
                  ) : null}
                  <View style={{ gap: 6 }}>
                    {meta.features.map((f) => (
                      <View key={f} style={styles.featureRow}>
                        <MaterialCommunityIcons name="check-circle" size={15} color={meta.accent} />
                        <Text style={[styles.featureText, { color: colors.foreground, fontFamily: "Inter_400Regular" }]}>
                          {f}
                        </Text>
                      </View>
                    ))}
                  </View>
                </TouchableOpacity>
              );
            })}

            {tier !== "blue" ? (
              <>
                <Text style={[styles.payLabel, { color: colors.mutedForeground, fontFamily: "Inter_600SemiBold" }]}>
                  HOW OFTEN WOULD YOU LIKE TO PAY?
                </Text>
                <View style={styles.billingRow}>
                  {(["monthly", "yearly"] as BillingCycle[]).map((b) => {
                    const active = billing === b;
                    const meta = TIER_PRICING[tier as PaidTier][b];
                    const accent = PLAN_META[tier].accent;
                    return (
                      <TouchableOpacity
                        key={b}
                        activeOpacity={0.8}
                        onPress={() => { Haptics.selectionAsync(); setBilling(b); }}
                        style={[styles.billingCard, {
                          backgroundColor: active ? colors.glassPrimary : colors.glass,
                          borderColor: active ? accent : colors.glassBorder,
                          borderWidth: active ? 1.5 : 1,
                        }]}
                      >
                        <Text style={[styles.billingLabel, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
                          {meta.label}
                        </Text>
                        <Text style={[styles.billingPrice, { color: active ? accent : colors.mutedForeground, fontFamily: "Inter_700Bold" }]}>
                          {meta.price}
                        </Text>
                        {meta.note ? (
                          <Text style={[styles.billingNote, { color: "#047857", fontFamily: "Inter_600SemiBold" }]}>
                            {meta.note}
                          </Text>
                        ) : null}
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {!verified ? (
                  <View style={[styles.lockCard, { backgroundColor: colors.glass, borderColor: colors.glassBorder }]}>
                    <MaterialCommunityIcons name="lock-outline" size={18} color={colors.mutedForeground} />
                    <Text style={[styles.lockText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                      Complete Step 1 first — upgrading to the {PLAN_META[tier].label} needs identity
                      verification. Your Blue Card keeps working in the meantime.
                    </Text>
                  </View>
                ) : (
                  <>
                    <Text style={[styles.payLabel, { color: colors.mutedForeground, fontFamily: "Inter_600SemiBold" }]}>
                      HOW WOULD YOU LIKE TO PAY?
                    </Text>
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

                    <TouchableOpacity activeOpacity={0.85} onPress={handleConfirmPaid} disabled={busy !== null}>
                      <LinearGradient
                        colors={tier === "red" ? ["#B91C3C", "#E5294E", "#B91C3C"] : ["#C9860A", "#D4A017", "#C9860A"]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.confirmBtn}
                      >
                        {busy === "confirm"
                          ? <ActivityIndicator color="#fff" />
                          : <Text style={[styles.confirmText, { fontFamily: "Inter_700Bold" }]}>
                              {currentTier === tier
                                ? "Update My Membership"
                                : onPaid
                                  ? `Switch to the ${PLAN_META[tier].label}`
                                  : `Upgrade to the ${PLAN_META[tier].label}`}
                            </Text>}
                      </LinearGradient>
                    </TouchableOpacity>
                  </>
                )}
              </>
            ) : onPaid ? (
              <>
                {error ? (
                  <View style={[styles.errorBox, { backgroundColor: colors.emergencyBg, borderColor: colors.emergencyBorder }]}>
                    <MaterialCommunityIcons name="alert-circle-outline" size={16} color={colors.emergency} />
                    <Text style={[styles.errorText, { color: colors.emergency, fontFamily: "Inter_400Regular" }]}>{error}</Text>
                  </View>
                ) : null}
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={handleDowngrade}
                  disabled={busy !== null}
                  style={[styles.downgradeBtn, { borderColor: "#2563EB" }]}
                >
                  {busy === "downgrade"
                    ? <ActivityIndicator color="#2563EB" />
                    : <Text style={[styles.downgradeText, { color: "#2563EB", fontFamily: "Inter_700Bold" }]}>
                        Switch back to Blue Card
                      </Text>}
                </TouchableOpacity>
              </>
            ) : (
              <View style={[styles.lockCard, { backgroundColor: colors.glass, borderColor: colors.glassBorder }]}>
                <MaterialCommunityIcons name="check-circle-outline" size={18} color="#2563EB" />
                <Text style={[styles.lockText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                  The Blue Card is your current card — there's nothing to pay. Select the Gold Card or the
                  Red Geriatric Safety Pack above if you'd like more each month.
                </Text>
              </View>
            )}

            {editing ? (
              <TouchableOpacity onPress={() => { setEditing(false); refresh(); }} style={styles.cancelLink}>
                <Text style={[styles.cancelText, { color: colors.mutedForeground, fontFamily: "Inter_600SemiBold" }]}>Cancel</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        ) : (
          <View style={[styles.card, { backgroundColor: colors.glass, borderColor: colors.glassBorder }]}>
            <Text style={[styles.cardBody, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              {PLAN_META[membership!.plan].label} · {TIER_PRICING[membership!.plan][membership!.billing].price} · {METHOD_META[membership!.method].label}
            </Text>
            <TouchableOpacity
              onPress={() => { Haptics.selectionAsync(); setEditing(true); }}
              style={[styles.vBtn, { backgroundColor: colors.glassPrimary, borderColor: colors.primary, alignSelf: "flex-start" }]}
            >
              <Text style={[styles.vBtnText, { color: colors.primary, fontFamily: "Inter_600SemiBold" }]}>Change card or payment</Text>
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
  usageRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  usageLabel: { flex: 1, fontSize: 14 },
  usageValue: { fontSize: 13 },
  usageHint: { flex: 1, fontSize: 11.5, lineHeight: 16 },
  vRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  vRowTitle: { fontSize: 15 },
  vRowSub: { fontSize: 12.5, marginTop: 1 },
  vBtn: { borderRadius: 10, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 8 },
  vBtnText: { fontSize: 13 },
  lockCard: { flexDirection: "row", alignItems: "flex-start", gap: 10, borderRadius: 16, borderWidth: 1, padding: 14 },
  lockText: { flex: 1, fontSize: 13, lineHeight: 19 },
  planCard: { borderRadius: 16, padding: 14, gap: 12 },
  planHead: { flexDirection: "row", alignItems: "center", gap: 12 },
  planTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  planName: { fontSize: 16 },
  planPrice: { fontSize: 14 },
  planBlurb: { fontSize: 12.5, lineHeight: 17, marginTop: 2 },
  currentPill: { alignSelf: "flex-start", borderRadius: 999, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 4 },
  currentPillText: { fontSize: 10, letterSpacing: 1 },
  featureRow: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  featureText: { flex: 1, fontSize: 13.5, lineHeight: 19 },
  billingRow: { flexDirection: "row", gap: 10 },
  billingCard: { flex: 1, borderRadius: 16, padding: 14, gap: 4, alignItems: "center" },
  billingLabel: { fontSize: 13 },
  billingPrice: { fontSize: 15 },
  billingNote: { fontSize: 11 },
  payLabel: { fontSize: 10.5, letterSpacing: 1.3, marginTop: 8 },
  methodCard: { flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 16, padding: 14 },
  methodName: { fontSize: 14.5 },
  methodBlurb: { fontSize: 12.5, lineHeight: 17, marginTop: 2 },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11, fontSize: 14.5 },
  errorBox: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 10, borderWidth: 1, padding: 12 },
  errorText: { fontSize: 13, flex: 1 },
  confirmBtn: { borderRadius: 14, paddingVertical: 16, alignItems: "center", marginTop: 4 },
  confirmText: { color: "#fff", fontSize: 16 },
  downgradeBtn: { borderRadius: 14, borderWidth: 1.5, paddingVertical: 15, alignItems: "center", marginTop: 4 },
  downgradeText: { fontSize: 15 },
  cancelLink: { alignItems: "center", paddingVertical: 8 },
  cancelText: { fontSize: 14 },
  privacyRow: { flexDirection: "row", alignItems: "flex-start", gap: 8, paddingHorizontal: 4, marginTop: 4 },
  privacyText: { flex: 1, fontSize: 12, lineHeight: 17 },
  qrWrap: { alignItems: "center", gap: 6 },
  qrBox: { backgroundColor: "#FFFFFF", borderRadius: 14, padding: 12 },
  qrCodeText: { fontSize: 17, letterSpacing: 1.5, marginTop: 4 },
  qrIssued: { fontSize: 11.5 },
  qrRegenBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 12, borderWidth: 1, paddingVertical: 12 },
  qrRegenText: { fontSize: 14 },
  qrNoteRow: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  qrNoteText: { flex: 1, fontSize: 12.5, lineHeight: 18 },
});
