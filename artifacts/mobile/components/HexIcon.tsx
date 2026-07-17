import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useRef } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import Svg, {
  Defs,
  Ellipse,
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
const HEX_TOP_FACET = "50,7 87.2,28.5 50,50 12.8,28.5";

// Blend a #rrggbb colour toward white (amt > 0) or black (amt < 0).
function shade(hex: string, amt: number): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex);
  if (!m) return hex;
  const n = parseInt(m[1], 16);
  const mix = (c: number) =>
    Math.round(amt >= 0 ? c + (255 - c) * amt : c * (1 + amt));
  const r = mix((n >> 16) & 255);
  const g = mix((n >> 8) & 255);
  const b = mix(n & 255);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

/**
 * Candy-glossy "Pixar" hexagon node for the dashboard hive.
 * A vivid colour body shaded light-to-dark, a big soft gloss highlight,
 * a bright rounded rim and a soft drop shadow give it a toy-like 3D feel.
 * The whole tile is slightly translucent so the honeycomb wallpaper
 * shows through. The active node gets a gold glow.
 */
export default function HexIcon({
  icon,
  label,
  color,
  size = 85,
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
  labelColor?: string;
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

  const iconSize = Math.round(size * 0.34);
  const light = shade(color, 0.55);
  const mid = shade(color, 0.08);
  const dark = shade(color, -0.42);

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
        {/* ~15% translucent so the wallpaper glows through the candy shell */}
        <Svg width={size} height={size} viewBox="0 0 100 100" opacity={0.85}>
          <Defs>
            <LinearGradient id={`body-${gid}`} x1="0" y1="0" x2="0.25" y2="1">
              <Stop offset="0" stopColor={light} stopOpacity={0.95} />
              <Stop offset="0.45" stopColor={mid} stopOpacity={0.9} />
              <Stop offset="1" stopColor={dark} stopOpacity={0.95} />
            </LinearGradient>
            <LinearGradient id={`facet-${gid}`} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="#ffffff" stopOpacity={0.6} />
              <Stop offset="1" stopColor="#ffffff" stopOpacity={0.02} />
            </LinearGradient>
            <LinearGradient id={`rim-${gid}`} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="#ffffff" stopOpacity={active ? 0.95 : 0.85} />
              <Stop offset="0.5" stopColor={active ? "#F5C518" : light} stopOpacity={active ? 0.95 : 0.7} />
              <Stop offset="1" stopColor={active ? "#F5C518" : dark} stopOpacity={active ? 0.85 : 0.6} />
            </LinearGradient>
            <RadialGradient id={`glow-${gid}`} cx="0.5" cy="0.42" r="0.62">
              <Stop offset="0" stopColor={active ? "#F5C518" : light} stopOpacity={active ? 0.4 : 0.2} />
              <Stop offset="1" stopColor={color} stopOpacity={0} />
            </RadialGradient>
            <RadialGradient id={`gloss-${gid}`} cx="0.5" cy="0.35" r="0.65">
              <Stop offset="0" stopColor="#ffffff" stopOpacity={0.55} />
              <Stop offset="0.7" stopColor="#ffffff" stopOpacity={0.06} />
              <Stop offset="1" stopColor="#ffffff" stopOpacity={0} />
            </RadialGradient>
          </Defs>

          {/* soft drop shadow for depth */}
          <Polygon points={hexPoints(51.5, 54, 43)} fill="#000000" opacity={0.3} />
          {/* soft glow behind the shell */}
          <Polygon points={HEX_OUTER} fill={`url(#glow-${gid})`} />
          {/* candy body */}
          <Polygon
            points={HEX_BODY}
            fill={`url(#body-${gid})`}
            stroke={`url(#rim-${gid})`}
            strokeWidth={active ? 3 : 2.4}
            strokeLinejoin="round"
          />
          {/* top facet catching the light */}
          <Polygon points={HEX_TOP_FACET} fill={`url(#facet-${gid})`} opacity={0.7} />
          {/* big soft gloss blob — the toy-like sheen */}
          <Ellipse cx="42" cy="30" rx="26" ry="16" fill={`url(#gloss-${gid})`} />
        </Svg>

        {/* centre glyph */}
        <View style={[StyleSheet.absoluteFillObject, styles.center]}>
          <MaterialCommunityIcons
            name={icon}
            size={iconSize}
            color={active ? "#F5C518" : "#ffffff"}
            style={styles.glyphShadow}
          />
        </View>
        {badge && (
          <View style={[styles.badge, { backgroundColor: color, right: size * 0.14, top: size * 0.1 }]} />
        )}
      </Animated.View>
      <Text
        style={[
          styles.label,
          { color: active ? "#F5C518" : shade(color, 0.35), fontFamily: "Inter_700Bold" },
        ]}
        numberOfLines={2}
      >
        {label.toUpperCase()}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: "center", justifyContent: "center" },
  glyphShadow: {
    textShadowColor: "rgba(0,0,0,0.45)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 3,
  },
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
    fontSize: 9.5,
    letterSpacing: 0.5,
    textAlign: "center",
    lineHeight: 12.5,
    opacity: 0.9,
  },
});
