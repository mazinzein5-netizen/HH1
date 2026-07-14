import { BlurView } from "expo-blur";
import { Tabs } from "expo-router";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHiveBot } from "@/context/HiveBotContext";
import { useSmartDevices } from "@/context/SmartDevicesContext";
import { useColors } from "@/hooks/useColors";

export default function TabLayout() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isIOS = Platform.OS === "ios";
  const hiveBot = useHiveBot();
  const { connectedCount } = useSmartDevices();

  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;
  const fabBottom = bottomPad + 64 + 14;

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.mutedForeground,
          headerShown: false,
          tabBarStyle: {
            position: "absolute",
            backgroundColor: isIOS ? "transparent" : colors.card,
            borderTopWidth: 1,
            borderTopColor: colors.border,
            elevation: 0,
            height: 64,
            paddingBottom: 8,
            paddingTop: 6,
          },
          tabBarLabelStyle: {
            fontFamily: "Inter_500Medium",
            fontSize: 10,
            marginTop: 1,
          },
          tabBarBackground: () =>
            isIOS ? (
              <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
            ) : (
              <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.card, borderTopWidth: 1, borderTopColor: colors.border }]} />
            ),
        }}
      >
        <Tabs.Screen
          name="dashboard"
          options={{
            title: "Home",
            tabBarIcon: ({ color, size }) => <Feather name="home" size={size ?? 20} color={color} />,
          }}
        />
        <Tabs.Screen
          name="live-hive"
          options={{
            title: "Live HIVE",
            tabBarIcon: ({ color, size }) => (
              <View>
                <MaterialCommunityIcons name="hexagon-multiple" size={(size ?? 20) + 2} color={color} />
                <View
                  style={[
                    styles.deviceDot,
                    { backgroundColor: connectedCount > 0 ? "#22c55e" : colors.mutedForeground },
                  ]}
                />
              </View>
            ),
          }}
        />
        <Tabs.Screen name="triage" options={{ href: null }} />
        <Tabs.Screen
          name="profile"
          options={{
            title: "Health Card",
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons name="shield-account" size={(size ?? 20) + 2} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="complaint"
          options={{ href: null }}
        />
      </Tabs>

      {/* Floating Queen B bee — visible across all tabs */}
      <TouchableOpacity
        activeOpacity={0.88}
        onPress={() => hiveBot.open()}
        style={[styles.fab, { bottom: fabBottom, backgroundColor: "#C9860A", shadowColor: "#C9860A" }]}
      >
        <MaterialCommunityIcons name="bee" size={26} color="#fff" />
        <Text style={styles.fabLabel}>Ask{"\n"}Queen B</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    right: 20,
    zIndex: 50,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    borderRadius: 30,
    paddingHorizontal: 16,
    paddingVertical: 11,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 12,
  },
  fabLabel: {
    color: "#fff",
    fontFamily: "Inter_700Bold",
    fontSize: 12,
    lineHeight: 14,
  },
  deviceDot: {
    position: "absolute",
    top: -1,
    right: -3,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
