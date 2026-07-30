import Constants from "expo-constants";
import React, { useEffect, useState } from "react";
import { Linking, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";

type LatestRelease = {
  platform: string;
  version: string;
  versionCode: number;
  apkUrl: string;
};

const API = () => `https://${process.env.EXPO_PUBLIC_DOMAIN}/api`;

export default function UpdateBanner({ topOffset = 0 }: { topOffset?: number }) {
  const colors = useColors();
  const [release, setRelease] = useState<LatestRelease | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (Platform.OS !== "android") return;
    const installedCode = Number(Constants.expoConfig?.android?.versionCode ?? 0);
    if (!Number.isFinite(installedCode) || installedCode <= 0) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${API()}/app/latest`);
        if (!res.ok) return;
        const data: LatestRelease = await res.json();
        if (!cancelled && data.versionCode > installedCode && data.apkUrl) {
          setRelease(data);
        }
      } catch {
        // Offline or server asleep — stay silent, never block the app.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!release || dismissed) return null;

  return (
    <View
      style={[
        styles.banner,
        { backgroundColor: colors.gold, paddingTop: topOffset + 10, zIndex: 20 },
      ]}
      accessibilityRole="alert"
    >
      <Feather name="download" size={18} color="#1a1a1a" style={styles.icon} />
      <Text style={styles.text}>
        Version {release.version} is available.
      </Text>
      <Pressable
        onPress={() => Linking.openURL(release.apkUrl)}
        accessibilityRole="button"
        accessibilityLabel={`Download update version ${release.version}`}
        style={styles.button}
      >
        <Text style={styles.buttonText}>Update</Text>
      </Pressable>
      <Pressable
        onPress={() => setDismissed(true)}
        accessibilityRole="button"
        accessibilityLabel="Dismiss update notice"
        hitSlop={8}
      >
        <Feather name="x" size={18} color="#1a1a1a" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
  },
  icon: { marginRight: 2 },
  text: {
    flex: 1,
    color: "#1a1a1a",
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
  },
  button: {
    backgroundColor: "#1a1a1a",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  buttonText: {
    color: "#F5C518",
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
  },
});
