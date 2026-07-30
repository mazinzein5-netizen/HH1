import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, View } from "react-native";
import { DensityLevel } from "@/context/LogoThemeContext";

interface HoneycombWallpaperProps {
  density?: DensityLevel;
}

const SPARSE_GRID = [
  { top: -20, left: -30, size: 130, opacity: 0.035 },
  { top: 80, left: 90, size: 110, opacity: 0.028 },
  { top: 200, left: -20, size: 120, opacity: 0.032 },
  { top: 180, left: 200, size: 90, opacity: 0.025 },
  { top: 360, left: 60, size: 140, opacity: 0.03 },
  { top: 480, left: -40, size: 100, opacity: 0.028 },
  { top: 500, left: 230, size: 120, opacity: 0.025 },
  { top: 660, left: 100, size: 110, opacity: 0.03 },
];

const MEDIUM_GRID = [
  { top: -30, left: -40, size: 130, opacity: 0.04 },
  { top: -20, left: 80, size: 95, opacity: 0.032 },
  { top: -10, left: 190, size: 115, opacity: 0.038 },
  { top: 80, left: 20, size: 100, opacity: 0.028 },
  { top: 90, left: 140, size: 120, opacity: 0.035 },
  { top: 190, left: -30, size: 110, opacity: 0.03 },
  { top: 200, left: 100, size: 90, opacity: 0.025 },
  { top: 200, left: 240, size: 105, opacity: 0.032 },
  { top: 320, left: 50, size: 125, opacity: 0.038 },
  { top: 330, left: 190, size: 95, opacity: 0.028 },
  { top: 440, left: -20, size: 110, opacity: 0.033 },
  { top: 450, left: 130, size: 100, opacity: 0.03 },
  { top: 560, left: 60, size: 120, opacity: 0.035 },
  { top: 580, left: 220, size: 90, opacity: 0.025 },
];

const DENSE_GRID = [
  { top: -40, left: -50, size: 140, opacity: 0.05 },
  { top: -30, left: 60, size: 100, opacity: 0.042 },
  { top: -20, left: 170, size: 130, opacity: 0.048 },
  { top: -10, left: 280, size: 90, opacity: 0.038 },
  { top: 60, left: -20, size: 110, opacity: 0.04 },
  { top: 70, left: 110, size: 130, opacity: 0.045 },
  { top: 80, left: 240, size: 100, opacity: 0.038 },
  { top: 160, left: -40, size: 95, opacity: 0.035 },
  { top: 170, left: 80, size: 120, opacity: 0.042 },
  { top: 180, left: 200, size: 100, opacity: 0.038 },
  { top: 260, left: 20, size: 130, opacity: 0.045 },
  { top: 270, left: 160, size: 95, opacity: 0.035 },
  { top: 270, left: 270, size: 115, opacity: 0.04 },
  { top: 360, left: -30, size: 105, opacity: 0.038 },
  { top: 370, left: 100, size: 125, opacity: 0.045 },
  { top: 380, left: 230, size: 95, opacity: 0.035 },
  { top: 460, left: 50, size: 110, opacity: 0.04 },
  { top: 470, left: 180, size: 130, opacity: 0.045 },
  { top: 560, left: -20, size: 100, opacity: 0.038 },
  { top: 570, left: 130, size: 115, opacity: 0.042 },
];

export default function HoneycombWallpaper({ density = "Medium" }: HoneycombWallpaperProps) {
  const grid =
    density === "Sparse" ? SPARSE_GRID :
    density === "Dense" ? DENSE_GRID :
    MEDIUM_GRID;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {grid.map((p, i) => (
        <MaterialCommunityIcons
          key={i}
          name="hexagon-outline"
          size={p.size}
          color={`rgba(201,134,10,${p.opacity})`}
          style={{ position: "absolute", top: p.top, left: p.left }}
        />
      ))}
    </View>
  );
}
