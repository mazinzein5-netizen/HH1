import { Stack } from "expo-router";
import { HiveBotProvider } from "@/context/HiveBotContext";
import { useColors } from "@/hooks/useColors";

export default function AppLayout() {
  const colors = useColors();
  return (
    <HiveBotProvider>
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.gold,
        headerTitleStyle: { fontFamily: "Inter_600SemiBold", color: colors.foreground },
        headerShadowVisible: false,
        headerBackTitle: "Back",
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="body-map" options={{ headerShown: false }} />
      <Stack.Screen name="kardex" options={{ title: "Medical Kardex", headerShown: true }} />
      <Stack.Screen name="medical-history" options={{ title: "Medical History", headerShown: true }} />
      <Stack.Screen name="emergency-share" options={{ title: "Emergency Share", headerShown: true }} />
      <Stack.Screen name="geriatric" options={{ headerShown: false }} />
      <Stack.Screen name="consultation" options={{ headerShown: false }} />
      <Stack.Screen name="telemedicine" options={{ headerShown: false }} />
      <Stack.Screen name="monitoring" options={{ headerShown: false }} />
      <Stack.Screen name="settings" options={{ headerShown: false }} />
      <Stack.Screen name="privacy-policy" options={{ headerShown: false }} />
      <Stack.Screen name="smart-devices" options={{ headerShown: false }} />
      <Stack.Screen name="documents" options={{ title: "Documents & Prescription", headerShown: true }} />
      <Stack.Screen name="membership" options={{ title: "Membership & Verification", headerShown: true }} />
      <Stack.Screen name="pharmacies" options={{ title: "Find a Pharmacy", headerShown: true }} />
      <Stack.Screen name="interpreter" options={{ title: "Live Interpreter", headerShown: true }} />
      <Stack.Screen name="companion" options={{ headerShown: false }} />
      <Stack.Screen name="companion-memory" options={{ headerShown: false }} />
      <Stack.Screen name="translator" options={{ headerShown: false }} />
    </Stack>
    </HiveBotProvider>
  );
}
