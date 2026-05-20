import "server-only";

import { db } from "@/db";
import * as schema from "@/db/schema/tables";
import { and, eq } from "drizzle-orm";

export type ShoppingListInsertItem = {
  name: string;
  quantity?: string | null;
  unit?: string | null;
};

function normalizeName(value: string) {
  return value.trim().toLowerCase();
}

async function getOwnedShoppingList(listId: string, householdId: string) {
  const lists = await db
    .select({ id: schema.shopping_lists.id })
    .from(schema.shopping_lists)
    .where(and(eq(schema.shopping_lists.id, listId), eq(schema.shopping_lists.household_id, householdId)))
    .limit(1);

  return lists[0] ?? null;
}

export async function getOrCreateHouseholdShoppingList(
  householdId: string,
  userId: string,
  options: { listId?: string | null; name?: string } = {}
) {
  if (options.listId) {
    const ownedList = await getOwnedShoppingList(options.listId, householdId);
    if (ownedList) return ownedList;
  }

  const existing = await db
    .select({ id: schema.shopping_lists.id })
    .from(schema.shopping_lists)
    .where(eq(schema.shopping_lists.household_id, householdId))
    .limit(1);

  if (existing[0]) return existing[0];

  const inserted = await db
    .insert(schema.shopping_lists)
    .values({
      household_id: householdId,
      name: options.name ?? "Smart meal plan",
      created_by: userId,
    })
    .returning({ id: schema.shopping_lists.id });

  return inserted[0];
}

export async function addUniqueItemsToShoppingList(
  householdId: string,
  userId: string,
  items: ShoppingListInsertItem[],
  options: { listId?: string | null; listName?: string } = {}
) {
  const list = await getOrCreateHouseholdShoppingList(householdId, userId, {
    listId: options.listId,
    name: options.listName,
  });

  const existingRows = await db
    .select({ name: schema.shopping_list_items.name })
    .from(schema.shopping_list_items)
    .where(eq(schema.shopping_list_items.shopping_list_id, list.id));

  const existingNames = new Set(existingRows.map((item) => normalizeName(item.name)));
  const uniqueItems = items.filter((item) => {
    const key = normalizeName(item.name);
    if (!key || existingNames.has(key)) return false;
    existingNames.add(key);
    return true;
  });

  if (uniqueItems.length > 0) {
    await db.insert(schema.shopping_list_items).values(
      uniqueItems.map((item) => ({
        shopping_list_id: list.id,
        name: item.name,
        quantity: item.quantity || "1",
        unit: item.unit || null,
        checked: false,
      }))
    );
  }

  return {
    listId: list.id,
    insertedCount: uniqueItems.length,
    skippedCount: items.length - uniqueItems.length,
  };
}
