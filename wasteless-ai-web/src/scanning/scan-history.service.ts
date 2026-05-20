import "server-only";

import { and, desc, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import * as schema from "@/db/schema/tables";
import { parseDateInput } from "@/lib/date";
import type {
  BarcodeProductMetadata,
  ImportReceiptItemInput,
  ImportReceiptItemsResult,
  ParsedReceipt,
  ScanHistoryItem,
  ScanStatus,
  ScanType,
} from "@/scanning/types";

export async function createScanHistoryEntry(
  userId: string,
  data: {
    type: ScanType;
    barcode?: string | null;
    symbology?: string | null;
    rawText?: string | null;
    status?: ScanStatus;
    metadata?: Record<string, unknown>;
  }
) {
  const rows = await db
    .insert(schema.scan_history)
    .values({
      user_id: userId,
      type: data.type,
      barcode: data.barcode ?? null,
      symbology: data.symbology ?? null,
      raw_text: data.rawText ?? null,
      status: data.status ?? "processed",
      metadata: data.metadata ?? {},
    })
    .returning({ id: schema.scan_history.id });

  return rows[0] ?? null;
}

export async function getRecentScanHistory(userId: string, limit = 12): Promise<ScanHistoryItem[]> {
  const rows = await db
    .select()
    .from(schema.scan_history)
    .where(eq(schema.scan_history.user_id, userId))
    .orderBy(desc(schema.scan_history.created_at))
    .limit(limit);

  return rows.map((row) => ({
    id: row.id,
    type: row.type,
    barcode: row.barcode ?? null,
    symbology: row.symbology ?? null,
    rawText: row.raw_text ?? null,
    status: row.status,
    metadata: (row.metadata as Record<string, unknown> | null) ?? {},
    createdAt: row.created_at,
  }));
}

export async function createScannedReceipt(
  userId: string,
  data: {
    imageUrl?: string | null;
    rawText?: string | null;
    extractedData: ParsedReceipt;
    status?: ScanStatus;
  }
) {
  const rows = await db
    .insert(schema.scanned_receipts)
    .values({
      user_id: userId,
      image_url: data.imageUrl ?? null,
      raw_text: data.rawText ?? null,
      extracted_data: data.extractedData,
      status: data.status ?? "processed",
      processed_at: new Date(),
      updated_at: new Date(),
    })
    .returning({ id: schema.scanned_receipts.id });

  return rows[0] ?? null;
}

export async function userOwnsReceipt(userId: string, receiptId: string) {
  const rows = await db
    .select({ id: schema.scanned_receipts.id })
    .from(schema.scanned_receipts)
    .where(and(eq(schema.scanned_receipts.id, receiptId), eq(schema.scanned_receipts.user_id, userId)))
    .limit(1);

  return Boolean(rows[0]);
}

async function resolveCategoryIds(userId: string, items: ImportReceiptItemInput[]) {
  const explicitIds = items
    .map((item) => item.categoryId)
    .filter((id): id is string => Boolean(id));

  const validIds = explicitIds.length
    ? await db
        .select({ id: schema.categories.id })
        .from(schema.categories)
        .where(and(eq(schema.categories.user_id, userId), inArray(schema.categories.id, explicitIds)))
    : [];

  const validIdSet = new Set(validIds.map((row) => row.id));
  const categoryRows = await db
    .select({ id: schema.categories.id, name: schema.categories.name })
    .from(schema.categories)
    .where(eq(schema.categories.user_id, userId));

  const byName = new Map(categoryRows.map((category) => [category.name.toLowerCase(), category.id]));

  return items.map((item) => {
    if (item.categoryId && validIdSet.has(item.categoryId)) return item.categoryId;
    if (!item.category) return null;
    return byName.get(item.category.toLowerCase()) ?? null;
  });
}

export async function importReceiptItemsToInventory(
  userId: string,
  data: {
    purchaseDate?: string | null;
    receiptId?: string | null;
    source?: "receipt" | "food_photo" | "shelf_photo" | "fridge_photo";
    items: ImportReceiptItemInput[];
  }
): Promise<ImportReceiptItemsResult> {
  const selectedItems = data.items.filter((item) => item.selected !== false);
  if (selectedItems.length === 0) {
    return { importedCount: 0, productIds: [], skippedCount: data.items.length };
  }

  if (data.receiptId && !(await userOwnsReceipt(userId, data.receiptId))) {
    throw new Error("Receipt was not found");
  }

  const purchaseDate = data.purchaseDate ? parseDateInput(data.purchaseDate) : new Date();
  const categoryIds = await resolveCategoryIds(userId, selectedItems);
  const source = data.source ?? "receipt";

  const inserted = await db
    .insert(schema.products)
    .values(
      selectedItems.map((item, index) => ({
        user_id: userId,
        category_id: categoryIds[index],
        name: item.normalizedName || item.name,
        quantity: String(item.quantity || 1),
        unit: item.unit ?? null,
        purchase_date: purchaseDate ?? new Date(),
        expiration_date: item.expirationDate ? parseDateInput(item.expirationDate) : null,
        storage_location: item.storageLocation ?? "pantry",
        notes:
          item.notes ??
          (data.receiptId
            ? `Imported from receipt ${data.receiptId}`
            : source === "receipt"
              ? "Imported from scanner"
              : "Imported from photo recognition"),
        brand: item.brand ?? null,
        attributes: {
          scan: {
            source,
            receiptId: data.receiptId ?? null,
            category: item.category ?? null,
            confidence: item.confidence ?? null,
            price: item.price ?? null,
            shelfLifeDays: item.shelfLifeDays ?? null,
          },
        },
      }))
    )
    .returning({ id: schema.products.id });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/inventory");
  revalidatePath("/dashboard/scanning");

  return {
    importedCount: inserted.length,
    productIds: inserted.map((row) => row.id),
    skippedCount: data.items.length - selectedItems.length,
  };
}

export async function importBarcodeProductToInventory(
  userId: string,
  data: {
    barcode: string;
    name: string;
    brand?: string | null;
    category?: string | null;
    categoryId?: string | null;
    quantity: number;
    unit?: string | null;
    purchaseDate?: string | null;
    expirationDate?: string | null;
    storageLocation?: string | null;
    notes?: string | null;
    metadata?: Record<string, unknown> | BarcodeProductMetadata;
  }
) {
  const categoryId = (
    await resolveCategoryIds(userId, [
      {
        name: data.name,
        normalizedName: data.name,
        quantity: data.quantity,
        unit: data.unit ?? null,
        price: null,
        brand: data.brand ?? null,
        category: data.category ?? null,
        categoryId: data.categoryId ?? null,
        shelfLifeDays: null,
        expirationDate: data.expirationDate ?? null,
        storageLocation: data.storageLocation ?? null,
        confidence: 0.9,
      },
    ])
  )[0];

  const rows = await db
    .insert(schema.products)
    .values({
      user_id: userId,
      category_id: categoryId,
      name: data.name,
      quantity: String(data.quantity || 1),
      unit: data.unit ?? null,
      purchase_date: data.purchaseDate ? parseDateInput(data.purchaseDate) : new Date(),
      expiration_date: data.expirationDate ? parseDateInput(data.expirationDate) : null,
      storage_location: data.storageLocation ?? "pantry",
      notes: data.notes ?? "Imported from barcode scanner",
      brand: data.brand ?? null,
      gtin: data.barcode,
      attributes: {
        scan: {
          source: "barcode",
          barcode: data.barcode,
          category: data.category ?? null,
          metadata: data.metadata ?? {},
        },
      },
    })
    .returning({ id: schema.products.id });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/inventory");
  revalidatePath("/dashboard/scanning");

  return rows[0] ?? null;
}
