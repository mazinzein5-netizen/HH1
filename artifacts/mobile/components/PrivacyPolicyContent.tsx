import {
  PRIVACY_POLICY_LAST_UPDATED,
  PRIVACY_POLICY_SECTIONS,
} from "@workspace/privacy-policy";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useColors } from "@/hooks/useColors";

export default function PrivacyPolicyContent() {
  const colors = useColors();
  return (
    <View style={styles.wrap}>
      <Text style={[styles.updated, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
        Last updated: {PRIVACY_POLICY_LAST_UPDATED}
      </Text>
      {PRIVACY_POLICY_SECTIONS.map((s) => (
        <View key={s.heading} style={styles.section}>
          <Text style={[styles.heading, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
            {s.heading}
          </Text>
          <Text style={[styles.body, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
            {s.body}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 18 },
  updated: { fontSize: 12 },
  section: { gap: 6 },
  heading: { fontSize: 15, letterSpacing: -0.2 },
  body: { fontSize: 13.5, lineHeight: 20 },
});
