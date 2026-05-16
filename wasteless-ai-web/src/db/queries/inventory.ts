import "server-only";

import { db } from "@/db";
import * as schema from "@/db/schema/tables";
import {
  addDays,
  formatQuantity,
  getExpirationStatus,
  parseJsonValue,
  startOfDay,
  type ExpirationStatus,
} from "@/lib/dashboard-utils";
import { and, asc, eq, gt, gte, ilike, isNull, lte, lt, type SQL } from "drizzle-orm";
import { getPrimaryHouseholdForUser } from "./households";

export type InventoryFilters = {
  query?: string;
  status?: ExpirationStatus | "all";
  location?: string;
};

type InventoryMetadata = {
  category?: string;
};

export async function getInventoryPageData(userId: string, filters: InventoryFilters = {}) {
  const household = await getPrimaryHouseholdForUser(userId);

  if (!household) {
    return {
      household: null,
      items: [],
      locations: [],
    };
  }

  const today = startOfDay();
  const soon = addDays(today, 7);
  const conditions: SQL[] = [
    eq(schema.inventory_items.household_id, household.id),
    isNull(schema.inventory_items.deleted_at),
  ];

  if (filters.query) {
    conditions.push(ilike(schema.inventory_items.name, `%${filters.query}%`));
  }

  if (filters.location && filters.location !== "all") {
    conditions.push(eq(schema.inventory_items.location, filters.location));
  }

  if (filters.status === "expired") {
    conditions.push(lt(schema.inventory_items.expiration_date, today));
  }

  if (filters.status === "expiring") {
    conditions.push(gte(schema.inventory_items.expiration_date, today));
    conditions.push(lte(schema.inventory_items.expiration_date, soon));
  }

  if (filters.status === "fresh") {
    conditions.push(gt(schema.inventory_items.expiration_date, soon));
  }

  const [rows, locationRows] = await Promise.all([
    db
      .select({
        id: schema.inventory_items.id,
        name: schema.inventory_items.name,
        quantity: schema.inventory_items.quantity,
        unit: schema.inventory_items.unit,
        location: schema.inventory_items.location,
        expirationDate: schema.inventory_items.expiration_date,
        metadata: schema.inventory_items.metadata,
        categoryName: schema.categories.name,
      })
      .from(schema.inventory_items)
      .leftJoin(schema.products, eq(schema.inventory_items.product_id, schema.products.id))
      .leftJoin(schema.categories, eq(schema.products.category_id, schema.categories.id))
      .where(and(...conditions))
      .orderBy(asc(schema.inventory_items.expiration_date), asc(schema.inventory_items.name))
      .limit(100),
    db
      .select({
        location: schema.inventory_items.location,
      })
      .from(schema.inventory_items)
      .where(
        and(
          eq(schema.inventory_items.household_id, household.id),
          isNull(schema.inventory_items.deleted_at)
        )
      )
      .limit(200),
  ]);

  const locations = Array.from(
    new Set(locationRows.map((row) => row.location).filter((location): location is string => Boolean(location)))
  ).sort();

  const items = rows.map((item) => {
    const metadata = parseJsonValue<InventoryMetadata>(item.metadata, {});

    return {
      id: item.id,
      product: item.name,
      quantity: formatQuantity(item.quantity, item.unit),
      category: item.categoryName ?? metadata.category ?? "Uncategorized",
      expirationDate: item.expirationDate,
      location: item.location ?? "pantry",
      status: getExpirationStatus(item.expirationDate),
    };
  });

  return {
    household,
    items,
    locations,
  };
}
