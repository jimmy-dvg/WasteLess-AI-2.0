import { z } from "zod";

export const notificationSettingsSchema = z.object({
  expirationReminders: z.boolean().default(true),
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
