export type NotificationDigestFrequency = 'off' | 'daily' | 'weekly';

export type NotificationPreferences = {
  expirationReminders: boolean;
  expiredItemReminders: boolean;
  lowStockReminders: boolean;
  useTodayAlerts: boolean;
  mealPlanReminders: boolean;
  shoppingReminders: boolean;
  digestFrequency: NotificationDigestFrequency;
  emailNotifications: boolean;
  webPushNotifications: boolean;
  expoPushNotifications: boolean;
  expirationWindowDays: number;
  reminderTime: string;
};

export type PushTokenRegistrationPayload = {
  expoPushToken: string;
  deviceId?: string | null;
  platform: 'ios' | 'android' | 'web' | 'unknown';
  deviceName?: string | null;
};

export type NotificationPermissionState = {
  granted: boolean;
  status: string;
};

export type PushRegistrationResult = {
  success: boolean;
  status: 'registered' | 'permission-denied' | 'unsupported' | 'error';
  message: string;
  expoPushToken?: string;
};

export const EXPIRING_SOON_THRESHOLDS = [1, 3, 7, 14] as const;

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  expirationReminders: true,
  expiredItemReminders: true,
  lowStockReminders: true,
  useTodayAlerts: true,
  mealPlanReminders: true,
  shoppingReminders: true,
  digestFrequency: 'weekly',
  emailNotifications: false,
  webPushNotifications: false,
  expoPushNotifications: false,
  expirationWindowDays: 7,
  reminderTime: '08:00',
};
