import "server-only";

import { db } from "@/db";
import { ensurePersonalHouseholdForUser } from "@/db/queries/households";
import * as schema from "@/db/schema/tables";
import type { AuthenticatedUser } from "@/lib/auth";
import type {
  notificationPushTokenDeleteSchema,
  notificationPushTokenSchema,
} from "@/validation/notifications";
import { and, eq, or, type SQL } from "drizzle-orm";
import type { z } from "zod";

export type NotificationPushTokenInput = z.infer<typeof notificationPushTokenSchema>;
export type NotificationPushTokenDeleteInput = z.infer<typeof notificationPushTokenDeleteSchema>;

function toNullableText(value: string | null | undefined) {
  const text = value?.trim();
  return text ? text : null;
}

export async function registerExpoPushTokenForUser(
  user: AuthenticatedUser,
  input: NotificationPushTokenInput
) {
  const household = await ensurePersonalHouseholdForUser(user);
  const now = new Date();

  const rows = await db
    .insert(schema.notification_push_tokens)
    .values({
      user_id: user.id,
      household_id: household.id,
      expo_push_token: input.expoPushToken,
      device_id: toNullableText(input.deviceId),
      platform: input.platform,
      device_name: toNullableText(input.deviceName),
      status: "active",
      last_registered_at: now,
      updated_at: now,
    })
    .onConflictDoUpdate({
      target: schema.notification_push_tokens.expo_push_token,
      set: {
        user_id: user.id,
        household_id: household.id,
        device_id: toNullableText(input.deviceId),
        platform: input.platform,
        device_name: toNullableText(input.deviceName),
        status: "active",
        last_registered_at: now,
        updated_at: now,
      },
    })
    .returning({
      id: schema.notification_push_tokens.id,
      platform: schema.notification_push_tokens.platform,
      status: schema.notification_push_tokens.status,
      lastRegisteredAt: schema.notification_push_tokens.last_registered_at,
    });

  return rows[0] ?? null;
}

export async function deactivateExpoPushTokenForUser(
  userId: string,
  input: NotificationPushTokenDeleteInput
) {
  const conditions: SQL[] = [eq(schema.notification_push_tokens.user_id, userId)];
  const tokenCondition = input.expoPushToken
    ? eq(schema.notification_push_tokens.expo_push_token, input.expoPushToken)
    : null;
  const deviceCondition = input.deviceId
    ? eq(schema.notification_push_tokens.device_id, input.deviceId)
    : null;

  if (tokenCondition && deviceCondition) {
    conditions.push(or(tokenCondition, deviceCondition)!);
  } else if (tokenCondition) {
    conditions.push(tokenCondition);
  } else if (deviceCondition) {
    conditions.push(deviceCondition);
  }

  const rows = await db
    .update(schema.notification_push_tokens)
    .set({
      status: "inactive",
      updated_at: new Date(),
    })
    .where(and(...conditions))
    .returning({ id: schema.notification_push_tokens.id });

  return rows.length;
}
