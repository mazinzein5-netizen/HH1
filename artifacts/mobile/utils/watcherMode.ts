/**
 * Watcher Mode — Sarah stays on watch while the app is closed.
 *
 * When enabled, Sarah schedules gentle local check-in notifications
 * (morning and evening) so she can reach the user even when the app
 * isn't open. Tapping a notification opens the app, where she is
 * floating and ready to chat. Everything is on-device: no server
 * involvement, no data leaves the phone (Zero-Server).
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

const KEY = "hive_watcher_mode";

export async function isWatcherModeEnabled(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(KEY)) === "1";
  } catch {
    return false;
  }
}

const CHECK_INS: { hour: number; minute: number; title: string; body: string }[] = [
  {
    hour: 10,
    minute: 0,
    title: "Sarah is checking in 🌤",
    body: "Good morning! How are you feeling today? Tap to chat with me.",
  },
  {
    hour: 18,
    minute: 30,
    title: "Sarah is on watch",
    body: "Just checking in — everything alright? I'm here if you want to talk.",
  },
];

/**
 * Enable watcher mode. Returns true on success. On web (no local
 * notifications), the preference is saved but no reminders can fire
 * while the browser tab is closed — the caller should explain this.
 */
export async function enableWatcherMode(): Promise<{ ok: boolean; reason?: string }> {
  if (Platform.OS === "web") {
    try {
      await AsyncStorage.setItem(KEY, "1");
    } catch {}
    return { ok: true, reason: "web" };
  }
  try {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== "granted") {
      return { ok: false, reason: "permission" };
    }
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("sarah-watcher", {
        name: "Sarah check-ins",
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }
    // Clear any previous schedule before re-scheduling.
    await Notifications.cancelAllScheduledNotificationsAsync();
    for (const c of CHECK_INS) {
      await Notifications.scheduleNotificationAsync({
        content: { title: c.title, body: c.body, sound: false },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: c.hour,
          minute: c.minute,
          channelId: Platform.OS === "android" ? "sarah-watcher" : undefined,
        } as Notifications.DailyTriggerInput,
      });
    }
    await AsyncStorage.setItem(KEY, "1");
    return { ok: true };
  } catch {
    return { ok: false, reason: "error" };
  }
}

export async function disableWatcherMode(): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, "0");
  } catch {}
  if (Platform.OS !== "web") {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch {}
  }
}
