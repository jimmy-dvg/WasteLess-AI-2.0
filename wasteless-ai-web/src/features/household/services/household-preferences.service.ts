import "server-only";

import { db } from "@/db";
import * as schema from "@/db/schema/tables";
import { ensurePersonalHouseholdForUser, getPrimaryHouseholdForUser, type DashboardUser } from "@/db/queries/households";
import { parseJsonValue } from "@/lib/dashboard-utils";
import { canManageHousehold } from "@/features/household/constants";
import { normalizeStorageZone } from "@/features/categories/constants";
import { householdPreferencesSchema } from "@/validation/household";
import { eq } from "drizzle-orm";
import type { z } from "zod";

export type HouseholdPreferences = z.infer<typeof householdPreferencesSchema>;

export const DEFAULT_HOUSEHOLD_PREFERENCES: HouseholdPreferences = {
  defaultStorageLocation: "Pantry",
  shoppingCadence: "weekly",
};

function normalizePreferences(value: unknown): HouseholdPreferences {
  const parsed = householdPreferencesSchema.safeParse(value);
  if (!parsed.success) return DEFAULT_HOUSEHOLD_PREFERENCES;

  return {
    ...parsed.data,
    defaultStorageLocation: normalizeStorageZone(parsed.data.defaultStorageLocation) as HouseholdPreferences["defaultStorageLocation"],
  };
}

async function getHouseholdSettings(householdId: string) {
  const rows = await db
    .select({ settings: schema.households.settings })
    .from(schema.households)
    .where(eq(schema.households.id, householdId))
    .limit(1);

  return parseJsonValue<Record<string, unknown>>(rows[0]?.settings ?? {}, {});
}

export async function getHouseholdPreferencesForUser(userId: string): Promise<HouseholdPreferences> {
  const household = await getPrimaryHouseholdForUser(userId);
  if (!household) return DEFAULT_HOUSEHOLD_PREFERENCES;

  const settings = await getHouseholdSettings(household.id);
  return normalizePreferences(settings.preferences);
}

export async function updateHouseholdPreferencesForUser(
  user: DashboardUser,
  preferences: HouseholdPreferences
): Promise<HouseholdPreferences> {
  const household = await ensurePersonalHouseholdForUser(user);
  if (!canManageHousehold(household.role)) {
    throw new Error("Only household owners and admins can update household defaults.");
  }

  const settings = await getHouseholdSettings(household.id);
  const nextPreferences = normalizePreferences(preferences);

  await db
    .update(schema.households)
    .set({
      settings: {
        ...settings,
        preferences: nextPreferences,
      },
      updated_at: new Date(),
    })
    .where(eq(schema.households.id, household.id));

  return nextPreferences;
}
