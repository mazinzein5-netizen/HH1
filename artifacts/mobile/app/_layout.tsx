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

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AuthProvider } from "@/context/AuthContext";
import { LogoThemeProvider } from "@/context/LogoThemeContext";
import { PatientProvider } from "@/context/PatientContext";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
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
  const splashHidden = useRef(false);

  const maybeHideSplash = useCallback(
    (fontsDone: boolean, themeDone: boolean) => {
      if (splashHidden.current) return;
      if (fontsDone && themeDone) {
        splashHidden.current = true;
        SplashScreen.hideAsync();
      }
    },
    [],
  );

  useEffect(() => {
    if (fontsLoaded || fontError) {
      maybeHideSplash(true, logoThemeReady);
    }
  }, [fontsLoaded, fontError, logoThemeReady, maybeHideSplash]);

  const handleLogoThemeReady = useCallback(() => {
    setLogoThemeReady(true);
    maybeHideSplash(!!(fontsLoaded || fontError), true);
  }, [fontsLoaded, fontError, maybeHideSplash]);

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <KeyboardProvider>
              <AuthProvider>
                <PatientProvider>
                  <LogoThemeProvider onReady={handleLogoThemeReady}>
                    <RootLayoutNav />
                  </LogoThemeProvider>
                </PatientProvider>
              </AuthProvider>
            </KeyboardProvider>
          </GestureHandlerRootView>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
