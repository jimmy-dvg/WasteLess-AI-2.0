import { z } from "zod";

export const shoppingItemSourceSchema = z.enum(["manual", "recipe", "low-stock"]);

function optionalText(max: number) {
  return z.preprocess((value) => {
    if (value == null) return null;
    const text = String(value).trim();
    return text.length > 0 ? text : null;
  }, z.string().max(max).nullable());
}

const optionalQuantitySchema = z.preprocess((value) => {
  if (value == null || value === "") return null;
  return value;
}, z.coerce.number().positive().max(99999).nullable());

const nullableUuidSchema = z.preprocess((value) => {
  if (value == null || value === "") return null;
  return value;
}, z.string().uuid().nullable());

export const shoppingIngredientSchema = z.object({
  name: z.string().trim().min(1).max(140),
  quantity: z.union([z.string().trim().max(32), z.number().positive().max(99999)]).nullable().optional(),
  unit: optionalText(32).optional(),
  note: optionalText(240).optional(),
  notes: optionalText(240).optional(),
});

export const shoppingRecipeSourceSchema = z.object({
  recipeId: nullableUuidSchema.optional(),
  title: optionalText(160).optional(),
  missingIngredients: z.array(shoppingIngredientSchema).max(40).default([]),
});

export const shoppingItemCreateSchema = z.object({
  name: z.string().trim().min(2, "Item name must be at least 2 characters").max(140),
  quantity: optionalQuantitySchema.optional(),
  unit: optionalText(32).optional(),
  category: optionalText(80).optional(),
  note: optionalText(500).optional(),
  checked: z.boolean().optional().default(false),
  source: shoppingItemSourceSchema.optional().default("manual"),
  recipeId: nullableUuidSchema.optional(),
  inventoryItemId: nullableUuidSchema.optional(),
});

export const shoppingItemUpdateSchema = shoppingItemCreateSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: "Provide at least one field to update",
  });

export const shoppingListGenerationSchema = z.object({
  recipeIds: z.array(z.string().uuid()).max(12).optional().default([]),
  recipes: z.array(shoppingRecipeSourceSchema).max(12).optional().default([]),
  missingIngredients: z.array(shoppingIngredientSchema).max(80).optional().default([]),
  includeRecipeMissing: z.boolean().optional().default(true),
  includeLowStock: z.boolean().optional().default(true),
});

export type ShoppingItemCreateInput = z.infer<typeof shoppingItemCreateSchema>;
export type ShoppingItemUpdateInput = z.infer<typeof shoppingItemUpdateSchema>;
export type ShoppingListGenerationInput = z.infer<typeof shoppingListGenerationSchema>;
