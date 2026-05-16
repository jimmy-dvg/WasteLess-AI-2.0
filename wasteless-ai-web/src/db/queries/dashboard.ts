import "server-only";

import { db } from "@/db";
import * as schema from "@/db/schema/tables";
import {
  addDays,
  formatRelativeExpiration,
  formatQuantity,
  getExpirationStatus,
  startOfDay,
} from "@/lib/dashboard-utils";
import { and, asc, count, desc, eq, gte, isNull, lte, lt } from "drizzle-orm";
import { getPrimaryHouseholdForUser } from "./households";

export async function getDashboardOverview(userId: string) {
  const household = await getPrimaryHouseholdForUser(userId);

  if (!household) {
    return {
      household: null,
      stats: {
        totalProducts: 0,
        expiringSoon: 0,
        expiredItems: 0,
        shoppingItems: 0,
      },
      recentInventory: [],
      insights: [
        "Add your first inventory item to unlock expiration insights.",
        "Start a shopping list to prevent duplicate purchases.",
        "Waste tracking will appear once your household has activity.",
      ],
    };
  }

  const today = startOfDay();
  const soon = addDays(today, 7);
  const activeInventory = and(
    eq(schema.inventory_items.household_id, household.id),
    isNull(schema.inventory_items.deleted_at)
  );

  const [totalProductsRow, expiringSoonRow, expiredItemsRow, shoppingItemsRow] = await Promise.all([
    db.select({ value: count() }).from(schema.inventory_items).where(activeInventory),
    db
      .select({ value: count() })
      .from(schema.inventory_items)
      .where(
        and(
          activeInventory,
          gte(schema.inventory_items.expiration_date, today),
          lte(schema.inventory_items.expiration_date, soon)
        )
      ),
    db
      .select({ value: count() })
      .from(schema.inventory_items)
      .where(and(activeInventory, lt(schema.inventory_items.expiration_date, today))),
    db
      .select({ value: count() })
      .from(schema.shopping_list_items)
      .innerJoin(
        schema.shopping_lists,
        eq(schema.shopping_list_items.shopping_list_id, schema.shopping_lists.id)
      )
      .where(
        and(
          eq(schema.shopping_lists.household_id, household.id),
          eq(schema.shopping_list_items.checked, false)
        )
      ),
  ]);

  const [recentRows, soonRows] = await Promise.all([
    db
      .select({
        id: schema.inventory_items.id,
        name: schema.inventory_items.name,
        quantity: schema.inventory_items.quantity,
        unit: schema.inventory_items.unit,
        location: schema.inventory_items.location,
        expirationDate: schema.inventory_items.expiration_date,
        createdAt: schema.inventory_items.created_at,
      })
      .from(schema.inventory_items)
      .where(activeInventory)
      .orderBy(desc(schema.inventory_items.created_at))
      .limit(6),
    db
      .select({
        name: schema.inventory_items.name,
        expirationDate: schema.inventory_items.expiration_date,
      })
      .from(schema.inventory_items)
      .where(
        and(
          activeInventory,
          gte(schema.inventory_items.expiration_date, today),
          lte(schema.inventory_items.expiration_date, soon)
        )
      )
      .orderBy(asc(schema.inventory_items.expiration_date))
      .limit(3),
  ]);

  const stats = {
    totalProducts: Number(totalProductsRow[0]?.value ?? 0),
    expiringSoon: Number(expiringSoonRow[0]?.value ?? 0),
    expiredItems: Number(expiredItemsRow[0]?.value ?? 0),
    shoppingItems: Number(shoppingItemsRow[0]?.value ?? 0),
  };

  const recentInventory = recentRows.map((item) => ({
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
    "You reduced waste by 15% against the starter household baseline.",
  ];

  return {
    household,
    stats,
    recentInventory,
    insights,
  };
}
