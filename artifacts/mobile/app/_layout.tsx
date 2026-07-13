import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";

import ConsentGate from "@/components/ConsentGate";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AppModeProvider, useAppMode } from "@/context/AppModeContext";
import { AuthProvider } from "@/context/AuthContext";
import { LogoThemeProvider } from "@/context/LogoThemeContext";
import { PatientProvider } from "@/context/PatientContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { SmartDevicesProvider } from "@/context/SmartDevicesContext";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  const { consentAccepted } = useAppMode();

  if (consentAccepted === null) return null;
  if (!consentAccepted) return <ConsentGate />;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(app)" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  const [logoThemeReady, setLogoThemeReady] = useState(false);
  const [themeReady, setThemeReady] = useState(false);
  const splashHidden = useRef(false);

  const maybeHideSplash = useCallback(
    (fontsDone: boolean, logoDone: boolean, appThemeDone: boolean) => {
      if (splashHidden.current) return;
      if (fontsDone && logoDone && appThemeDone) {
        splashHidden.current = true;
        SplashScreen.hideAsync();
      }
    },
    [],
  );

  useEffect(() => {
    if (fontsLoaded || fontError) {
      maybeHideSplash(true, logoThemeReady, themeReady);
    }
  }, [fontsLoaded, fontError, logoThemeReady, themeReady, maybeHideSplash]);

  const handleLogoThemeReady = useCallback(() => {
    setLogoThemeReady(true);
    maybeHideSplash(!!(fontsLoaded || fontError), true, themeReady);
  }, [fontsLoaded, fontError, themeReady, maybeHideSplash]);

  const handleThemeReady = useCallback(() => {
    setThemeReady(true);
    maybeHideSplash(!!(fontsLoaded || fontError), logoThemeReady, true);
  }, [fontsLoaded, fontError, logoThemeReady, maybeHideSplash]);

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <KeyboardProvider>
              <AppModeProvider>
                <AuthProvider>
                  <PatientProvider>
                    <ThemeProvider onReady={handleThemeReady}>
                      <SmartDevicesProvider>
                        <LogoThemeProvider onReady={handleLogoThemeReady}>
                          <RootLayoutNav />
                        </LogoThemeProvider>
                      </SmartDevicesProvider>
                    </ThemeProvider>
                  </PatientProvider>
                </AuthProvider>
              </AppModeProvider>
            </KeyboardProvider>
          </GestureHandlerRootView>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
