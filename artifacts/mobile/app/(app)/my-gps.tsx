/**
 * My GPs & Practices — the patient's personal, on-device list of GPs.
 * Partner GPs (IbnCeena network) can be booked directly in the app.
 * Non-partner practices can be found via an OpenStreetMap search and reached
 * with an appointment-request email the patient reviews and sends themselves.
 */
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as MailComposer from "expo-mail-composer";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Linking,
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
import HoneycombWallpaper from "@/components/HoneycombWallpaper";
import ThemedStatusBar from "@/components/ThemedStatusBar";
import { PILOT_ACTIVATION_CODE, useAppMode } from "@/context/AppModeContext";
import { useLogoTheme } from "@/context/LogoThemeContext";
import { useColors } from "@/hooks/useColors";
import {
  addGp,
  buildOutreachTemplate,
  type GPRecord,
  listGps,
  OUTREACH_TIMEFRAME,
  type OutreachUrgency,
  type PracticeSearchResult,
  removeGp,
  searchPractices,
  updateGp,
} from "@/utils/gpStore";

type OutreachDraft = {
  gp: GPRecord;
  urgency: OutreachUrgency;
  appointmentType: "video" | "in_person";
  reason: string;
  subject: string;
  body: string;
};

export default function MyGpsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { prefs } = useLogoTheme();
  const { pilotMode } = useAppMode();
  const topPad = Platform.OS === "web" ? 0 : insets.top;

  const [gps, setGps] = useState<GPRecord[]>([]);

  // Add-manually form
  const [showAdd, setShowAdd] = useState(false);
  const [fName, setFName] = useState("");
  const [fPractice, setFPractice] = useState("");
  const [fPhone, setFPhone] = useState("");
  const [fEmail, setFEmail] = useState("");
  const [fPartner, setFPartner] = useState(false);

  // Practice search (OpenStreetMap)
  const [showSearch, setShowSearch] = useState(false);
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<PracticeSearchResult[] | null>(null);

  // Outreach flow
  const [outreachGp, setOutreachGp] = useState<GPRecord | null>(null);
  const [outreachReason, setOutreachReason] = useState("");
  const [outreachUrgency, setOutreachUrgency] = useState<OutreachUrgency>("routine");
  const [outreachType, setOutreachType] = useState<"video" | "in_person">("in_person");
  const [drafting, setDrafting] = useState(false);
  const [draft, setDraft] = useState<OutreachDraft | null>(null);

  useFocusEffect(
    useCallback(() => {
      listGps().then(setGps);
    }, [])
  );

  async function refresh() {
    setGps(await listGps());
  }

  async function saveManual() {
    if (!fPractice.trim() && !fName.trim()) {
      Alert.alert("Missing details", "Please give at least a doctor or practice name.");
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await addGp({
      name: fName.trim(),
      practice: fPractice.trim() || fName.trim(),
      isPartner: fPartner,
      phone: fPhone.trim() || undefined,
      email: fEmail.trim() || undefined,
      source: "manual",
    });
    setFName(""); setFPractice(""); setFPhone(""); setFEmail(""); setFPartner(false);
    setShowAdd(false);
    await refresh();
  }

  async function runSearch() {
    const q = query.trim();
    if (!q) return;
    setSearching(true);
    setResults(null);
    try {
      setResults(await searchPractices(q));
    } catch {
      Alert.alert("Search failed", "The practice search couldn't be reached. Please try again in a moment.");
    } finally {
      setSearching(false);
    }
  }

  async function saveSearchResult(r: PracticeSearchResult) {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await addGp({
      name: "",
      practice: r.name,
      isPartner: false,
      address: r.address,
      source: "osm",
    });
    setShowSearch(false);
    setResults(null);
    setQuery("");
    await refresh();
  }

  function confirmRemove(g: GPRecord) {
    Alert.alert("Remove from my list?", `${g.name || g.practice} will be removed from your GP list.`, [
      { text: "Keep", style: "cancel" },
      { text: "Remove", style: "destructive", onPress: async () => { await removeGp(g.id); await refresh(); } },
    ]);
  }

  async function togglePartner(g: GPRecord) {
    Haptics.selectionAsync();
    await updateGp(g.id, { isPartner: !g.isPartner });
    await refresh();
  }

  // ── Outreach: AI draft in pilot mode, local formal template otherwise ──
  async function draftOutreach() {
    const gp = outreachGp;
    if (!gp || drafting) return;
    setDrafting(true);
    const local = buildOutreachTemplate({
      practice: gp.practice,
      gpName: gp.name || undefined,
      reason: outreachReason,
      urgency: outreachUrgency,
      appointmentType: outreachType,
    });
    let body = local.body;
    if (pilotMode) {
      try {
        const domain = process.env.EXPO_PUBLIC_DOMAIN;
        const res = await fetch(`https://${domain}/api/ai/outreach-email`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            pilotCode: PILOT_ACTIVATION_CODE,
            practice: gp.practice,
            gpName: gp.name || undefined,
            reason: outreachReason,
            urgency: outreachUrgency,
            appointmentType: outreachType,
          }),
        });
        if (res.ok) {
          const data = (await res.json()) as { email?: string };
          if (data.email?.trim()) body = data.email.trim();
        }
      } catch {
        // Fall back to the local template silently.
      }
    }
    setDraft({
      gp,
      urgency: outreachUrgency,
      appointmentType: outreachType,
      reason: outreachReason,
      subject: local.subject,
      body,
    });
    setDrafting(false);
  }

  async function sendDraft() {
    if (!draft) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const email = draft.gp.email?.trim();
    if (Platform.OS !== "web" && (await MailComposer.isAvailableAsync())) {
      await MailComposer.composeAsync({
        recipients: email ? [email] : [],
        subject: draft.subject,
        body: draft.body,
      });
    } else {
      const mailto = `mailto:${email ?? ""}?subject=${encodeURIComponent(draft.subject)}&body=${encodeURIComponent(draft.body)}`;
      Linking.openURL(mailto).catch(() => {
        Alert.alert("Unable to open mail", "Please copy the letter text and send it from your own email app.");
      });
    }
    setDraft(null);
    setOutreachGp(null);
    setOutreachReason("");
  }

  const partners = gps.filter((g) => g.isPartner);
  const others = gps.filter((g) => !g.isPartner);

  function gpCard(g: GPRecord) {
    return (
      <View key={g.id} style={[styles.gpCard, { backgroundColor: colors.card, borderColor: g.isPartner ? "#22c55e55" : colors.border }]}>
        <View style={[styles.gpIcon, { backgroundColor: (g.isPartner ? "#22c55e" : colors.gold) + "22" }]}>
          <MaterialCommunityIcons name={g.isPartner ? "doctor" : "hospital-building"} size={24} color={g.isPartner ? "#22c55e" : colors.gold} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.gpName, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
            {g.name || g.practice}
          </Text>
          {!!g.name && !!g.practice && g.practice !== g.name && (
            <Text style={[styles.gpSub, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]} numberOfLines={1}>
              {g.practice}
            </Text>
          )}
          {!!g.address && (
            <Text style={[styles.gpSub, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]} numberOfLines={2}>
              {g.address}
            </Text>
          )}
          <View style={styles.gpActions}>
            {g.isPartner ? (
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => { Haptics.selectionAsync(); router.push("/(app)/telemedicine/book"); }}
                style={[styles.gpActionBtn, { backgroundColor: "#22c55e" }]}
              >
                <MaterialCommunityIcons name="calendar-plus" size={15} color="#fff" />
                <Text style={[styles.gpActionText, { color: "#fff", fontFamily: "Inter_600SemiBold" }]}>Book appointment</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => { Haptics.selectionAsync(); setOutreachGp(g); setOutreachUrgency("routine"); setOutreachType("in_person"); }}
                style={[styles.gpActionBtn, { backgroundColor: colors.gold }]}
              >
                <MaterialCommunityIcons name="email-edit" size={15} color="#fff" />
                <Text style={[styles.gpActionText, { color: "#fff", fontFamily: "Inter_600SemiBold" }]}>Request appointment</Text>
              </TouchableOpacity>
            )}
            {!!g.phone && (
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => Linking.openURL(`tel:${g.phone!.replace(/[^\d+]/g, "")}`).catch(() => {})}
                style={[styles.gpActionBtn, { backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border }]}
              >
                <Feather name="phone" size={14} color={colors.foreground} />
                <Text style={[styles.gpActionText, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>Call</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
        <View style={{ alignItems: "flex-end", gap: 8 }}>
          <TouchableOpacity onPress={() => confirmRemove(g)} hitSlop={8}>
            <Feather name="trash-2" size={16} color={colors.mutedForeground} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => togglePartner(g)} hitSlop={8}>
            <Text style={[styles.partnerToggle, { color: g.isPartner ? "#22c55e" : colors.mutedForeground, fontFamily: "Inter_600SemiBold" }]}>
              {g.isPartner ? "Partner" : "Not partner"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ThemedStatusBar />
      <HoneycombWallpaper density={prefs.density} />

      <View style={[styles.header, { paddingTop: topPad + 12, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <Feather name="arrow-left" size={20} color={colors.foreground} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>My GPs & Practices</Text>
          <Text style={[styles.headerSub, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
            Stored only on this device
          </Text>
        </View>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {/* Add buttons */}
          <View style={styles.addRow}>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => { Haptics.selectionAsync(); setShowAdd((v) => !v); setShowSearch(false); }}
              style={[styles.addBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <MaterialCommunityIcons name="account-plus" size={18} color={colors.gold} />
              <Text style={[styles.addBtnText, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>Add manually</Text>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => { Haptics.selectionAsync(); setShowSearch((v) => !v); setShowAdd(false); }}
              style={[styles.addBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <MaterialCommunityIcons name="map-search" size={18} color={colors.gold} />
              <Text style={[styles.addBtnText, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>Find a practice</Text>
            </TouchableOpacity>
          </View>

          {/* Manual add form */}
          {showAdd && (
            <View style={[styles.formCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {[
                { v: fName, set: setFName, ph: "Doctor's name (e.g. Dr. Mary O'Brien)" },
                { v: fPractice, set: setFPractice, ph: "Practice / surgery name" },
                { v: fPhone, set: setFPhone, ph: "Phone (optional)" },
                { v: fEmail, set: setFEmail, ph: "Email (optional)" },
              ].map((f, i) => (
                <TextInput
                  key={i}
                  value={f.v}
                  onChangeText={f.set}
                  placeholder={f.ph}
                  placeholderTextColor={colors.mutedForeground}
                  autoCapitalize={f.ph.startsWith("Email") ? "none" : "words"}
                  keyboardType={f.ph.startsWith("Phone") ? "phone-pad" : f.ph.startsWith("Email") ? "email-address" : "default"}
                  style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground, fontFamily: "Inter_400Regular" }]}
                />
              ))}
              <View style={styles.partnerRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.partnerLabel, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>Partner GP</Text>
                  <Text style={[styles.partnerHint, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                    Part of the IbnCeena network — bookable directly in the app
                  </Text>
                </View>
                <Switch value={fPartner} onValueChange={setFPartner} trackColor={{ true: "#22c55e" }} />
              </View>
              <TouchableOpacity activeOpacity={0.85} onPress={saveManual}>
                <LinearGradient colors={["#0a2818", "#22c55e"]} style={styles.saveBtn}>
                  <Text style={[styles.saveBtnText, { fontFamily: "Inter_700Bold" }]}>Save to my list</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

          {/* OSM practice search */}
          {showSearch && (
            <View style={[styles.formCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.searchRow}>
                <TextInput
                  value={query}
                  onChangeText={setQuery}
                  placeholder="Practice name and town, e.g. “Main Street Surgery Cork”"
                  placeholderTextColor={colors.mutedForeground}
                  onSubmitEditing={runSearch}
                  returnKeyType="search"
                  style={[styles.input, { flex: 1, backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground, fontFamily: "Inter_400Regular" }]}
                />
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={runSearch}
                  style={[styles.searchBtn, { backgroundColor: colors.gold }]}
                >
                  {searching ? <ActivityIndicator size="small" color="#fff" /> : <Feather name="search" size={18} color="#fff" />}
                </TouchableOpacity>
              </View>
              <Text style={[styles.disclosure, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                To run the search, only the text you type is sent to the OpenStreetMap lookup service — never to HIVE servers, and never any of your health information.
              </Text>
              {results !== null && results.length === 0 && !searching && (
                <Text style={[styles.gpSub, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                  No matches found. Try adding the town or county to the name.
                </Text>
              )}
              {(results ?? []).map((r) => (
                <TouchableOpacity
                  key={r.id}
                  activeOpacity={0.85}
                  onPress={() => saveSearchResult(r)}
                  style={[styles.resultRow, { borderColor: colors.border, backgroundColor: colors.background }]}
                >
                  <MaterialCommunityIcons name="map-marker" size={18} color={colors.gold} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.gpName, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>{r.name}</Text>
                    <Text style={[styles.gpSub, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]} numberOfLines={2}>{r.address}</Text>
                  </View>
                  <MaterialCommunityIcons name="plus-circle-outline" size={20} color={colors.mutedForeground} />
                </TouchableOpacity>
              ))}
              {(results ?? []).length > 0 && (
                <Text style={[styles.disclosure, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                  Practice details from OpenStreetMap — please double-check them before contacting the practice.
                </Text>
              )}
            </View>
          )}

          {/* Partner GPs */}
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>PARTNER GPs — BOOK IN APP</Text>
          {partners.length === 0 && (
            <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.emptyText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                No partner GPs yet. Add a GP and mark them as a partner to book video or in-person appointments directly.
              </Text>
            </View>
          )}
          {partners.map(gpCard)}

          {/* Other practices */}
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>OTHER GPs & PRACTICES</Text>
          {others.length === 0 && (
            <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.emptyText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                Practices outside the partner network can still be reached from here — the app helps you write a formal appointment request that you review and send from your own email.
              </Text>
            </View>
          )}
          {others.map(gpCard)}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ── Outreach modal: reason + urgency → draft → review → send ── */}
      <Modal visible={!!outreachGp} transparent animationType="slide" onRequestClose={() => { setOutreachGp(null); setDraft(null); }}>
        <View style={styles.modalWrap}>
          <View style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.border, paddingBottom: Math.max(insets.bottom, 16) }]}>
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              {!draft ? (
                <>
                  <Text style={[styles.modalTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
                    Request an appointment
                  </Text>
                  <Text style={[styles.modalSub, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                    {outreachGp?.name || outreachGp?.practice} isn't a partner practice, so the app will help you write a short formal email. You read and approve it, then send it from your own email app — nothing is sent for you.
                  </Text>

                  <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>WHAT IS IT ABOUT?</Text>
                  <TextInput
                    value={outreachReason}
                    onChangeText={setOutreachReason}
                    placeholder="e.g. ongoing knee pain, medication review…"
                    placeholderTextColor={colors.mutedForeground}
                    multiline
                    style={[styles.input, { minHeight: 64, textAlignVertical: "top", backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground, fontFamily: "Inter_400Regular" }]}
                  />

                  <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>HOW SOON?</Text>
                  <View style={styles.chipWrap}>
                    {(["routine", "urgent"] as const).map((u) => (
                      <TouchableOpacity
                        key={u}
                        activeOpacity={0.85}
                        onPress={() => { Haptics.selectionAsync(); setOutreachUrgency(u); }}
                        style={[styles.chip, {
                          backgroundColor: outreachUrgency === u ? "#0f1a5a" : colors.background,
                          borderColor: outreachUrgency === u ? colors.primary : colors.border,
                        }]}
                      >
                        <Text style={[styles.chipText, { color: outreachUrgency === u ? "#fff" : colors.foreground, fontFamily: "Inter_500Medium" }]}>
                          {u === "routine" ? `Routine (${OUTREACH_TIMEFRAME.routine})` : `Urgent (${OUTREACH_TIMEFRAME.urgent})`}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>APPOINTMENT TYPE</Text>
                  <View style={styles.chipWrap}>
                    {([
                      { key: "in_person" as const, label: "In-person visit" },
                      { key: "video" as const, label: "Video appointment" },
                    ]).map((m) => (
                      <TouchableOpacity
                        key={m.key}
                        activeOpacity={0.85}
                        onPress={() => { Haptics.selectionAsync(); setOutreachType(m.key); }}
                        style={[styles.chip, {
                          backgroundColor: outreachType === m.key ? "#0f1a5a" : colors.background,
                          borderColor: outreachType === m.key ? colors.primary : colors.border,
                        }]}
                      >
                        <Text style={[styles.chipText, { color: outreachType === m.key ? "#fff" : colors.foreground, fontFamily: "Inter_500Medium" }]}>
                          {m.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <TouchableOpacity activeOpacity={0.85} onPress={draftOutreach} disabled={drafting} style={{ opacity: drafting ? 0.6 : 1 }}>
                    <LinearGradient colors={["#0a2818", "#22c55e"]} style={styles.saveBtn}>
                      {drafting ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <Text style={[styles.saveBtnText, { fontFamily: "Inter_700Bold" }]}>Write the email for me</Text>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <Text style={[styles.modalTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
                    Read it over first
                  </Text>
                  <Text style={[styles.modalSub, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                    This is your email — check it says what you want. It will only be sent when you press Send in your own email app.
                  </Text>
                  <View style={[styles.letterBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
                    <Text style={[styles.letterSubject, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>{draft.subject}</Text>
                    <Text style={[styles.letterBody, { color: colors.foreground, fontFamily: "Inter_400Regular" }]}>{draft.body}</Text>
                  </View>
                  <TouchableOpacity activeOpacity={0.85} onPress={sendDraft}>
                    <LinearGradient colors={["#0a2818", "#22c55e"]} style={styles.saveBtn}>
                      <MaterialCommunityIcons name="email-fast-outline" size={18} color="#fff" />
                      <Text style={[styles.saveBtnText, { fontFamily: "Inter_700Bold" }]}>Open in my email app</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() => setDraft(null)}
                    style={[styles.cancelBtn, { borderColor: colors.border }]}
                  >
                    <Text style={[styles.cancelText, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>Go back and change it</Text>
                  </TouchableOpacity>
                </>
              )}
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => { setOutreachGp(null); setDraft(null); }}
                style={[styles.cancelBtn, { borderColor: "transparent" }]}
              >
                <Text style={[styles.cancelText, { color: colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>Cancel</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", gap: 14, paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 1 },
  backBtn: { padding: 6 },
  headerTitle: { fontSize: 17, letterSpacing: -0.3 },
  headerSub: { fontSize: 11, marginTop: 2 },
  scroll: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 100, gap: 12 },
  addRow: { flexDirection: "row", gap: 10 },
  addBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 12, borderWidth: 1, paddingVertical: 13 },
  addBtnText: { fontSize: 13 },
  formCard: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 10 },
  input: { borderRadius: 12, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 11, fontSize: 14 },
  partnerRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  partnerLabel: { fontSize: 13.5 },
  partnerHint: { fontSize: 11.5, lineHeight: 16, marginTop: 2 },
  saveBtn: { borderRadius: 12, paddingVertical: 14, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 4 },
  saveBtnText: { color: "#fff", fontSize: 14 },
  searchRow: { flexDirection: "row", gap: 8 },
  searchBtn: { width: 46, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  disclosure: { fontSize: 10.5, lineHeight: 15 },
  resultRow: { flexDirection: "row", alignItems: "center", gap: 10, borderRadius: 12, borderWidth: 1, padding: 12 },
  sectionLabel: { fontSize: 10, fontFamily: "Inter_600SemiBold", letterSpacing: 1.4, marginTop: 6, marginBottom: 6 },
  emptyCard: { borderRadius: 14, borderWidth: 1, padding: 16 },
  emptyText: { fontSize: 12.5, lineHeight: 18, textAlign: "center" },
  gpCard: { flexDirection: "row", gap: 12, borderRadius: 14, borderWidth: 1.5, padding: 14 },
  gpIcon: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  gpName: { fontSize: 14 },
  gpSub: { fontSize: 12, marginTop: 2, lineHeight: 17 },
  gpActions: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 10 },
  gpActionBtn: { flexDirection: "row", alignItems: "center", gap: 6, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
  gpActionText: { fontSize: 12 },
  partnerToggle: { fontSize: 10.5 },
  chipWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { borderRadius: 20, borderWidth: 1.5, paddingHorizontal: 14, paddingVertical: 9 },
  chipText: { fontSize: 13 },
  modalWrap: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.5)" },
  modalCard: { borderTopLeftRadius: 22, borderTopRightRadius: 22, borderWidth: 1, padding: 20, maxHeight: "88%" },
  modalTitle: { fontSize: 18, letterSpacing: -0.3 },
  modalSub: { fontSize: 13, lineHeight: 19, marginTop: 6, marginBottom: 8 },
  letterBox: { borderRadius: 12, borderWidth: 1, padding: 14, gap: 8, marginTop: 4 },
  letterSubject: { fontSize: 13.5 },
  letterBody: { fontSize: 13, lineHeight: 20 },
  cancelBtn: { borderRadius: 12, borderWidth: 1.5, paddingVertical: 12, alignItems: "center", marginTop: 10 },
  cancelText: { fontSize: 13.5 },
});
