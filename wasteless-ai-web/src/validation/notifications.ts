import { z } from "zod";

export const notificationSettingsSchema = z.object({
  expirationReminders: z.boolean().default(true),
  expiredItemReminders: z.boolean().default(true),
  lowStockReminders: z.boolean().default(true),
  useTodayAlerts: z.boolean().default(true),
  mealPlanReminders: z.boolean().default(true),
  shoppingReminders: z.boolean().default(true),
  digestFrequency: z.enum(["off", "daily", "weekly"]).default("weekly"),
  emailNotifications: z.boolean().default(false),
  webPushNotifications: z.boolean().default(false),
  expoPushNotifications: z.boolean().default(false),
  expirationWindowDays: z.coerce.number().int().min(1).max(14).default(7),
  reminderTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use HH:MM time")
    .default("08:00"),
});

export const notificationIdSchema = z.object({
  notificationId: z.string().uuid(),
});

export const notificationPushTokenSchema = z.object({
  expoPushToken: z
    .string()
    .trim()
    .min(12, "Expo push token is required")
    .max(512, "Expo push token is too long")
    .regex(/^(Expo|Exponent)PushToken\[[^\]]+\]$/, "Invalid Expo push token"),
  deviceId: z.string().trim().min(1).max(256).optional().nullable(),
  platform: z.enum(["ios", "android", "web", "unknown"]).default("unknown"),
  deviceName: z.string().trim().max(120).optional().nullable(),
});

export const notificationPushTokenDeleteSchema = z
  .object({
    expoPushToken: z.string().trim().max(512).optional().nullable(),
    deviceId: z.string().trim().max(256).optional().nullable(),
  })
  .refine((value) => Boolean(value.expoPushToken || value.deviceId), {
    message: "Expo push token or device id is required",
  });
