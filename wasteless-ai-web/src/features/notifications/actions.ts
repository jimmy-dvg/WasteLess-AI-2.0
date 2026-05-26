"use server";

import { ensurePersonalHouseholdForUser } from "@/db/queries/households";
import {
  markAllNotificationsReadForUser,
  markNotificationReadForUser,
  runNotificationChecksForUser,
  updateNotificationSettingsForHousehold,
} from "@/features/notifications/services/notification.service";
import { requireUser } from "@/lib/auth";
import { notificationIdSchema, notificationSettingsSchema } from "@/validation/notifications";
import { revalidatePath } from "next/cache";

export type NotificationActionState = {
  success: boolean;
  message?: string | null;
  error?: string | null;
};

const revalidateNotificationPaths = () => {
  revalidatePath("/dashboard", "layout");
};

function checkbox(formData: FormData, key: string) {
  return formData.get(key) === "on";
}

export async function updateNotificationSettingsAction(
  _prevState: NotificationActionState,
  formData: FormData
): Promise<NotificationActionState> {
  const parsed = notificationSettingsSchema.safeParse({
    expirationReminders: checkbox(formData, "expirationReminders"),
    expiredItemReminders: checkbox(formData, "expiredItemReminders"),
    lowStockReminders: checkbox(formData, "lowStockReminders"),
    useTodayAlerts: checkbox(formData, "useTodayAlerts"),
    mealPlanReminders: checkbox(formData, "mealPlanReminders"),
    shoppingReminders: checkbox(formData, "shoppingReminders"),
    digestFrequency: formData.get("digestFrequency") || "weekly",
    emailNotifications: checkbox(formData, "emailNotifications"),
    webPushNotifications: checkbox(formData, "webPushNotifications"),
    expoPushNotifications: checkbox(formData, "expoPushNotifications"),
    expirationWindowDays: formData.get("expirationWindowDays") || 7,
    reminderTime: formData.get("reminderTime") || "08:00",
  });

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid notification settings",
    };
  }

  try {
    const user = await requireUser();
    const household = await ensurePersonalHouseholdForUser(user);
    await updateNotificationSettingsForHousehold(household.id, parsed.data);
    revalidateNotificationPaths();

    return {
      success: true,
      message: "Notification settings updated.",
    };
  } catch {
    return {
      success: false,
      error: "Unable to update notification settings right now",
    };
  }
}

export async function markNotificationReadAction(formData: FormData) {
  const parsed = notificationIdSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return;

  const user = await requireUser();
  await markNotificationReadForUser(user.id, parsed.data.notificationId);
  revalidateNotificationPaths();
}

export async function markAllNotificationsReadAction() {
  const user = await requireUser();
  await markAllNotificationsReadForUser(user.id);
  revalidateNotificationPaths();
}

export async function runNotificationChecksAction(): Promise<NotificationActionState> {
  try {
    const user = await requireUser();
    const result = await runNotificationChecksForUser(user.id);
    revalidateNotificationPaths();

    return {
      success: true,
      message:
        result.created > 0
          ? `${result.created} notification${result.created === 1 ? "" : "s"} generated.`
          : "No new notifications needed right now.",
    };
  } catch {
    return {
      success: false,
      error: "Unable to run notification checks right now",
    };
  }
}
