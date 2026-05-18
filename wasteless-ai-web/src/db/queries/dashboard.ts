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
import { and, asc, count, desc, eq, gte, lte, lt } from "drizzle-orm";

export async function getDashboardOverview(userId: string) {
  const today = startOfDay();
  const soon = addDays(today, 7);
  const activeInventory = eq(schema.products.user_id, userId);

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
    db.select({ value: count() }).from(schema.categories).where(eq(schema.categories.user_id, userId)),
  ]);

  const [recentRows, soonRows] = await Promise.all([
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
        name: schema.products.name,
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
  ]);

  const stats = {
    totalProducts: Number(totalProductsRow[0]?.value ?? 0),
    expiringSoon: Number(expiringSoonRow[0]?.value ?? 0),
    expiredItems: Number(expiredItemsRow[0]?.value ?? 0),
    categoriesCount: Number(categoriesRow[0]?.value ?? 0),
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
    stats.categoriesCount > 0
      ? stats.categoriesCount === 1
        ? "1 category keeps your items organized."
        : `${stats.categoriesCount} categories keep your items organized.`
      : "Create a category to keep your pantry organized.",
  ];

  return {
    household: null,
    stats,
    recentInventory,
    insights,
  };
}
