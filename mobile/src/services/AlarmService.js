import { Platform, Alert, Linking } from 'react-native';
import notifee, {
  AndroidImportance,
  AndroidCategory,
  TriggerType,
  RepeatFrequency,
  EventType,
} from '@notifee/react-native';

let TaskManager = null;
let BackgroundFetch = null;
let createAudioPlayer = null;

try {
  TaskManager = require('expo-task-manager');
} catch (error) {
  console.warn('ExpoTaskManager native module not found. Background tasks will be disabled.');
}

try {
  BackgroundFetch = require('expo-background-fetch');
} catch (error) {
  console.warn('ExpoBackgroundFetch native module not found. Background fetch will be disabled.');
}

try {
  createAudioPlayer = require('expo-audio').createAudioPlayer;
} catch (error) {
  console.warn('expo-audio native module not found. Audio playback will be disabled.');
}

const BACKGROUND_ALARM_TASK = 'baby-alarm-background-task';
const CHANNEL_ID = 'baby-alarm';

// ─── Background Task ───────────────────────────────────────────────────────────
if (TaskManager && typeof TaskManager.defineTask === 'function') {
  try {
    TaskManager.defineTask(BACKGROUND_ALARM_TASK, async () => {
      try {
        // Play alarm sound
        if (createAudioPlayer) {
          try {
            const player = createAudioPlayer(require('../../assets/audio/alarm.wav'));
            player.loop = true;
            player.volume = 1.0;
            player.play();
          } catch (audioError) {
            console.error('Failed to play background audio:', audioError);
          }
        }

        // Fire immediate notification via Notifee
        await notifee.displayNotification({
          title: '⏰ Baby Timer Done!',
          body: "It's time to check on your baby",
          android: {
            channelId: CHANNEL_ID,
            importance: AndroidImportance.HIGH,
            category: AndroidCategory.ALARM,
            pressAction: { id: 'default' },
            fullScreenAction: { id: 'default' },
            actions: [{ title: '🛑 Stop', pressAction: { id: 'stop-alarm' } }],
          },
          ios: { sound: 'default' },
        });

        return BackgroundFetch ? BackgroundFetch.Result.NewData : 1;
      } catch (error) {
        console.error('Background alarm task failed:', error);
        return BackgroundFetch ? BackgroundFetch.Result.Failed : 2;
      }
    });
  } catch (error) {
    console.error('Failed to define TaskManager task:', error);
  }
}

// ─── AlarmService ──────────────────────────────────────────────────────────────
export class AlarmService {
  // Initialize alarm system
  static async initialize() {
    try {
      // 1. Request notification permissions (without criticalAlert — needs Apple entitlement)
      const settings = await notifee.requestPermission({
        criticalAlert: false, // Set to true only after Apple approves the entitlement
      });

      const granted = settings.authorizationStatus >= 1;
      if (!granted) {
        Alert.alert(
          'Permission Required',
          'Please enable notifications in Settings for alarms to work',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Open Settings',
              onPress: () => Linking.openSettings(),
            },
          ]
        );
        return false;
      }

      // 3. On Android 12+ check exact alarm permission
      if (Platform.OS === 'android' && Platform.Version >= 31) {
        const androidSettings = await notifee.getNotificationSettings();
        if (androidSettings.android?.alarm !== undefined) {
          const alarmEnabled = androidSettings.android.alarm;
          // alarm === 1 means enabled
          if (alarmEnabled !== 1) {
            console.warn('⚠️ Exact alarm permission not granted. Reminders may be delayed.');
          }
        }
      }

      // 4. Register background fetch (iOS only)
      if (Platform.OS === 'ios' && BackgroundFetch && TaskManager) {
        await this.registerBackgroundAlarm();
      }

      console.log('✅ Alarm system initialized');
      return true;
    } catch (error) {
      console.error('❌ Alarm initialization failed:', error);
      return false;
    }
  }

  // Register background task
  static async registerBackgroundAlarm() {
    if (!BackgroundFetch || !TaskManager) {
      console.warn('⚠️ Background tasks are not supported in this environment.');
      return;
    }
    try {
      await BackgroundFetch.registerTaskAsync(BACKGROUND_ALARM_TASK, {
        minimumInterval: 15 * 60, // 15 minutes (iOS minimum)
        stopOnTerminate: false,
        startOnBoot: true,
      });
      console.log('✅ Background alarm registered');
    } catch (error) {
      // Task may already be registered — safe to ignore
      if (!error.message?.includes('already')) {
        console.error('❌ Background alarm registration failed:', error);
      }
    }
  }

  // Schedule a one-shot timer alarm (fires after durationSeconds)
  static async scheduleTimer(durationSeconds) {
    try {
      const fireDate = new Date(Date.now() + durationSeconds * 1000);

      await notifee.createTriggerNotification(
        {
          title: '⏰ Baby Timer Done!',
          body: "It's time to check on your baby",
          android: {
            channelId: CHANNEL_ID,
            importance: AndroidImportance.HIGH,
            category: AndroidCategory.ALARM,
            pressAction: { id: 'default' },
            fullScreenAction: { id: 'default' },
            loopSound: true,
            actions: [{ title: '🛑 Stop Alarm', pressAction: { id: 'stop-alarm' } }],
          },
          ios: { sound: 'default' },
        },
        {
          type: TriggerType.TIMESTAMP,
          timestamp: fireDate.getTime(),
          // No repeatFrequency — fires once
          alarmManager: true,
        }
      );

      console.log(`✅ Timer scheduled: ${durationSeconds} seconds`);
      return true;
    } catch (error) {
      // Fallback: try without exact alarm if permission denied
      try {
        const fireDate = new Date(Date.now() + durationSeconds * 1000);
        await notifee.createTriggerNotification(
          {
            title: '⏰ Baby Timer Done!',
            body: "It's time to check on your baby",
            android: { channelId: CHANNEL_ID, importance: AndroidImportance.HIGH },
            ios: { sound: 'default' },
          },
          { type: TriggerType.TIMESTAMP, timestamp: fireDate.getTime() }
        );
        console.log(`✅ Timer scheduled (inexact fallback): ${durationSeconds} seconds`);
        return true;
      } catch (fallbackError) {
        console.error('❌ Timer scheduling failed:', fallbackError);
        return false;
      }
    }
  }

  // Schedule a daily recurring alarm at a specific time
  static async scheduleRecurring(hour, minute, label = 'Baby Check') {
    try {
      const now = new Date();
      const date = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, minute, 0);
      if (date < now) date.setDate(date.getDate() + 1);

      await notifee.createTriggerNotification(
        {
          title: `⏰ ${label}`,
          body: 'Time to check on your baby',
          android: {
            channelId: CHANNEL_ID,
            importance: AndroidImportance.HIGH,
            category: AndroidCategory.ALARM,
            pressAction: { id: 'default' },
            fullScreenAction: { id: 'default' },
            loopSound: true,
          },
          ios: { sound: 'default' },
        },
        {
          type: TriggerType.TIMESTAMP,
          timestamp: date.getTime(),
          repeatFrequency: RepeatFrequency.DAILY,
          alarmManager: true,
        }
      );

      console.log(`✅ Recurring alarm scheduled: ${hour}:${minute}`);
      return true;
    } catch (error) {
      console.error('❌ Recurring alarm failed:', error);
      return false;
    }
  }

  // Cancel all alarms
  static async cancelAll() {
    await notifee.cancelAllNotifications();
    console.log('✅ All alarms cancelled');
  }

  // Get scheduled alarms
  static async getScheduled() {
    return await notifee.getTriggerNotificationIds();
  }

  // Play alarm immediately (for testing)
  static async playAlarmNow() {
    if (!createAudioPlayer) {
      console.warn('⚠️ Audio is not available in this environment.');
      return null;
    }
    try {
      const player = createAudioPlayer(require('../../assets/audio/alarm.wav'));
      player.loop = true;
      player.volume = 1.0;
      player.play();
      console.log('🔔 Alarm playing now');
      return player;
    } catch (error) {
      console.error('❌ Alarm playback failed:', error);
      return null;
    }
  }

  // Stop alarm
  static stopAlarm(player) {
    if (player) {
      try {
        player.pause();
        player.release();
      } catch (e) {
        console.warn('stopAlarm error:', e);
      }
      console.log('✅ Alarm stopped');
    }
  }
}
