import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { api } from './api';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export class PushNotificationService {
  private static token: string | null = null;

  /**
   * Register for push notifications and send token to backend
   */
  static async registerForPushNotifications(): Promise<string | null> {
    if (!Device.isDevice) {
      console.log('Push notifications only work on physical devices');
      return null;
    }

    try {
      // Check existing permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      // Request permissions if not granted
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Push notification permissions not granted');
        return null;
      }

      // Get push token
      const projectId = Constants.expoConfig?.extra?.eas?.projectId;
      if (!projectId) {
        console.log('Project ID not found in app config');
        return null;
      }

      const token = (
        await Notifications.getExpoPushTokenAsync({
          projectId,
        })
      ).data;

      this.token = token;

      // Send token to backend
      await this.sendTokenToBackend(token);

      // Configure Android channel
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
      }

      return token;
    } catch (error) {
      console.error('Error registering for push notifications:', error);
      return null;
    }
  }

  /**
   * Send FCM token to backend
   */
  private static async sendTokenToBackend(token: string): Promise<void> {
    try {
      await api.post('/notifications/register-token', { token });
      console.log('Push token registered with backend');
    } catch (error) {
      console.error('Failed to register token with backend:', error);
    }
  }

  /**
   * Unregister push notifications
   */
  static async unregisterPushNotifications(): Promise<void> {
    if (!this.token) return;

    try {
      await api.post('/notifications/unregister-token', { token: this.token });
      this.token = null;
      console.log('Push token unregistered');
    } catch (error) {
      console.error('Failed to unregister token:', error);
    }
  }

  /**
   * Add notification received listener
   */
  static addNotificationReceivedListener(
    callback: (notification: Notifications.Notification) => void
  ) {
    return Notifications.addNotificationReceivedListener(callback);
  }

  /**
   * Add notification response listener (when user taps notification)
   */
  static addNotificationResponseListener(
    callback: (response: Notifications.NotificationResponse) => void
  ) {
    return Notifications.addNotificationResponseReceivedListener(callback);
  }

  /**
   * Schedule a local notification
   */
  static async scheduleLocalNotification(
    title: string,
    body: string,
    data?: any,
    trigger?: Notifications.NotificationTriggerInput
  ): Promise<string> {
    return await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: true,
      },
      trigger: trigger || null,
    });
  }

  /**
   * Cancel a scheduled notification
   */
  static async cancelNotification(notificationId: string): Promise<void> {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  }

  /**
   * Cancel all scheduled notifications
   */
  static async cancelAllNotifications(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }

  /**
   * Get badge count
   */
  static async getBadgeCount(): Promise<number> {
    return await Notifications.getBadgeCountAsync();
  }

  /**
   * Set badge count
   */
  static async setBadgeCount(count: number): Promise<void> {
    await Notifications.setBadgeCountAsync(count);
  }

  /**
   * Clear badge
   */
  static async clearBadge(): Promise<void> {
    await Notifications.setBadgeCountAsync(0);
  }

  /**
   * Send test notification (for development)
   */
  static async sendTestNotification(): Promise<void> {
    try {
      await api.post('/notifications/test', {
        title: 'Test Notification',
        body: 'This is a test notification from Consistency App',
      });
      console.log('Test notification sent');
    } catch (error) {
      console.error('Failed to send test notification:', error);
    }
  }
}

/**
 * Notification types for handling different notification actions
 */
export enum NotificationType {
  TASK_REMINDER = 'task_reminder',
  STREAK_MILESTONE = 'streak_milestone',
  LEVEL_UP = 'level_up',
  CONNECTION_REQUEST = 'connection_request',
  GROUP_MESSAGE = 'group_message',
  CHALLENGE_INVITE = 'challenge_invite',
  DAILY_SUMMARY = 'daily_summary',
}

/**
 * Handle notification tap based on type
 */
export function handleNotificationTap(
  notification: Notifications.NotificationResponse,
  navigation: any
) {
  const data = notification.notification.request.content.data;
  const type = data?.type as NotificationType;

  switch (type) {
    case NotificationType.TASK_REMINDER:
      navigation.navigate('Today');
      break;
    case NotificationType.STREAK_MILESTONE:
    case NotificationType.LEVEL_UP:
      navigation.navigate('Progress');
      break;
    case NotificationType.CONNECTION_REQUEST:
      navigation.navigate('Social', { screen: 'Connections' });
      break;
    case NotificationType.GROUP_MESSAGE:
      if (data?.groupId) {
        navigation.navigate('GroupDetail', { groupId: data.groupId });
      }
      break;
    case NotificationType.CHALLENGE_INVITE:
      navigation.navigate('Social', { screen: 'Groups' });
      break;
    case NotificationType.DAILY_SUMMARY:
      navigation.navigate('Progress');
      break;
    default:
      navigation.navigate('Today');
  }
}
