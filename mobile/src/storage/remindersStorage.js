import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { Platform, NativeModules } from "react-native";

const { AlarmModule } = NativeModules;

const KEYS = {
  REMINDERS: "baby_reminders",
};

// ─── Notification Handler Setup ───────────────────────────────────────────────
// This must be called at the module level (not inside a component) so
// notifications that arrive while the app is in the foreground are shown.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export const setupNotifications = async () => {
  // Create the Android notification channel (safe no-op on iOS)
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("baby-alarm", {
      name: "Baby Alarms",
      importance: Notifications.AndroidImportance.MAX,
      sound: "default",
      vibrationPattern: [0, 250, 250, 250],
      enableVibrate: true,
      lockscreenVisibility: 1, // 1 = PUBLIC
      bypassDnd: true,
    });
  }
};

// ─── Request Permissions ──────────────────────────────────────────────────────
export const requestNotificationPermissions = async () => {
  try {
    const { status } = await Notifications.requestPermissionsAsync({
      ios: {
        allowAlert: true,
        allowBadge: true,
        allowSound: true,
      },
    });
    return status === "granted";
  } catch (e) {
    console.error("requestNotificationPermissions error:", e);
    return false;
  }
};

// ─── Schedule LOCAL notification ─────────────────────────────────────────────
export const scheduleNotification = async (reminder) => {
  try {
    let trigger;
    let safeSeconds = 0;
    let hour = 0;
    let minute = 0;

    if (reminder.type === "interval") {
      // intervalHours is stored as a decimal (e.g. 0.5 = 30 min, 3 = 3 hours)
      const rawHours = Number(reminder.intervalHours);
      const totalSeconds =
        isNaN(rawHours) || rawHours <= 0 ? 3600 : Math.round(rawHours * 3600);
      // expo-notifications minimum interval is 1 second (no 15-min floor needed
      // for one-shot triggers — only for repeating ones on iOS, handled below)
      safeSeconds = Math.max(60, totalSeconds);

      trigger = {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: safeSeconds,
        repeats: true,
      };
    } else {
      // Daily trigger at a specific time
      const parts = (reminder.time || "08:00").split(":").map(Number);
      hour = parts[0];
      minute = parts[1];

      trigger = {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
      };
    }

    const notifId = await Notifications.scheduleNotificationAsync({
      identifier: reminder.id,
      content: {
        title: reminder.emoji + " " + reminder.label,
        body: reminder.message || "Time for " + reminder.label + "!",
        sound: "default",
        vibrate: [0, 500, 300, 500, 300, 800],
        priority: Notifications.AndroidNotificationPriority.MAX,
        sticky: true, // Notification persists until user interacts
        data: { isAlarm: true, reminderId: reminder.id },
        // Android channel
        ...(Platform.OS === "android" && { channelId: "baby-alarm" }),
      },
      trigger,
    });

    // Schedule native alarm manager for background/locked screen wakeup
    if (Platform.OS === "android" && AlarmModule) {
      const title = (reminder.emoji || "⏰") + " " + (reminder.label || "Reminder");
      const body = reminder.message || "Time for " + (reminder.label || "reminder") + "!";
      try {
        await AlarmModule.scheduleAlarm(
          reminder.id,
          reminder.type,
          safeSeconds,
          hour,
          minute,
          title,
          body
        );
      } catch (err) {
        console.warn("Native scheduleAlarm error:", err);
      }
    }

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
    const reminders = await getAllReminders();
    if (Platform.OS === "android" && AlarmModule) {
      for (const r of reminders) {
        try {
          await AlarmModule.cancelAlarm(r.id);
        } catch (err) {}
      }
    }
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
          if (Platform.OS === "android" && AlarmModule) {
            try {
              await AlarmModule.cancelAlarm(r.id);
            } catch (err) {}
          }
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
    if (Platform.OS === "android" && AlarmModule) {
      try {
        await AlarmModule.cancelAlarm(id);
      } catch (err) {}
    }
    const updated = reminders.filter((r) => r.id !== id);
    await AsyncStorage.setItem(KEYS.REMINDERS, JSON.stringify(updated));
    return updated;
  } catch (e) {
    return [];
  }
};

export const generateId = () =>
  Date.now() + "_" + Math.random().toString(36).substr(2, 9);
