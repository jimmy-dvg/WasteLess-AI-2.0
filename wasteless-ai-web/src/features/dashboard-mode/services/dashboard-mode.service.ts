import "server-only";

import { db } from "@/db";
import * as schema from "@/db/schema/tables";
import { parseJsonValue } from "@/lib/dashboard-utils";
import { eq } from "drizzle-orm";
import {
  normalizeDashboardMode,
  type DashboardMode,
} from "../constants";

type UserMeta = Record<string, unknown>;

export async function getDashboardModeForUser(userId: string): Promise<DashboardMode> {
  const rows = await db
    .select({ meta: schema.users.meta })
    .from(schema.users)
    .where(eq(schema.users.id, userId))
    .limit(1);

  const meta = parseJsonValue<UserMeta>(rows[0]?.meta ?? {}, {});
  return normalizeDashboardMode(meta.dashboardMode);
}

export async function updateDashboardModeForUser(userId: string, mode: DashboardMode) {
  const rows = await db
    .select({ meta: schema.users.meta })
    .from(schema.users)
    .where(eq(schema.users.id, userId))
    .limit(1);

  const meta = parseJsonValue<UserMeta>(rows[0]?.meta ?? {}, {});

  await db
    .update(schema.users)
    .set({
      meta: {
        ...meta,
        dashboardMode: mode,
      },
      updated_at: new Date(),
    })
    .where(eq(schema.users.id, userId));

  return mode;
}
