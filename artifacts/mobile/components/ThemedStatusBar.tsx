import React from "react";
import { StatusBar, StatusBarProps } from "react-native";

import { useTheme } from "@/context/ThemeContext";

/**
 * StatusBar that automatically adapts its bar style to the active theme.
 * Any props (e.g. `backgroundColor`, `translucent`) are forwarded; `barStyle`
 * is always derived from the current light/dark palette.
 */
export default function ThemedStatusBar(props: StatusBarProps) {
  const { isDark, colors } = useTheme();
  return (
    <StatusBar
      backgroundColor={colors.background}
      {...props}
      barStyle={isDark ? "light-content" : "dark-content"}
    />
  );
}
