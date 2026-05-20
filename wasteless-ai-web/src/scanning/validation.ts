import { z } from "zod";

export const supportedBarcodeFormatSchema = z.enum(["EAN_13", "UPC_A", "UPC_E", "QR_CODE", "CODE_128"]);

export const barcodeLookupRequestSchema = z.object({
  barcode: z
    .string()
    .trim()
    .min(4, "Barcode is too short")
    .max(256, "Barcode is too long"),
  format: supportedBarcodeFormatSchema.optional().or(z.string().trim().max(32)).nullable(),
});

export const ocrParseRequestSchema = z.object({
  rawText: z.string().trim().min(5, "Receipt text is too short").max(20_000),
  imageUrl: z.string().url().optional().nullable(),
});

export const receiptItemImportSchema = z.object({
  name: z.string().trim().min(2).max(160),
  normalizedName: z.string().trim().min(2).max(160).optional(),
  quantity: z.coerce.number().positive().max(9999).default(1),
  unit: z.string().trim().max(32).nullable().optional(),
  price: z.coerce.number().min(0).max(99999).nullable().optional(),
  brand: z.string().trim().max(120).nullable().optional(),
  category: z.string().trim().max(80).nullable().optional(),
  categoryId: z.string().uuid().nullable().optional(),
  shelfLifeDays: z.coerce.number().int().min(0).max(3650).nullable().optional(),
  expirationDate: z.string().trim().max(32).nullable().optional(),
  storageLocation: z.string().trim().max(32).nullable().optional(),
  confidence: z.coerce.number().min(0).max(1).optional().default(0.6),
  selected: z.boolean().optional().default(true),
  notes: z.string().trim().max(500).nullable().optional(),
});

export const importReceiptItemsRequestSchema = z.object({
  receiptId: z.string().uuid().nullable().optional(),
  purchaseDate: z.string().trim().max(32).nullable().optional(),
  source: z.enum(["receipt", "food_photo", "shelf_photo", "fridge_photo"]).optional().default("receipt"),
  items: z.array(receiptItemImportSchema).min(1).max(120),
});

export const importBarcodeProductRequestSchema = z.object({
  barcode: z.string().trim().min(4).max(256),
  name: z.string().trim().min(2).max(160),
  brand: z.string().trim().max(120).nullable().optional(),
  category: z.string().trim().max(80).nullable().optional(),
  categoryId: z.string().uuid().nullable().optional(),
  quantity: z.coerce.number().positive().max(9999).default(1),
  unit: z.string().trim().max(32).nullable().optional(),
  purchaseDate: z.string().trim().max(32).nullable().optional(),
  expirationDate: z.string().trim().max(32).nullable().optional(),
  storageLocation: z.string().trim().max(32).nullable().optional(),
  notes: z.string().trim().max(500).nullable().optional(),
  metadata: z.record(z.unknown()).optional().default({}),
});

export const scanHistoryMetadataSchema = z.record(z.unknown()).optional().default({});

export const photoScanModeSchema = z.enum(["food_photo", "shelf_photo", "fridge_photo"]);

export const MAX_RECEIPT_IMAGE_BYTES = 8 * 1024 * 1024;
export const SUPPORTED_RECEIPT_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
