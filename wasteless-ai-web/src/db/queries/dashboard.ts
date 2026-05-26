import "server-only";

import { db } from "@/db";
import * as schema from "@/db/schema/tables";
import { getPrimaryHouseholdForUser } from "@/db/queries/households";
import {
  addDays,
  formatRelativeExpiration,
  formatQuantity,
  getExpirationStatus,
  startOfDay,
} from "@/lib/dashboard-utils";
import { and, asc, count, desc, eq, gte, isNull, lte, lt, or } from "drizzle-orm";

export async function getDashboardOverview(userId: string) {
  const today = startOfDay();
  const soon = addDays(today, 7);
  const household = await getPrimaryHouseholdForUser(userId);
  const activeInventory = household
    ? or(
        eq(schema.products.household_id, household.id),
        and(isNull(schema.products.household_id), eq(schema.products.user_id, userId))
      )!
    : eq(schema.products.user_id, userId);
  const activeCategories = household
    ? or(eq(schema.categories.user_id, userId), eq(schema.categories.household_id, household.id))!
    : eq(schema.categories.user_id, userId);

  const [totalProductsRow, expiringSoonRow, expiredItemsRow, categoriesRow] = await Promise.all([
    db.select({ value: count() }).from(schema.products).where(activeInventory),
    db
      .select({ value: count() })
      .from(schema.products)
      .where(
        and(
          activeInventory,
          gte(schema.products.expiration_date, today),
          lte(schema.products.expiration_date, soon)
        )
      ),
    db
      .select({ value: count() })
      .from(schema.products)
      .where(and(activeInventory, lt(schema.products.expiration_date, today))),
    db.select({ value: count() }).from(schema.categories).where(activeCategories),
  ]);

  const [recentRows, soonRows, shoppingListRows] = await Promise.all([
    db
      .select({
        id: schema.products.id,
        name: schema.products.name,
        quantity: schema.products.quantity,
        unit: schema.products.unit,
        location: schema.products.storage_location,
        expirationDate: schema.products.expiration_date,
        createdAt: schema.products.created_at,
      })
      .from(schema.products)
      .where(activeInventory)
      .orderBy(desc(schema.products.created_at))
      .limit(6),
    db
      .select({
        id: schema.products.id,
        name: schema.products.name,
        quantity: schema.products.quantity,
        unit: schema.products.unit,
        location: schema.products.storage_location,
        expirationDate: schema.products.expiration_date,
      })
      .from(schema.products)
      .where(
        and(
          activeInventory,
          gte(schema.products.expiration_date, today),
          lte(schema.products.expiration_date, soon)
        )
      )
      .orderBy(asc(schema.products.expiration_date))
      .limit(3),
    household
      ? db
          .select({
            id: schema.shopping_lists.id,
            name: schema.shopping_lists.name,
          })
          .from(schema.shopping_lists)
          .where(eq(schema.shopping_lists.household_id, household.id))
          .orderBy(desc(schema.shopping_lists.updated_at))
          .limit(1)
      : Promise.resolve([]),
  ]);

  const shoppingList = shoppingListRows[0] ?? null;
  const [shoppingItemsRow, openShoppingItemsRow] = shoppingList
    ? await Promise.all([
        db
          .select({ value: count() })
          .from(schema.shopping_list_items)
          .where(eq(schema.shopping_list_items.shopping_list_id, shoppingList.id)),
        db
          .select({ value: count() })
          .from(schema.shopping_list_items)
          .where(
            and(
              eq(schema.shopping_list_items.shopping_list_id, shoppingList.id),
              eq(schema.shopping_list_items.checked, false)
            )
          ),
      ])
    : [null, null];

  const stats = {
    totalProducts: Number(totalProductsRow[0]?.value ?? 0),
    expiringSoon: Number(expiringSoonRow[0]?.value ?? 0),
    expiredItems: Number(expiredItemsRow[0]?.value ?? 0),
    categoriesCount: Number(categoriesRow[0]?.value ?? 0),
    openShoppingItems: Number(openShoppingItemsRow?.[0]?.value ?? 0),
  };

  const recentInventory = recentRows.map((item) => ({
    id: item.id,
    name: item.name,
    quantity: formatQuantity(item.quantity, item.unit),
    location: item.location ?? "pantry",
    expirationDate: item.expirationDate,
    status: getExpirationStatus(item.expirationDate),
  }));

  const expiringSoonItems = soonRows.map((item) => ({
    id: item.id,
    name: item.name,
    quantity: formatQuantity(item.quantity, item.unit),
    location: item.location ?? "pantry",
    expirationDate: item.expirationDate,
    status: getExpirationStatus(item.expirationDate),
  }));

  const insights = [
    stats.expiringSoon > 0
      ? `${stats.expiringSoon} item${stats.expiringSoon === 1 ? "" : "s"} expire this week.`
      : "No tracked items expire this week.",
    stats.expiredItems > 0
      ? `${stats.expiredItems} expired item${stats.expiredItems === 1 ? "" : "s"} need review.`
      : "You have no expired tracked items.",
    soonRows[0]
      ? `${soonRows[0].name} ${formatRelativeExpiration(soonRows[0].expirationDate).toLowerCase()}.`
      : "Your pantry is in a calm window right now.",
    stats.categoriesCount > 0
      ? stats.categoriesCount === 1
        ? "1 category keeps your items organized."
        : `${stats.categoriesCount} categories keep your items organized.`
      : "Create a category to keep your pantry organized.",
    shoppingList
      ? `${stats.openShoppingItems} open shopping item${
          stats.openShoppingItems === 1 ? "" : "s"
        } are ready for the next trip.`
      : "Create a shopping list when a recipe or meal plan has gaps.",
  ];

  return {
    household,
    stats,
    shoppingList: shoppingList
      ? {
          id: shoppingList.id,
          name: shoppingList.name,
          totalItems: Number(shoppingItemsRow?.[0]?.value ?? 0),
          openItems: stats.openShoppingItems,
        }
      : null,
    recentInventory,
    expiringSoonItems,
    insights,
  };
}
