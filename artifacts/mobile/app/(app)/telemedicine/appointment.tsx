import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import HoneycombWallpaper from "@/components/HoneycombWallpaper";
import ThemedStatusBar from "@/components/ThemedStatusBar";
import { useAppMode } from "@/context/AppModeContext";
import { useLogoTheme } from "@/context/LogoThemeContext";
import { usePatient, type Complaint } from "@/context/PatientContext";
import { useColors } from "@/hooks/useColors";
import { listDocuments, type StoredDocument } from "@/utils/documentsStore";
import { formatPatientCard } from "@/utils/healthShare";
import {
  type Appointment,
  cancelAppointment,
  clinicianMeta,
  formatApptDate,
  getAppointment,
  updateAppointment,
} from "@/utils/telemedicineStore";

function buildSymptomSummary(c: Complaint): string {
  const lines = [
    "STRUCTURED SYMPTOM SUMMARY",
    "",
    `Chief complaint: ${c.chiefComplaint}`,
    `Recorded: ${c.date}`,
    "",
    ...c.answers.map((a) => `• ${a.question}: ${a.answer}`),
  ];
  if (c.aiSummary) lines.push("", `Summary: ${c.aiSummary}`);
  if (c.triageRecommendation) lines.push(`Triage recommendation: ${c.triageRecommendation}`);
  return lines.join("\n");
}

export default function AppointmentDetailScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { prefs } = useLogoTheme();
  const { pilotMode } = useAppMode();
  const { data: patient } = usePatient();
  const { id } = useLocalSearchParams<{ id: string }>();
  const topPad = Platform.OS === "web" ? 0 : insets.top;

  const [appt, setAppt] = useState<Appointment | null>(null);
  const [prescriptionDocs, setPrescriptionDocs] = useState<StoredDocument[]>([]);

  useEffect(() => {
    if (!pilotMode) router.replace("/(app)/consultation");
  }, [pilotMode]);

  useFocusEffect(
    useCallback(() => {
      if (!id) return;
      getAppointment(id).then(setAppt);
      listDocuments().then((docs) => setPrescriptionDocs(docs.filter((d) => d.category === "prescription")));
    }, [id])
  );

  if (!pilotMode || !appt) return null;

  const meta = clinicianMeta(appt.clinicianType);
  const latestComplaint = patient.complaints[0];
  const isUpcoming = appt.status === "upcoming";

  async function patchAttachments(patch: Partial<Appointment["attachments"]>) {
    if (!appt) return;
    const next = await updateAppointment(appt.id, {
      attachments: { ...appt.attachments, ...patch },
    });
    setAppt(next);
  }

  async function toggleHealthCard() {
    Haptics.selectionAsync();
    await patchAttachments({
      healthCardSummary: appt?.attachments.healthCardSummary ? undefined : formatPatientCard(patient),
    });
  }

  async function toggleSymptomSummary() {
    Haptics.selectionAsync();
    if (appt?.attachments.symptomSummary) {
      await patchAttachments({ symptomSummary: undefined });
      return;
    }
    if (!latestComplaint) {
      Alert.alert(
        "No symptom summary yet",
        "Complete a symptom questionnaire (Do you have pain?) first, then attach the summary here."
      );
      return;
    }
    await patchAttachments({ symptomSummary: buildSymptomSummary(latestComplaint) });
  }

  async function toggleDocument(docId: string) {
    Haptics.selectionAsync();
    const ids = appt?.attachments.documentIds ?? [];
    await patchAttachments({
      documentIds: ids.includes(docId) ? ids.filter((d) => d !== docId) : [...ids, docId],
    });
  }

  async function toggleInterpreter() {
    if (!appt) return;
    Haptics.selectionAsync();
    if (appt.interpreterRequested) {
      const next = await updateAppointment(appt.id, { interpreterRequested: false });
      setAppt(next);
      return;
    }
    const next = await updateAppointment(appt.id, { interpreterRequested: true });
    setAppt(next);
    Alert.alert(
      "Interpreter requested",
      "We've noted an interpreter for this appointment. Complete the interpreter booking now?",
      [
        { text: "Later", style: "cancel" },
        { text: "Book Interpreter", onPress: () => router.push("/(app)/interpreter") },
      ]
    );
  }

  function onCancel() {
    Alert.alert("Cancel appointment?", "This appointment will be marked as cancelled.", [
      { text: "Keep", style: "cancel" },
      {
        text: "Cancel Appointment",
        style: "destructive",
        onPress: async () => {
          await cancelAppointment(appt!.id);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          router.back();
        },
      },
    ]);
  }

  const attachRows: {
    key: string;
    title: string;
    subtitle: string;
    icon: string;
    attached: boolean;
    onPress: () => void;
  }[] = [
    {
      key: "healthcard",
      title: "Health Card Summary",
      subtitle: "Conditions, allergies, and current medications",
      icon: "shield-account",
      attached: !!appt.attachments.healthCardSummary,
      onPress: toggleHealthCard,
    },
    {
      key: "symptoms",
      title: "Symptom Summary",
      subtitle: latestComplaint ? `Latest: ${latestComplaint.chiefComplaint}` : "No questionnaire completed yet",
      icon: "clipboard-pulse",
      attached: !!appt.attachments.symptomSummary,
      onPress: toggleSymptomSummary,
    },
  ];

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ThemedStatusBar />
      <HoneycombWallpaper density={prefs.density} />

      <View style={[styles.header, { paddingTop: topPad + 12, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <Feather name="arrow-left" size={20} color={colors.foreground} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>Appointment</Text>
          <Text style={[styles.headerSub, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
            {meta.label} · {formatApptDate(appt.dateISO)} at {appt.time}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <LinearGradient colors={["#0f1840", "#0d0d1a"]} style={styles.heroCard}>
          <View style={[styles.heroIcon, { backgroundColor: meta.color + "33" }]}>
            <MaterialCommunityIcons name={meta.icon as never} size={34} color={meta.color} />
          </View>
          <Text style={[styles.heroTitle, { color: "#fff", fontFamily: "Inter_700Bold" }]}>{meta.label}</Text>
          <Text style={[styles.heroSub, { color: "rgba(255,255,255,0.6)", fontFamily: "Inter_400Regular" }]}>
            {appt.reason || meta.subtitle}
          </Text>
          <View style={[styles.statusChip, {
            backgroundColor: isUpcoming ? "#22c55e22" : "rgba(255,255,255,0.08)",
            borderColor: isUpcoming ? "#22c55e55" : "rgba(255,255,255,0.15)",
          }]}>
            <Text style={[styles.statusText, {
              color: isUpcoming ? "#22c55e" : "rgba(255,255,255,0.6)",
              fontFamily: "Inter_600SemiBold",
            }]}>
              {appt.status === "upcoming" ? `${formatApptDate(appt.dateISO)} · ${appt.time}` : appt.status === "completed" ? "Completed" : "Cancelled"}
            </Text>
          </View>
        </LinearGradient>

        {isUpcoming && (
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); router.push({ pathname: "/(app)/telemedicine/session", params: { id: appt.id } }); }}
          >
            <LinearGradient colors={["#0a2818", "#22c55e"]} style={styles.joinBtn}>
              <MaterialCommunityIcons name="video" size={20} color="#fff" />
              <Text style={[styles.joinBtnText, { fontFamily: "Inter_700Bold" }]}>Enter Virtual Waiting Room</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* Handover pack */}
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>HANDOVER FOR YOUR CLINICIAN</Text>
        {attachRows.map((row) => (
          <TouchableOpacity
            key={row.key}
            activeOpacity={0.85}
            disabled={!isUpcoming}
            onPress={row.onPress}
            style={[styles.attachCard, {
              backgroundColor: row.attached ? "#22c55e14" : colors.card,
              borderColor: row.attached ? "#22c55e55" : colors.border,
              opacity: isUpcoming ? 1 : 0.6,
            }]}
          >
            <View style={[styles.attachIcon, { backgroundColor: colors.gold + "1e" }]}>
              <MaterialCommunityIcons name={row.icon as never} size={22} color={colors.gold} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.attachTitle, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>{row.title}</Text>
              <Text style={[styles.attachSub, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]} numberOfLines={1}>
                {row.subtitle}
              </Text>
            </View>
            <MaterialCommunityIcons
              name={row.attached ? "check-circle" : "plus-circle-outline"}
              size={22}
              color={row.attached ? "#22c55e" : colors.mutedForeground}
            />
          </TouchableOpacity>
        ))}

        {/* Prescription documents */}
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>PRESCRIPTION DOCUMENTS</Text>
        {prescriptionDocs.length === 0 && (
          <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.emptyText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              No prescription documents on this device. Import one in My Prescription Portal to attach it here.
            </Text>
          </View>
        )}
        {prescriptionDocs.map((doc) => {
          const attached = appt.attachments.documentIds.includes(doc.id);
          return (
            <TouchableOpacity
              key={doc.id}
              activeOpacity={0.85}
              disabled={!isUpcoming}
              onPress={() => toggleDocument(doc.id)}
              style={[styles.attachCard, {
                backgroundColor: attached ? "#22c55e14" : colors.card,
                borderColor: attached ? "#22c55e55" : colors.border,
                opacity: isUpcoming ? 1 : 0.6,
              }]}
            >
              <View style={[styles.attachIcon, { backgroundColor: "rgba(4,120,87,0.14)" }]}>
                <MaterialCommunityIcons name="prescription" size={22} color="#047857" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.attachTitle, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]} numberOfLines={1}>
                  {doc.name}
                </Text>
                <Text style={[styles.attachSub, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                  Added {new Date(doc.addedAt).toLocaleDateString()}
                </Text>
              </View>
              <MaterialCommunityIcons
                name={attached ? "check-circle" : "plus-circle-outline"}
                size={22}
                color={attached ? "#22c55e" : colors.mutedForeground}
              />
            </TouchableOpacity>
          );
        })}

        {/* Interpreter */}
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>INTERPRETER</Text>
        <TouchableOpacity
          activeOpacity={0.85}
          disabled={!isUpcoming}
          onPress={toggleInterpreter}
          style={[styles.attachCard, {
            backgroundColor: appt.interpreterRequested ? colors.gold + "14" : colors.card,
            borderColor: appt.interpreterRequested ? colors.gold + "66" : colors.border,
            opacity: isUpcoming ? 1 : 0.6,
          }]}
        >
          <View style={[styles.attachIcon, { backgroundColor: colors.gold + "1e" }]}>
            <MaterialCommunityIcons name="translate" size={22} color={colors.gold} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.attachTitle, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
              {appt.interpreterRequested ? "Interpreter requested" : "Request an interpreter"}
            </Text>
            <Text style={[styles.attachSub, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              Professional, confidential interpreters in your language
            </Text>
          </View>
          <MaterialCommunityIcons
            name={appt.interpreterRequested ? "check-circle" : "plus-circle-outline"}
            size={22}
            color={appt.interpreterRequested ? colors.gold : colors.mutedForeground}
          />
        </TouchableOpacity>

        {/* Session note (completed appointments) */}
        {appt.sessionNote ? (
          <>
            <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>POST-SESSION NOTE</Text>
            <View style={[styles.noteCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.noteText, { color: colors.foreground, fontFamily: "Inter_400Regular" }]}>{appt.sessionNote}</Text>
              <Text style={[styles.noteHint, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                Saved to your Documents.
              </Text>
            </View>
          </>
        ) : null}

        {isUpcoming && (
          <TouchableOpacity activeOpacity={0.85} onPress={onCancel} style={[styles.cancelBtn, { borderColor: colors.accent + "66" }]}>
            <Text style={[styles.cancelText, { color: colors.accent, fontFamily: "Inter_600SemiBold" }]}>Cancel Appointment</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
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
  heroCard: { borderRadius: 20, padding: 22, gap: 10, alignItems: "center" },
  heroIcon: { width: 68, height: 68, borderRadius: 34, alignItems: "center", justifyContent: "center" },
  heroTitle: { fontSize: 19, letterSpacing: -0.4, textAlign: "center" },
  heroSub: { fontSize: 13, lineHeight: 19, textAlign: "center" },
  statusChip: { borderRadius: 16, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 5 },
  statusText: { fontSize: 12 },
  joinBtn: { borderRadius: 14, paddingVertical: 16, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10 },
  joinBtnText: { color: "#fff", fontSize: 15 },
  sectionLabel: { fontSize: 10, fontFamily: "Inter_600SemiBold", letterSpacing: 1.4, marginTop: 6 },
  attachCard: { flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 14, borderWidth: 1.5, padding: 14 },
  attachIcon: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  attachTitle: { fontSize: 14 },
  attachSub: { fontSize: 12, marginTop: 2 },
  emptyCard: { borderRadius: 14, borderWidth: 1, padding: 16 },
  emptyText: { fontSize: 12.5, lineHeight: 18, textAlign: "center" },
  noteCard: { borderRadius: 14, borderWidth: 1, padding: 16, gap: 8 },
  noteText: { fontSize: 13, lineHeight: 20 },
  noteHint: { fontSize: 11 },
  cancelBtn: { borderRadius: 14, borderWidth: 1.5, paddingVertical: 14, alignItems: "center", marginTop: 4 },
  cancelText: { fontSize: 14 },
});
