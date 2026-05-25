import { z } from "zod";

const DEFAULT_RECIPE_DESCRIPTION = "A pantry-friendly recipe designed to reduce household food waste.";
const DEFAULT_WASTE_NOTE = "Uses available ingredients first so fewer items expire unused.";
const DEFAULT_STEPS = [
  "Prepare the ingredients and trim anything past its best texture.",
  "Cook the main ingredients until tender and season to taste.",
  "Serve promptly and store leftovers for another meal.",
];
const DEFAULT_NUTRITION = {
  calories_kcal: 0,
  protein_g: 0,
  carbs_g: 0,
  fat_g: 0,
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function optionalString(max: number) {
  return z.preprocess((value) => {
    if (value == null) return undefined;
    const text = String(value).trim();
    return text.length > 0 ? text : undefined;
  }, z.string().max(max).optional());
}

function requiredString(min: number, max: number) {
  return z.preprocess((value) => {
    if (value == null) return "";
    return String(value).trim();
  }, z.string().min(min).max(max));
}

function optionalNumber(min: number, max: number) {
  return z.preprocess((value) => {
    if (value == null || value === "") return undefined;
    return value;
  }, z.coerce.number().min(min).max(max).optional().catch(undefined));
}

function boundedNumber(min: number, max: number, fallback: number) {
  return z.preprocess((value) => {
    if (value == null || value === "") return fallback;
    return value;
  }, z.coerce.number().min(min).max(max).catch(fallback));
}

function boundedInt(min: number, max: number, fallback: number) {
  return z.preprocess((value) => {
    if (value == null || value === "") return fallback;
    return value;
  }, z.coerce.number().int().min(min).max(max).catch(fallback));
}

function normalizeSteps(value: unknown) {
  if (Array.isArray(value)) return value;
  if (typeof value !== "string") return DEFAULT_STEPS;

  const steps = value
    .split(/\r?\n|(?<=\.)\s+/)
    .map((step) => step.replace(/^\d+[\).]\s*/, "").trim())
    .filter(Boolean);

  return steps.length > 0 ? steps : DEFAULT_STEPS;
}

export const recipePreferencesSchema = z.object({
  mealType: z.enum(["breakfast", "lunch", "dinner", "snack"]).optional(),
  cuisines: z.array(z.string().trim().min(2)).max(10).default([]),
  diets: z.array(z.string().trim().min(2)).max(10).default([]),
  allergens: z.array(z.string().trim().min(2)).max(12).default([]),
  dislikes: z.array(z.string().trim().min(2)).max(12).default([]),
  maxCookTimeMinutes: z.number().int().min(5).max(240).optional(),
  servings: z.number().int().min(1).max(12).optional(),
  difficulty: z.enum(["easy", "medium", "hard"]).optional(),
  notes: z.string().trim().max(280).optional(),
});

export const recipeGenerationModeSchema = z.enum(["all", "selected", "expiring-soon"]);

export const mobileRecipePreferencesSchema = z.object({
  mealType: z.enum(["breakfast", "lunch", "dinner", "snack"]).optional(),
  cuisine: optionalString(80),
  dietary: z.array(z.string().trim().min(2).max(60)).max(10).optional().default([]),
  maxCookingTimeMinutes: z.number().int().min(5).max(240).optional(),
  servings: z.number().int().min(1).max(12).optional(),
  difficulty: z.enum(["easy", "medium", "hard"]).optional(),
});

export const recipeGenerationRequestSchema = z.object({
  maxRecipes: z.coerce.number().int().min(1).max(6).optional().default(3),
  includeExpired: z.boolean().optional().default(false),
  inventoryOnly: z.boolean().optional().default(false),
  excludedRecipeTitles: z.array(z.string().trim().min(3).max(120)).max(12).optional().default([]),
  mode: recipeGenerationModeSchema.optional().default("all"),
  inventoryItemIds: z.array(z.string().uuid()).max(60).optional().default([]),
  preferences: mobileRecipePreferencesSchema.optional(),
  preferencesOverride: recipePreferencesSchema.partial().optional(),
}).superRefine((value, context) => {
  if (value.mode === "selected" && value.inventoryItemIds.length === 0) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["inventoryItemIds"],
      message: "Select at least one inventory item.",
    });
  }
});

const recipeIngredientSchema = z.preprocess((value) => {
  if (typeof value === "string") return { name: value };
  if (!isRecord(value)) return value;

  return {
    ...value,
    is_optional: value.is_optional ?? value.isOptional,
    is_expiring: value.is_expiring ?? value.isExpiring,
  };
}, z.object({
  name: requiredString(2, 120),
  quantity: optionalString(32),
  unit: optionalString(32),
  notes: optionalString(140),
  is_optional: z.boolean().optional().catch(undefined),
  is_expiring: z.boolean().optional().catch(undefined),
}));

const recipeNutritionSchema = z.preprocess((value) => {
  const source = isRecord(value) ? value : {};
  return {
    calories_kcal: source.calories_kcal ?? source.caloriesKcal ?? source.calories ?? DEFAULT_NUTRITION.calories_kcal,
    protein_g: source.protein_g ?? source.proteinG ?? source.protein ?? DEFAULT_NUTRITION.protein_g,
    carbs_g: source.carbs_g ?? source.carbsG ?? source.carbs ?? DEFAULT_NUTRITION.carbs_g,
    fat_g: source.fat_g ?? source.fatG ?? source.fat ?? DEFAULT_NUTRITION.fat_g,
    fiber_g: source.fiber_g ?? source.fiberG ?? source.fiber,
    sugar_g: source.sugar_g ?? source.sugarG ?? source.sugar,
    sodium_mg: source.sodium_mg ?? source.sodiumMg ?? source.sodium,
  };
}, z.object({
  calories_kcal: boundedNumber(0, 3000, DEFAULT_NUTRITION.calories_kcal),
  protein_g: boundedNumber(0, 300, DEFAULT_NUTRITION.protein_g),
  carbs_g: boundedNumber(0, 500, DEFAULT_NUTRITION.carbs_g),
  fat_g: boundedNumber(0, 300, DEFAULT_NUTRITION.fat_g),
  fiber_g: optionalNumber(0, 200),
  sugar_g: optionalNumber(0, 300),
  sodium_mg: optionalNumber(0, 10000),
}));

const recipeSuggestionSchema = z.preprocess((value) => {
  if (!isRecord(value)) return value;

  return {
    title: value.title ?? value.name,
    description: value.description ?? value.summary ?? DEFAULT_RECIPE_DESCRIPTION,
    servings: value.servings ?? value.serves ?? 2,
    cooking_time_minutes:
      value.cooking_time_minutes ?? value.cookingTimeMinutes ?? value.cook_time ?? value.cookTime ?? 25,
    difficulty: value.difficulty ?? "easy",
    ingredients: value.ingredients ?? value.used_ingredients ?? value.usedIngredients ?? [],
    missing_ingredients: value.missing_ingredients ?? value.missingIngredients ?? value.missing ?? [],
    steps: value.steps ?? value.instructions ?? value.method ?? DEFAULT_STEPS,
    waste_reduction_note:
      value.waste_reduction_note ?? value.wasteReductionNote ?? value.waste_note ?? value.wasteNote ?? DEFAULT_WASTE_NOTE,
    nutrition: value.nutrition ?? DEFAULT_NUTRITION,
    tags: value.tags ?? [],
  };
}, z.object({
  title: requiredString(3, 120),
  description: requiredString(3, 400).catch(DEFAULT_RECIPE_DESCRIPTION),
  servings: boundedInt(1, 12, 2),
  cooking_time_minutes: boundedInt(5, 240, 25),
  difficulty: z.enum(["easy", "medium", "hard"]).catch("easy"),
  ingredients: z.array(recipeIngredientSchema).min(1).max(30),
  missing_ingredients: z.array(recipeIngredientSchema).max(30).optional().default([]),
  steps: z.preprocess(
    normalizeSteps,
    z.array(requiredString(3, 400)).min(1).max(12).catch(DEFAULT_STEPS)
  ),
  waste_reduction_note: requiredString(3, 400).catch(DEFAULT_WASTE_NOTE),
  nutrition: recipeNutritionSchema,
  tags: z.array(requiredString(1, 24)).max(8).optional().default([]),
}));

export const recipeAiResponseSchema = z.preprocess((value) => {
  if (Array.isArray(value)) return { recipes: value };
  if (!isRecord(value)) return value;

  return {
    recipes: value.recipes ?? value.recommendations ?? value.recipe_recommendations ?? [],
    summary: value.summary,
    pantry_staples: value.pantry_staples ?? value.pantryStaples ?? [],
  };
}, z.object({
  recipes: z.array(recipeSuggestionSchema).min(1).max(6),
  summary: optionalString(400),
  pantry_staples: z.array(requiredString(2, 40)).max(12).optional().default([]),
}));

export type RecipeGenerationRequest = z.infer<typeof recipeGenerationRequestSchema>;
export type RecipePreferencesInput = z.infer<typeof recipePreferencesSchema>;
export type RecipeAiResponseInput = z.infer<typeof recipeAiResponseSchema>;
