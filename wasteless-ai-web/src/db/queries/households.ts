import "server-only";

import { db } from "@/db";
import * as schema from "@/db/schema/tables";
import { eq } from "drizzle-orm";

export type DashboardUser = {
  id: string;
  name: string;
  email: string;
};

export type UserHousehold = {
  id: string;
  name: string;
  slug: string;
  role: string;
  timezone: string | null;
};

export async function getPrimaryHouseholdForUser(userId: string): Promise<UserHousehold | null> {
  const rows = await db
    .select({
      id: schema.households.id,
      name: schema.households.name,
      slug: schema.households.slug,
      timezone: schema.households.timezone,
      role: schema.household_members.role,
    })
    .from(schema.household_members)
    .innerJoin(schema.households, eq(schema.household_members.household_id, schema.households.id))
    .where(eq(schema.household_members.user_id, userId))
    .limit(1);

  return rows[0] ?? null;
}

export async function ensurePersonalHouseholdForUser(user: DashboardUser) {
  const household = await getPrimaryHouseholdForUser(user.id);
  if (household) return household;

  const firstName = user.name.split(" ")[0] || "My";
  const name = `${firstName}'s Kitchen`;
  const slugBase = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  const insertedHouseholds = await db
    .insert(schema.households)
    .values({
      name,
      slug: `${slugBase || "kitchen"}-${user.id.slice(0, 8)}`,
      timezone: "America/New_York",
      settings: {
        currency: "USD",
        language: "en",
        notifications: {
          expiration_reminders: true,
          shopping_reminders: true,
        },
      },
    })
    .returning({
      id: schema.households.id,
      name: schema.households.name,
      slug: schema.households.slug,
      timezone: schema.households.timezone,
    });

  const createdHousehold = insertedHouseholds[0];

  await db.insert(schema.household_members).values({
    household_id: createdHousehold.id,
    user_id: user.id,
    role: "owner",
  });

  return {
    ...createdHousehold,
    role: "owner",
  };
}
