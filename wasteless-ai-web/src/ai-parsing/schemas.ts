import { z } from "zod";

export const receiptItemExtractionSchema = z.object({
  name: z.string().trim().min(1).max(160),
  normalizedName: z.string().trim().min(1).max(160),
  quantity: z.coerce.number().positive().max(9999).default(1),
  unit: z.string().trim().max(32).nullable().default(null),
  price: z.coerce.number().min(0).max(99999).nullable().default(null),
  brand: z.string().trim().max(120).nullable().default(null),
  category: z.string().trim().max(80).nullable().default(null),
  shelfLifeDays: z.coerce.number().int().min(0).max(3650).nullable().default(null),
  expirationDate: z.string().trim().max(32).nullable().default(null),
  storageLocation: z.string().trim().max(32).nullable().default(null),
  confidence: z.coerce.number().min(0).max(1).default(0.6),
});

export const parsedReceiptSchema = z.object({
  storeName: z.string().trim().max(120).nullable().default(null),
  purchaseDate: z.string().trim().max(32).nullable().default(null),
  total: z.coerce.number().min(0).max(999999).nullable().default(null),
  currency: z.string().trim().max(8).nullable().default("USD"),
  items: z.array(receiptItemExtractionSchema).max(120).default([]),
  warnings: z.array(z.string().trim().max(200)).default([]),
});

export type ParsedReceiptAI = z.infer<typeof parsedReceiptSchema>;
