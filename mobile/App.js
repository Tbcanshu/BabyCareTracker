import React, { useEffect, useState, useRef } from "react";
import { View, Text, StyleSheet, Alert, DeviceEventEmitter, NativeModules, Platform } from "react-native";
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

const { AlarmModule } = NativeModules;

export default function App() {
  const [ready, setReady] = useState(false);

  // Alarm overlay state
  const [alarmVisible, setAlarmVisible] = useState(false);
  const [alarmId, setAlarmId] = useState(null);
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

        // Check if there is a pending alarm that launched this app
        if (Platform.OS === 'android' && AlarmModule) {
          const pending = await AlarmModule.getPendingAlarm();
          if (pending) {
            setAlarmId(pending.id || null);
            setAlarmTitle(pending.title || "⏰ Alarm!");
            setAlarmBody(pending.body || "Time to check on your baby!");
            setAlarmVisible(true);
          }

          // Check/Request overlay permission
          const hasOverlay = await AlarmModule.checkOverlayPermission();
          if (!hasOverlay) {
            Alert.alert(
              "Display Over Other Apps",
              "BabyBloom needs 'Display over other apps' permission to show full-screen alarms even when you are using other apps or your screen is off. Please enable it in the next screen.",
              [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Enable",
                  onPress: () => AlarmModule.requestOverlayPermission(),
                },
              ]
            );
          }
        }
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
        const { title, body, data } = notification.request.content;
        setAlarmId(data?.reminderId || null);
        setAlarmTitle(title || "⏰ Alarm!");
        setAlarmBody(body || "Time to check on your baby!");
        setAlarmVisible(true);
      });

    // ── Notification tap listener ─────────────────────────────────────────────
    // When user taps the notification from the tray, also show the overlay
    notifResponseRef.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        const { title, body, data } = response.notification.request.content;
        setAlarmId(data?.reminderId || null);
        setAlarmTitle(title || "⏰ Alarm!");
        setAlarmBody(body || "Time to check on your baby!");
        setAlarmVisible(true);
      });

    // ── Native Alarm trigger listener ─────────────────────────────────────────
    const alarmSubscription = DeviceEventEmitter.addListener(
      "onAlarmTriggered",
      (event) => {
        setAlarmId(event.id || null);
        setAlarmTitle(event.title || "⏰ Alarm!");
        setAlarmBody(event.body || "Time to check on your baby!");
        setAlarmVisible(true);
      }
    );

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
      alarmSubscription.remove();
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
        alarmId={alarmId}
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
