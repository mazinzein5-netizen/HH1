/**
 * QueenBeeWidget — small Pixar-style 3D cartoon bee, draggable.
 *
 * Lifelike touches: high-frequency wing buzz with a motion-blur ghost pair,
 * random blinking, bob with squash-and-stretch, gentle hover tilt, glossy
 * sphere shading, and a pulsing "always online" presence dot.
 */
import { LinearGradient } from "expo-linear-gradient";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  PanResponder,
  Platform,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
} from "react-native";

const { width: SW, height: SH } = Dimensions.get("window");

// ── Size constants (smaller, friendlier footprint) ────────────────────────────
const BEE_W = 38;   // total widget width
const BEE_H = 47;   // total bee height (no label)

// ── Colour palette ─────────────────────────────────────────────────────────────
const G0  = "#FFF59D"; // top highlight
const G1  = "#FFCA28"; // golden yellow
const G2  = "#F5A800"; // mid amber
const G3  = "#C17900"; // deep shadow
const BK  = "#1C1207"; // near-black stripe / outline
const EW  = "#FFFFFF";  // eye white
const EI  = "#1A56CC"; // iris blue
const EP  = "#080808"; // pupil
const WC  = "rgba(210,240,255,0.85)"; // wing fill
const WB  = "rgba(140,205,255,0.6)";  // wing border
const ONLINE = "#22c55e";

// ── Wing (sharp pair + ghost pair for motion blur) ────────────────────────────
function Wing({
  side,
  anim,
  ghost,
}: {
  side: "L" | "R";
  anim: Animated.Value;
  ghost?: boolean;
}) {
  // Ghost pair flaps in counter-phase at lower opacity → motion-blur illusion
  const rot = anim.interpolate({
    inputRange: [0, 1],
    outputRange: side === "L" ? ["-18deg", "-52deg"] : ["18deg", "52deg"],
  });
  const rotGhost = anim.interpolate({
    inputRange: [0, 1],
    outputRange: side === "L" ? ["-52deg", "-18deg"] : ["52deg", "18deg"],
  });
  const sy = anim.interpolate({ inputRange: [0, 1], outputRange: ghost ? [0.8, 1] : [1, 0.8] });
  return (
    <Animated.View
      style={[
        s.wing,
        side === "L" ? s.wingL : s.wingR,
        ghost && s.wingGhost,
        { transform: [{ rotate: ghost ? rotGhost : rot }, { scaleY: sy }] },
      ]}
    />
  );
}

// ── Eye (big Pixar eye, dual catchlights, blinking lid via scaleY) ────────────
function Eye({ blink }: { blink: Animated.Value }) {
  return (
    <View style={s.eyeShell}>
      <Animated.View style={[s.eyeWhite, { transform: [{ scaleY: blink }] }]}>
        <LinearGradient
          colors={["#5b97ff", EI, "#0a2faa"]}
          start={{ x: 0.25, y: 0.1 }}
          end={{ x: 0.75, y: 1 }}
          style={s.eyeIris}
        >
          <View style={s.pupil} />
        </LinearGradient>
        {/* primary catchlight */}
        <View style={s.catchlight} />
        {/* secondary, smaller catchlight opposite side */}
        <View style={s.catchlight2} />
      </Animated.View>
    </View>
  );
}

// ── Face (eyes + expression) ──────────────────────────────────────────────────
function Face({ grabbed, blink }: { grabbed: boolean; blink: Animated.Value }) {
  return (
    <View style={s.face}>
      <Eye blink={blink} />
      <Eye blink={blink} />
      <View style={grabbed ? s.mouthO : s.mouthSmile} />
    </View>
  );
}

// ── Antennae (sway gently with the bob) ──────────────────────────────────────
function Antennae({ sway }: { sway: Animated.AnimatedInterpolation<string> }) {
  return (
    <View style={s.antRow}>
      <Animated.View style={[s.antL, { transform: [{ rotate: sway }] }]}>
        <View style={s.antStem} />
        <LinearGradient colors={[G1, G3]} style={s.antBall} />
      </Animated.View>
      <Animated.View style={[s.antR, { transform: [{ rotate: sway }] }]}>
        <View style={s.antStem} />
        <LinearGradient colors={[G1, G3]} style={s.antBall} />
      </Animated.View>
    </View>
  );
}

// ── Body — laid back behind the head with perspective foreshortening ─────────
function Body() {
  return (
    <View style={s.bodyOuter}>
      {/* 3D sphere gradient — light from the front (bottom, near the head) */}
      <LinearGradient
        colors={[G3, G2, G1, G0]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={s.bodyGrad}
      >
        {/* Black stripes — foreshortened by the rotateX lay-back */}
        <View style={[s.stripe, { top: "16%", height: "15%" }]} />
        <View style={[s.stripe, { top: "42%", height: "16%" }]} />
        <View style={[s.stripe, { top: "68%", height: "16%" }]} />
        {/* front sheen, catching light near the head */}
        <View style={s.specular} />
        <View style={s.specular2} />
        {/* atmospheric depth haze — the far end fades darker */}
        <LinearGradient
          colors={["rgba(30,18,4,0.55)", "rgba(30,18,4,0.18)", "transparent"]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 0.85 }}
          style={StyleSheet.absoluteFillObject}
        />
      </LinearGradient>
    </View>
  );
}

// ── Head ──────────────────────────────────────────────────────────────────────
function Head({ grabbed, blink }: { grabbed: boolean; blink: Animated.Value }) {
  return (
    <View style={s.headOuter}>
      <LinearGradient
        colors={[G0, G1, G2, G3]}
        start={{ x: 0.15, y: 0.05 }}
        end={{ x: 0.85, y: 1 }}
        style={s.headGrad}
      >
        {/* top specular */}
        <View style={s.headSpec} />
        <Face grabbed={grabbed} blink={blink} />
      </LinearGradient>
    </View>
  );
}

// ── Stinger ───────────────────────────────────────────────────────────────────
function Stinger() {
  return (
    <View style={s.stingerWrap}>
      <LinearGradient colors={[G2, BK]} style={s.stinger} />
    </View>
  );
}

// ── Main Widget ───────────────────────────────────────────────────────────────
interface Props {
  onPress: () => void;
  initialBottom?: number;
  initialRight?: number;
}

export default function QueenBeeWidget({
  onPress,
  initialBottom = 90,
  initialRight = 18,
}: Props) {
  const startX = SW - BEE_W - initialRight;
  const startY = SH - BEE_H - initialBottom;

  const posRef = useRef({ x: startX, y: startY });
  const pan = useRef(new Animated.ValueXY({ x: startX, y: startY })).current;

  const bobAnim     = useRef(new Animated.Value(0)).current;
  const flutterAnim = useRef(new Animated.Value(0)).current;
  const tiltAnim    = useRef(new Animated.Value(0)).current;
  const blinkAnim   = useRef(new Animated.Value(1)).current;
  const pulseAnim   = useRef(new Animated.Value(0)).current;
  const shadowAnim  = useRef(new Animated.Value(1)).current;
  const scaleAnim   = useRef(new Animated.Value(1)).current;

  const [grabbed, setGrabbed] = useState(false);
  const bobRef     = useRef<Animated.CompositeAnimation | null>(null);
  const blinkTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startBob = useCallback(() => {
    bobAnim.setValue(0);
    bobRef.current = Animated.loop(
      Animated.sequence([
        Animated.timing(bobAnim, { toValue: 1, duration: 1100, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(bobAnim, { toValue: 0, duration: 1100, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    );
    bobRef.current.start();
  }, [bobAnim]);

  const stopBob = useCallback(() => {
    bobRef.current?.stop();
  }, []);

  useEffect(() => {
    startBob();

    // Wing buzz — fast enough to feel like a real hover (~8 Hz full cycle)
    const flutter = Animated.loop(
      Animated.sequence([
        Animated.timing(flutterAnim, { toValue: 1, duration: 60, easing: Easing.linear, useNativeDriver: true }),
        Animated.timing(flutterAnim, { toValue: 0, duration: 60, easing: Easing.linear, useNativeDriver: true }),
      ])
    );
    flutter.start();

    // Gentle hover tilt — like she's riding a light breeze
    const tilt = Animated.loop(
      Animated.sequence([
        Animated.timing(tiltAnim, { toValue: 1, duration: 1700, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(tiltAnim, { toValue: 0, duration: 1700, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    );
    tilt.start();

    // Online presence pulse
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 1400, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0, duration: 0, useNativeDriver: true }),
      ])
    );
    pulse.start();

    // Random blinking (sometimes a double-blink)
    let cancelled = false;
    const blinkOnce = (then?: () => void) => {
      Animated.sequence([
        Animated.timing(blinkAnim, { toValue: 0.08, duration: 70, easing: Easing.in(Easing.quad), useNativeDriver: true }),
        Animated.timing(blinkAnim, { toValue: 1, duration: 110, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      ]).start(() => then?.());
    };
    const scheduleBlink = () => {
      if (cancelled) return;
      const delay = 2200 + Math.random() * 2800;
      blinkTimer.current = setTimeout(() => {
        if (cancelled) return;
        const double = Math.random() < 0.25;
        blinkOnce(() => {
          if (double && !cancelled) blinkOnce(scheduleBlink);
          else scheduleBlink();
        });
      }, delay);
    };
    scheduleBlink();

    return () => {
      cancelled = true;
      bobRef.current?.stop();
      flutter.stop();
      tilt.stop();
      pulse.stop();
      if (blinkTimer.current) clearTimeout(blinkTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const bobY = bobAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -5] });
  // Squash & stretch: slightly squashed at the top of the bob, stretched at the bottom
  const squashY = bobAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 0.955] });
  const squashX = bobAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.045] });
  const tilt = tiltAnim.interpolate({ inputRange: [0, 1], outputRange: ["-2.5deg", "2.5deg"] });
  const antSway = bobAnim.interpolate({ inputRange: [0, 1], outputRange: ["-4deg", "5deg"] });
  const pulseScale = pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 2.1] });
  const pulseOpacity = pulseAnim.interpolate({ inputRange: [0, 0.7, 1], outputRange: [0.55, 0.12, 0] });

  const pr = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 3 || Math.abs(g.dy) > 3,

      onPanResponderGrant: () => {
        setGrabbed(true);
        stopBob();
        Animated.parallel([
          Animated.spring(shadowAnim, { toValue: 1.6, useNativeDriver: true }),
          Animated.spring(scaleAnim,  { toValue: 1.12, useNativeDriver: true }),
        ]).start();
        pan.setOffset({ x: posRef.current.x, y: posRef.current.y });
        pan.setValue({ x: 0, y: 0 });
      },

      onPanResponderMove: Animated.event(
        [null, { dx: pan.x, dy: pan.y }],
        { useNativeDriver: false }
      ),

      onPanResponderRelease: (_, g) => {
        pan.flattenOffset();
        const nx = Math.max(0, Math.min(SW - BEE_W, posRef.current.x + g.dx));
        const ny = Math.max(60, Math.min(SH - BEE_H - 70, posRef.current.y + g.dy));
        posRef.current = { x: nx, y: ny };

        Animated.spring(pan, {
          toValue: { x: nx, y: ny },
          useNativeDriver: false,
          tension: 90,
          friction: 9,
        }).start();

        setGrabbed(false);
        startBob();
        Animated.parallel([
          Animated.spring(shadowAnim, { toValue: 1,  useNativeDriver: true }),
          Animated.spring(scaleAnim,  { toValue: 1,  useNativeDriver: true }),
        ]).start();
      },

      onPanResponderTerminate: () => {
        setGrabbed(false);
        startBob();
        shadowAnim.setValue(1);
        scaleAnim.setValue(1);
      },
    })
  ).current;

  const handlePress = () => {
    if (grabbed) return;
    // Quick bounce feedback
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.88, duration: 80, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }),
    ]).start();
    onPress();
  };

  return (
    <Animated.View
      style={[s.container, { left: pan.x, top: pan.y }]}
      {...pr.panHandlers}
    >
      {/* Ground shadow */}
      <Animated.View
        style={[s.shadow, { transform: [{ scaleX: shadowAnim }, { scaleY: 0.4 }] }]}
      />

      <TouchableWithoutFeedback
        onPress={handlePress}
        accessibilityRole="button"
        accessibilityLabel="Talk to Sarah"
        testID="sarah-bee"
      >
        <Animated.View
          style={{
            transform: [
              { translateY: bobY },
              { rotate: tilt },
              { scaleY: squashY },
              { scaleX: squashX },
              { scale: scaleAnim },
            ],
          }}
        >
          <View style={s.beeStage}>
            {/* Stinger — furthest away, peeking up behind the body */}
            <View style={s.stingerLayer}>
              <Stinger />
            </View>

            {/* Body — laid back and receding behind the head as she flies forward */}
            <View style={s.bodyLayer}>
              <Body />
            </View>

            {/* Wings — behind the head, above the laid-back body */}
            <View style={s.wingsLayer}>
              <Wing side="L" anim={flutterAnim} ghost />
              <Wing side="R" anim={flutterAnim} ghost />
            </View>
            <View style={s.wingsLayer}>
              <Wing side="L" anim={flutterAnim} />
              <Wing side="R" anim={flutterAnim} />
            </View>

            {/* Head — biggest and closest, face straight at the user */}
            <View style={s.headLayer}>
              <Antennae sway={antSway} />
              <Head grabbed={grabbed} blink={blinkAnim} />
            </View>
          </View>

          {/* Always-online presence dot */}
          <View style={s.onlineDotWrap} pointerEvents="none">
            <Animated.View
              style={[s.onlinePulse, { opacity: pulseOpacity, transform: [{ scale: pulseScale }] }]}
            />
            <View style={s.onlineDot} />
          </View>
        </Animated.View>
      </TouchableWithoutFeedback>
    </Animated.View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  container: {
    position: "absolute",
    width: BEE_W,
    alignItems: "center",
    zIndex: 9999,
  },

  // Ground shadow blob
  shadow: {
    position: "absolute",
    bottom: 0,
    width: 26,
    height: 7,
    borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.22)",
    alignSelf: "center",
  },

  // Flying-forward stage: everything absolutely layered for depth
  beeStage: {
    width: BEE_W,
    height: BEE_H,
  },

  // Wings layer — behind the head, above the receding body
  wingsLayer: {
    position: "absolute",
    top: 9,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    zIndex: 2,
  },
  wing: {
    width: 22,
    height: 14,
    borderRadius: 40,
    backgroundColor: WC,
    borderWidth: 1,
    borderColor: WB,
    ...(Platform.OS !== "android" && {
      shadowColor: "#99ccff",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.9,
      shadowRadius: 3,
    }),
  },
  wingL: { marginRight: -4, transform: [{ rotate: "-32deg" }, { scaleX: 1.05 }] },
  wingR: { marginLeft: -4,  transform: [{ rotate:  "32deg" }, { scaleX: 1.05 }] },
  wingGhost: {
    opacity: 0.35,
    borderWidth: 0,
    ...(Platform.OS !== "android" && { shadowOpacity: 0 }),
  },

  // Head layer — front-most, face towards the user
  headLayer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 3,
  },

  // Body layer — laid back with perspective so it recedes behind the head
  bodyLayer: {
    position: "absolute",
    top: 3,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 1,
    transform: [
      { perspective: 70 },
      { rotateX: "54deg" },
      { scale: 0.98 },
    ],
  },

  // Stinger layer — furthest away, tip trailing up behind the body
  stingerLayer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 0,
    opacity: 0.85,
    transform: [{ rotate: "180deg" }, { scale: 0.8 }],
  },

  // ── Antennae ──
  antRow: {
    flexDirection: "row",
    justifyContent: "center",
    width: BEE_W,
    height: 11,
    marginBottom: -3,
  },
  antL: {
    alignItems: "flex-end",
    width: 10,
    marginRight: 4,
    transform: [{ rotate: "-20deg" }],
  },
  antR: {
    alignItems: "flex-start",
    width: 10,
    marginLeft: 4,
    transform: [{ rotate: "20deg" }],
  },
  antStem: {
    width: 2,
    height: 8,
    backgroundColor: BK,
    borderRadius: 1,
  },
  antBall: {
    width: 4.5,
    height: 4.5,
    borderRadius: 3,
    marginLeft: -1.5,
  },

  // ── Head ──
  headOuter: {
    width: 28,
    height: 26,
    borderRadius: 14,
    overflow: "hidden",
    zIndex: 3,
    ...(Platform.OS !== "android" && {
      shadowColor: G3,
      shadowOffset: { width: -1, height: 2 },
      shadowOpacity: 0.6,
      shadowRadius: 4,
    }),
    elevation: 6,
  },
  headGrad: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  headSpec: {
    position: "absolute",
    top: 2.5,
    left: 3.5,
    width: 8,
    height: 5,
    borderRadius: 5,
    backgroundColor: "rgba(255,255,255,0.5)",
    transform: [{ rotate: "-20deg" }],
  },

  // ── Face — big Pixar eyes facing the user ──
  face: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
    gap: 1.5,
  },
  eyeShell: { alignItems: "center" },
  eyeWhite: {
    width: 10,
    height: 11.5,
    borderRadius: 6,
    backgroundColor: EW,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderWidth: 0.5,
    borderColor: "#ddd",
  },
  eyeIris: {
    width: 7.5,
    height: 9,
    borderRadius: 5,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  pupil: {
    width: 4.5,
    height: 5.5,
    borderRadius: 3,
    backgroundColor: EP,
  },
  catchlight: {
    position: "absolute",
    top: 1.5,
    left: 1.5,
    width: 3.2,
    height: 3.2,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.95)",
  },
  catchlight2: {
    position: "absolute",
    bottom: 2,
    right: 1.5,
    width: 1.8,
    height: 1.8,
    borderRadius: 1,
    backgroundColor: "rgba(255,255,255,0.7)",
  },
  mouthSmile: {
    position: "absolute",
    bottom: -12,
    width: 10,
    height: 5.5,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    borderWidth: 2,
    borderColor: BK,
    borderTopWidth: 0,
    alignSelf: "center",
  },
  mouthO: {
    position: "absolute",
    bottom: -12,
    width: 6.5,
    height: 6.5,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: BK,
    alignSelf: "center",
  },

  // ── Body ──
  bodyOuter: {
    width: 24,
    height: 30,
    borderRadius: 12,
    overflow: "hidden",
    ...(Platform.OS !== "android" && {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.45,
      shadowRadius: 4,
    }),
    elevation: 6,
  },
  bodyGrad: { flex: 1, overflow: "hidden" },
  stripe: {
    position: "absolute",
    left: 0,
    right: 0,
    backgroundColor: BK,
    opacity: 0.9,
  },
  specular: {
    position: "absolute",
    top: 4,
    left: 4,
    width: 7,
    height: 12,
    borderRadius: 6,
    backgroundColor: "rgba(255,255,255,0.3)",
    transform: [{ rotate: "-12deg" }],
  },
  specular2: {
    position: "absolute",
    top: 3,
    right: 4,
    width: 3,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.14)",
    transform: [{ rotate: "14deg" }],
  },
  rimShadow: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "30%",
    backgroundColor: "rgba(0,0,0,0.18)",
    borderBottomLeftRadius: 13,
    borderBottomRightRadius: 13,
  },

  // ── Stinger ──
  stingerWrap: { alignItems: "center" },
  stinger: {
    width: 4.5,
    height: 7,
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 3,
    borderTopLeftRadius: 1,
    borderTopRightRadius: 1,
  },

  // ── Always-online presence dot ──
  onlineDotWrap: {
    position: "absolute",
    top: 8,
    right: -1,
    width: 12,
    height: 12,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 5,
  },
  onlinePulse: {
    position: "absolute",
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: ONLINE,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: ONLINE,
    borderWidth: 1.5,
    borderColor: "#ffffff",
  },
});
