import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import AppNavigator from "./AppNavigator";
import { COLORS } from "./src/theme";
import { setupNotifications } from "./src/storage/remindersStorage";
import { AlarmService } from "./src/services/AlarmService";

export default function App() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        // Race the entire init against a 3-second timeout so the app
        // always loads even if notifee hangs in the dev client.
        await Promise.race([
          (async () => {
            // 1. Create notification channel FIRST
            await setupNotifications();
            // 2. Initialize AlarmService (requests permissions)
            await AlarmService.initialize().catch((err) => {
              console.log("Failed to initialize AlarmService:", err);
            });
          })(),
          new Promise((resolve) => setTimeout(resolve, 3000)),
        ]);
      } catch (e) {
        console.log("App init error:", e);
      } finally {
        setReady(true);
      }
    };
    init();
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
