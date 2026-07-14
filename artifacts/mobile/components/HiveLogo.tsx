import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { DepthLevel, TextWeightLevel } from "@/context/LogoThemeContext";

interface HiveLogoProps {
  size?: number;
  goldIntensity?: number;
  depth?: DepthLevel;
  textWeight?: TextWeightLevel;
  showText?: boolean;
}

function interpolateGold(intensity: number): { back: string; mid: string; front: string } {
  const clamp = Math.max(0, Math.min(1, intensity));
  const back  = `rgba(139,94,0,${0.5 + clamp * 0.4})`;
  const mid   = `rgba(201,134,10,${0.65 + clamp * 0.3})`;
  const front = clamp < 0.5
    ? `rgba(212,160,23,${0.7 + clamp * 0.6})`
    : `rgba(245,197,24,${0.5 + clamp * 0.5})`;
  return { back, mid, front };
}

function depthOffsets(depth: DepthLevel): { back: number; mid: number } {
  if (depth === "Flat")   return { back: 0, mid: 0 };
  if (depth === "Subtle") return { back: 6, mid: 3 };
  return { back: 12, mid: 6 };
}

export default function HiveLogo({
  size = 52,
  goldIntensity = 0.6,
  depth = "Subtle",
  textWeight = "Black",
  showText = true,
}: HiveLogoProps) {
  const hexSize = size * 1.1;
  const gold    = interpolateGold(goldIntensity);
  const offsets = depthOffsets(depth);

  const fontFamily =
    textWeight === "Condensed"
      ? "Inter_600SemiBold"
      : "Inter_700Bold";

  const hiveTextStyle = {
    fontSize: size * 0.44,
    letterSpacing: size * -0.012,
    color: "#FFFFFF",
    fontFamily,
    lineHeight: size * 0.54,
  };

  const subTextStyle = {
    fontSize: size * 0.155,
    letterSpacing: size * 0.04,
    color: gold.mid,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 0,
  };

  const companyTextStyle = {
    fontSize: size * 0.115,
    letterSpacing: size * 0.01,
    color: gold.back,
    fontFamily: "Inter_400Regular",
    opacity: 0.72,
    marginTop: 1,
  };

  const S = hexSize;

  return (
    <View style={[styles.container, { width: size * 3.8, height: size * 1.8 }]}>

      {/* ── Depth shadow layers ── */}
      {depth !== "Flat" && (
        <MaterialCommunityIcons
          name="hexagon"
          size={S * 0.82}
          color={gold.back}
          style={[styles.hex, { left: offsets.back * 0.9 + 1, top: offsets.back * 0.6 + 1, opacity: 0.35 }]}
        />
      )}
      {depth !== "Flat" && (
        <MaterialCommunityIcons
          name="hexagon"
          size={S * 0.88}
          color={gold.mid}
          style={[styles.hex, { left: offsets.mid * 0.5, top: offsets.mid * 0.35, opacity: 0.55 }]}
        />
      )}

      {/* ── Central / largest hex ── */}
      <MaterialCommunityIcons
        name="hexagon"
        size={S * 0.82}
        color={gold.front}
        style={[styles.hex, { left: 0, top: 0, opacity: 0.85 }]}
      />
      <MaterialCommunityIcons
        name="hexagon-outline"
        size={S * 0.82}
        color={gold.front}
        style={[styles.hex, { left: 0, top: 0, opacity: 0.55 }]}
      />

      {/* ── Medium upper-right ── */}
      <MaterialCommunityIcons
        name="hexagon"
        size={S * 0.56}
        color={gold.mid}
        style={[styles.hex, { left: S * 0.46, top: -S * 0.14, opacity: 0.70 }]}
      />
      <MaterialCommunityIcons
        name="hexagon-outline"
        size={S * 0.56}
        color={gold.mid}
        style={[styles.hex, { left: S * 0.46, top: -S * 0.14, opacity: 0.45 }]}
      />

      {/* ── Medium lower-right ── */}
      <MaterialCommunityIcons
        name="hexagon-outline"
        size={S * 0.50}
        color={gold.mid}
        style={[styles.hex, { left: S * 0.44, top: S * 0.37, opacity: 0.60 }]}
      />

      {/* ── Small — far upper right ── */}
      <MaterialCommunityIcons
        name="hexagon"
        size={S * 0.36}
        color={gold.back}
        style={[styles.hex, { left: S * 0.74, top: -S * 0.22, opacity: 0.55 }]}
      />

      {/* ── Small — right mid ── */}
      <MaterialCommunityIcons
        name="hexagon-outline"
        size={S * 0.32}
        color={gold.mid}
        style={[styles.hex, { left: S * 0.76, top: S * 0.22, opacity: 0.50 }]}
      />

      {/* ── Small — lower centre-right ── */}
      <MaterialCommunityIcons
        name="hexagon-outline"
        size={S * 0.28}
        color={gold.back}
        style={[styles.hex, { left: S * 0.60, top: S * 0.58, opacity: 0.42 }]}
      />

      {/* ── Tiny — outer far right ── */}
      <MaterialCommunityIcons
        name="hexagon"
        size={S * 0.22}
        color={gold.back}
        style={[styles.hex, { left: S * 0.90, top: -S * 0.04, opacity: 0.38 }]}
      />

      {/* ── Tiny — outer lower edge ── */}
      <MaterialCommunityIcons
        name="hexagon-outline"
        size={S * 0.18}
        color={gold.back}
        style={[styles.hex, { left: S * 0.88, top: S * 0.50, opacity: 0.30 }]}
      />

      {/* ── Tiny — far upper edge ── */}
      <MaterialCommunityIcons
        name="hexagon-outline"
        size={S * 0.16}
        color={gold.back}
        style={[styles.hex, { left: S * 0.78, top: -S * 0.34, opacity: 0.25 }]}
      />

      {/* ── Text overlay ── */}
      {showText && (
        <View style={[styles.textBlock, { left: S * 1.02 }]}>
          <Text style={subTextStyle} numberOfLines={1}>PATIENT PORTAL</Text>
          <Text style={hiveTextStyle} numberOfLines={1}>HIVE COMPANION</Text>
          <Text style={companyTextStyle} numberOfLines={1}>IbnCeena Ltd.</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "relative",
    flexDirection: "row",
    alignItems: "center",
  },
  hex: {
    position: "absolute",
  },
  textBlock: {
    position: "absolute",
    justifyContent: "center",
  },
});
