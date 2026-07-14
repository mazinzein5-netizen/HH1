/**
 * QueenBeeWidget — small Pixar-style 3D cartoon bee, draggable.
 * Uses expo-linear-gradient for sphere shading. No label.
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

// ── Size constants ─────────────────────────────────────────────────────────────
const BEE_W = 44;   // total widget width
const BEE_H = 54;   // total bee height (no label)

// ── Colour palette ─────────────────────────────────────────────────────────────
const G0  = "#FFF176"; // top highlight
const G1  = "#FFCA28"; // golden yellow
const G2  = "#F5A800"; // mid amber
const G3  = "#C17900"; // deep shadow
const BK  = "#1C1207"; // near-black stripe / outline
const EW  = "#FFFFFF";  // eye white
const EI  = "#1A56CC"; // iris blue
const EP  = "#080808"; // pupil
const WC  = "rgba(200,235,255,0.78)"; // wing fill
const WB  = "rgba(140,205,255,0.55)"; // wing border

// ── Wing ──────────────────────────────────────────────────────────────────────
function Wing({ side, anim }: { side: "L" | "R"; anim: Animated.Value }) {
  const rot = anim.interpolate({
    inputRange: [0, 1],
    outputRange: side === "L" ? ["-28deg", "-42deg"] : ["28deg", "42deg"],
  });
  const sy = anim.interpolate({ inputRange: [0, 1], outputRange: [1, 0.84] });
  return (
    <Animated.View
      style={[
        s.wing,
        side === "L" ? s.wingL : s.wingR,
        { transform: [{ rotate: rot }, { scaleY: sy }] },
      ]}
    />
  );
}

// ── Eye ───────────────────────────────────────────────────────────────────────
function Eye() {
  return (
    <View style={s.eyeShell}>
      {/* white sclera */}
      <View style={s.eyeWhite}>
        {/* gradient iris – deep blue sphere effect */}
        <LinearGradient
          colors={["#4a8bff", EI, "#0a2faa"]}
          start={{ x: 0.25, y: 0.1 }}
          end={{ x: 0.75, y: 1 }}
          style={s.eyeIris}
        >
          <View style={s.pupil} />
        </LinearGradient>
        {/* catchlight */}
        <View style={s.catchlight} />
      </View>
    </View>
  );
}

// ── Face (eyes + expression) ──────────────────────────────────────────────────
function Face({ grabbed }: { grabbed: boolean }) {
  return (
    <View style={s.face}>
      <Eye />
      <Eye />
      <View style={grabbed ? s.mouthO : s.mouthSmile} />
    </View>
  );
}

// ── Antennae ──────────────────────────────────────────────────────────────────
function Antennae() {
  return (
    <View style={s.antRow}>
      {(["L", "R"] as const).map((side) => (
        <View key={side} style={side === "L" ? s.antL : s.antR}>
          <View style={s.antStem} />
          <LinearGradient
            colors={[G1, G3]}
            style={s.antBall}
          />
        </View>
      ))}
    </View>
  );
}

// ── Body ──────────────────────────────────────────────────────────────────────
function Body() {
  return (
    <View style={s.bodyOuter}>
      {/* 3D sphere gradient — light from top-left */}
      <LinearGradient
        colors={[G0, G1, G2, G3]}
        start={{ x: 0.15, y: 0 }}
        end={{ x: 0.85, y: 1 }}
        style={s.bodyGrad}
      >
        {/* Black stripes */}
        <View style={[s.stripe, { top: "20%", height: "16%" }]} />
        <View style={[s.stripe, { top: "44%", height: "16%" }]} />
        <View style={[s.stripe, { top: "68%", height: "13%" }]} />
        {/* top-left specular sheen */}
        <View style={s.specular} />
        {/* bottom rim shadow */}
        <View style={s.rimShadow} />
      </LinearGradient>
    </View>
  );
}

// ── Head ──────────────────────────────────────────────────────────────────────
function Head({ grabbed }: { grabbed: boolean }) {
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
        <Face grabbed={grabbed} />
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
  const shadowAnim  = useRef(new Animated.Value(1)).current;
  const scaleAnim   = useRef(new Animated.Value(1)).current;

  const [grabbed, setGrabbed] = useState(false);
  const [tapped, setTapped]   = useState(false);
  const bobRef     = useRef<Animated.CompositeAnimation | null>(null);
  const flutterRef = useRef<Animated.CompositeAnimation | null>(null);

  const startBob = useCallback(() => {
    bobAnim.setValue(0);
    bobRef.current = Animated.loop(
      Animated.sequence([
        Animated.timing(bobAnim, { toValue: 1, duration: 1200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(bobAnim, { toValue: 0, duration: 1200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    );
    bobRef.current.start();
  }, []);

  const stopBob = useCallback(() => {
    bobRef.current?.stop();
  }, []);

  useEffect(() => {
    startBob();
    flutterAnim.setValue(0);
    flutterRef.current = Animated.loop(
      Animated.sequence([
        Animated.timing(flutterAnim, { toValue: 1, duration: 160, easing: Easing.linear, useNativeDriver: true }),
        Animated.timing(flutterAnim, { toValue: 0, duration: 160, easing: Easing.linear, useNativeDriver: true }),
      ])
    );
    flutterRef.current.start();
    return () => { bobRef.current?.stop(); flutterRef.current?.stop(); };
  }, []);

  const bobY = bobAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -6] });

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

      <TouchableWithoutFeedback onPress={handlePress}>
        <Animated.View style={{ transform: [{ translateY: bobY }, { scale: scaleAnim }] }}>
          {/* Wings sit behind the body */}
          <View style={s.wingsLayer}>
            <Wing side="L" anim={flutterAnim} />
            <Wing side="R" anim={flutterAnim} />
          </View>

          <View style={s.beeCol}>
            <Antennae />
            <Head grabbed={grabbed} />
            <Body />
            <Stinger />
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
    width: 30,
    height: 8,
    borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.22)",
    alignSelf: "center",
  },

  // Wings layer (absolutely positioned so body renders on top)
  wingsLayer: {
    position: "absolute",
    top: 14,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    zIndex: 0,
  },
  wing: {
    width: 26,
    height: 17,
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

  // Main bee column
  beeCol: { alignItems: "center", zIndex: 1 },

  // ── Antennae ──
  antRow: {
    flexDirection: "row",
    justifyContent: "center",
    width: BEE_W,
    height: 13,
    marginBottom: -3,
  },
  antL: {
    alignItems: "flex-end",
    width: 12,
    marginRight: 4,
    transform: [{ rotate: "-20deg" }],
  },
  antR: {
    alignItems: "flex-start",
    width: 12,
    marginLeft: 4,
    transform: [{ rotate: "20deg" }],
  },
  antStem: {
    width: 2,
    height: 9,
    backgroundColor: BK,
    borderRadius: 1,
  },
  antBall: {
    width: 5,
    height: 5,
    borderRadius: 3,
    marginLeft: -1.5,
  },

  // ── Head ──
  headOuter: {
    width: 28,
    height: 26,
    borderRadius: 14,
    overflow: "hidden",
    marginBottom: -3,
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
    top: 3,
    left: 4,
    width: 9,
    height: 6,
    borderRadius: 5,
    backgroundColor: "rgba(255,255,255,0.45)",
    transform: [{ rotate: "-20deg" }],
  },

  // ── Face ──
  face: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 3,
    gap: 2,
  },
  eyeShell: { alignItems: "center" },
  eyeWhite: {
    width: 10,
    height: 12,
    borderRadius: 6,
    backgroundColor: EW,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderWidth: 0.5,
    borderColor: "#ddd",
  },
  eyeIris: {
    width: 7,
    height: 9,
    borderRadius: 5,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  pupil: {
    width: 4,
    height: 5,
    borderRadius: 3,
    backgroundColor: EP,
  },
  catchlight: {
    position: "absolute",
    top: 2,
    left: 2,
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.95)",
  },
  mouthSmile: {
    position: "absolute",
    bottom: -13,
    width: 11,
    height: 6,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    borderWidth: 2,
    borderColor: BK,
    borderTopWidth: 0,
    alignSelf: "center",
  },
  mouthO: {
    position: "absolute",
    bottom: -13,
    width: 7,
    height: 7,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: BK,
    alignSelf: "center",
  },

  // ── Body ──
  bodyOuter: {
    width: 30,
    height: 34,
    borderRadius: 15,
    overflow: "hidden",
    zIndex: 2,
    ...(Platform.OS !== "android" && {
      shadowColor: G3,
      shadowOffset: { width: -2, height: 4 },
      shadowOpacity: 0.55,
      shadowRadius: 5,
    }),
    elevation: 8,
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
    top: 5,
    left: 5,
    width: 8,
    height: 14,
    borderRadius: 6,
    backgroundColor: "rgba(255,255,255,0.28)",
    transform: [{ rotate: "-12deg" }],
  },
  rimShadow: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "30%",
    backgroundColor: "rgba(0,0,0,0.18)",
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
  },

  // ── Stinger ──
  stingerWrap: { alignItems: "center", marginTop: -1, zIndex: 1 },
  stinger: {
    width: 5,
    height: 8,
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 3,
    borderTopLeftRadius: 1,
    borderTopRightRadius: 1,
  },
});
