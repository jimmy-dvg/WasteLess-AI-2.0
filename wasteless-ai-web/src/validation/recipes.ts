import { z } from "zod";

export const recipePreferencesSchema = z.object({
  cuisines: z.array(z.string().trim().min(2)).max(10).default([]),
  diets: z.array(z.string().trim().min(2)).max(10).default([]),
  allergens: z.array(z.string().trim().min(2)).max(12).default([]),
  dislikes: z.array(z.string().trim().min(2)).max(12).default([]),
  maxCookTimeMinutes: z.number().int().min(5).max(240).optional(),
  servings: z.number().int().min(1).max(12).optional(),
  difficulty: z.enum(["easy", "medium", "hard"]).optional(),
  notes: z.string().trim().max(280).optional(),
});

export const recipeGenerationRequestSchema = z.object({
  maxRecipes: z.number().int().min(1).max(6).optional().default(3),
  includeExpired: z.boolean().optional().default(false),
  preferencesOverride: recipePreferencesSchema.partial().optional(),
});

const recipeIngredientSchema = z.object({
  name: z.string().trim().min(2).max(120),
  quantity: z.string().trim().max(32).optional(),
  unit: z.string().trim().max(32).optional(),
  notes: z.string().trim().max(140).optional(),
  is_optional: z.boolean().optional(),
  is_expiring: z.boolean().optional(),
});

const recipeNutritionSchema = z.object({
  calories_kcal: z.number().min(0).max(3000),
  protein_g: z.number().min(0).max(300),
  carbs_g: z.number().min(0).max(500),
  fat_g: z.number().min(0).max(300),
  fiber_g: z.number().min(0).max(200).optional(),
  sugar_g: z.number().min(0).max(300).optional(),
  sodium_mg: z.number().min(0).max(10000).optional(),
});

const recipeSuggestionSchema = z.object({
  title: z.string().trim().min(3).max(120),
  description: z.string().trim().min(10).max(400),
  servings: z.number().int().min(1).max(12),
  cooking_time_minutes: z.number().int().min(5).max(240),
  difficulty: z.enum(["easy", "medium", "hard"]),
  ingredients: z.array(recipeIngredientSchema).min(3).max(30),
  missing_ingredients: z.array(recipeIngredientSchema).max(30).optional().default([]),
  steps: z.array(z.string().trim().min(4).max(400)).min(3).max(12),
  waste_reduction_note: z.string().trim().min(8).max(400),
  nutrition: recipeNutritionSchema,
  tags: z.array(z.string().trim().min(2).max(24)).max(8).optional(),
});

export const recipeAiResponseSchema = z.object({
  recipes: z.array(recipeSuggestionSchema).min(1).max(6),
  summary: z.string().trim().max(400).optional(),
  pantry_staples: z.array(z.string().trim().min(2).max(40)).max(12).optional(),
});

export type RecipeGenerationRequest = z.infer<typeof recipeGenerationRequestSchema>;
export type RecipePreferencesInput = z.infer<typeof recipePreferencesSchema>;
export type RecipeAiResponseInput = z.infer<typeof recipeAiResponseSchema>;
