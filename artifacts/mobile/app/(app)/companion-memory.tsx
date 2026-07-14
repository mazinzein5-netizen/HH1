/**
 * What the Companion remembers — pilot-only, fully on-device.
 * The patient can view every remembered fact and erase items or everything.
 */
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ThemedStatusBar from "@/components/ThemedStatusBar";
import { useAppMode } from "@/context/AppModeContext";
import { useColors } from "@/hooks/useColors";
import {
  clearMemoryName,
  eraseCompanionMemory,
  getCompanionMemory,
  memoryIsEmpty,
  removeMemoryItem,
  type CompanionMemory,
} from "@/utils/companionMemory";

type ListField = "conditions" | "medications" | "preferences" | "topics";

const SECTIONS: { field: ListField; title: string; icon: string; color: string }[] = [
  { field: "conditions", title: "Health conditions you've mentioned", icon: "heart-pulse", color: "#f87171" },
  { field: "medications", title: "Medicines you've mentioned", icon: "pill", color: "#60a5fa" },
  { field: "preferences", title: "How you like things explained", icon: "hand-heart", color: "#22c55e" },
  { field: "topics", title: "Things we've talked about", icon: "chat-outline", color: "#a78bfa" },
];

export default function CompanionMemoryScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { pilotMode } = useAppMode();
  const [memory, setMemory] = useState<CompanionMemory | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (!pilotMode) {
        router.replace("/(app)/(tabs)/dashboard");
        return;
      }
      getCompanionMemory().then(setMemory);
    }, [pilotMode])
  );

  async function handleRemove(field: ListField, value: string) {
    setMemory(await removeMemoryItem(field, value));
  }

  async function handleClearName() {
    setMemory(await clearMemoryName());
  }

  function handleEraseAll() {
    Alert.alert(
      "Forget everything?",
      "The companion will forget your name, your conditions, and everything you've talked about. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Forget everything",
          style: "destructive",
          onPress: async () => {
            await eraseCompanionMemory();
            setMemory(await getCompanionMemory());
          },
        },
      ]
    );
  }

  if (!pilotMode || !memory) return null;

  const topPad = Platform.OS === "web" ? 24 : insets.top;
  const empty = memoryIsEmpty(memory);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ThemedStatusBar backgroundColor="transparent" translucent />

      <View style={[styles.header, { paddingTop: topPad + 8, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.headerBtn, { borderColor: colors.border, backgroundColor: colors.card }]}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="arrow-left" size={26} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
          What I Remember
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={[styles.privacyCard, { backgroundColor: "rgba(34,197,94,0.08)", borderColor: "rgba(34,197,94,0.35)" }]}>
          <MaterialCommunityIcons name="cellphone-lock" size={26} color="#22c55e" />
          <Text style={[styles.privacyText, { color: colors.foreground, fontFamily: "Inter_500Medium" }]}>
            Everything here is stored only on this phone. Nothing is kept on any server, and you can erase it all at any time.
          </Text>
        </View>

        {empty ? (
          <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <MaterialCommunityIcons name="brain" size={40} color={colors.mutedForeground} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>
              I don't remember anything yet. As we talk, I'll gently remember your name, your conditions, and what we discuss — so you never have to repeat yourself.
            </Text>
          </View>
        ) : (
          <>
            {memory.name && (
              <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.sectionHead}>
                  <MaterialCommunityIcons name="account" size={22} color={colors.gold} />
                  <Text style={[styles.sectionTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
                    Your name
                  </Text>
                </View>
                <View style={[styles.itemRow, { borderColor: colors.border }]}>
                  <Text style={[styles.itemText, { color: colors.foreground, fontFamily: "Inter_500Medium" }]}>
                    {memory.name}
                  </Text>
                  <TouchableOpacity onPress={handleClearName} hitSlop={10} activeOpacity={0.7}>
                    <MaterialCommunityIcons name="close-circle" size={26} color={colors.mutedForeground} />
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {SECTIONS.map(({ field, title, icon, color }) =>
              memory[field].length > 0 ? (
                <View key={field} style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={styles.sectionHead}>
                    <MaterialCommunityIcons name={icon as any} size={22} color={color} />
                    <Text style={[styles.sectionTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
                      {title}
                    </Text>
                  </View>
                  {memory[field].map((item) => (
                    <View key={item} style={[styles.itemRow, { borderColor: colors.border }]}>
                      <Text style={[styles.itemText, { color: colors.foreground, fontFamily: "Inter_500Medium" }]}>
                        {item}
                      </Text>
                      <TouchableOpacity onPress={() => handleRemove(field, item)} hitSlop={10} activeOpacity={0.7}>
                        <MaterialCommunityIcons name="close-circle" size={26} color={colors.mutedForeground} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              ) : null
            )}

            <TouchableOpacity
              onPress={handleEraseAll}
              activeOpacity={0.85}
              style={[styles.eraseBtn, { backgroundColor: colors.emergencyBg, borderColor: colors.emergency }]}
            >
              <MaterialCommunityIcons name="delete-forever" size={26} color={colors.emergency} />
              <Text style={[styles.eraseText, { color: colors.emergency, fontFamily: "Inter_700Bold" }]}>
                Forget everything about me
              </Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerBtn: {
    width: 48,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { fontSize: 24, letterSpacing: -0.3 },

  scroll: { padding: 16, gap: 14, paddingBottom: 48 },

  privacyCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1.5,
    borderRadius: 16,
    padding: 16,
  },
  privacyText: { fontSize: 16, lineHeight: 24, flex: 1 },

  emptyCard: {
    alignItems: "center",
    gap: 14,
    borderWidth: 1,
    borderRadius: 18,
    padding: 28,
  },
  emptyText: { fontSize: 18, lineHeight: 27, textAlign: "center" },

  sectionCard: { borderWidth: 1, borderRadius: 18, padding: 16, gap: 8 },
  sectionHead: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 4 },
  sectionTitle: { fontSize: 17, flex: 1 },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: 12,
  },
  itemText: { fontSize: 18, lineHeight: 26, flex: 1 },

  eraseBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    borderWidth: 1.5,
    borderRadius: 18,
    paddingVertical: 18,
  },
  eraseText: { fontSize: 18 },
});
