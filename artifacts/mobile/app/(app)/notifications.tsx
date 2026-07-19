import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ThemedStatusBar from "@/components/ThemedStatusBar";
import { getMemoryPermission, setMemoryPermission } from "@/utils/chatMemory";
import { useColors } from "@/hooks/useColors";

const PREF_KEY = "hive_notification_prefs";

interface NotifPrefs {
  medicationMorning:    boolean;
  medicationEvening:    boolean;
  appointmentReminders: boolean;
  vitalAlerts:          boolean;
  weeklyWellbeing:      boolean;
  queenBMemory:         boolean;
}

const DEFAULT_PREFS: NotifPrefs = {
  medicationMorning:    true,
  medicationEvening:    true,
  appointmentReminders: true,
  vitalAlerts:          true,
  weeklyWellbeing:      false,
  queenBMemory:         false,
};

async function loadPrefs(): Promise<NotifPrefs> {
  try {
    const raw = await AsyncStorage.getItem(PREF_KEY);
    return raw ? { ...DEFAULT_PREFS, ...JSON.parse(raw) } : DEFAULT_PREFS;
  } catch { return DEFAULT_PREFS; }
}

async function savePrefs(p: NotifPrefs) {
  try { await AsyncStorage.setItem(PREF_KEY, JSON.stringify(p)); } catch {}
}

interface RowProps {
  icon: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
  iconColor: string;
  label: string;
  sub: string;
  value: boolean;
  onToggle: (v: boolean) => void;
  colors: ReturnType<typeof useColors>;
}

function PrefRow({ icon, iconColor, label, sub, value, onToggle, colors }: RowProps) {
  return (
    <View style={[prow.row, { borderBottomColor: colors.border }]}>
      <View style={[prow.iconBox, { backgroundColor: iconColor + "20" }]}>
        <MaterialCommunityIcons name={icon} size={20} color={iconColor} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[prow.label, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>{label}</Text>
        <Text style={[prow.sub, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>{sub}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={(v) => { Haptics.selectionAsync(); onToggle(v); }}
        trackColor={{ false: colors.border, true: "#C9860A" }}
        thumbColor="#fff"
      />
    </View>
  );
}

const prow = StyleSheet.create({
  row:     { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 14, borderBottomWidth: 1 },
  iconBox: { width: 38, height: 38, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  label:   { fontSize: 14 },
  sub:     { fontSize: 12, marginTop: 2, lineHeight: 17 },
});

export default function NotificationsScreen() {
  const colors    = useColors();
  const insets    = useSafeAreaInsets();
  const topPad    = Platform.OS === "web" ? 0 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const [prefs, setPrefs] = useState<NotifPrefs>(DEFAULT_PREFS);

  useEffect(() => {
    (async () => {
      const loaded = await loadPrefs();
      const mem    = await getMemoryPermission();
      setPrefs({ ...loaded, queenBMemory: mem === true });
    })();
  }, []);

  async function toggle(key: keyof NotifPrefs, val: boolean) {
    const next = { ...prefs, [key]: val };
    setPrefs(next);
    await savePrefs(next);
    if (key === "queenBMemory") await setMemoryPermission(val);
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ThemedStatusBar />
      <View style={[styles.header, { paddingTop: topPad + 12, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <Feather name="arrow-left" size={20} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>Notifications & Preferences</Text>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: bottomPad + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.banner, { backgroundColor: "rgba(201,134,10,0.08)", borderColor: "rgba(201,134,10,0.3)" }]}>
          <MaterialCommunityIcons name="cellphone-lock" size={18} color="#C9860A" />
          <Text style={[styles.bannerText, { color: "#C9860A", fontFamily: "Inter_500Medium" }]}>
            All preferences are stored only on this device. No data leaves the app.
          </Text>
        </View>

        {/* Medication reminders */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.cardLabel, { color: colors.mutedForeground }]}>MEDICATION REMINDERS</Text>
          <PrefRow
            icon="white-balance-sunny" iconColor="#f59e0b"
            label="Morning dose reminder"
            sub="Reminder at 8:00 AM for morning medications"
            value={prefs.medicationMorning}
            onToggle={(v) => toggle("medicationMorning", v)}
            colors={colors}
          />
          <PrefRow
            icon="weather-night" iconColor="#818cf8"
            label="Evening dose reminder"
            sub="Reminder at 8:00 PM for evening medications"
            value={prefs.medicationEvening}
            onToggle={(v) => toggle("medicationEvening", v)}
            colors={colors}
          />
        </View>

        {/* Appointments & health */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.cardLabel, { color: colors.mutedForeground }]}>APPOINTMENTS & HEALTH</Text>
          <PrefRow
            icon="calendar-clock" iconColor="#22c55e"
            label="Appointment reminders"
            sub="Notified 24h and 1h before upcoming consultations"
            value={prefs.appointmentReminders}
            onToggle={(v) => toggle("appointmentReminders", v)}
            colors={colors}
          />
          <PrefRow
            icon="heart-pulse" iconColor="#e11d48"
            label="Vital sign alerts"
            sub="Alert if monitored vitals fall outside safe range"
            value={prefs.vitalAlerts}
            onToggle={(v) => toggle("vitalAlerts", v)}
            colors={colors}
          />
          <PrefRow
            icon="emoticon-happy-outline" iconColor="#0ea5e9"
            label="Weekly wellbeing check"
            sub="A gentle weekly reminder to complete a wellbeing check-in"
            value={prefs.weeklyWellbeing}
            onToggle={(v) => toggle("weeklyWellbeing", v)}
            colors={colors}
          />
        </View>

        {/* Queen B memory */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: "rgba(201,134,10,0.4)" }]}>
          <Text style={[styles.cardLabel, { color: "#C9860A" }]}>QUEEN B COMPANION</Text>
          <PrefRow
            icon="brain" iconColor="#C9860A"
            label="Remember conversations"
            sub="Queen B recalls past conversations and continues where you left off. Stored only on this device."
            value={prefs.queenBMemory}
            onToggle={(v) => toggle("queenBMemory", v)}
            colors={colors}
          />
        </View>

        <View style={[styles.noteBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <MaterialCommunityIcons name="information-outline" size={16} color={colors.mutedForeground} />
          <Text style={[styles.noteText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
            Push notifications require the installed app on your device. Preferences set here will apply automatically when you install HIVE COMPANION.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root:      { flex: 1 },
  header:    { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 1 },
  backBtn:   { padding: 6 },
  headerTitle: { flex: 1, fontSize: 17, letterSpacing: -0.3 },
  scroll:    { padding: 16, gap: 14 },
  banner:    { flexDirection: "row", alignItems: "flex-start", gap: 10, borderRadius: 13, borderWidth: 1, padding: 13 },
  bannerText: { flex: 1, fontSize: 12.5, lineHeight: 18 },
  card:      { borderRadius: 16, borderWidth: 1, paddingHorizontal: 14, paddingBottom: 4 },
  cardLabel: { fontSize: 10.5, fontFamily: "Inter_600SemiBold", letterSpacing: 1.3, paddingTop: 14, paddingBottom: 2 },
  noteBox:   { flexDirection: "row", alignItems: "flex-start", gap: 10, borderRadius: 13, borderWidth: 1, padding: 13 },
  noteText:  { flex: 1, fontSize: 12, lineHeight: 18 },
});
