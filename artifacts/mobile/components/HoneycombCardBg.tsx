import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { StyleSheet, View } from "react-native";

const CELLS = [
  { size: 88,  top: -22, left: -18, opacity: 0.09 },
  { size: 60,  top: -10, left: 52,  opacity: 0.07 },
  { size: 44,  top: 28,  left: 100, opacity: 0.06 },
  { size: 72,  top: 38,  left: -8,  opacity: 0.07 },
  { size: 50,  top: 72,  left: 54,  opacity: 0.055 },
  { size: 36,  top: 80,  left: 108, opacity: 0.05 },
  { size: 56,  top: 4,   left: 148, opacity: 0.06 },
  { size: 40,  top: 52,  left: 178, opacity: 0.045 },
  { size: 28,  top: 88,  left: 160, opacity: 0.04 },
];

interface Props {
  gradientColors?: [string, string, string];
}

export default function HoneycombCardBg({
  gradientColors = ["rgba(139,94,0,0.18)", "rgba(0,0,0,0.28)", "transparent"],
}: Props) {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {CELLS.map((c, i) => (
        <MaterialCommunityIcons
          key={i}
          name="hexagon-outline"
          size={c.size}
          color={`rgba(201,134,10,${c.opacity})`}
          style={{ position: "absolute", top: c.top, left: c.left }}
        />
      ))}
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}
