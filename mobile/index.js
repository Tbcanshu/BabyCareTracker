import { registerRootComponent } from "expo";
import notifee, { EventType } from '@notifee/react-native';
import App from "./App";

// Register background event handler for Notifee
notifee.onBackgroundEvent(async ({ type, detail }) => {
  const { notification, pressAction } = detail;

  // Check if the user pressed the 'Stop Alarm' action
  if (type === EventType.ACTION_PRESS && pressAction.id === 'stop-alarm') {
    // Remove the notification
    await notifee.cancelNotification(notification.id);
  }
});

registerRootComponent(App);

