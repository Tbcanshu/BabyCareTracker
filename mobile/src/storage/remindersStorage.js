import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

const KEYS = {
  REMINDERS: "baby_reminders",
};

// ─── Notification Handler Setup ───────────────────────────────────────────────
export const setupNotifications = () => {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
};

// ─── Request Permissions ──────────────────────────────────────────────────────
export const requestNotificationPermissions = async () => {
  try {
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("baby-reminders", {
        name: "Baby Care Reminders",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#E8A0BF",
        sound: "default",
      });
    }
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    return finalStatus === "granted";
  } catch (e) {
    console.error("requestNotificationPermissions error:", e);
    return false;
  }
};

// ─── Schedule LOCAL notification only ────────────────────────────────────────
export const scheduleNotification = async (reminder) => {
  try {
    let trigger;

    if (reminder.type === "interval") {
      const seconds = Math.max(60, reminder.intervalHours * 60 * 60);
      trigger = {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds,
        repeats: true,
      };
    } else {
      const [hour, minute] = (reminder.time || "08:00").split(":").map(Number);
      trigger = {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
      };
    }

    const notifId = await Notifications.scheduleNotificationAsync({
      content: {
        title: reminder.emoji + " " + reminder.label,
        body: reminder.message || "Time for " + reminder.label + "!",
        sound: "default",
        priority: "high",
        color: reminder.color || "#E8A0BF",
      },
      trigger,
    });

    return notifId;
  } catch (e) {
    console.error("scheduleNotification error:", e);
    return null;
  }
};

export const cancelNotification = async (notifId) => {
  try {
    if (notifId) await Notifications.cancelScheduledNotificationAsync(notifId);
    return true;
  } catch (e) {
    return false;
  }
};

export const cancelAllNotifications = async () => {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (e) {}
};

export const getAllReminders = async () => {
  try {
    const raw = await AsyncStorage.getItem(KEYS.REMINDERS);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
};

export const saveReminder = async (reminder) => {
  try {
    const reminders = await getAllReminders();
    const notifId = await scheduleNotification(reminder);
    const newReminder = {
      ...reminder,
      notifId,
      active: true,
      createdAt: new Date().toISOString(),
    };
    const updated = [...reminders, newReminder];
    await AsyncStorage.setItem(KEYS.REMINDERS, JSON.stringify(updated));
    return newReminder;
  } catch (e) {
    console.error("saveReminder error:", e);
    return null;
  }
};

export const toggleReminder = async (id) => {
  try {
    const reminders = await getAllReminders();
    const updated = await Promise.all(
      reminders.map(async (r) => {
        if (r.id !== id) return r;
        if (r.active) {
          if (r.notifId) await cancelNotification(r.notifId);
          return { ...r, active: false, notifId: null };
        } else {
          const notifId = await scheduleNotification(r);
          return { ...r, active: true, notifId };
        }
      }),
    );
    await AsyncStorage.setItem(KEYS.REMINDERS, JSON.stringify(updated));
    return updated;
  } catch (e) {
    return [];
  }
};

export const deleteReminder = async (id) => {
  try {
    const reminders = await getAllReminders();
    const reminder = reminders.find((r) => r.id === id);
    if (reminder?.notifId) await cancelNotification(reminder.notifId);
    const updated = reminders.filter((r) => r.id !== id);
    await AsyncStorage.setItem(KEYS.REMINDERS, JSON.stringify(updated));
    return updated;
  } catch (e) {
    return [];
  }
};

export const generateId = () =>
  Date.now() + "_" + Math.random().toString(36).substr(2, 9);
