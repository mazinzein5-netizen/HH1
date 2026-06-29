import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  Animated,
  StatusBar,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";

type TriageCategory = "emergency" | "fasttrack" | "physio" | "virtual" | null;
type Site = "Spine" | "Hip" | "Knee" | "Ankle" | "Shoulder" | "Wrist";

const SITES: Site[] = ["Spine", "Hip", "Knee", "Ankle", "Shoulder", "Wrist"];

interface TriageResult {
  category: TriageCategory;
  label: string;
  description: string;
  action: string;
}

function getTriageResult(
  redFlag: boolean,
  anticoag: boolean,
  site: Site,
  notes: string
): TriageResult {
  if (redFlag) {
    return {
      category: "emergency",
      label: "CATEGORY 1 — EMERGENCY",
      description: "Critical neurovascular compromise suspected.",
      action: "Present to A&E immediately. Do not delay.",
    };
  }
  if (anticoag) {
    return {
      category: "fasttrack",
      label: "CATEGORY 2 — FAST TRACK",
      description: "High-risk medication alert identified.",
      action: "Schedule urgent physiotherapy assessment within 24–48 hours.",
    };
  }
  return {
    category: "physio",
    label: "CATEGORY 3 — PHYSIOTHERAPY",
    description: `${site} — Conservative management pathway.`,
    action: "Routine physiotherapy referral. Monitor for progression.",
  };
}

function ToggleCard({
  icon,
  title,
  subtitle,
  value,
  onToggle,
  activeColor,
  activeBg,
  activeBorder,
}: {
  icon: string;
  title: string;
  subtitle: string;
  value: boolean;
  onToggle: () => void;
  activeColor: string;
  activeBg: string;
  activeBorder: string;
}) {
  const colors = useColors();
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onToggle}
      style={[
        styles.toggleCard,
        {
          backgroundColor: value ? activeBg : colors.card,
          borderColor: value ? activeBorder : colors.border,
          borderWidth: value ? 1.5 : 1,
        },
      ]}
    >
      <View
        style={[
          styles.toggleIconWrap,
          { backgroundColor: value ? activeBorder : colors.secondary },
        ]}
      >
        <MaterialCommunityIcons
          name={icon as any}
          size={20}
          color={value ? "#fff" : colors.mutedForeground}
        />
      </View>
      <View style={styles.toggleText}>
        <Text
          style={[
            styles.toggleTitle,
            { color: value ? activeColor : colors.foreground },
          ]}
        >
          {title}
        </Text>
        <Text style={[styles.toggleSub, { color: colors.mutedForeground }]}>
          {subtitle}
        </Text>
      </View>
      <View
        style={[
          styles.checkbox,
          {
            backgroundColor: value ? activeBorder : "transparent",
            borderColor: value ? activeBorder : colors.border,
          },
        ]}
      >
        {value && <Feather name="check" size={13} color="#fff" />}
      </View>
    </TouchableOpacity>
  );
}

function ResultCard({ result }: { result: TriageResult }) {
  const colors = useColors();

  const categoryStyle = {
    emergency: {
      bg: colors.emergencyBg,
      border: colors.emergencyBorder,
      text: colors.emergency,
      icon: "alert-octagon",
    },
    fasttrack: {
      bg: colors.fastTrackBg,
      border: colors.fastTrackBorder,
      text: colors.fastTrack,
      icon: "clock-fast",
    },
    physio: {
      bg: colors.physioBg,
      border: colors.physioBorder,
      text: colors.physio,
      icon: "human-handsup",
    },
    virtual: {
      bg: colors.virtualBg,
      border: colors.virtualBorder,
      text: colors.virtual,
      icon: "monitor-account",
    },
  };

  const style = categoryStyle[result.category!];

  return (
    <View
      style={[
        styles.resultCard,
        { backgroundColor: style.bg, borderColor: style.border },
      ]}
    >
      <View style={styles.resultHeader}>
        <MaterialCommunityIcons name={style.icon as any} size={22} color={style.text} />
        <Text style={[styles.resultLabel, { color: style.text }]}>
          {result.label}
        </Text>
      </View>
      <Text style={[styles.resultDesc, { color: style.text }]}>
        {result.description}
      </Text>
      <View style={[styles.resultDivider, { backgroundColor: style.border }]} />
      <View style={styles.resultActionRow}>
        <Feather name="arrow-right-circle" size={15} color={style.text} />
        <Text style={[styles.resultAction, { color: style.text }]}>
          {result.action}
        </Text>
      </View>
    </View>
  );
}

export default function TriageScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [redFlag, setRedFlag] = useState(false);
  const [anticoag, setAnticoag] = useState(false);
  const [selectedSite, setSelectedSite] = useState<Site>("Spine");
  const [notes, setNotes] = useState("");
  const [result, setResult] = useState<TriageResult | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  function handleToggleRedFlag() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setRedFlag((v) => !v);
    setResult(null);
  }

  function handleToggleAnticoag() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setAnticoag((v) => !v);
    setResult(null);
  }

  function handleAssess() {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const r = getTriageResult(redFlag, anticoag, selectedSite, notes);
    setResult(r);
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 350,
      useNativeDriver: true,
    }).start();
  }

  function handleReset() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRedFlag(false);
    setAnticoag(false);
    setSelectedSite("Spine");
    setNotes("");
    setResult(null);
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="dark-content" />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: topPad + 16, paddingBottom: bottomPad + 32 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View
            style={[styles.logoWrap, { backgroundColor: colors.primary }]}
          >
            <MaterialCommunityIcons name="hospital-box" size={26} color="#fff" />
          </View>
          <View>
            <Text style={[styles.headerTitle, { color: colors.primary }]}>
              IbnCeena
            </Text>
            <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>
              Clinical Triage System
            </Text>
          </View>
        </View>

        {/* Section: Red Flags */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
            RED FLAGS
          </Text>
          <ToggleCard
            icon="alert-rhombus"
            title="CES / Myelopathy / ACS Signs"
            subtitle="Cauda equina, cord compression, or acute coronary"
            value={redFlag}
            onToggle={handleToggleRedFlag}
            activeColor={colors.emergency}
            activeBg={colors.emergencyBg}
            activeBorder={colors.emergencyBorder}
          />
        </View>

        {/* Section: Risk Factors */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
            RISK FACTORS
          </Text>
          <ToggleCard
            icon="blood-bag"
            title="On Blood Thinners / Anticoagulants"
            subtitle="Warfarin, rivaroxaban, apixaban, etc."
            value={anticoag}
            onToggle={handleToggleAnticoag}
            activeColor={colors.fastTrack}
            activeBg={colors.fastTrackBg}
            activeBorder={colors.fastTrackBorder}
          />
        </View>

        {/* Section: Primary Site */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
            PRIMARY SITE
          </Text>
          <View
            style={[styles.siteGrid, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            {SITES.map((site) => {
              const active = selectedSite === site;
              return (
                <TouchableOpacity
                  key={site}
                  activeOpacity={0.75}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setSelectedSite(site);
                    setResult(null);
                  }}
                  style={[
                    styles.siteChip,
                    {
                      backgroundColor: active ? colors.primary : "transparent",
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.siteChipText,
                      {
                        color: active
                          ? colors.primaryForeground
                          : colors.mutedForeground,
                        fontFamily: active
                          ? "Inter_600SemiBold"
                          : "Inter_400Regular",
                      },
                    ]}
                  >
                    {site}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Section: Clinical Notes */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
            CLINICAL NOTES
          </Text>
          <View
            style={[
              styles.notesWrap,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <TextInput
              style={[
                styles.notesInput,
                { color: colors.foreground, fontFamily: "Inter_400Regular" },
              ]}
              placeholder="Enter clinical history, mechanism of injury, onset, duration..."
              placeholderTextColor={colors.mutedForeground}
              multiline
              numberOfLines={4}
              value={notes}
              onChangeText={(t) => {
                setNotes(t);
                setResult(null);
              }}
              textAlignVertical="top"
            />
          </View>
        </View>

        {/* Assess Button */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleAssess}
          style={[styles.assessBtn, { backgroundColor: colors.primary }]}
          testID="assess-button"
        >
          <Feather name="activity" size={18} color="#fff" />
          <Text style={styles.assessBtnText}>Assess Patient</Text>
        </TouchableOpacity>

        {/* Result */}
        {result && (
          <Animated.View style={{ opacity: fadeAnim }}>
            <ResultCard result={result} />
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleReset}
              style={[styles.resetBtn, { borderColor: colors.border }]}
            >
              <Feather name="refresh-ccw" size={14} color={colors.mutedForeground} />
              <Text
                style={[styles.resetText, { color: colors.mutedForeground }]}
              >
                New Assessment
              </Text>
            </TouchableOpacity>
          </Animated.View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scroll: {
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 28,
  },
  logoWrap: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.5,
  },
  headerSub: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    marginTop: 1,
  },
  section: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1.2,
    marginBottom: 10,
    marginLeft: 2,
  },
  toggleCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    padding: 14,
    gap: 12,
  },
  toggleIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  toggleText: {
    flex: 1,
  },
  toggleTitle: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 2,
  },
  toggleSub: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    lineHeight: 16,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 7,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  siteGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    borderRadius: 14,
    borderWidth: 1,
    padding: 6,
    gap: 6,
  },
  siteChip: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 9,
  },
  siteChipText: {
    fontSize: 14,
  },
  notesWrap: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
  },
  notesInput: {
    fontSize: 14,
    lineHeight: 22,
    minHeight: 90,
  },
  assessBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    borderRadius: 14,
    paddingVertical: 17,
    marginBottom: 20,
  },
  assessBtnText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.2,
  },
  resultCard: {
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 18,
    marginBottom: 14,
  },
  resultHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 8,
  },
  resultLabel: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.3,
    flex: 1,
  },
  resultDesc: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    lineHeight: 20,
    marginBottom: 12,
  },
  resultDivider: {
    height: 1,
    opacity: 0.3,
    marginBottom: 12,
  },
  resultActionRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  resultAction: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    lineHeight: 19,
    flex: 1,
  },
  resetBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 12,
    marginBottom: 8,
  },
  resetText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
});
