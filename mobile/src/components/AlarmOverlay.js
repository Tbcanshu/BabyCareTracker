import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Vibration,
  Animated,
  Dimensions,
  Platform,
} from "react-native";
import { useAudioPlayer } from "expo-audio";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

/**
 * AlarmOverlay — a full-screen alarm popup that plays a loud alarm sound,
 * vibrates the device, and shows an animated dismiss UI.
 *
 * Props:
 *   visible     (bool)   — whether the alarm is active
 *   title       (string) — notification title
 *   body        (string) — notification body
 *   onDismiss   (fn)     — callback when user taps "Stop Alarm"
 */
const AlarmOverlay = ({ visible, title, body, onDismiss }) => {
  const player = useAudioPlayer(require("../../assets/audio/alarm.wav"));
  player.loop = true;

  // Animations
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const bellAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(80)).current;

  // ── Start alarm: sound + vibration + animations ─────────────────────────────
  useEffect(() => {
    if (!visible) return;

    let soundObj = null;
    let mounted = true;

    const startAlarm = async () => {
      // 1. Play the alarm sound in a loop using expo-audio
      try {
        if (player) {
          player.volume = 1.0;
          player.play();
        }
      } catch (e) {
        console.warn("Alarm sound load error:", e);
      }

      // 3. Start vibration pattern (looping)
      // Pattern: pause, vibrate, pause, vibrate... repeats indefinitely
      Vibration.vibrate([0, 500, 300, 500, 300, 800], true);

      // 4. Entrance animation
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          friction: 8,
          tension: 60,
          useNativeDriver: true,
        }),
      ]).start();

      // 5. Pulse animation (looping)
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // 6. Bell shake animation (looping)
      Animated.loop(
        Animated.sequence([
          Animated.timing(bellAnim, {
            toValue: 1,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.timing(bellAnim, {
            toValue: -1,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.timing(bellAnim, {
            toValue: 1,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.timing(bellAnim, {
            toValue: 0,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.delay(400),
        ])
      ).start();
    };

    startAlarm();

    return () => {
      mounted = false;
      // Cleanup on unmount or when visible becomes false
      Vibration.cancel();
      if (player) {
        player.pause();
      }
      pulseAnim.setValue(1);
      bellAnim.setValue(0);
      fadeAnim.setValue(0);
      slideAnim.setValue(80);
    };
  }, [visible]);

  // ── Stop alarm handler ──────────────────────────────────────────────────────
  const handleStop = async () => {
    // Stop vibration
    Vibration.cancel();

    // Stop sound
    if (player) {
      try {
        player.pause();
      } catch (e) {
        console.warn("Sound cleanup error:", e);
      }
    }

    // Exit animation then dismiss
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      if (onDismiss) onDismiss();
    });
  };

  // Bell rotation interpolation
  const bellRotation = bellAnim.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ["-20deg", "0deg", "20deg"],
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={handleStop}
    >
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        {/* Pulsing glow background */}
        <Animated.View
          style={[
            styles.glowCircle,
            { transform: [{ scale: pulseAnim }] },
          ]}
        />

        <Animated.View
          style={[
            styles.card,
            { transform: [{ translateY: slideAnim }] },
          ]}
        >
          {/* Animated bell icon */}
          <Animated.View
            style={[
              styles.bellContainer,
              { transform: [{ rotate: bellRotation }] },
            ]}
          >
            <Text style={styles.bellEmoji}>🔔</Text>
          </Animated.View>

          {/* Title */}
          <Text style={styles.alarmTitle}>
            {title || "⏰ Alarm!"}
          </Text>

          {/* Body */}
          <Text style={styles.alarmBody}>
            {body || "Time to check on your baby!"}
          </Text>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Stop button */}
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <TouchableOpacity
              style={styles.stopButton}
              onPress={handleStop}
              activeOpacity={0.8}
            >
              <Text style={styles.stopIcon}>🛑</Text>
              <Text style={styles.stopText}>Stop Alarm</Text>
            </TouchableOpacity>
          </Animated.View>

          {/* Snooze hint */}
          <Text style={styles.hintText}>
            Tap to silence alarm and vibration
          </Text>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(60, 20, 50, 0.92)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  glowCircle: {
    position: "absolute",
    width: SCREEN_WIDTH * 0.9,
    height: SCREEN_WIDTH * 0.9,
    borderRadius: SCREEN_WIDTH * 0.45,
    backgroundColor: "rgba(232, 90, 120, 0.12)",
  },
  card: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    paddingVertical: 36,
    paddingHorizontal: 28,
    alignItems: "center",
    // Shadow
    shadowColor: "#E85C7A",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 20,
  },
  bellContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#FFF0F3",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    borderWidth: 3,
    borderColor: "#FFD6DE",
  },
  bellEmoji: {
    fontSize: 40,
  },
  alarmTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#3A2140",
    textAlign: "center",
    marginBottom: 8,
  },
  alarmBody: {
    fontSize: 16,
    color: "#7A5F85",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  divider: {
    width: "60%",
    height: 1,
    backgroundColor: "#F0E0F0",
    marginBottom: 24,
  },
  stopButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E85C7A",
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 999,
    gap: 10,
    // Shadow
    shadowColor: "#E85C7A",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 8,
  },
  stopIcon: {
    fontSize: 20,
  },
  stopText: {
    fontSize: 18,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },
  hintText: {
    fontSize: 12,
    color: "#B8A0C0",
    marginTop: 16,
    fontWeight: "500",
  },
});

export default AlarmOverlay;
