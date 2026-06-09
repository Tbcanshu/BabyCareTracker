import AsyncStorage from "@react-native-async-storage/async-storage";
import notifee, { 
  AndroidImportance, 
  AndroidNotificationVisibility, 
  TriggerType, 
  RepeatFrequency,
  AndroidCategory
} from "@notifee/react-native";
import { Platform } from "react-native";

const KEYS = {
  REMINDERS: "baby_reminders",
};

// ─── Notification Handler Setup ───────────────────────────────────────────────
export const setupNotifications = async () => {
  // Create the high-priority alarm channel for Android
  if (Platform.OS === 'android') {
    await notifee.createChannel({
      id: 'baby-alarm',
      name: 'Baby Alarms',
      importance: AndroidImportance.HIGH,
      visibility: AndroidNotificationVisibility.PUBLIC,
      sound: 'default', // User should replace with a custom sound file name later
      vibration: true,
      bypassDnd: true,
    });
  }
};

// ─── Request Permissions ──────────────────────────────────────────────────────
export const requestNotificationPermissions = async () => {
  try {
    const settings = await notifee.requestPermission();
    return settings.authorizationStatus >= 1; // 1 = Authorized
  } catch (e) {
    console.error('requestNotificationPermissions error:', e);
    return false;
  }
};

// ─── Schedule LOCAL notification ─────────────────────────────────────────────
export const scheduleNotification = async (reminder) => {
  try {
    let trigger;

    if (reminder.type === "interval") {
      // Notifee Interval trigger repeats every X seconds
      const seconds = Math.max(60, reminder.intervalHours * 60 * 60);
      trigger = {
        type: TriggerType.INTERVAL,
        interval: seconds,
        timeUnit: 'SECONDS',
      };
    } else {
      // Daily trigger at specific time
      const [hour, minute] = (reminder.time || "08:00").split(":").map(Number);
      const now = new Date();
      const date = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, minute, 0);
      
      // If time has already passed today, schedule for tomorrow
      if (date < now) {
        date.setDate(date.getDate() + 1);
      }

      trigger = {
        type: TriggerType.TIMESTAMP,
        timestamp: date.getTime(),
        repeatFrequency: RepeatFrequency.DAILY,
        alarmManager: true, // Crucial for "Real" Alarms on Android
      };
    }

    const notifId = await notifee.createTriggerNotification(
      {
        id: reminder.id, // Use reminder ID as notification ID for easier management
        title: reminder.emoji + " " + reminder.label,
        body: reminder.message || "Time for " + reminder.label + "!",
        android: {
          channelId: 'baby-alarm',
          importance: AndroidImportance.HIGH,
          category: AndroidCategory.ALARM,
          pressAction: { id: 'default' },
          // This ensures the sound keeps playing until the notification is dismissed
          loopSound: true,
          // Ensures the notification shows up over other apps
          fullScreenAction: { id: 'default' },
          actions: [
            {
              title: '🛑 Stop Alarm',
              pressAction: { id: 'stop-alarm' },
            },
          ],
        },
        ios: {
          sound: 'default',
          critical: true, // Bypasses silent mode (requires entitlement)
          criticalVolume: 0.9, // Ensure it's loud
        },
      },
      trigger
    );


    return reminder.id; // Notifee uses the provided ID or returns generated one
  } catch (e) {
    console.error("scheduleNotification error:", e);
    return null;
  }
};

export const cancelNotification = async (notifId) => {
  try {
    if (notifId) await notifee.cancelNotification(notifId);
    return true;
  } catch (e) {
    return false;
  }
};

export const cancelAllNotifications = async () => {
  try {
    await notifee.cancelAllNotifications();
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

