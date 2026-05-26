export const NOTIFICATION_TYPE_LABELS = {
  expiration_reminder: "Expiration reminder",
  expired_item_reminder: "Expired item",
  low_stock_reminder: "Low stock",
  use_today_alert: "Use today",
  meal_plan_reminder: "Meal plan",
  shopping_reminder: "Shopping",
  daily_digest: "Daily digest",
  weekly_digest: "Weekly digest",
} as const;

export type NotificationType = keyof typeof NOTIFICATION_TYPE_LABELS;

export type NotificationSeverity = "info" | "success" | "warning" | "critical";

export type NotificationDigestFrequency = "off" | "daily" | "weekly";

export type NotificationSettings = {
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

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  expirationReminders: true,
  expiredItemReminders: true,
  lowStockReminders: true,
  useTodayAlerts: true,
  mealPlanReminders: true,
  shoppingReminders: true,
  digestFrequency: "weekly",
  emailNotifications: false,
  webPushNotifications: false,
  expoPushNotifications: false,
  expirationWindowDays: 7,
  reminderTime: "08:00",
};

export function getNotificationTypeLabel(type: string) {
  return NOTIFICATION_TYPE_LABELS[type as NotificationType] ?? "Notification";
}
