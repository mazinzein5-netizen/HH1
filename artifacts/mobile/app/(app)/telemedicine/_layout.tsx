import { Stack } from "expo-router";

export default function TelemedicineLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="book" />
      <Stack.Screen name="appointment" />
      <Stack.Screen name="session" />
    </Stack>
  );
}
