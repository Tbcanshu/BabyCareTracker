import React, { useEffect, useState, useRef } from "react";
import { View, Text, StyleSheet } from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import * as Notifications from "expo-notifications";
import AppNavigator from "./AppNavigator";
import AlarmOverlay from "./src/components/AlarmOverlay";
import { COLORS } from "./src/theme";
import {
  setupNotifications,
  requestNotificationPermissions,
} from "./src/storage/remindersStorage";

export default function App() {
  const [ready, setReady] = useState(false);

  // Alarm overlay state
  const [alarmVisible, setAlarmVisible] = useState(false);
  const [alarmTitle, setAlarmTitle] = useState("");
  const [alarmBody, setAlarmBody] = useState("");

  // Refs for notification listeners (so we can clean them up)
  const notifReceivedRef = useRef(null);
  const notifResponseRef = useRef(null);

  useEffect(() => {
    const init = async () => {
      try {
        await setupNotifications();
        await requestNotificationPermissions();
      } catch (e) {
        console.log("App init error:", e);
      } finally {
        setReady(true);
      }
    };
    init();

    // ── Foreground notification listener ─────────────────────────────────────
    // When a notification fires while the app is open, show the alarm overlay
    notifReceivedRef.current =
      Notifications.addNotificationReceivedListener((notification) => {
        const { title, body } = notification.request.content;
        setAlarmTitle(title || "⏰ Alarm!");
        setAlarmBody(body || "Time to check on your baby!");
        setAlarmVisible(true);
      });

    // ── Notification tap listener ─────────────────────────────────────────────
    // When user taps the notification from the tray, also show the overlay
    notifResponseRef.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        const { title, body } = response.notification.request.content;
        setAlarmTitle(title || "⏰ Alarm!");
        setAlarmBody(body || "Time to check on your baby!");
        setAlarmVisible(true);
      });

    return () => {
      if (notifReceivedRef.current) {
        Notifications.removeNotificationSubscription(
          notifReceivedRef.current
        );
      }
      if (notifResponseRef.current) {
        Notifications.removeNotificationSubscription(
          notifResponseRef.current
        );
      }
    };
  }, []);

  if (!ready) {
    return (
      <View style={styles.splash}>
        <Text style={styles.splashEmoji}>🍼</Text>
        <Text style={styles.splashTitle}>Baby Care</Text>
        <Text style={styles.splashSubtitle}>Tracker</Text>
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" backgroundColor={COLORS.surface} />
      <AppNavigator />

      {/* Full-screen alarm overlay — renders above everything */}
      <AlarmOverlay
        visible={alarmVisible}
        title={alarmTitle}
        body={alarmBody}
        onDismiss={() => setAlarmVisible(false)}
      />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: "center",
    justifyContent: "center",
  },
  splashEmoji: { fontSize: 72, marginBottom: 16 },
  splashTitle: {
    fontSize: 32,
    fontWeight: "800",
    color: COLORS.textPrimary,
    letterSpacing: -0.5,
  },
  splashSubtitle: {
    fontSize: 18,
    color: COLORS.primaryDark,
    fontWeight: "600",
  },
});
