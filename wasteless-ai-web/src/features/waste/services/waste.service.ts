import "server-only";

import { db } from "@/db";
import { getPrimaryHouseholdForUser, type UserHousehold } from "@/db/queries/households";
import * as schema from "@/db/schema/tables";
import { addDays, formatQuantity, startOfDay } from "@/lib/dashboard-utils";
import { getWasteReasonLabel, type WasteReason } from "@/features/waste/constants";
import { and, count, desc, eq, gte } from "drizzle-orm";

export type WasteLogEntry = {
  id: string;
  productId: string | null;
  productName: string;
  categoryName: string;
  quantity: string;
  unit: string | null;
  quantityLabel: string;
  reason: string;
  reasonLabel: string;
  notes: string | null;
  createdAt: Date;
};

export type WasteReasonBreakdown = {
  reason: string;
  label: string;
  count: number;
};

export type WastePageData = {
  household: UserHousehold | null;
  stats: {
    totalEvents: number;
    recentEvents: number;
    topReason: string;
    preventedUpdates: number;
  };
  recentLogs: WasteLogEntry[];
  reasonBreakdown: WasteReasonBreakdown[];
};

function toNumber(value: unknown) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function formatDecimal(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(2).replace(/\.?0+$/, "");
}

function normalizeNotes(value?: string | null) {
  const notes = value?.trim();
  return notes ? notes : null;
}

function emptyWastePageData(household: UserHousehold | null): WastePageData {
  return {
    household,
    stats: {
      totalEvents: 0,
      recentEvents: 0,
      topReason: "None yet",
      preventedUpdates: 0,
    },
    recentLogs: [],
    reasonBreakdown: [],
  };
}

export async function logProductWasteForUser(input: {
  userId: string;
  householdId: string;
  productId: string;
  quantity: number;
  reason: WasteReason;
  notes?: string | null;
}) {
  const requestedQuantity = input.quantity;
  if (!Number.isFinite(requestedQuantity) || requestedQuantity <= 0) {
    throw new Error("Quantity must be greater than 0");
  }

  return db.transaction(async (tx) => {
    const productRows = await tx
      .select({
        id: schema.products.id,
        name: schema.products.name,
        quantity: schema.products.quantity,
        unit: schema.products.unit,
      })
      .from(schema.products)
      .where(and(eq(schema.products.id, input.productId), eq(schema.products.user_id, input.userId)))
      .limit(1);

    const product = productRows[0];
    if (!product) throw new Error("Product not found");

    const currentQuantity = toNumber(product.quantity);
    if (currentQuantity <= 0) {
      throw new Error(`${product.name} has no remaining quantity to log.`);
    }

    if (requestedQuantity > currentQuantity) {
      throw new Error(`Waste quantity cannot exceed ${formatQuantity(product.quantity, product.unit)}.`);
    }

    const nextQuantity = Math.max(0, currentQuantity - requestedQuantity);

    await tx.insert(schema.waste_logs).values({
      household_id: input.householdId,
      user_id: input.userId,
      product_id: product.id,
      inventory_item_id: null,
      quantity: formatDecimal(requestedQuantity),
      unit: product.unit ?? null,
      reason: input.reason,
      notes: normalizeNotes(input.notes),
    });

    await tx
      .update(schema.products)
      .set({
        quantity: formatDecimal(nextQuantity),
        updated_at: new Date(),
      })
      .where(and(eq(schema.products.id, product.id), eq(schema.products.user_id, input.userId)));

    return {
      productName: product.name,
      quantityLabel: formatQuantity(formatDecimal(requestedQuantity), product.unit),
      nextQuantityLabel: formatQuantity(formatDecimal(nextQuantity), product.unit),
    };
  });
}

export async function getWastePageData(userId: string): Promise<WastePageData> {
  const household = await getPrimaryHouseholdForUser(userId);
  if (!household) return emptyWastePageData(null);

  const recentWindowStart = addDays(startOfDay(), -30);

  const [totalRows, recentRows, preventedRows, reasonRows, logRows] = await Promise.all([
    db
      .select({ value: count() })
      .from(schema.waste_logs)
      .where(eq(schema.waste_logs.household_id, household.id)),
    db
      .select({ value: count() })
      .from(schema.waste_logs)
      .where(and(eq(schema.waste_logs.household_id, household.id), gte(schema.waste_logs.created_at, recentWindowStart))),
    db
      .select({ value: count() })
      .from(schema.meal_plan_inventory_usages)
      .innerJoin(
        schema.meal_plan_items,
        eq(schema.meal_plan_inventory_usages.meal_plan_item_id, schema.meal_plan_items.id)
      )
      .innerJoin(schema.meal_plans, eq(schema.meal_plan_items.meal_plan_id, schema.meal_plans.id))
      .where(
        and(
          eq(schema.meal_plans.household_id, household.id),
          gte(schema.meal_plan_inventory_usages.created_at, recentWindowStart)
        )
      ),
    db
      .select({
        reason: schema.waste_logs.reason,
        value: count(),
      })
      .from(schema.waste_logs)
      .where(eq(schema.waste_logs.household_id, household.id))
      .groupBy(schema.waste_logs.reason),
    db
      .select({
        id: schema.waste_logs.id,
        productId: schema.waste_logs.product_id,
        productName: schema.products.name,
        categoryName: schema.categories.name,
        quantity: schema.waste_logs.quantity,
        unit: schema.waste_logs.unit,
        reason: schema.waste_logs.reason,
        notes: schema.waste_logs.notes,
        createdAt: schema.waste_logs.created_at,
      })
      .from(schema.waste_logs)
      .leftJoin(schema.products, eq(schema.waste_logs.product_id, schema.products.id))
      .leftJoin(schema.categories, eq(schema.products.category_id, schema.categories.id))
      .where(eq(schema.waste_logs.household_id, household.id))
      .orderBy(desc(schema.waste_logs.created_at))
      .limit(20),
  ]);

  const reasonBreakdown = reasonRows
    .map((row) => ({
      reason: row.reason ?? "other",
      label: getWasteReasonLabel(row.reason),
      count: Number(row.value ?? 0),
    }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));

  return {
    household,
    stats: {
      totalEvents: Number(totalRows[0]?.value ?? 0),
      recentEvents: Number(recentRows[0]?.value ?? 0),
      topReason: reasonBreakdown[0]?.label ?? "None yet",
      preventedUpdates: Number(preventedRows[0]?.value ?? 0),
    },
    recentLogs: logRows.map((row) => ({
      id: row.id,
      productId: row.productId ?? null,
      productName: row.productName ?? "Deleted product",
      categoryName: row.categoryName ?? "Uncategorized",
      quantity: String(row.quantity ?? "0"),
      unit: row.unit ?? null,
      quantityLabel: formatQuantity(row.quantity, row.unit),
      reason: row.reason ?? "other",
      reasonLabel: getWasteReasonLabel(row.reason),
      notes: row.notes ?? null,
      createdAt: row.createdAt,
    })),
    reasonBreakdown,
  };
}
