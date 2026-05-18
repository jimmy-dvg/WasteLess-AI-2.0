import { z } from "zod";

export const categorySchema = z.object({
  name: z.string().trim().min(2, "Category name must be at least 2 characters").max(60),
  color: z
    .string()
    .trim()
    .max(24)
    .optional()
    .refine((value) => !value || /^#([0-9a-fA-F]{6})$/.test(value), {
      message: "Color must be a hex value like #22c55e",
    }),
});

export const productSchema = z.object({
  name: z.string().trim().min(2, "Product name must be at least 2 characters").max(140),
  quantity: z.string().trim().min(1, "Quantity is required").max(16),
  unit: z.string().trim().max(32).optional(),
  category_id: z.string().uuid().optional().or(z.literal("")),
  purchase_date: z.string().trim().optional(),
  expiration_date: z.string().trim().optional(),
  storage_location: z.string().trim().max(32).optional(),
  notes: z.string().trim().max(500).optional(),
});

export const productUpdateSchema = productSchema.partial().extend({
  id: z.string().uuid(),
});

export const inventoryFilterSchema = z.object({
  query: z.string().trim().optional().default(""),
  status: z.enum(["all", "fresh", "expiring", "expired"]).optional().default("all"),
  categoryId: z.string().optional().default("all"),
  location: z.string().optional().default("all"),
  sort: z
    .enum(["expiration_asc", "expiration_desc", "name_asc", "created_desc"])
    .optional()
    .default("expiration_asc"),
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(5).max(50).optional().default(12),
});
