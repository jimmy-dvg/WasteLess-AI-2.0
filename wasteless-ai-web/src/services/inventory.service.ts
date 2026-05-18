import "server-only";

import { db } from "@/db";
import * as schema from "@/db/schema/tables";
import { getSoonWindow } from "@/lib/date";
import { formatQuantity, getExpirationStatus } from "@/lib/dashboard-utils";
import type { InventoryCategory, InventoryFilters, InventoryPageData, InventoryProduct } from "@/types/inventory";
import { and, asc, count, desc, eq, ilike, lte, lt, or, gte, type SQL } from "drizzle-orm";

const LOW_STOCK_THRESHOLD = 1;

function toQuantityString(value: unknown) {
  if (value == null) return "0";
  return String(value);
}

export async function getCategoriesForUser(userId: string): Promise<InventoryCategory[]> {
  const rows = await db
    .select({
      id: schema.categories.id,
      name: schema.categories.name,
      color: schema.categories.color,
      createdAt: schema.categories.created_at,
    })
    .from(schema.categories)
    .where(eq(schema.categories.user_id, userId))
    .orderBy(asc(schema.categories.name));

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    color: row.color ?? null,
    createdAt: row.createdAt,
  }));
}

export async function getInventoryPageData(
  userId: string,
  filters: InventoryFilters
): Promise<InventoryPageData> {
  const conditions: SQL[] = [eq(schema.products.user_id, userId)];

  if (filters.query) {
    const pattern = `%${filters.query}%`;
    conditions.push(or(ilike(schema.products.name, pattern), ilike(schema.products.notes, pattern))!);
  }

  if (filters.categoryId && filters.categoryId !== "all") {
    conditions.push(eq(schema.products.category_id, filters.categoryId));
  }

  if (filters.location && filters.location !== "all") {
    conditions.push(eq(schema.products.storage_location, filters.location));
  }

  if (filters.status !== "all") {
    const { today, soon } = getSoonWindow();

    if (filters.status === "expired") {
      conditions.push(lt(schema.products.expiration_date, today));
    }

    if (filters.status === "expiring") {
      conditions.push(gte(schema.products.expiration_date, today));
      conditions.push(lte(schema.products.expiration_date, soon));
    }

    if (filters.status === "fresh") {
      conditions.push(gte(schema.products.expiration_date, soon));
    }
  }

  const orderBy = (() => {
    switch (filters.sort) {
      case "expiration_desc":
        return [desc(schema.products.expiration_date), asc(schema.products.name)];
      case "name_asc":
        return [asc(schema.products.name)];
      case "created_desc":
        return [desc(schema.products.created_at)];
      case "expiration_asc":
      default:
        return [asc(schema.products.expiration_date), asc(schema.products.name)];
    }
  })();

  const offset = (filters.page - 1) * filters.pageSize;

  const [countRow, rows, categoryRows, locationRows] = await Promise.all([
    db
      .select({ value: count() })
      .from(schema.products)
      .where(and(...conditions)),
    db
      .select({
        id: schema.products.id,
        name: schema.products.name,
        quantity: schema.products.quantity,
        unit: schema.products.unit,
        purchaseDate: schema.products.purchase_date,
        expirationDate: schema.products.expiration_date,
        storageLocation: schema.products.storage_location,
        notes: schema.products.notes,
        categoryId: schema.products.category_id,
        categoryName: schema.categories.name,
        categoryColor: schema.categories.color,
        createdAt: schema.products.created_at,
        updatedAt: schema.products.updated_at,
      })
      .from(schema.products)
      .leftJoin(schema.categories, eq(schema.products.category_id, schema.categories.id))
      .where(and(...conditions))
      .orderBy(...orderBy)
      .limit(filters.pageSize)
      .offset(offset),
    db
      .select({
        id: schema.categories.id,
        name: schema.categories.name,
        color: schema.categories.color,
        createdAt: schema.categories.created_at,
      })
      .from(schema.categories)
      .where(eq(schema.categories.user_id, userId))
      .orderBy(asc(schema.categories.name)),
    db
      .select({
        location: schema.products.storage_location,
      })
      .from(schema.products)
      .where(eq(schema.products.user_id, userId)),
  ]);

  const totalCount = Number(countRow[0]?.value ?? 0);
  const pageCount = Math.max(1, Math.ceil(totalCount / filters.pageSize));

  const locations = Array.from(
    new Set(locationRows.map((row) => row.location).filter((location): location is string => Boolean(location)))
  ).sort();

  const items: InventoryProduct[] = rows.map((row) => {
    const quantityValue = Number(row.quantity ?? 0);
    return {
      id: row.id,
      name: row.name,
      quantity: toQuantityString(row.quantity),
      unit: row.unit ?? null,
      purchaseDate: row.purchaseDate ?? null,
      expirationDate: row.expirationDate ?? null,
      storageLocation: row.storageLocation ?? null,
      notes: row.notes ?? null,
      categoryId: row.categoryId ?? null,
      categoryName: row.categoryName ?? null,
      categoryColor: row.categoryColor ?? null,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      status: getExpirationStatus(row.expirationDate),
      lowStock: Number.isFinite(quantityValue) && quantityValue <= LOW_STOCK_THRESHOLD,
    };
  });

  return {
    items,
    categories: categoryRows.map((category) => ({
      id: category.id,
      name: category.name,
      color: category.color ?? null,
      createdAt: category.createdAt,
    })),
    locations,
    totalCount,
    page: filters.page,
    pageSize: filters.pageSize,
    pageCount,
  };
}

export async function getProductById(userId: string, productId: string) {
  const rows = await db
    .select({
      id: schema.products.id,
      name: schema.products.name,
      quantity: schema.products.quantity,
      unit: schema.products.unit,
      purchaseDate: schema.products.purchase_date,
      expirationDate: schema.products.expiration_date,
      storageLocation: schema.products.storage_location,
      notes: schema.products.notes,
      categoryId: schema.products.category_id,
      categoryName: schema.categories.name,
      categoryColor: schema.categories.color,
      createdAt: schema.products.created_at,
      updatedAt: schema.products.updated_at,
    })
    .from(schema.products)
    .leftJoin(schema.categories, eq(schema.products.category_id, schema.categories.id))
    .where(and(eq(schema.products.id, productId), eq(schema.products.user_id, userId)))
    .limit(1);

  const row = rows[0];
  if (!row) return null;

  const quantityValue = Number(row.quantity ?? 0);

  return {
    id: row.id,
    name: row.name,
    quantity: toQuantityString(row.quantity),
    unit: row.unit ?? null,
    purchaseDate: row.purchaseDate ?? null,
    expirationDate: row.expirationDate ?? null,
    storageLocation: row.storageLocation ?? null,
    notes: row.notes ?? null,
    categoryId: row.categoryId ?? null,
    categoryName: row.categoryName ?? null,
    categoryColor: row.categoryColor ?? null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    status: getExpirationStatus(row.expirationDate),
    lowStock: Number.isFinite(quantityValue) && quantityValue <= LOW_STOCK_THRESHOLD,
  } satisfies InventoryProduct;
}

export async function createCategory(userId: string, data: { name: string; color?: string | null }) {
  const rows = await db
    .insert(schema.categories)
    .values({
      user_id: userId,
      name: data.name,
      color: data.color ?? null,
    })
    .returning({
      id: schema.categories.id,
      name: schema.categories.name,
      color: schema.categories.color,
      createdAt: schema.categories.created_at,
    });

  return rows[0] ?? null;
}

export async function updateCategory(
  userId: string,
  categoryId: string,
  data: { name?: string; color?: string | null }
) {
  const rows = await db
    .update(schema.categories)
    .set({
      name: data.name,
      color: data.color ?? null,
      updated_at: new Date(),
    })
    .where(and(eq(schema.categories.id, categoryId), eq(schema.categories.user_id, userId)))
    .returning({
      id: schema.categories.id,
    });

  return rows[0] ?? null;
}

export async function deleteCategory(userId: string, categoryId: string) {
  const rows = await db
    .delete(schema.categories)
    .where(and(eq(schema.categories.id, categoryId), eq(schema.categories.user_id, userId)))
    .returning({ id: schema.categories.id });

  return rows[0] ?? null;
}

export async function createProduct(userId: string, data: {
  name: string;
  quantity: string;
  unit?: string | null;
  categoryId?: string | null;
  purchaseDate?: Date | null;
  expirationDate?: Date | null;
  storageLocation?: string | null;
  notes?: string | null;
}) {
  const rows = await db
    .insert(schema.products)
    .values({
      user_id: userId,
      category_id: data.categoryId ?? null,
      name: data.name,
      quantity: data.quantity,
      unit: data.unit ?? null,
      purchase_date: data.purchaseDate ?? null,
      expiration_date: data.expirationDate ?? null,
      storage_location: data.storageLocation ?? null,
      notes: data.notes ?? null,
    })
    .returning({ id: schema.products.id });

  return rows[0] ?? null;
}

export async function updateProduct(
  userId: string,
  productId: string,
  data: {
    name?: string;
    quantity?: string;
    unit?: string | null;
    categoryId?: string | null;
    purchaseDate?: Date | null;
    expirationDate?: Date | null;
    storageLocation?: string | null;
    notes?: string | null;
  }
) {
  const rows = await db
    .update(schema.products)
    .set({
      name: data.name,
      quantity: data.quantity,
      unit: data.unit ?? null,
      category_id: data.categoryId ?? null,
      purchase_date: data.purchaseDate ?? null,
      expiration_date: data.expirationDate ?? null,
      storage_location: data.storageLocation ?? null,
      notes: data.notes ?? null,
      updated_at: new Date(),
    })
    .where(and(eq(schema.products.id, productId), eq(schema.products.user_id, userId)))
    .returning({ id: schema.products.id });

  return rows[0] ?? null;
}

export async function deleteProduct(userId: string, productId: string) {
  const rows = await db
    .delete(schema.products)
    .where(and(eq(schema.products.id, productId), eq(schema.products.user_id, userId)))
    .returning({ id: schema.products.id });

  return rows[0] ?? null;
}

export function formatProductQuantity(quantity: string, unit: string | null) {
  return formatQuantity(quantity, unit ?? undefined);
}
