import { BlurView } from "expo-blur";
import { Tabs } from "expo-router";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useState } from "react";
import { Platform, StyleSheet, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ChatBot from "@/components/ChatBot";
import { useColors } from "@/hooks/useColors";

export default function TabLayout() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isIOS = Platform.OS === "ios";
  const [chatVisible, setChatVisible] = useState(false);

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
          name="triage"
          options={{
            title: "Health Hive",
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons name="waveform" size={(size ?? 20) + 2} color={color} />
            ),
          }}
        />
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

      {/* Floating HIVE Bot button — visible across all tabs */}
      <TouchableOpacity
        activeOpacity={0.88}
        onPress={() => setChatVisible(true)}
        style={[styles.fab, { bottom: fabBottom, backgroundColor: "#C9860A", shadowColor: "#C9860A" }]}
      >
        <MaterialCommunityIcons name="robot-happy" size={24} color="#fff" />
      </TouchableOpacity>

      <ChatBot visible={chatVisible} onClose={() => setChatVisible(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    right: 20,
    zIndex: 50,
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 12,
  },
});
