import * as Notifications from 'expo-notifications';
import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import { Audio } from 'expo-av';
import { Asset } from 'expo-asset';
import { Platform, Alert } from 'react-native';

const BACKGROUND_ALARM_TASK = 'baby-alarm-background-task';

// Define background task
TaskManager.defineTask(BACKGROUND_ALARM_TASK, async () => {
  try {
    // Play alarm sound directly (bypasses notification)
    const sound = new Audio.Sound();
    const soundUri = Asset.fromModule(require('../../assets/audio/alarm.wav')).uri;
    await sound.loadAsync({ uri: soundUri });
    await sound.setIsLoopingAsync(true);
    await sound.setVolumeAsync(1.0);
    await sound.playAsync();

    // Also send notification
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "⏰ Baby Timer Done!",
        body: "It's time to check on your baby",
        sound: soundUri,
        channelId: 'baby-alarm-channel',
      },
      trigger: { seconds: 0 },
    });

    return BackgroundFetch.Result.NewData;
  } catch (error) {
    console.error('Background alarm task failed:', error);
    return BackgroundFetch.Result.Failed;
  }
});

export class AlarmService {
  // Initialize alarm system
  static async initialize() {
    try {
      // 1. Set notification handler
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldPlaySound: true,
          shouldShowBanner: true,
          shouldShowList: true,
        }),
      });

      // 2. Create alarm channel (Android)
      const soundUri = Asset.fromModule(require('../../assets/audio/alarm.wav')).uri;
      await Notifications.createNotificationChannelAsync({
        name: 'Baby Alarm',
        id: 'baby-alarm-channel',
        importance: Notifications.AndroidImportance.MAX,
        sound: soundUri,
        enableVibrate: true,
        vibrationPattern: [0, 250, 250, 250],
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
        bypassDnd: true,
      });

      // 3. Request permissions
      const { status } = await Notifications.requestPermissionsAsync({
        android: {},
        ios: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
          criticalAlert: true,
          allowAnnouncements: true,
        },
      });

      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please enable notifications in Settings for alarms to work',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => {
              if (Platform.OS === 'ios') {
                require('react-native').Linking.openSettings();
              }
            }}
          ]
        );
        return false;
      }

      // 4. Register background fetch (iOS only)
      if (Platform.OS === 'ios') {
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
    try {
      const hasPermission = await BackgroundFetch.registerTaskAsync(
        BACKGROUND_ALARM_TASK,
        {
          minimumInterval: 15 * 60, // 15 minutes (iOS minimum)
          stopOnTerminate: false,
          startOnBoot: true,
        }
      );
      console.log('✅ Background alarm registered:', hasPermission);
    } catch (error) {
      console.error('❌ Background alarm registration failed:', error);
    }
  }

  // Schedule timer alarm
  static async scheduleTimer(durationSeconds) {
    try {
      const soundUri = Asset.fromModule(require('../../assets/audio/alarm.wav')).uri;

      const triggerConfig = Platform.OS === 'ios'
        ? {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: new Date(Date.now() + durationSeconds * 1000),
          }
        : {
            type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
            seconds: durationSeconds,
            repeats: false,
          };

      await Notifications.scheduleNotificationAsync({
        content: {
          title: "⏰ Baby Timer Done!",
          body: "It's time to check on your baby",
          sound: soundUri,
          channelId: 'baby-alarm-channel',
          categoryIdentifier: Notifications.AndroidCategoryIdentifier.ALARM,
          priority: Platform.OS === 'android' 
            ? Notifications.AndroidNotificationPriority.HIGH 
            : undefined,
          bypassDnd: Platform.OS === 'android',
        },
        trigger: triggerConfig,
      });

      console.log(`✅ Timer scheduled: ${durationSeconds} seconds`);
      return true;
    } catch (error) {
      console.error('❌ Timer scheduling failed:', error);
      return false;
    }
  }

  // Schedule recurring alarm (daily)
  static async scheduleRecurring(hour, minute, label = 'Baby Check') {
    try {
      const soundUri = Asset.fromModule(require('../../assets/audio/alarm.wav')).uri;

      await Notifications.scheduleNotificationAsync({
        content: {
          title: '⏰ ' + label,
          body: 'Time to check on your baby',
          sound: soundUri,
          channelId: 'baby-alarm-channel',
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.CRON,
          hour,
          minute,
          repeats: true,
        },
      });

      console.log(`✅ Recurring alarm scheduled: ${hour}:${minute}`);
      return true;
    } catch (error) {
      console.error('❌ Recurring alarm failed:', error);
      return false;
    }
  }

  // Cancel all alarms
  static async cancelAll() {
    await Notifications.cancelAllScheduledNotificationsAsync();
    console.log('✅ All alarms cancelled');
  }

  // Get scheduled alarms
  static async getScheduled() {
    return await Notifications.getAllScheduledNotificationsAsync();
  }

  // Play alarm immediately (for testing)
  static async playAlarmNow() {
    try {
      const sound = new Audio.Sound();
      const soundUri = Asset.fromModule(require('../../assets/audio/alarm.wav')).uri;
      await sound.loadAsync({ uri: soundUri });
      await sound.setIsLoopingAsync(true);
      await sound.setVolumeAsync(1.0);
      await sound.playAsync();
      
      console.log('🔔 Alarm playing now');
      return sound;
    } catch (error) {
      console.error('❌ Alarm playback failed:', error);
      return null;
    }
  }

  // Stop alarm
  static async stopAlarm(sound) {
    if (sound) {
      await sound.stopAsync();
      await sound.unloadAsync();
      console.log('✅ Alarm stopped');
    }
  }
}
