/**
 * QueenBeeWidget — Pixar-style cartoon bee, draggable, always-on-top companion.
 * Drawn entirely with React Native Views (no images needed).
 */
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  PanResponder,
  Platform,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
} from "react-native";

const { width: SW, height: SH } = Dimensions.get("window");

const BEE_W = 68;
const BEE_H = 86;
const LABEL_H = 18;
const WIDGET_H = BEE_H + LABEL_H + 4;

// Bee colours
const GOLD = "#F5C518";
const GOLD_DARK = "#D4A017";
const STRIPE = "#1a1a1a";
const WHITE = "#FFFFFF";
const EYE_IRIS = "#3B6EE8";
const WING_COLOR = "rgba(190, 230, 255, 0.72)";
const WING_BORDER = "rgba(160, 210, 255, 0.6)";

// ── Sub-components ────────────────────────────────────────────────────────────

function Wing({
  side,
  flutterAnim,
}: {
  side: "left" | "right";
  flutterAnim: Animated.Value;
}) {
  const rotate = flutterAnim.interpolate({
    inputRange: [0, 1],
    outputRange: side === "left" ? ["-30deg", "-40deg"] : ["30deg", "40deg"],
  });
  const scaleY = flutterAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.88],
  });

  return (
    <Animated.View
      style={[
        styles.wing,
        side === "left" ? styles.wingLeft : styles.wingRight,
        { transform: [{ rotate }, { scaleY }] },
      ]}
    />
  );
}

function Eye({ side }: { side: "left" | "right" }) {
  return (
    <View style={[styles.eyeOuter, side === "left" ? { marginRight: 5 } : { marginLeft: 5 }]}>
      {/* White sclera */}
      <View style={styles.eyeWhite}>
        {/* Coloured iris */}
        <View style={styles.eyeIris}>
          {/* Pupil */}
          <View style={styles.eyePupil} />
        </View>
        {/* Catchlight highlight */}
        <View style={styles.eyeHighlight} />
      </View>
    </View>
  );
}

function BeeFace({ expression }: { expression: "happy" | "thinking" | "grabbed" }) {
  const smileStyle = expression === "grabbed"
    ? styles.mouthO
    : styles.mouthSmile;

  return (
    <View style={styles.face}>
      <Eye side="left" />
      <Eye side="right" />
      <View style={smileStyle} />
    </View>
  );
}

function BeeBody() {
  return (
    <View style={styles.body}>
      {/* Stripe 1 */}
      <View style={[styles.stripe, { top: "22%", height: "18%" }]} />
      {/* Stripe 2 */}
      <View style={[styles.stripe, { top: "48%", height: "18%" }]} />
      {/* Stripe 3 */}
      <View style={[styles.stripe, { top: "74%", height: "12%" }]} />
      {/* Belly sheen */}
      <View style={styles.bellySheen} />
    </View>
  );
}

function Antennae() {
  return (
    <View style={styles.antennaeWrap}>
      {/* Left antenna */}
      <View style={styles.antennaLeft}>
        <View style={styles.antennaStem} />
        <View style={styles.antennaBall} />
      </View>
      {/* Right antenna */}
      <View style={styles.antennaRight}>
        <View style={styles.antennaStem} />
        <View style={styles.antennaBall} />
      </View>
    </View>
  );
}

function Stinger() {
  return (
    <View style={styles.stingerWrap}>
      <View style={styles.stinger} />
    </View>
  );
}

// ── Main widget ───────────────────────────────────────────────────────────────

interface Props {
  onPress: () => void;
  initialBottom?: number;
  initialRight?: number;
}

export default function QueenBeeWidget({ onPress, initialBottom = 88, initialRight = 16 }: Props) {
  // Position — start bottom-right
  const posRef = useRef({
    x: SW - BEE_W - initialRight,
    y: SH - WIDGET_H - initialBottom,
  });
  const pan = useRef(new Animated.ValueXY({ x: posRef.current.x, y: posRef.current.y })).current;

  // Bop / hover
  const bobAnim = useRef(new Animated.Value(0)).current;
  // Wings
  const flutterAnim = useRef(new Animated.Value(0)).current;
  // Shadow scale
  const shadowAnim = useRef(new Animated.Value(1)).current;

  const [expression, setExpression] = useState<"happy" | "thinking" | "grabbed">("happy");
  const [isDragging, setIsDragging] = useState(false);
  const bobLoopRef = useRef<Animated.CompositeAnimation | null>(null);
  const flutterLoopRef = useRef<Animated.CompositeAnimation | null>(null);

  // Bob animation
  const startBob = useCallback(() => {
    bobAnim.setValue(0);
    bobLoopRef.current = Animated.loop(
      Animated.sequence([
        Animated.timing(bobAnim, { toValue: 1, duration: 1400, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(bobAnim, { toValue: 0, duration: 1400, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    );
    bobLoopRef.current.start();
  }, []);

  const stopBob = useCallback(() => {
    bobLoopRef.current?.stop();
    Animated.timing(bobAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start();
  }, []);

  // Wing flutter
  const startFlutter = useCallback(() => {
    flutterAnim.setValue(0);
    flutterLoopRef.current = Animated.loop(
      Animated.sequence([
        Animated.timing(flutterAnim, { toValue: 1, duration: 180, easing: Easing.linear, useNativeDriver: true }),
        Animated.timing(flutterAnim, { toValue: 0, duration: 180, easing: Easing.linear, useNativeDriver: true }),
      ])
    );
    flutterLoopRef.current.start();
  }, []);

  useEffect(() => {
    startBob();
    startFlutter();
    return () => {
      bobLoopRef.current?.stop();
      flutterLoopRef.current?.stop();
    };
  }, []);

  const bobTranslate = bobAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -8],
  });

  // PanResponder for drag
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, g) =>
        Math.abs(g.dx) > 4 || Math.abs(g.dy) > 4,

      onPanResponderGrant: () => {
        setIsDragging(true);
        setExpression("grabbed");
        stopBob();
        // Lift shadow
        Animated.spring(shadowAnim, { toValue: 1.5, useNativeDriver: true }).start();
        // Fix pan offset from current position
        pan.setOffset({ x: posRef.current.x, y: posRef.current.y });
        pan.setValue({ x: 0, y: 0 });
      },

      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], {
        useNativeDriver: false,
      }),

      onPanResponderRelease: (_, g) => {
        pan.flattenOffset();
        // Clamp inside screen
        const rawX = posRef.current.x + g.dx;
        const rawY = posRef.current.y + g.dy;
        const clampedX = Math.max(0, Math.min(SW - BEE_W, rawX));
        const clampedY = Math.max(60, Math.min(SH - WIDGET_H - 80, rawY));
        posRef.current = { x: clampedX, y: clampedY };

        Animated.spring(pan, {
          toValue: { x: clampedX, y: clampedY },
          useNativeDriver: false,
          tension: 80,
          friction: 10,
        }).start();

        setIsDragging(false);
        setExpression("happy");
        startBob();
        Animated.spring(shadowAnim, { toValue: 1, useNativeDriver: true }).start();
      },

      onPanResponderTerminate: () => {
        setIsDragging(false);
        setExpression("happy");
        startBob();
      },
    })
  ).current;

  return (
    <Animated.View
      style={[
        styles.container,
        { left: pan.x, top: pan.y },
      ]}
      {...panResponder.panHandlers}
    >
      {/* Drop shadow underneath bee */}
      <Animated.View
        style={[
          styles.dropShadow,
          { transform: [{ scaleX: shadowAnim }] },
        ]}
      />

      <TouchableWithoutFeedback
        onPress={() => {
          if (!isDragging) onPress();
        }}
      >
        <Animated.View style={{ transform: [{ translateY: bobTranslate }] }}>
          {/* Wings behind body */}
          <View style={styles.wingsRow}>
            <Wing side="left" flutterAnim={flutterAnim} />
            <Wing side="right" flutterAnim={flutterAnim} />
          </View>

          {/* Bee body stack */}
          <View style={styles.beeStack}>
            <Antennae />
            {/* Head */}
            <View style={styles.head}>
              <BeeFace expression={expression} />
            </View>
            {/* Body */}
            <BeeBody />
            <Stinger />
          </View>
        </Animated.View>
      </TouchableWithoutFeedback>

      {/* Label */}
      <View style={styles.labelWrap}>
        <View style={styles.labelBubble}>
          <Text style={styles.labelText}>Queen B 🐝</Text>
        </View>
      </View>
    </Animated.View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    width: BEE_W,
    alignItems: "center",
    zIndex: 999,
  },

  dropShadow: {
    position: "absolute",
    bottom: LABEL_H + 2,
    width: 44,
    height: 10,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.25)",
    alignSelf: "center",
  },

  // ── Wings ──
  wingsRow: {
    position: "absolute",
    top: 22,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  wing: {
    width: 34,
    height: 22,
    borderRadius: 50,
    backgroundColor: WING_COLOR,
    borderWidth: 1.5,
    borderColor: WING_BORDER,
    ...(Platform.OS !== "android" && {
      shadowColor: "#aaddff",
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.8,
      shadowRadius: 4,
    }),
  },
  wingLeft: {
    marginRight: -6,
    transform: [{ rotate: "-35deg" }, { scaleX: 1.1 }],
  },
  wingRight: {
    marginLeft: -6,
    transform: [{ rotate: "35deg" }, { scaleX: 1.1 }],
  },

  // ── Body stack ──
  beeStack: {
    alignItems: "center",
    zIndex: 2,
  },

  // ── Antennae ──
  antennaeWrap: {
    flexDirection: "row",
    justifyContent: "center",
    width: BEE_W,
    height: 20,
    paddingTop: 0,
    marginBottom: -4,
  },
  antennaLeft: {
    width: 14,
    alignItems: "flex-end",
    marginRight: 6,
    transform: [{ rotate: "-22deg" }],
  },
  antennaRight: {
    width: 14,
    alignItems: "flex-start",
    marginLeft: 6,
    transform: [{ rotate: "22deg" }],
  },
  antennaStem: {
    width: 2.5,
    height: 14,
    backgroundColor: STRIPE,
    borderRadius: 2,
    marginBottom: 2,
  },
  antennaBall: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: STRIPE,
    marginLeft: -2,
  },

  // ── Head ──
  head: {
    width: 40,
    height: 38,
    borderRadius: 20,
    backgroundColor: GOLD,
    borderWidth: 1.5,
    borderColor: GOLD_DARK,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 3,
    marginBottom: -4,
    ...(Platform.OS !== "android" && {
      shadowColor: GOLD_DARK,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.5,
      shadowRadius: 3,
    }),
  },

  // ── Face / eyes ──
  face: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  eyeOuter: {
    alignItems: "center",
    justifyContent: "center",
  },
  eyeWhite: {
    width: 13,
    height: 15,
    borderRadius: 8,
    backgroundColor: WHITE,
    borderWidth: 0.5,
    borderColor: "#ccc",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  eyeIris: {
    width: 9,
    height: 11,
    borderRadius: 6,
    backgroundColor: EYE_IRIS,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  eyePupil: {
    width: 5,
    height: 6,
    borderRadius: 4,
    backgroundColor: "#0a0a0a",
  },
  eyeHighlight: {
    position: "absolute",
    top: 2,
    left: 2,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.9)",
  },
  mouthSmile: {
    position: "absolute",
    bottom: -14,
    width: 14,
    height: 7,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    borderWidth: 2.5,
    borderColor: STRIPE,
    borderTopWidth: 0,
    alignSelf: "center",
  },
  mouthO: {
    position: "absolute",
    bottom: -14,
    width: 9,
    height: 9,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: STRIPE,
    alignSelf: "center",
  },

  // ── Body ──
  body: {
    width: 44,
    height: 46,
    borderRadius: 22,
    backgroundColor: GOLD,
    borderWidth: 1.5,
    borderColor: GOLD_DARK,
    overflow: "hidden",
    zIndex: 2,
    ...(Platform.OS !== "android" && {
      shadowColor: GOLD_DARK,
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.4,
      shadowRadius: 4,
    }),
  },
  stripe: {
    position: "absolute",
    left: 0,
    right: 0,
    backgroundColor: STRIPE,
    opacity: 0.88,
  },
  bellySheen: {
    position: "absolute",
    top: 6,
    left: 8,
    width: 12,
    height: 20,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.22)",
    transform: [{ rotate: "-10deg" }],
  },

  // ── Stinger ──
  stingerWrap: {
    alignItems: "center",
    marginTop: -2,
  },
  stinger: {
    width: 0,
    height: 0,
    borderLeftWidth: 4,
    borderRightWidth: 4,
    borderTopWidth: 8,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: STRIPE,
  },

  // ── Label ──
  labelWrap: {
    marginTop: 4,
    alignItems: "center",
  },
  labelBubble: {
    backgroundColor: "rgba(201,134,10,0.92)",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  labelText: {
    color: "#fff",
    fontSize: 10,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.3,
  },
});
