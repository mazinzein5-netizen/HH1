import { Stack } from "expo-router";
import { useColors } from "@/hooks/useColors";

export default function AppLayout() {
  const colors = useColors();
  return (
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
      <Stack.Screen name="kardex" options={{ title: "Medical Kardex", headerShown: true }} />
      <Stack.Screen name="medical-history" options={{ title: "Medical History", headerShown: true }} />
      <Stack.Screen name="geriatric" options={{ headerShown: false }} />
      <Stack.Screen name="consultation" options={{ headerShown: false }} />
      <Stack.Screen name="monitoring" options={{ headerShown: false }} />
      <Stack.Screen name="settings" options={{ headerShown: false }} />
      <Stack.Screen name="smart-devices" options={{ headerShown: false }} />
    </Stack>
  );
}
