import "server-only";

import { db } from "@/db";
import { getPrimaryHouseholdForUser, type UserHousehold } from "@/db/queries/households";
import * as schema from "@/db/schema/tables";
import { addDays, formatDate, formatRelativeExpiration, parseJsonValue, startOfDay } from "@/lib/dashboard-utils";
import {
  DEFAULT_NOTIFICATION_SETTINGS,
  getNotificationTypeLabel,
  type NotificationSeverity,
  type NotificationSettings,
  type NotificationType,
} from "@/features/notifications/constants";
import { notificationSettingsSchema } from "@/validation/notifications";
import { and, asc, count, desc, eq, gte, isNull, lt, ne, or } from "drizzle-orm";

export type NotificationPayload = {
  key?: string;
  title?: string;
  body?: string;
  href?: string;
  actionLabel?: string;
  severity?: NotificationSeverity;
  channels?: {
    inApp: boolean;
    email: boolean;
    webPush: boolean;
    expoPush: boolean;
  };
  items?: Array<{
    label: string;
    value?: string;
  }>;
};

export type NotificationListItem = {
  id: string;
  type: string;
  typeLabel: string;
  status: string;
  title: string;
  body: string;
  href: string;
  actionLabel: string;
  severity: NotificationSeverity;
  createdAt: Date;
  scheduledAt: Date | null;
  readAt: Date | null;
};

export type NotificationCenterData = {
  household: UserHousehold | null;
  unreadCount: number;
  items: NotificationListItem[];
};

export type NotificationCheckResult = {
  usersChecked: number;
  created: number;
  byType: Record<string, number>;
};

type HouseholdSettingsRecord = {
  notifications?: Record<string, unknown>;
  [key: string]: unknown;
};

type CreateNotificationInput = {
  userId: string;
  householdId: string;
  type: NotificationType;
  key: string;
  title: string;
  body: string;
  href: string;
  actionLabel: string;
  severity: NotificationSeverity;
  settings: NotificationSettings;
  dedupeSince: Date;
  items?: NotificationPayload["items"];
};

function toBoolean(value: unknown, fallback: boolean) {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    if (value === "true" || value === "on" || value === "1") return true;
    if (value === "false" || value === "off" || value === "0") return false;
  }
  return fallback;
}

function normalizeNotificationSettings(raw: unknown): NotificationSettings {
  const record = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const defaults = DEFAULT_NOTIFICATION_SETTINGS;
  const candidate = {
    expirationReminders: toBoolean(record.expirationReminders ?? record.expiration_reminders, defaults.expirationReminders),
    useTodayAlerts: toBoolean(record.useTodayAlerts ?? record.use_today_alerts, defaults.useTodayAlerts),
    mealPlanReminders: toBoolean(record.mealPlanReminders ?? record.meal_plan_reminders, defaults.mealPlanReminders),
    shoppingReminders: toBoolean(record.shoppingReminders ?? record.shopping_reminders, defaults.shoppingReminders),
    digestFrequency: record.digestFrequency ?? record.digest_frequency ?? defaults.digestFrequency,
    emailNotifications: toBoolean(record.emailNotifications ?? record.email_notifications, defaults.emailNotifications),
    webPushNotifications: toBoolean(record.webPushNotifications ?? record.web_push_notifications, defaults.webPushNotifications),
    expoPushNotifications: toBoolean(record.expoPushNotifications ?? record.expo_push_notifications, defaults.expoPushNotifications),
    expirationWindowDays: record.expirationWindowDays ?? record.expiration_window_days ?? defaults.expirationWindowDays,
    reminderTime: record.reminderTime ?? record.reminder_time ?? defaults.reminderTime,
  };

  const parsed = notificationSettingsSchema.safeParse(candidate);
  return parsed.success ? parsed.data : defaults;
}

function getChannels(settings: NotificationSettings) {
  return {
    inApp: true,
    email: settings.emailNotifications,
    webPush: settings.webPushNotifications,
    expoPush: settings.expoPushNotifications,
  };
}

function formatKeyDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function startOfWeek(date = new Date()) {
  const day = date.getDay();
  const offset = day === 0 ? -6 : 1 - day;
  return addDays(startOfDay(date), offset);
}

function getNotificationCondition(userId: string, household: UserHousehold | null) {
  if (!household) return eq(schema.notifications.user_id, userId);

  return or(
    eq(schema.notifications.user_id, userId),
    and(eq(schema.notifications.household_id, household.id), isNull(schema.notifications.user_id))
  );
}

function getHouseholdProductAccessCondition(userId: string, householdId: string) {
  return or(
    eq(schema.products.household_id, householdId),
    and(isNull(schema.products.household_id), eq(schema.products.user_id, userId))
  )!;
}

async function getHouseholdSettings(householdId: string): Promise<HouseholdSettingsRecord> {
  const rows = await db
    .select({ settings: schema.households.settings })
    .from(schema.households)
    .where(eq(schema.households.id, householdId))
    .limit(1);

  return parseJsonValue<HouseholdSettingsRecord>(rows[0]?.settings ?? {}, {});
}

async function getNotificationSettingsForHousehold(householdId: string): Promise<NotificationSettings> {
  const settings = await getHouseholdSettings(householdId);
  return normalizeNotificationSettings(settings.notifications ?? {});
}

async function createNotificationIfMissing(input: CreateNotificationInput) {
  const recentRows = await db
    .select({
      payload: schema.notifications.payload,
    })
    .from(schema.notifications)
    .where(
      and(
        eq(schema.notifications.user_id, input.userId),
        eq(schema.notifications.household_id, input.householdId),
        eq(schema.notifications.type, input.type),
        gte(schema.notifications.created_at, input.dedupeSince)
      )
    )
    .limit(50);

  const alreadyExists = recentRows.some((row) => {
    const payload = parseJsonValue<NotificationPayload>(row.payload, {});
    return payload.key === input.key;
  });

  if (alreadyExists) return false;

  await db.insert(schema.notifications).values({
    user_id: input.userId,
    household_id: input.householdId,
    type: input.type,
    status: "pending",
    scheduled_at: new Date(),
    payload: {
      key: input.key,
      title: input.title,
      body: input.body,
      href: input.href,
      actionLabel: input.actionLabel,
      severity: input.severity,
      channels: getChannels(input.settings),
      items: input.items ?? [],
    } satisfies NotificationPayload,
  });

  return true;
}

function incrementType(result: NotificationCheckResult, type: NotificationType) {
  result.created += 1;
  result.byType[type] = (result.byType[type] ?? 0) + 1;
}

export async function getNotificationSettingsForUser(userId: string) {
  const household = await getPrimaryHouseholdForUser(userId);
  if (!household) {
    return {
      household: null,
      settings: DEFAULT_NOTIFICATION_SETTINGS,
    };
  }

  return {
    household,
    settings: await getNotificationSettingsForHousehold(household.id),
  };
}

export async function updateNotificationSettingsForHousehold(
  householdId: string,
  nextSettings: NotificationSettings
) {
  const parsed = notificationSettingsSchema.safeParse(nextSettings);
  const settings = parsed.success ? parsed.data : DEFAULT_NOTIFICATION_SETTINGS;
  const householdSettings = await getHouseholdSettings(householdId);

  await db
    .update(schema.households)
    .set({
      settings: {
        ...householdSettings,
        notifications: settings,
      },
      updated_at: new Date(),
    })
    .where(eq(schema.households.id, householdId));

  return settings;
}

export async function getUnreadNotificationCountForUser(userId: string) {
  const household = await getPrimaryHouseholdForUser(userId);
  const condition = getNotificationCondition(userId, household);

  const rows = await db
    .select({ value: count() })
    .from(schema.notifications)
    .where(and(condition, ne(schema.notifications.status, "read")));

  return Number(rows[0]?.value ?? 0);
}

export async function getNotificationCenterData(userId: string): Promise<NotificationCenterData> {
  const household = await getPrimaryHouseholdForUser(userId);
  const condition = getNotificationCondition(userId, household);

  const [countRows, rows] = await Promise.all([
    db
      .select({ value: count() })
      .from(schema.notifications)
      .where(and(condition, ne(schema.notifications.status, "read"))),
    db
      .select({
        id: schema.notifications.id,
        type: schema.notifications.type,
        status: schema.notifications.status,
        payload: schema.notifications.payload,
        scheduledAt: schema.notifications.scheduled_at,
        readAt: schema.notifications.read_at,
        createdAt: schema.notifications.created_at,
      })
      .from(schema.notifications)
      .where(condition)
      .orderBy(asc(schema.notifications.status), desc(schema.notifications.created_at))
      .limit(50),
  ]);

  return {
    household,
    unreadCount: Number(countRows[0]?.value ?? 0),
    items: rows.map((row) => {
      const payload = parseJsonValue<NotificationPayload>(row.payload, {});
      return {
        id: row.id,
        type: row.type,
        typeLabel: getNotificationTypeLabel(row.type),
        status: row.status ?? "pending",
        title: payload.title ?? getNotificationTypeLabel(row.type),
        body: payload.body ?? "Open WasteLessAI for details.",
        href: payload.href ?? "/dashboard",
        actionLabel: payload.actionLabel ?? "Open",
        severity: payload.severity ?? "info",
        scheduledAt: row.scheduledAt ?? null,
        readAt: row.readAt ?? null,
        createdAt: row.createdAt,
      };
    }),
  };
}

export async function markNotificationReadForUser(userId: string, notificationId: string) {
  const household = await getPrimaryHouseholdForUser(userId);
  const ownershipCondition = getNotificationCondition(userId, household);

  const rows = await db
    .update(schema.notifications)
    .set({
      status: "read",
      read_at: new Date(),
      updated_at: new Date(),
    })
    .where(and(eq(schema.notifications.id, notificationId), ownershipCondition))
    .returning({ id: schema.notifications.id });

  return rows[0] ?? null;
}

export async function markAllNotificationsReadForUser(userId: string) {
  const household = await getPrimaryHouseholdForUser(userId);
  const ownershipCondition = getNotificationCondition(userId, household);

  const rows = await db
    .update(schema.notifications)
    .set({
      status: "read",
      read_at: new Date(),
      updated_at: new Date(),
    })
    .where(and(ownershipCondition, ne(schema.notifications.status, "read")))
    .returning({ id: schema.notifications.id });

  return rows.length;
}

export async function runNotificationChecksForUser(userId: string): Promise<NotificationCheckResult> {
  const household = await getPrimaryHouseholdForUser(userId);
  const result: NotificationCheckResult = {
    usersChecked: 1,
    created: 0,
    byType: {},
  };

  if (!household) return result;

  const settings = await getNotificationSettingsForHousehold(household.id);
  const today = startOfDay();
  const tomorrow = addDays(today, 1);

  if (settings.useTodayAlerts) {
    const useTodayItems = await db
      .select({
        id: schema.products.id,
        name: schema.products.name,
        expirationDate: schema.products.expiration_date,
      })
      .from(schema.products)
      .where(
        and(
          getHouseholdProductAccessCondition(userId, household.id),
          gte(schema.products.expiration_date, today),
          lt(schema.products.expiration_date, tomorrow)
        )
      )
      .orderBy(asc(schema.products.expiration_date), asc(schema.products.name))
      .limit(5);

    for (const item of useTodayItems) {
      const created = await createNotificationIfMissing({
        userId,
        householdId: household.id,
        type: "use_today_alert",
        key: `use_today_alert:${item.id}:${formatKeyDate(today)}`,
        title: `Use ${item.name} today`,
        body: `${item.name} expires today. Add it to a meal before it becomes waste.`,
        href: `/dashboard/inventory/${item.id}`,
        actionLabel: "View item",
        severity: "critical",
        settings,
        dedupeSince: today,
      });
      if (created) incrementType(result, "use_today_alert");
    }
  }

  if (settings.expirationReminders) {
    const expirationEnd = addDays(today, settings.expirationWindowDays);
    const expiringItems = await db
      .select({
        id: schema.products.id,
        name: schema.products.name,
        expirationDate: schema.products.expiration_date,
      })
      .from(schema.products)
      .where(
        and(
          getHouseholdProductAccessCondition(userId, household.id),
          gte(schema.products.expiration_date, tomorrow),
          lt(schema.products.expiration_date, addDays(expirationEnd, 1))
        )
      )
      .orderBy(asc(schema.products.expiration_date), asc(schema.products.name))
      .limit(5);

    for (const item of expiringItems) {
      const created = await createNotificationIfMissing({
        userId,
        householdId: household.id,
        type: "expiration_reminder",
        key: `expiration_reminder:${item.id}:${formatKeyDate(item.expirationDate ?? today)}`,
        title: `${item.name} expires soon`,
        body: `${item.name} ${formatRelativeExpiration(item.expirationDate).toLowerCase()}.`,
        href: `/dashboard/inventory/${item.id}`,
        actionLabel: "View item",
        severity: "warning",
        settings,
        dedupeSince: today,
      });
      if (created) incrementType(result, "expiration_reminder");
    }
  }

  if (settings.mealPlanReminders) {
    const plannedMeals = await db
      .select({
        id: schema.meal_plan_items.id,
        title: schema.meal_plan_items.title,
        mealDate: schema.meal_plan_items.meal_date,
      })
      .from(schema.meal_plan_items)
      .innerJoin(schema.meal_plans, eq(schema.meal_plan_items.meal_plan_id, schema.meal_plans.id))
      .where(
        and(
          eq(schema.meal_plans.household_id, household.id),
          eq(schema.meal_plans.status, "active"),
          eq(schema.meal_plan_items.status, "planned"),
          gte(schema.meal_plan_items.meal_date, today),
          lt(schema.meal_plan_items.meal_date, tomorrow)
        )
      )
      .orderBy(asc(schema.meal_plan_items.meal_date))
      .limit(3);

    for (const meal of plannedMeals) {
      const created = await createNotificationIfMissing({
        userId,
        householdId: household.id,
        type: "meal_plan_reminder",
        key: `meal_plan_reminder:${meal.id}:${formatKeyDate(today)}`,
        title: `Meal plan for today`,
        body: `${meal.title} is planned for ${formatDate(meal.mealDate)}.`,
        href: "/dashboard/meal-plan",
        actionLabel: "Open plan",
        severity: "info",
        settings,
        dedupeSince: today,
      });
      if (created) incrementType(result, "meal_plan_reminder");
    }
  }

  let openShoppingCount = 0;
  if (settings.shoppingReminders) {
    const shoppingLists = await db
      .select({
        id: schema.shopping_lists.id,
        name: schema.shopping_lists.name,
      })
      .from(schema.shopping_lists)
      .where(eq(schema.shopping_lists.household_id, household.id))
      .orderBy(desc(schema.shopping_lists.updated_at))
      .limit(1);

    const shoppingList = shoppingLists[0] ?? null;
    if (shoppingList) {
      const uncheckedRows = await db
        .select({ value: count() })
        .from(schema.shopping_list_items)
        .where(
          and(
            eq(schema.shopping_list_items.shopping_list_id, shoppingList.id),
            eq(schema.shopping_list_items.checked, false)
          )
        );
      openShoppingCount = Number(uncheckedRows[0]?.value ?? 0);

      if (openShoppingCount > 0) {
        const created = await createNotificationIfMissing({
          userId,
          householdId: household.id,
          type: "shopping_reminder",
          key: `shopping_reminder:${shoppingList.id}:${formatKeyDate(today)}`,
          title: `${openShoppingCount} shopping item${openShoppingCount === 1 ? "" : "s"} open`,
          body: `${shoppingList.name} still has unchecked items.`,
          href: "/dashboard/shopping",
          actionLabel: "Open list",
          severity: "info",
          settings,
          dedupeSince: today,
        });
        if (created) incrementType(result, "shopping_reminder");
      }
    }
  }

  if (settings.digestFrequency === "daily" || (settings.digestFrequency === "weekly" && today.getDay() === 1)) {
    const digestType: NotificationType = settings.digestFrequency === "daily" ? "daily_digest" : "weekly_digest";
    const digestStart = digestType === "daily_digest" ? today : startOfWeek(today);
    const [expiringCountRows, useTodayCountRows, wasteCountRows] = await Promise.all([
      db
        .select({ value: count() })
        .from(schema.products)
        .where(
          and(
            getHouseholdProductAccessCondition(userId, household.id),
            gte(schema.products.expiration_date, today),
            lt(schema.products.expiration_date, addDays(today, settings.expirationWindowDays + 1))
          )
        ),
      db
        .select({ value: count() })
        .from(schema.products)
        .where(
          and(
            getHouseholdProductAccessCondition(userId, household.id),
            gte(schema.products.expiration_date, today),
            lt(schema.products.expiration_date, tomorrow)
          )
        ),
      db
        .select({ value: count() })
        .from(schema.waste_logs)
        .where(and(eq(schema.waste_logs.household_id, household.id), gte(schema.waste_logs.created_at, digestStart))),
    ]);

    const expiringCount = Number(expiringCountRows[0]?.value ?? 0);
    const useTodayCount = Number(useTodayCountRows[0]?.value ?? 0);
    const wasteCount = Number(wasteCountRows[0]?.value ?? 0);

    const created = await createNotificationIfMissing({
      userId,
      householdId: household.id,
      type: digestType,
      key: `${digestType}:${formatKeyDate(digestStart)}`,
      title: digestType === "daily_digest" ? "Daily low-waste digest" : "Weekly low-waste digest",
      body: `${expiringCount} expiring soon, ${useTodayCount} use today, ${openShoppingCount} shopping open, ${wasteCount} waste logged.`,
      href: "/dashboard",
      actionLabel: "Open dashboard",
      severity: wasteCount > 0 || useTodayCount > 0 ? "warning" : "success",
      settings,
      dedupeSince: digestStart,
      items: [
        { label: "Expiring soon", value: String(expiringCount) },
        { label: "Use today", value: String(useTodayCount) },
        { label: "Shopping open", value: String(openShoppingCount) },
        { label: "Waste logged", value: String(wasteCount) },
      ],
    });
    if (created) incrementType(result, digestType);
  }

  return result;
}

export async function runNotificationChecksForAllUsers(): Promise<NotificationCheckResult> {
  const memberRows = await db
    .select({
      userId: schema.household_members.user_id,
    })
    .from(schema.household_members);

  const userIds = Array.from(new Set(memberRows.map((row) => row.userId).filter(Boolean)));
  const aggregate: NotificationCheckResult = {
    usersChecked: 0,
    created: 0,
    byType: {},
  };

  for (const userId of userIds) {
    const result = await runNotificationChecksForUser(userId);
    aggregate.usersChecked += result.usersChecked;
    aggregate.created += result.created;
    Object.entries(result.byType).forEach(([type, value]) => {
      aggregate.byType[type] = (aggregate.byType[type] ?? 0) + value;
    });
  }

  return aggregate;
}
