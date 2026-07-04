import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";

export type DepthLevel = "Flat" | "Subtle" | "Strong";
export type DensityLevel = "Sparse" | "Medium" | "Dense";
export type TextWeightLevel = "Bold" | "Black" | "Condensed";

export interface LogoThemePrefs {
  goldIntensity: number;
  depth: DepthLevel;
  density: DensityLevel;
  textWeight: TextWeightLevel;
}

const DEFAULTS: LogoThemePrefs = {
  goldIntensity: 0.6,
  depth: "Subtle",
  density: "Medium",
  textWeight: "Black",
};

const STORAGE_KEY = "@hive_logo_theme";

interface LogoThemeContextValue {
  prefs: LogoThemePrefs;
  setGoldIntensity: (v: number) => void;
  setDepth: (v: DepthLevel) => void;
  setDensity: (v: DensityLevel) => void;
  setTextWeight: (v: TextWeightLevel) => void;
}

const LogoThemeContext = createContext<LogoThemeContextValue>({
  prefs: DEFAULTS,
  setGoldIntensity: () => {},
  setDepth: () => {},
  setDensity: () => {},
  setTextWeight: () => {},
});

export function LogoThemeProvider({ children }: { children: React.ReactNode }) {
  const [prefs, setPrefs] = useState<LogoThemePrefs>(DEFAULTS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) {
          try {
            setPrefs({ ...DEFAULTS, ...JSON.parse(raw) });
          } catch {}
        }
      })
      .finally(() => {
        setLoaded(true);
      });
  }, []);

  function update(partial: Partial<LogoThemePrefs>) {
    setPrefs((prev) => {
      const next = { ...prev, ...partial };
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }

  if (!loaded) {
    return null;
  }

  return (
    <LogoThemeContext.Provider
      value={{
        prefs,
        setGoldIntensity: (v) => update({ goldIntensity: v }),
        setDepth: (v) => update({ depth: v }),
        setDensity: (v) => update({ density: v }),
        setTextWeight: (v) => update({ textWeight: v }),
      }}
    >
      {children}
    </LogoThemeContext.Provider>
  );
}

export function useLogoTheme() {
  return useContext(LogoThemeContext);
}
