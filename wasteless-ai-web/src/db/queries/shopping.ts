import "server-only";

import { db } from "@/db";
import * as schema from "@/db/schema/tables";
import { formatQuantity } from "@/lib/dashboard-utils";
import { asc, desc, eq } from "drizzle-orm";
import { getPrimaryHouseholdForUser } from "./households";

export async function getShoppingPageData(userId: string) {
  const household = await getPrimaryHouseholdForUser(userId);

  if (!household) {
    return {
      household: null,
      list: null,
      items: [],
    };
  }

  const lists = await db
    .select({
      id: schema.shopping_lists.id,
      name: schema.shopping_lists.name,
      dueDate: schema.shopping_lists.due_date,
      updatedAt: schema.shopping_lists.updated_at,
    })
    .from(schema.shopping_lists)
    .where(eq(schema.shopping_lists.household_id, household.id))
    .orderBy(desc(schema.shopping_lists.updated_at))
    .limit(1);

  const list = lists[0] ?? null;

  if (!list) {
    return {
      household,
      list: null,
      items: [],
    };
  }

  const rows = await db
    .select({
      id: schema.shopping_list_items.id,
      name: schema.shopping_list_items.name,
      quantity: schema.shopping_list_items.quantity,
      unit: schema.shopping_list_items.unit,
      checked: schema.shopping_list_items.checked,
      source: schema.shopping_list_items.source,
      createdAt: schema.shopping_list_items.created_at,
    })
    .from(schema.shopping_list_items)
    .where(eq(schema.shopping_list_items.shopping_list_id, list.id))
    .orderBy(asc(schema.shopping_list_items.checked), asc(schema.shopping_list_items.created_at));

  return {
    household,
    list,
    items: rows.map((item) => ({
      id: item.id,
      name: item.name,
      quantity: formatQuantity(item.quantity, item.unit),
      checked: Boolean(item.checked),
      source: item.source ?? "manual",
    })),
  };
}
