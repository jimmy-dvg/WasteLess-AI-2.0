import "server-only";

import { db } from "@/db";
import { getRecipeDetail } from "@/db/queries/recipes";
import * as schema from "@/db/schema/tables";
import { and, asc, desc, eq, isNull, lte, or } from "drizzle-orm";

export const SHOPPING_ITEM_SOURCES = ["manual", "recipe", "low-stock"] as const;

export type ShoppingItemSource = (typeof SHOPPING_ITEM_SOURCES)[number];

export type ShoppingListItem = {
  id: string;
  userId: string;
  name: string;
  quantity: number | null;
  unit: string | null;
  category: string | null;
  note: string | null;
  checked: boolean;
  source: ShoppingItemSource;
  recipeId: string | null;
  inventoryItemId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ShoppingListInsertItem = {
  name: string;
  quantity?: number | string | null;
  unit?: string | null;
  category?: string | null;
  note?: string | null;
  source?: ShoppingItemSource;
  recipeId?: string | null;
  inventoryItemId?: string | null;
};

export type ShoppingListUpdateItem = Partial<ShoppingListInsertItem> & {
  checked?: boolean;
};

export type ShoppingIngredientInput = {
  name: string;
  quantity?: number | string | null;
  unit?: string | null;
  notes?: string | null;
  note?: string | null;
};

export type ShoppingRecipeSourceInput = {
  recipeId?: string | null;
  title?: string | null;
  missingIngredients: ShoppingIngredientInput[];
};

export type ShoppingListGenerationInput = {
  recipeIds?: string[];
  recipes?: ShoppingRecipeSourceInput[];
  missingIngredients?: ShoppingIngredientInput[];
  includeRecipeMissing?: boolean;
  includeLowStock?: boolean;
};

type ShoppingListSummary = {
  id: string;
  name: string;
};

type ShoppingItemRow = {
  id: string;
  createdBy: string | null;
  name: string;
  quantity: unknown;
  unit: string | null;
  category: string | null;
  note: string | null;
  checked: boolean | null;
  source: string;
  recipeId: string | null;
  inventoryItemId: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
};

function normalizeName(value: string) {
  return value.trim().toLowerCase();
}

function isShoppingItemSource(value: unknown): value is ShoppingItemSource {
  return SHOPPING_ITEM_SOURCES.includes(value as ShoppingItemSource);
}

function normalizeSource(value: unknown): ShoppingItemSource {
  return isShoppingItemSource(value) ? value : "manual";
}

function cleanOptionalText(value: string | null | undefined) {
  const text = value?.trim();
  return text ? text : null;
}

function parseQuantity(value: unknown): number | null {
  if (value == null || value === "") return null;
  if (typeof value === "number") return Number.isFinite(value) && value > 0 ? value : null;

  const numeric = Number(String(value).trim());
  return Number.isFinite(numeric) && numeric > 0 ? numeric : null;
}

function toQuantityDbValue(value: unknown) {
  const quantity = parseQuantity(value);
  return quantity == null ? null : String(quantity);
}

function toIsoString(value: Date | string) {
  return value instanceof Date ? value.toISOString() : value;
}

function mapShoppingItem(row: ShoppingItemRow, fallbackUserId: string): ShoppingListItem {
  return {
    id: row.id,
    userId: row.createdBy ?? fallbackUserId,
    name: row.name,
    quantity: parseQuantity(row.quantity),
    unit: row.unit ?? null,
    category: row.category ?? null,
    note: row.note ?? null,
    checked: Boolean(row.checked),
    source: normalizeSource(row.source),
    recipeId: row.recipeId ?? null,
    inventoryItemId: row.inventoryItemId ?? null,
    createdAt: toIsoString(row.createdAt),
    updatedAt: toIsoString(row.updatedAt),
  };
}

function getShoppingItemSelection() {
  return {
    id: schema.shopping_list_items.id,
    createdBy: schema.shopping_list_items.created_by,
    name: schema.shopping_list_items.name,
    quantity: schema.shopping_list_items.quantity,
    unit: schema.shopping_list_items.unit,
    category: schema.shopping_list_items.category,
    note: schema.shopping_list_items.note,
    checked: schema.shopping_list_items.checked,
    source: schema.shopping_list_items.source,
    recipeId: schema.shopping_list_items.recipe_id,
    inventoryItemId: schema.shopping_list_items.inventory_item_id,
    createdAt: schema.shopping_list_items.created_at,
    updatedAt: schema.shopping_list_items.updated_at,
  };
}

async function getOwnedShoppingList(listId: string, householdId: string) {
  const lists = await db
    .select({ id: schema.shopping_lists.id, name: schema.shopping_lists.name })
    .from(schema.shopping_lists)
    .where(and(eq(schema.shopping_lists.id, listId), eq(schema.shopping_lists.household_id, householdId)))
    .limit(1);

  return lists[0] ?? null;
}

async function getLatestHouseholdShoppingList(householdId: string) {
  const lists = await db
    .select({ id: schema.shopping_lists.id, name: schema.shopping_lists.name })
    .from(schema.shopping_lists)
    .where(eq(schema.shopping_lists.household_id, householdId))
    .orderBy(desc(schema.shopping_lists.updated_at))
    .limit(1);

  return lists[0] ?? null;
}

async function touchShoppingList(listId: string) {
  await db
    .update(schema.shopping_lists)
    .set({ updated_at: new Date() })
    .where(eq(schema.shopping_lists.id, listId));
}

export async function getOrCreateHouseholdShoppingList(
  householdId: string,
  userId: string,
  options: { listId?: string | null; name?: string } = {}
): Promise<ShoppingListSummary> {
  if (options.listId) {
    const ownedList = await getOwnedShoppingList(options.listId, householdId);
    if (ownedList) return ownedList;
  }

  const existing = await getLatestHouseholdShoppingList(householdId);
  if (existing) return existing;

  const inserted = await db
    .insert(schema.shopping_lists)
    .values({
      household_id: householdId,
      name: options.name ?? "Weekly groceries",
      created_by: userId,
    })
    .returning({ id: schema.shopping_lists.id, name: schema.shopping_lists.name });

  return inserted[0];
}

async function getShoppingItemsForList(listId: string, userId: string) {
  const rows = await db
    .select(getShoppingItemSelection())
    .from(schema.shopping_list_items)
    .where(eq(schema.shopping_list_items.shopping_list_id, listId))
    .orderBy(asc(schema.shopping_list_items.checked), asc(schema.shopping_list_items.created_at));

  return rows.map((row) => mapShoppingItem(row, userId));
}

export async function getShoppingListData(householdId: string, userId: string) {
  const list = await getOrCreateHouseholdShoppingList(householdId, userId);
  const items = await getShoppingItemsForList(list.id, userId);

  return { list, items };
}

async function getItemForHousehold(itemId: string, householdId: string) {
  const rows = await db
    .select({
      listId: schema.shopping_lists.id,
      ...getShoppingItemSelection(),
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

function toInsertValues(listId: string, userId: string, item: ShoppingListInsertItem) {
  return {
    shopping_list_id: listId,
    product_id: item.inventoryItemId ?? null,
    created_by: userId,
    name: item.name.trim(),
    quantity: toQuantityDbValue(item.quantity),
    unit: cleanOptionalText(item.unit),
    category: cleanOptionalText(item.category),
    note: cleanOptionalText(item.note),
    checked: false,
    source: item.source ?? "manual",
    recipe_id: item.recipeId ?? null,
    inventory_item_id: item.inventoryItemId ?? null,
  };
}

export async function createShoppingItem(
  householdId: string,
  userId: string,
  item: ShoppingListInsertItem & { checked?: boolean }
) {
  const list = await getOrCreateHouseholdShoppingList(householdId, userId);
  const inserted = await db
    .insert(schema.shopping_list_items)
    .values({
      ...toInsertValues(list.id, userId, item),
      checked: item.checked ?? false,
    })
    .returning(getShoppingItemSelection());

  await touchShoppingList(list.id);

  return mapShoppingItem(inserted[0], userId);
}

export async function updateShoppingItem(
  householdId: string,
  userId: string,
  itemId: string,
  data: ShoppingListUpdateItem
) {
  const existing = await getItemForHousehold(itemId, householdId);
  if (!existing) return null;

  const changes: Partial<typeof schema.shopping_list_items.$inferInsert> = {
    updated_at: new Date(),
  };

  if (data.name !== undefined) changes.name = data.name.trim();
  if (data.quantity !== undefined) changes.quantity = toQuantityDbValue(data.quantity);
  if (data.unit !== undefined) changes.unit = cleanOptionalText(data.unit);
  if (data.category !== undefined) changes.category = cleanOptionalText(data.category);
  if (data.note !== undefined) changes.note = cleanOptionalText(data.note);
  if (data.checked !== undefined) changes.checked = data.checked;
  if (data.source !== undefined) changes.source = data.source;
  if (data.recipeId !== undefined) changes.recipe_id = data.recipeId;
  if (data.inventoryItemId !== undefined) {
    changes.inventory_item_id = data.inventoryItemId;
    changes.product_id = data.inventoryItemId;
  }

  const updated = await db
    .update(schema.shopping_list_items)
    .set(changes)
    .where(eq(schema.shopping_list_items.id, itemId))
    .returning(getShoppingItemSelection());

  await touchShoppingList(existing.listId);

  return mapShoppingItem(updated[0], userId);
}

export async function deleteShoppingItem(householdId: string, itemId: string) {
  const existing = await getItemForHousehold(itemId, householdId);
  if (!existing) return false;

  await db.delete(schema.shopping_list_items).where(eq(schema.shopping_list_items.id, itemId));
  await touchShoppingList(existing.listId);

  return true;
}

export async function clearCheckedShoppingItems(householdId: string) {
  const list = await getLatestHouseholdShoppingList(householdId);
  if (!list) return 0;

  const deleted = await db
    .delete(schema.shopping_list_items)
    .where(and(eq(schema.shopping_list_items.shopping_list_id, list.id), eq(schema.shopping_list_items.checked, true)))
    .returning({ id: schema.shopping_list_items.id });

  if (deleted.length > 0) await touchShoppingList(list.id);

  return deleted.length;
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

  let insertedItems: ShoppingListItem[] = [];

  if (uniqueItems.length > 0) {
    const rows = await db
      .insert(schema.shopping_list_items)
      .values(uniqueItems.map((item) => toInsertValues(list.id, userId, item)))
      .returning(getShoppingItemSelection());

    await touchShoppingList(list.id);
    insertedItems = rows.map((row) => mapShoppingItem(row, userId));
  }

  return {
    listId: list.id,
    insertedCount: insertedItems.length,
    skippedCount: items.length - uniqueItems.length,
    items: insertedItems,
  };
}

function recipeIngredientToShoppingItem(
  ingredient: ShoppingIngredientInput,
  recipe: { recipeId?: string | null; title?: string | null } = {}
): ShoppingListInsertItem | null {
  const name = ingredient.name.trim();
  if (!name) return null;

  return {
    name,
    quantity: ingredient.quantity ?? null,
    unit: ingredient.unit ?? null,
    note: ingredient.note ?? ingredient.notes ?? recipe.title ?? null,
    source: "recipe",
    recipeId: recipe.recipeId ?? null,
  };
}

async function getRecipeMissingShoppingItems(userId: string, input: ShoppingListGenerationInput) {
  const items: ShoppingListInsertItem[] = [];

  for (const recipeSource of input.recipes ?? []) {
    for (const ingredient of recipeSource.missingIngredients) {
      const item = recipeIngredientToShoppingItem(ingredient, {
        recipeId: recipeSource.recipeId ?? null,
        title: recipeSource.title ?? null,
      });
      if (item) items.push(item);
    }
  }

  for (const ingredient of input.missingIngredients ?? []) {
    const item = recipeIngredientToShoppingItem(ingredient);
    if (item) items.push(item);
  }

  const recipeIds = Array.from(new Set(input.recipeIds ?? []));
  const recipeDetails = await Promise.all(recipeIds.map((recipeId) => getRecipeDetail(userId, recipeId)));

  for (const recipe of recipeDetails) {
    if (!recipe) continue;

    for (const ingredient of recipe.missingIngredients) {
      const item = recipeIngredientToShoppingItem(ingredient, {
        recipeId: recipe.id,
        title: recipe.title,
      });
      if (item) items.push(item);
    }
  }

  return items;
}

async function getLowStockShoppingItems(householdId: string, userId: string) {
  const scope = or(
    eq(schema.products.household_id, householdId),
    and(isNull(schema.products.household_id), eq(schema.products.user_id, userId))
  )!;

  const rows = await db
    .select({
      id: schema.products.id,
      name: schema.products.name,
      quantity: schema.products.quantity,
      unit: schema.products.unit,
      categoryName: schema.categories.name,
    })
    .from(schema.products)
    .leftJoin(schema.categories, eq(schema.products.category_id, schema.categories.id))
    .where(and(scope, lte(schema.products.quantity, "1")))
    .orderBy(asc(schema.products.name))
    .limit(50);

  return rows.map((row) => {
    const quantity = parseQuantity(row.quantity);
    const quantityLabel = [quantity ?? 0, row.unit].filter(Boolean).join(" ");

    return {
      name: row.name,
      quantity: 1,
      unit: row.unit,
      category: row.categoryName,
      note: quantityLabel ? `Low stock: ${quantityLabel} remaining` : "Low stock",
      source: "low-stock",
      inventoryItemId: row.id,
    } satisfies ShoppingListInsertItem;
  });
}

export async function generateShoppingListItems(
  householdId: string,
  userId: string,
  input: ShoppingListGenerationInput
) {
  const includeRecipeMissing = input.includeRecipeMissing ?? true;
  const includeLowStock = input.includeLowStock ?? true;
  const recipeItems = includeRecipeMissing ? await getRecipeMissingShoppingItems(userId, input) : [];
  const lowStockItems = includeLowStock ? await getLowStockShoppingItems(householdId, userId) : [];
  const items = [...recipeItems, ...lowStockItems];

  if (items.length === 0) {
    return {
      listId: null,
      insertedCount: 0,
      skippedCount: 0,
      items: [],
      recipeItemCount: recipeItems.length,
      lowStockItemCount: lowStockItems.length,
    };
  }

  const result = await addUniqueItemsToShoppingList(householdId, userId, items, {
    listName: "Smart shopping list",
  });

  return {
    ...result,
    recipeItemCount: recipeItems.length,
    lowStockItemCount: lowStockItems.length,
  };
}
