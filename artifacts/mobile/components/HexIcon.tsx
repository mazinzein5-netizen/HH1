import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useRef } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import Svg, {
  Defs,
  LinearGradient,
  Polygon,
  RadialGradient,
  Stop,
} from "react-native-svg";

// Pointy-top hexagon in a 100x100 viewBox.
const hexPoints = (cx: number, cy: number, r: number) =>
  Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 180) * (60 * i - 90);
    return `${cx + r * Math.sin(a) * -1},${cy - r * Math.cos(a)}`;
  }).join(" ");

const HEX_OUTER = hexPoints(50, 50, 46);
const HEX_BODY = hexPoints(50, 50, 43);
const HEX_INNER = hexPoints(50, 50, 36);
const HEX_TOP_FACET = "50,7 87.2,28.5 50,50 12.8,28.5";

/**
 * Small "3D glass" hexagon node for the dashboard hive.
 * SVG gradients build the glass: a translucent tinted body, a top facet
 * catching the light, an inner refraction ring, and a soft rim. The active
 * node gets a gold glow.
 */
export default function HexIcon({
  icon,
  label,
  color,
  size = 74,
  active = false,
  badge,
  onPress,
  labelColor,
  reduceMotion = false,
}: {
  icon: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
  label: string;
  color: string;
  size?: number;
  active?: boolean;
  badge?: boolean;
  onPress: (originX?: number, originY?: number) => void;
  labelColor: string;
  reduceMotion?: boolean;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const gid = useRef(Math.random().toString(36).slice(2, 8)).current;

  const pressIn = () => {
    if (reduceMotion) return;
    Animated.spring(scale, { toValue: 0.9, useNativeDriver: true, speed: 40, bounciness: 5 }).start();
  };
  const pressOut = () => {
    if (reduceMotion) return;
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 40, bounciness: 5 }).start();
  };

  const iconSize = Math.round(size * 0.32);

  return (
    <Pressable
      onPress={(e) => {
        // Don't let the tap bubble to the outside-tap collapse wrapper.
        e.stopPropagation?.();
        onPress(e.nativeEvent?.pageX, e.nativeEvent?.pageY);
      }}
      onPressIn={pressIn}
      onPressOut={pressOut}
      style={{ alignItems: "center", width: size + 8 }}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      accessibilityLabel={label}
    >
      <Animated.View style={{ width: size, height: size, transform: [{ scale }] }}>
        <Svg width={size} height={size} viewBox="0 0 100 100">
          <Defs>
            <LinearGradient id={`body-${gid}`} x1="0" y1="0" x2="0.35" y2="1">
              <Stop offset="0" stopColor="#ffffff" stopOpacity={0.16} />
              <Stop offset="0.4" stopColor={color} stopOpacity={active ? 0.30 : 0.16} />
              <Stop offset="1" stopColor="#000000" stopOpacity={0.38} />
            </LinearGradient>
            <LinearGradient id={`facet-${gid}`} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="#ffffff" stopOpacity={0.30} />
              <Stop offset="1" stopColor="#ffffff" stopOpacity={0.02} />
            </LinearGradient>
            <LinearGradient id={`rim-${gid}`} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="#ffffff" stopOpacity={active ? 0.9 : 0.45} />
              <Stop offset="0.5" stopColor={active ? "#F5C518" : color} stopOpacity={active ? 0.95 : 0.55} />
              <Stop offset="1" stopColor={color} stopOpacity={active ? 0.8 : 0.30} />
            </LinearGradient>
            <RadialGradient id={`glow-${gid}`} cx="0.5" cy="0.42" r="0.62">
              <Stop offset="0" stopColor={active ? "#F5C518" : color} stopOpacity={active ? 0.30 : 0.14} />
              <Stop offset="1" stopColor={color} stopOpacity={0} />
            </RadialGradient>
          </Defs>

          {/* soft drop shadow for depth */}
          <Polygon
            points={hexPoints(51.5, 53, 43)}
            fill="#000000"
            opacity={0.28}
          />
          {/* soft inner glow behind the glass */}
          <Polygon points={HEX_OUTER} fill={`url(#glow-${gid})`} />
          {/* glass body */}
          <Polygon
            points={HEX_BODY}
            fill={`url(#body-${gid})`}
            stroke={`url(#rim-${gid})`}
            strokeWidth={active ? 2.4 : 1.6}
            strokeLinejoin="round"
          />
          {/* top facet catching the light */}
          <Polygon points={HEX_TOP_FACET} fill={`url(#facet-${gid})`} opacity={0.55} />
          {/* inner refraction line */}
          <Polygon
            points={HEX_INNER}
            fill="none"
            stroke="#ffffff"
            strokeOpacity={active ? 0.22 : 0.10}
            strokeWidth={1}
            strokeLinejoin="round"
          />
        </Svg>

        {/* centre glyph */}
        <View style={[StyleSheet.absoluteFillObject, styles.center]}>
          <MaterialCommunityIcons
            name={icon}
            size={iconSize}
            color={active ? "#F5C518" : color}
          />
        </View>
        {badge && (
          <View style={[styles.badge, { backgroundColor: color, right: size * 0.14, top: size * 0.1 }]} />
        )}
      </Animated.View>
      <Text
        style={[styles.label, { color: active ? "#F5C518" : labelColor, fontFamily: "Inter_600SemiBold" }]}
        numberOfLines={2}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: "center", justifyContent: "center" },
  badge: {
    position: "absolute",
    width: 9,
    height: 9,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: "rgba(0,0,0,0.5)",
  },
  label: {
    marginTop: 3,
    fontSize: 10.5,
    textAlign: "center",
    lineHeight: 13,
  },
});
