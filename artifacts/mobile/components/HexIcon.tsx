import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useRef } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";

/**
 * Large translucent "3D" hexagon icon used on the dashboard hive grid.
 * Layered hexagon glyphs create depth: a dark drop hexagon behind, a
 * coloured translucent face, a bright outline, and a top-light highlight.
 */
export default function HexIcon({
  icon,
  label,
  color,
  size = 104,
  active = false,
  badge,
  onPress,
  labelColor,
}: {
  icon: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
  label: string;
  color: string;
  size?: number;
  active?: boolean;
  badge?: boolean;
  onPress: () => void;
  labelColor: string;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  const pressIn = () =>
    Animated.spring(scale, { toValue: 0.92, useNativeDriver: true, speed: 40, bounciness: 6 }).start();
  const pressOut = () =>
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 40, bounciness: 6 }).start();

  const iconSize = Math.round(size * 0.34);

  return (
    <Pressable
      onPress={onPress}
      onPressIn={pressIn}
      onPressOut={pressOut}
      style={{ alignItems: "center", width: size }}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Animated.View style={{ width: size, height: size, transform: [{ scale }] }}>
        {/* depth: dark hexagon offset down-right */}
        <MaterialCommunityIcons
          name="hexagon"
          size={size}
          color="rgba(0,0,0,0.45)"
          style={[styles.layer, { top: size * 0.045, left: size * 0.03 }]}
        />
        {/* translucent coloured face */}
        <MaterialCommunityIcons
          name="hexagon"
          size={size}
          color={color + (active ? "55" : "33")}
          style={styles.layer}
        />
        {/* crisp coloured rim */}
        <MaterialCommunityIcons
          name="hexagon-outline"
          size={size}
          color={color + (active ? "FF" : "AA")}
          style={styles.layer}
        />
        {/* top-light highlight for the 3D sheen */}
        <MaterialCommunityIcons
          name="hexagon-outline"
          size={size * 0.86}
          color="rgba(255,255,255,0.20)"
          style={[styles.layer, { top: -size * 0.005, left: size * 0.07 }]}
        />
        {/* centre glyph */}
        <View style={[StyleSheet.absoluteFillObject, styles.center]}>
          <MaterialCommunityIcons name={icon} size={iconSize} color={color} />
        </View>
        {badge && (
          <View style={[styles.badge, { backgroundColor: color, right: size * 0.16, top: size * 0.12 }]} />
        )}
      </Animated.View>
      <Text
        style={[styles.label, { color: active ? color : labelColor, fontFamily: "Inter_600SemiBold" }]}
        numberOfLines={2}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  layer: { position: "absolute" },
  center: { alignItems: "center", justifyContent: "center" },
  badge: {
    position: "absolute",
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: "rgba(0,0,0,0.5)",
  },
  label: {
    marginTop: 2,
    fontSize: 11.5,
    textAlign: "center",
    lineHeight: 14,
  },
});
