import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ThemedStatusBar from "@/components/ThemedStatusBar";
import { useColors } from "@/hooks/useColors";

interface FAQ { q: string; a: string; }

const FAQS: FAQ[] = [
  {
    q: "Is my health data safe and private?",
    a: "Yes. All health data — medications, conditions, vitals, conversations — is stored exclusively on your device. Nothing is uploaded to any server. If you delete the app or tap 'Delete All My Data' in Settings, everything is permanently removed.",
  },
  {
    q: "What does Sarah do?",
    a: "Sarah is your AI health companion. She can answer questions about your medications, flag drug interactions, help you describe symptoms, and support you with health education. In Pilot Mode, she also provides clinical guidance from Irish and UK healthcare guidelines. She is not a replacement for your doctor.",
  },
  {
    q: "How do I activate Pilot Mode?",
    a: "Go to Settings and long-press the version number at the bottom of the page for 1.2 seconds. You will be prompted to enter an access code provided by your pilot site coordinator.",
  },
  {
    q: "Can Sarah speak to me out loud?",
    a: "Yes. Tap the speaker icon in the Sarah chat header to toggle voice on or off. She uses text-to-speech in Irish English.",
  },
  {
    q: "How do I use voice input to talk to Sarah?",
    a: "Tap the 'Voice' microphone button above the text box in Sarah's chat. On web and modern browsers, your speech will be transcribed automatically. On the installed native app, voice input is fully integrated.",
  },
  {
    q: "What is the sign language mode?",
    a: "Tap 'Sign Language' in the Sarah chat input row to open the sign language camera. Position your hands in view, tap Start Signing, then Done when finished. You then type what you signed and Sarah responds. Automated sign recognition is coming in a future update.",
  },
  {
    q: "How do I record a new health complaint?",
    a: "Go to the HIVE tab (bottom navigation) and tap 'Clinical Intake'. Answer the guided questions about your symptoms. The AI will generate a triage recommendation and clinical summary, saved automatically to your Intake History.",
  },
  {
    q: "Can I book a video appointment with a doctor?",
    a: "Yes. Tap 'Consultation' from the Home screen to book a video appointment with a GP, physiotherapist, specialist, or other clinician via the IbnCeena Telemedicine network.",
  },
  {
    q: "How does drug interaction checking work?",
    a: "Sarah automatically checks your current medications against any new drugs you mention in the chat, as well as against your known allergies. If a risk is detected, an amber 'Drug Interaction Alert' appears in the conversation. Always contact your GP or pharmacist before changing any medication.",
  },
  {
    q: "I see a 'Coming Soon' badge — when will it be available?",
    a: "Features marked 'SOON' are in active development and will be released in upcoming app updates. These include full push notifications, wearable wellness alerts, and video consultations directly from the app.",
  },
  {
    q: "The monitoring screen shows simulated data — is it real?",
    a: "In the demo and pilot build, vital sign data is simulated to show the app's capabilities. When connected to a compatible wearable or smart device via the Smart Devices screen, live data will be displayed.",
  },
];

function FAQItem({ faq, colors }: { faq: FAQ; colors: ReturnType<typeof useColors> }) {
  const [open, setOpen] = useState(false);
  return (
    <TouchableOpacity
      activeOpacity={0.82}
      onPress={() => { Haptics.selectionAsync(); setOpen(!open); }}
      style={[styles.faqItem, { borderBottomColor: colors.border }]}
    >
      <View style={styles.faqTop}>
        <Text style={[styles.faqQ, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>{faq.q}</Text>
        <MaterialCommunityIcons
          name={open ? "chevron-up" : "chevron-down"}
          size={18}
          color={colors.mutedForeground}
        />
      </View>
      {open && (
        <Text style={[styles.faqA, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>{faq.a}</Text>
      )}
    </TouchableOpacity>
  );
}

export default function HelpScreen() {
  const colors    = useColors();
  const insets    = useSafeAreaInsets();
  const topPad    = Platform.OS === "web" ? 0 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ThemedStatusBar />
      <View style={[styles.header, { paddingTop: topPad + 12, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <Feather name="arrow-left" size={20} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>Help & Support</Text>
      </View>

      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: bottomPad + 40 }]} showsVerticalScrollIndicator={false}>

        {/* Emergency */}
        <TouchableOpacity
          style={[styles.emergencyCard, { backgroundColor: "rgba(220,38,38,0.08)", borderColor: "rgba(220,38,38,0.35)" }]}
          onPress={() => Linking.openURL("tel:999")}
          activeOpacity={0.85}
        >
          <MaterialCommunityIcons name="phone-alert" size={26} color="#dc2626" />
          <View style={{ flex: 1 }}>
            <Text style={[styles.emergencyTitle, { color: "#dc2626", fontFamily: "Inter_700Bold" }]}>Emergency? Call 999</Text>
            <Text style={[styles.emergencySub, { color: "#dc2626", fontFamily: "Inter_400Regular" }]}>
              Tap to call emergency services immediately
            </Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={20} color="#dc2626" />
        </TouchableOpacity>

        {/* Contact */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>Contact & Support</Text>
          <TouchableOpacity
            style={[styles.contactRow, { borderBottomColor: colors.border }]}
            onPress={() => Linking.openURL("mailto:support@ibncena.com")}
            activeOpacity={0.8}
          >
            <View style={[styles.contactIcon, { backgroundColor: "rgba(79,70,229,0.12)" }]}>
              <MaterialCommunityIcons name="email-outline" size={20} color="#6366f1" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.contactLabel, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>Email Support</Text>
              <Text style={[styles.contactSub, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>support@ibncena.com · Response within 24h</Text>
            </View>
            <Feather name="external-link" size={15} color={colors.mutedForeground} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.contactRow]}
            onPress={() => router.push("/(app)/privacy-policy")}
            activeOpacity={0.8}
          >
            <View style={[styles.contactIcon, { backgroundColor: "rgba(201,134,10,0.12)" }]}>
              <MaterialCommunityIcons name="shield-lock-outline" size={20} color="#C9860A" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.contactLabel, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>Privacy & GDPR</Text>
              <Text style={[styles.contactSub, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>How your data is stored and protected</Text>
            </View>
            <Feather name="chevron-right" size={15} color={colors.mutedForeground} />
          </TouchableOpacity>
        </View>

        {/* Health guides */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>Health Resources</Text>
          {[
            { label: "HSE — My Health", url: "https://www2.hse.ie/", icon: "web", color: "#16a34a" },
            { label: "NHS — Health A–Z", url: "https://www.nhs.uk/conditions/", icon: "web", color: "#4F6EF7" },
            { label: "NICE — Patient Decisions", url: "https://www.nice.org.uk/about/nice-communities/patients-and-the-public", icon: "web", color: "#7c3aed" },
            { label: "HSE — Medication Safety", url: "https://www.hse.ie/eng/services/list/3/acutehospitals/staff/medication-safety/", icon: "pill", color: "#ea580c" },
          ].map((r, i) => (
            <TouchableOpacity
              key={i}
              style={[styles.contactRow, i < 3 && { borderBottomColor: colors.border, borderBottomWidth: 1 }]}
              onPress={() => Linking.openURL(r.url)}
              activeOpacity={0.8}
            >
              <View style={[styles.contactIcon, { backgroundColor: r.color + "18" }]}>
                <MaterialCommunityIcons name={r.icon as any} size={20} color={r.color} />
              </View>
              <Text style={[styles.contactLabel, { color: colors.foreground, fontFamily: "Inter_500Medium", flex: 1 }]}>{r.label}</Text>
              <Feather name="external-link" size={15} color={colors.mutedForeground} />
            </TouchableOpacity>
          ))}
        </View>

        {/* FAQs */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>Frequently Asked Questions</Text>
          {FAQS.map((faq, i) => (
            <FAQItem key={i} faq={faq} colors={colors} />
          ))}
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 1 },
  backBtn: { padding: 6 },
  headerTitle: { flex: 1, fontSize: 17, letterSpacing: -0.3 },
  scroll: { gap: 14, paddingHorizontal: 16, paddingTop: 16 },
  emergencyCard: { flexDirection: "row", alignItems: "center", gap: 14, borderRadius: 16, borderWidth: 1.5, padding: 16 },
  emergencyTitle: { fontSize: 16 },
  emergencySub: { fontSize: 12, marginTop: 2 },
  card: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 12 },
  cardTitle: { fontSize: 16, letterSpacing: -0.2 },
  contactRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12 },
  contactIcon: { width: 38, height: 38, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  contactLabel: { fontSize: 14 },
  contactSub: { fontSize: 12, marginTop: 2 },
  faqItem: { paddingVertical: 14, borderBottomWidth: 1, gap: 8 },
  faqTop: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  faqQ: { fontSize: 13.5, lineHeight: 20, flex: 1 },
  faqA: { fontSize: 13, lineHeight: 20 },
});
