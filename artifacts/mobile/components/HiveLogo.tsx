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
  const back = `rgba(139,94,0,${0.5 + clamp * 0.4})`;
  const mid = `rgba(201,134,10,${0.65 + clamp * 0.3})`;
  const front = clamp < 0.5
    ? `rgba(212,160,23,${0.7 + clamp * 0.6})`
    : `rgba(245,197,24,${0.5 + clamp * 0.5})`;
  return { back, mid, front };
}

function depthOffsets(depth: DepthLevel): { back: number; mid: number } {
  if (depth === "Flat") return { back: 0, mid: 0 };
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
  const gold = interpolateGold(goldIntensity);
  const offsets = depthOffsets(depth);

  const fontFamily =
    textWeight === "Condensed"
      ? "Inter_600SemiBold"
      : textWeight === "Bold"
      ? "Inter_700Bold"
      : "Inter_700Bold";

  const hiveTextStyle = {
    fontSize: size * 0.62,
    letterSpacing: size * -0.02,
    color: "#FFFFFF",
    fontFamily,
    lineHeight: size * 0.7,
  };

  const subTextStyle = {
    fontSize: size * 0.18,
    letterSpacing: size * 0.06,
    color: gold.mid,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 1,
  };

  return (
    <View style={[styles.container, { width: size * 2.2, height: size * 1.6 }]}>
      {/* Depth layer — back (darkest amber) */}
      {depth !== "Flat" && (
        <MaterialCommunityIcons
          name="hexagon"
          size={hexSize * 0.9}
          color={gold.back}
          style={[styles.hexLayer, { left: offsets.back * 0.8, top: offsets.back * 0.5, opacity: 0.5 }]}
        />
      )}

      {/* Depth layer — mid (gold) */}
      {depth !== "Flat" && (
        <MaterialCommunityIcons
          name="hexagon"
          size={hexSize}
          color={gold.mid}
          style={[styles.hexLayer, { left: offsets.mid * 0.5, top: offsets.mid * 0.3, opacity: 0.65 }]}
        />
      )}

      {/* Front layer — bright */}
      <MaterialCommunityIcons
        name="hexagon"
        size={hexSize * 0.85}
        color={gold.front}
        style={[styles.hexLayer, { left: 0, top: 0, opacity: 0.85 }]}
      />

      {/* Hex outline on top */}
      <MaterialCommunityIcons
        name="hexagon-outline"
        size={hexSize * 0.85}
        color={gold.front}
        style={[styles.hexLayer, { left: 0, top: 0, opacity: 0.6 }]}
      />

      {/* Additional cluster hexagons for depth */}
      <MaterialCommunityIcons
        name="hexagon-outline"
        size={hexSize * 0.45}
        color={gold.mid}
        style={[styles.hexLayer, { left: hexSize * 0.55, top: -hexSize * 0.05, opacity: depth === "Strong" ? 0.7 : 0.4 }]}
      />
      <MaterialCommunityIcons
        name="hexagon-outline"
        size={hexSize * 0.35}
        color={gold.back}
        style={[styles.hexLayer, { left: hexSize * 0.6, top: hexSize * 0.4, opacity: depth === "Flat" ? 0.15 : 0.35 }]}
      />

      {/* Text overlay */}
      {showText && (
        <View style={[styles.textBlock, { left: hexSize * 0.72 }]}>
          <Text style={subTextStyle} numberOfLines={1}>HEALTH HIVE</Text>
          <Text style={hiveTextStyle} numberOfLines={1}>HIVE</Text>
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
  hexLayer: {
    position: "absolute",
  },
  textBlock: {
    position: "absolute",
    justifyContent: "center",
  },
});
