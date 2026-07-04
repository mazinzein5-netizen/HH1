import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";
import { useColorScheme } from "react-native";

import colors from "@/constants/colors";

export type ThemeMode = "light" | "dark" | "system";

type Palette = typeof colors.dark & { radius: number };

const STORAGE_KEY = "@hive_theme_mode";

interface ThemeContextValue {
  mode: ThemeMode;
  isDark: boolean;
  colors: Palette;
  setMode: (mode: ThemeMode) => void;
}

function resolveIsDark(mode: ThemeMode, systemScheme: string | null | undefined) {
  if (mode === "system") return systemScheme !== "light";
  return mode === "dark";
}

const ThemeContext = createContext<ThemeContextValue>({
  mode: "system",
  isDark: true,
  colors: { ...colors.dark, radius: colors.radius },
  setMode: () => {},
});

export function ThemeProvider({
  children,
  onReady,
}: {
  children: React.ReactNode;
  onReady?: () => void;
}) {
  const systemScheme = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>("system");

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw === "light" || raw === "dark" || raw === "system") {
          setModeState(raw);
        }
      })
      .finally(() => {
        onReady?.();
      });
  }, []);

  function setMode(next: ThemeMode) {
    setModeState(next);
    AsyncStorage.setItem(STORAGE_KEY, next);
  }

  const isDark = resolveIsDark(mode, systemScheme);
  const palette = isDark ? colors.dark : colors.light;

  return (
    <ThemeContext.Provider
      value={{ mode, isDark, setMode, colors: { ...palette, radius: colors.radius } }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
