import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";
import { getPlanTier } from "@/utils/entitlements";
import { PLAN_META, type PlanTier } from "@/utils/membershipStore";

/**
 * Resolves the current user's plan tier. Returns null while loading;
 * falls back to "blue" on error so gated content stays locked.
 */
export function usePlanTier(): PlanTier | null {
  const { user } = useAuth();
  const [tier, setTier] = useState<PlanTier | null>(null);

  useEffect(() => {
    let alive = true;
    getPlanTier(user?.id ?? "unknown")
      .then((t) => { if (alive) setTier(t); })
      .catch(() => { if (alive) setTier("blue"); });
    return () => { alive = false; };
  }, [user?.id]);

  return tier;
}

/**
 * Upgrade card shown in place of Red-only content (monitoring, smart devices,
 * geriatric care) when the member is not on the Red Geriatric Safety Pack.
 */
export function RedUpgradeCard({ blurb }: { blurb: string }) {
  const colors = useColors();
  return (
    <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
      <View style={[styles.gateCard, { backgroundColor: colors.card, borderColor: "#E5294E55" }]}>
        <MaterialCommunityIcons name="shield-star" size={40} color="#E5294E" />
        <Text style={[styles.gateTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
          Part of the Red Geriatric Safety Pack
        </Text>
        <Text style={[styles.gateBody, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
          {blurb}
        </Text>
        <View style={{ gap: 6, alignSelf: "stretch" }}>
          {PLAN_META.red.features.map((f) => (
            <View key={f} style={styles.gateFeatureRow}>
              <MaterialCommunityIcons name="check-circle" size={15} color="#E5294E" />
              <Text style={[styles.gateFeatureText, { color: colors.foreground, fontFamily: "Inter_400Regular" }]}>
                {f}
              </Text>
            </View>
          ))}
        </View>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => { Haptics.selectionAsync(); router.push("/(app)/membership"); }}
          style={{ alignSelf: "stretch" }}
        >
          <LinearGradient
            colors={["#B91C3C", "#E5294E", "#B91C3C"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.gateBtn}
          >
            <MaterialCommunityIcons name="shield-star" size={18} color="#fff" />
            <Text style={[styles.gateBtnText, { fontFamily: "Inter_700Bold" }]}>
              Upgrade to the Red Geriatric Safety Pack
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 16, paddingBottom: 40 },
  gateCard: { borderRadius: 18, borderWidth: 1.5, padding: 22, alignItems: "center", gap: 14 },
  gateTitle: { fontSize: 17, textAlign: "center" },
  gateBody: { fontSize: 13.5, lineHeight: 20, textAlign: "center" },
  gateFeatureRow: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  gateFeatureText: { flex: 1, fontSize: 13, lineHeight: 19 },
  gateBtn: { borderRadius: 14, paddingVertical: 15, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  gateBtnText: { color: "#fff", fontSize: 14.5 },
});
