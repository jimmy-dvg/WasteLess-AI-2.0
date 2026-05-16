"use server";

import { db } from "@/db";
import { ensurePersonalHouseholdForUser } from "@/db/queries/households";
import * as schema from "@/db/schema/tables";
import { requireUser } from "@/lib/auth";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

export type ShoppingActionState = {
  success: boolean;
  message?: string | null;
  error?: string | null;
};

const shoppingItemSchema = z.object({
  name: z.string().trim().min(2, "Item name must be at least 2 characters").max(120),
  quantity: z.string().trim().optional(),
  unit: z.string().trim().max(32).optional(),
  listId: z.string().trim().optional(),
});

async function getOwnedShoppingList(listId: string, householdId: string) {
  const lists = await db
    .select({ id: schema.shopping_lists.id })
    .from(schema.shopping_lists)
    .where(and(eq(schema.shopping_lists.id, listId), eq(schema.shopping_lists.household_id, householdId)))
    .limit(1);

  return lists[0] ?? null;
}

async function getOrCreateShoppingList(householdId: string, userId: string, listId?: string) {
  if (listId) {
    const ownedList = await getOwnedShoppingList(listId, householdId);
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
      name: "Weekly groceries",
      created_by: userId,
    })
    .returning({ id: schema.shopping_lists.id });

  return inserted[0];
}

async function getItemForHousehold(itemId: string, householdId: string) {
  const rows = await db
    .select({
      id: schema.shopping_list_items.id,
    })
    .from(schema.shopping_list_items)
    .innerJoin(
      schema.shopping_lists,
      eq(schema.shopping_list_items.shopping_list_id, schema.shopping_lists.id)
    )
    .where(
      and(
        eq(schema.shopping_list_items.id, itemId),
        eq(schema.shopping_lists.household_id, householdId)
      )
    )
    .limit(1);

  return rows[0] ?? null;
}

export async function addShoppingItem(
  _prevState: ShoppingActionState,
  formData: FormData
): Promise<ShoppingActionState> {
  const user = await requireUser();
  const parsed = shoppingItemSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Unable to add shopping item",
    };
  }

  try {
    const household = await ensurePersonalHouseholdForUser(user);
    const list = await getOrCreateShoppingList(household.id, user.id, parsed.data.listId);

    await db.insert(schema.shopping_list_items).values({
      shopping_list_id: list.id,
      name: parsed.data.name,
      quantity: parsed.data.quantity || "1",
      unit: parsed.data.unit || null,
      checked: false,
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/shopping");

    return {
      success: true,
      message: `${parsed.data.name} was added to your shopping list.`,
    };
  } catch {
    return {
      success: false,
      error: "Unable to add shopping item right now",
    };
  }
}

export async function updateShoppingItemStatus(formData: FormData) {
  const user = await requireUser();
  const household = await ensurePersonalHouseholdForUser(user);
  const itemId = String(formData.get("itemId") ?? "");
  const checked = formData.get("checked") === "on";

  if (!itemId) return;

  const item = await getItemForHousehold(itemId, household.id);
  if (!item) return;

  await db
    .update(schema.shopping_list_items)
    .set({
      checked,
      updated_at: new Date(),
    })
    .where(eq(schema.shopping_list_items.id, itemId));

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/shopping");
}

export async function removeShoppingItem(formData: FormData) {
  const user = await requireUser();
  const household = await ensurePersonalHouseholdForUser(user);
  const itemId = String(formData.get("itemId") ?? "");

  if (!itemId) return;

  const item = await getItemForHousehold(itemId, household.id);
  if (!item) return;

  await db.delete(schema.shopping_list_items).where(eq(schema.shopping_list_items.id, itemId));

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/shopping");
}
