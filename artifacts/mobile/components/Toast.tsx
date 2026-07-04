import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text } from "react-native";

interface ToastProps {
  message: string;
  visible: boolean;
  onHide: () => void;
  iconName?: keyof typeof MaterialCommunityIcons.glyphMap;
  iconColor?: string;
  bottomOffset?: number;
}

export default function Toast({
  message,
  visible,
  onHide,
  iconName = "check-circle",
  iconColor = "#22c55e",
  bottomOffset = 100,
}: ToastProps) {
  const opacity    = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(16)).current;
  const timerRef   = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (visible) {
      if (timerRef.current) clearTimeout(timerRef.current);

      Animated.parallel([
        Animated.spring(translateY, { toValue: 0, useNativeDriver: true, speed: 20, bounciness: 6 }),
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();

      timerRef.current = setTimeout(() => {
        Animated.parallel([
          Animated.timing(translateY, { toValue: 16, duration: 260, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0, duration: 260, useNativeDriver: true }),
        ]).start(() => onHide());
      }, 2400);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [visible]);

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        { bottom: bottomOffset, opacity, transform: [{ translateY }] },
      ]}
    >
      <MaterialCommunityIcons name={iconName} size={18} color={iconColor} />
      <Text style={styles.message}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(15,30,15,0.96)",
    borderColor: "rgba(34,197,94,0.35)",
    borderWidth: 1,
    borderRadius: 100,
    paddingHorizontal: 20,
    paddingVertical: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
    zIndex: 999,
  },
  message: {
    color: "#e2fce8",
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
});
