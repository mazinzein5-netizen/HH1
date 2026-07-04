import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Easing,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { usePatient } from "@/context/PatientContext";
import { useColors } from "@/hooks/useColors";
import {
  callEmergencyServices,
  EMERGENCY_NUMBER,
  formatPatientCard,
  shareWithHealthServices,
} from "@/utils/healthShare";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  seedContext?: string;
}

const GREETING: ChatMessage = {
  role: "assistant",
  content:
    "Hello! I'm HIVE Bot, your AI pain and clinical guidance assistant.\n\nI can help you understand your symptoms, explain likely causes, walk you through self-care steps, and flag any signs that need urgent attention — all aligned with NICE and HSE clinical guidelines.\n\nTo get started, could you tell me where you're experiencing pain or discomfort?",
};

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

function parseGuidelineChips(text: string): React.ReactNode[] {
  const parts = text.split(/(【[^】]+】)/g);
  return parts.map((part, i) => {
    if (part.startsWith("【") && part.endsWith("】")) {
      return (
        <Text key={i} style={styles.guidelineChip}>
          {part}
        </Text>
      );
    }
    return <Text key={i}>{part}</Text>;
  });
}

function BotBubble({ content, colors }: { content: string; colors: ReturnType<typeof useColors> }) {
  const isRedFlag = content.startsWith("⚠️") || content.includes("RED FLAG");
  const bubbleBg = isRedFlag ? colors.emergencyBg : colors.card;
  const bubbleBorder = isRedFlag ? colors.emergencyBorder : colors.border;
  const textColor = isRedFlag ? colors.emergency : colors.foreground;

  return (
    <View style={[styles.botBubble, { backgroundColor: bubbleBg, borderColor: bubbleBorder }]}>
      <Text style={[styles.bubbleText, { color: textColor, fontFamily: "Inter_400Regular" }]}>
        {parseGuidelineChips(content)}
      </Text>
    </View>
  );
}

function UserBubble({ content, colors }: { content: string; colors: ReturnType<typeof useColors> }) {
  return (
    <View style={[styles.userBubble, { backgroundColor: colors.primary }]}>
      <Text style={[styles.bubbleText, { color: "#fff", fontFamily: "Inter_400Regular" }]}>{content}</Text>
    </View>
  );
}

export default function ChatBot({ visible, onClose, seedContext }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { data: patient } = usePatient();
  const [messages, setMessages] = useState<ChatMessage[]>([GREETING]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const seededRef = useRef<string | undefined>(undefined);

  const hasRedFlag = messages.some(
    (m) => m.role === "assistant" && (m.content.startsWith("⚠️") || m.content.includes("RED FLAG"))
  );

  useEffect(() => {
    if (visible) {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 340,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: SCREEN_HEIGHT,
        duration: 280,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  // When opened from the pain pathway with clinical context, prime the bot.
  // Waits for any in-flight request to finish before sending so the seed
  // is never silently dropped on a rapid close/reopen.
  useEffect(() => {
    if (visible && seedContext && !loading && seededRef.current !== seedContext) {
      seededRef.current = seedContext;
      sendMessage(seedContext);
    }
    if (!visible) {
      seededRef.current = undefined;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, seedContext, loading]);

  async function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const userMsg: ChatMessage = { role: "user", content: trimmed };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setLoading(true);

    try {
      const domain = process.env.EXPO_PUBLIC_DOMAIN;
      const res = await fetch(`https://${domain}/api/ai/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextMessages.map(({ role, content }) => ({ role, content })),
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.message) {
          setMessages((prev) => [...prev, { role: "assistant", content: data.message }]);
        }
      } else {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: "I'm having trouble connecting right now. Please check your connection and try again." },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "I'm having trouble connecting right now. Please check your connection and try again." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleSend() {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    sendMessage(text);
  }

  function handleShareToServices() {
    const transcript = messages
      .filter((m) => m !== GREETING)
      .map((m) => `${m.role === "user" ? "Patient" : "HIVE Bot"}: ${m.content}`)
      .join("\n\n");

    const body = [
      formatPatientCard(patient),
      "",
      "PAIN ASSESSMENT CONVERSATION",
      "",
      transcript || "No conversation recorded yet.",
    ].join("\n");

    shareWithHealthServices("HIVE Bot — Clinical Handover Summary", body);
  }

  function handleClear() {
    setMessages([GREETING]);
    setInput("");
    seededRef.current = undefined;
  }

  function handleClose() {
    onClose();
  }

  const bottomPad = Platform.OS === "ios" ? insets.bottom : 8;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={handleClose} />
        <Animated.View
          style={[
            styles.sheet,
            { backgroundColor: colors.background, transform: [{ translateY: slideAnim }] },
          ]}
        >
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View style={styles.dragHandle} />
            <View style={styles.headerRow}>
              <View style={[styles.botIcon, { backgroundColor: "rgba(201,134,10,0.18)", borderColor: "rgba(201,134,10,0.4)" }]}>
                <MaterialCommunityIcons name="robot-happy" size={20} color="#C9860A" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.headerTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
                  HIVE Bot
                </Text>
                <Text style={[styles.headerSub, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                  Pain & Clinical Guidance
                </Text>
              </View>
              <TouchableOpacity
                onPress={callEmergencyServices}
                style={[styles.emergencyPill, { backgroundColor: colors.emergencyBg, borderColor: colors.emergencyBorder }]}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons name="phone-alert" size={15} color={colors.emergency} />
                <Text style={[styles.emergencyPillText, { color: colors.emergency, fontFamily: "Inter_700Bold" }]}>
                  {EMERGENCY_NUMBER}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleClear}
                style={[styles.clearBtn, { borderColor: colors.border }]}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons name="delete-sweep" size={16} color={colors.mutedForeground} />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleClose} style={styles.closeBtn} activeOpacity={0.7}>
                <MaterialCommunityIcons name="close" size={20} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Message list */}
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={0}
          >
            <FlatList
              ref={flatListRef}
              data={messages}
              keyExtractor={(_, i) => String(i)}
              contentContainerStyle={[styles.messageList, { paddingBottom: 12 }]}
              onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
              renderItem={({ item }) =>
                item.role === "assistant" ? (
                  <BotBubble content={item.content} colors={colors} />
                ) : (
                  <UserBubble content={item.content} colors={colors} />
                )
              }
              ListFooterComponent={
                loading ? (
                  <View style={[styles.botBubble, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <ActivityIndicator size="small" color={colors.mutedForeground} />
                  </View>
                ) : null
              }
            />

            {/* Urgent escalation banner when a red flag is detected */}
            {hasRedFlag && (
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={callEmergencyServices}
                style={[styles.redFlagBanner, { backgroundColor: colors.emergencyBg, borderColor: colors.emergency }]}
              >
                <MaterialCommunityIcons name="phone-alert" size={18} color={colors.emergency} />
                <Text style={[styles.redFlagText, { color: colors.emergency, fontFamily: "Inter_700Bold" }]}>
                  Urgent symptoms flagged — Call Emergency Services ({EMERGENCY_NUMBER})
                </Text>
              </TouchableOpacity>
            )}

            {/* Emergency + handover action toolbar */}
            <View style={[styles.actionRow, { borderTopColor: colors.border }]}>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={callEmergencyServices}
                style={[styles.actionBtn, { backgroundColor: colors.emergencyBg, borderColor: colors.emergencyBorder }]}
              >
                <MaterialCommunityIcons name="phone-alert" size={16} color={colors.emergency} />
                <Text style={[styles.actionBtnText, { color: colors.emergency, fontFamily: "Inter_600SemiBold" }]}>
                  Emergency
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handleShareToServices}
                style={[styles.actionBtn, { backgroundColor: colors.glassGold, borderColor: colors.glassGoldBorder }]}
              >
                <MaterialCommunityIcons name="share-variant" size={16} color={colors.gold} />
                <Text style={[styles.actionBtnText, { color: colors.gold, fontFamily: "Inter_600SemiBold" }]}>
                  Send to Health Services
                </Text>
              </TouchableOpacity>
            </View>

            {/* Input bar */}
            <View style={[styles.inputBar, { borderTopColor: colors.border, paddingBottom: bottomPad }]}>
              <View style={[styles.inputWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <TextInput
                  style={[styles.textInput, { color: colors.foreground, fontFamily: "Inter_400Regular" }]}
                  placeholder="Describe your pain or ask a question..."
                  placeholderTextColor={colors.mutedForeground}
                  value={input}
                  onChangeText={setInput}
                  multiline
                  maxLength={600}
                  onSubmitEditing={handleSend}
                  blurOnSubmit={false}
                />
                <TouchableOpacity
                  onPress={handleSend}
                  disabled={!input.trim() || loading}
                  style={[
                    styles.sendBtn,
                    { backgroundColor: input.trim() && !loading ? "#C9860A" : colors.border },
                  ]}
                  activeOpacity={0.8}
                >
                  <MaterialCommunityIcons
                    name="send"
                    size={18}
                    color={input.trim() && !loading ? "#fff" : colors.mutedForeground}
                  />
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  sheet: {
    height: SCREEN_HEIGHT * 0.85,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: "hidden",
  },
  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignSelf: "center",
    marginTop: 10,
    marginBottom: 6,
  },
  header: {
    borderBottomWidth: 1,
    paddingBottom: 14,
    paddingHorizontal: 16,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  botIcon: {
    width: 38,
    height: 38,
    borderRadius: 11,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 16,
    letterSpacing: -0.2,
  },
  headerSub: {
    fontSize: 11,
    marginTop: 1,
  },
  emergencyPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  emergencyPillText: {
    fontSize: 12,
    letterSpacing: 0.3,
  },
  clearBtn: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderRadius: 8,
    padding: 7,
  },
  closeBtn: {
    padding: 4,
  },
  redFlagBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    marginHorizontal: 14,
    marginBottom: 4,
  },
  redFlagText: {
    fontSize: 13,
    lineHeight: 18,
    flex: 1,
  },
  actionRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 14,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 10,
  },
  actionBtnText: {
    fontSize: 12.5,
  },
  messageList: {
    paddingHorizontal: 14,
    paddingTop: 14,
    gap: 10,
  },
  botBubble: {
    alignSelf: "flex-start",
    maxWidth: "88%",
    borderRadius: 16,
    borderTopLeftRadius: 4,
    borderWidth: 1,
    padding: 12,
  },
  userBubble: {
    alignSelf: "flex-end",
    maxWidth: "80%",
    borderRadius: 16,
    borderBottomRightRadius: 4,
    padding: 12,
  },
  bubbleText: {
    fontSize: 14,
    lineHeight: 21,
  },
  guidelineChip: {
    backgroundColor: "rgba(201,134,10,0.15)",
    color: "#C9860A",
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    borderRadius: 4,
    paddingHorizontal: 3,
  },
  inputBar: {
    borderTopWidth: 1,
    paddingHorizontal: 14,
    paddingTop: 10,
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "flex-end",
    borderRadius: 14,
    borderWidth: 1,
    paddingLeft: 14,
    paddingRight: 6,
    paddingVertical: 6,
    gap: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    maxHeight: 100,
    paddingVertical: 4,
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
});
