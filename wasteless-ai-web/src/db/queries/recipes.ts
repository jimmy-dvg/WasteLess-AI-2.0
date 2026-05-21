import "server-only";

import { db } from "@/db";
import * as schema from "@/db/schema/tables";
import { parseJsonValue } from "@/lib/dashboard-utils";
import { and, desc, eq } from "drizzle-orm";
import { getPrimaryHouseholdForUser } from "./households";
import type { RecipeDetail, RecipeListItem } from "@/types/recipes";

type RecipeIngredient = {
  name: string;
  quantity?: string;
  unit?: string;
  notes?: string;
  isOptional?: boolean;
  isExpiring?: boolean;
};

type RecipeNutrition = {
  calories_kcal: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g?: number;
  sugar_g?: number;
  sodium_mg?: number;
};

type RecipeMetadata = {
  source?: string;
  difficulty?: string;
  cuisine?: string;
  summary?: string | null;
  pantry_staples?: string[];
};

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const FALLBACK_RECIPE_DETAILS: RecipeDetail[] = [
  {
    id: "fallback-greens-bowl",
    title: "Clean-Out-the-Fridge Greens Bowl",
    description: "A fast bowl built around tender greens, grains, and crisp vegetables nearing their date.",
    servings: 2,
    cookTime: 20,
    difficulty: "easy",
    ingredients: [
      { name: "leafy greens", quantity: "2", unit: "cups", isExpiring: true },
      { name: "cooked rice", quantity: "1", unit: "cup" },
      { name: "carrots", quantity: "2", unit: "pcs" },
      { name: "yogurt sauce", quantity: "3", unit: "tbsp" },
      { name: "lemon", quantity: "0.5", unit: "pc" },
    ],
    missingIngredients: [],
    tags: ["quick dinner", "fresh", "low waste"],
    source: "sample_recipe",
    isSaved: false,
    score: null,
    steps: [
      "Warm the cooked rice in a pan with a splash of water until fluffy.",
      "Saute carrots and leafy greens until tender-crisp.",
      "Whisk yogurt sauce with lemon juice, salt, and pepper.",
      "Layer rice, vegetables, and sauce in bowls.",
      "Finish with any herbs, seeds, or crunchy leftovers you have on hand.",
    ],
    wasteReductionNote: "Uses greens and vegetables that often wilt first, while turning leftover grains into a full meal.",
    nutrition: {
      calories_kcal: 420,
      protein_g: 15,
      carbs_g: 62,
      fat_g: 12,
      fiber_g: 9,
    },
    pantryStaples: ["salt", "pepper", "olive oil"],
    summary: "A flexible bowl for using tender produce before it slips past its best texture.",
  },
  {
    id: "fallback-soup",
    title: "Pantry Vegetable Soup",
    description: "A flexible soup for using soft vegetables, herbs, canned beans, and broth before they go unused.",
    servings: 4,
    cookTime: 35,
    difficulty: "easy",
    ingredients: [
      { name: "mixed vegetables", quantity: "4", unit: "cups", isExpiring: true },
      { name: "beans", quantity: "1", unit: "can" },
      { name: "broth", quantity: "4", unit: "cups" },
      { name: "tomato paste", quantity: "2", unit: "tbsp" },
      { name: "herbs", quantity: "1", unit: "handful" },
    ],
    missingIngredients: [],
    tags: ["batch", "freezer", "comfort"],
    source: "sample_recipe",
    isSaved: false,
    score: null,
    steps: [
      "Chop vegetables into similar-sized pieces so they cook evenly.",
      "Saute firmer vegetables with oil, salt, and pepper for 5 minutes.",
      "Stir in tomato paste and cook until it darkens slightly.",
      "Add beans and broth, then simmer until the vegetables are tender.",
      "Finish with herbs and adjust seasoning before serving.",
    ],
    wasteReductionNote: "Soft vegetables regain value in soup, and leftovers can be frozen in single portions.",
    nutrition: {
      calories_kcal: 310,
      protein_g: 17,
      carbs_g: 48,
      fat_g: 7,
      fiber_g: 13,
    },
    pantryStaples: ["salt", "pepper", "oil"],
    summary: "A forgiving soup that turns pantry odds and soft produce into several low-waste servings.",
  },
  {
    id: "fallback-toast",
    title: "Savory Leftover Toasts",
    description: "Crisp toast topped with odds and ends from the pantry for a low-effort lunch.",
    servings: 2,
    cookTime: 12,
    difficulty: "easy",
    ingredients: [
      { name: "bread", quantity: "4", unit: "slices" },
      { name: "cheese", quantity: "0.5", unit: "cup" },
      { name: "tomatoes", quantity: "1", unit: "cup", isExpiring: true },
      { name: "greens", quantity: "1", unit: "cup", isExpiring: true },
      { name: "olive oil", quantity: "1", unit: "tbsp" },
    ],
    missingIngredients: [],
    tags: ["lunch", "quick", "snack"],
    source: "sample_recipe",
    isSaved: false,
    score: null,
    steps: [
      "Toast bread until crisp enough to hold toppings.",
      "Warm tomatoes and greens with olive oil until just softened.",
      "Add cheese to the toast and melt briefly under heat.",
      "Spoon the warm vegetables over the toast.",
      "Finish with pepper, herbs, or a small squeeze of lemon.",
    ],
    wasteReductionNote: "A simple way to use bread ends, small cheese portions, and produce that is close to softening.",
    nutrition: {
      calories_kcal: 380,
      protein_g: 16,
      carbs_g: 42,
      fat_g: 17,
      fiber_g: 6,
    },
    pantryStaples: ["olive oil", "pepper"],
    summary: "A quick toast format for turning small leftovers into a satisfying meal.",
  },
];

function isUuid(value: string) {
  return UUID_PATTERN.test(value);
}

function normalizeIngredients(input: unknown) {
  const raw = parseJsonValue<unknown[]>(input, []);
  return raw
    .map((item) => {
      if (typeof item === "string") {
        return { name: item } as RecipeIngredient;
      }
      return item as RecipeIngredient;
    })
    .filter((item) => Boolean(item?.name));
}

function mapRecipeListItem(recipe: {
  id: string;
  title: string;
  description: string | null;
  servings: number | null;
  cook_time: number | null;
  difficulty: string | null;
  ingredients: unknown;
  missing_ingredients: unknown;
  nutrition: unknown;
  tags: unknown;
  metadata: unknown;
  score: string | number | null;
  savedId: string | null;
}) {
  const ingredients = normalizeIngredients(recipe.ingredients);
  const missingIngredients = normalizeIngredients(recipe.missing_ingredients);
  const nutrition = parseJsonValue<RecipeDetail["nutrition"]>(recipe.nutrition, {
    calories_kcal: 0,
    protein_g: 0,
    carbs_g: 0,
    fat_g: 0,
  });
  const tags = parseJsonValue<string[]>(recipe.tags, []);
  const metadata = parseJsonValue<RecipeMetadata>(recipe.metadata, {});

  return {
    id: recipe.id,
    title: recipe.title,
    description: recipe.description || "A pantry-friendly recommendation that helps use what you already have.",
    servings: recipe.servings ?? 2,
    cookTime: recipe.cook_time ?? 25,
    difficulty: (recipe.difficulty as "easy" | "medium" | "hard") ?? "easy",
    ingredients,
    missingIngredients,
    nutrition,
    tags,
    source: metadata.source ?? "ai_generated",
    isSaved: Boolean(recipe.savedId),
    score: recipe.score != null ? Number(recipe.score) : null,
  };
}

function mapFallbackRecipeListItem(recipe: RecipeDetail): RecipeListItem {
  return {
    id: recipe.id,
    title: recipe.title,
    description: recipe.description,
    servings: recipe.servings,
    cookTime: recipe.cookTime,
    difficulty: recipe.difficulty,
    ingredients: recipe.ingredients,
    missingIngredients: recipe.missingIngredients,
    nutrition: recipe.nutrition,
    tags: recipe.tags,
    source: recipe.source,
    isSaved: recipe.isSaved,
    score: recipe.score,
  };
}

export async function getRecipesPageData(userId: string) {
  const household = await getPrimaryHouseholdForUser(userId);

  const recipeSelection = {
    id: schema.recipes.id,
    title: schema.recipes.title,
    description: schema.recipes.description,
    servings: schema.recipes.servings,
    cook_time: schema.recipes.cook_time,
    difficulty: schema.recipes.difficulty,
    ingredients: schema.recipes.ingredients,
    missing_ingredients: schema.recipes.missing_ingredients,
    nutrition: schema.recipes.nutrition,
    tags: schema.recipes.tags,
    metadata: schema.recipes.metadata,
    score: schema.recipes.score,
    savedId: schema.saved_recipes.id,
  };

  const baseQuery = db
    .select({
      ...recipeSelection,
    })
    .from(schema.recipes)
    .leftJoin(
      schema.saved_recipes,
      and(eq(schema.saved_recipes.recipe_id, schema.recipes.id), eq(schema.saved_recipes.user_id, userId))
    );

  const rows = household
    ? await baseQuery
        .where(eq(schema.recipes.household_id, household.id))
        .orderBy(desc(schema.recipes.updated_at))
        .limit(12)
    : await baseQuery
        .where(eq(schema.recipes.created_by, userId))
        .orderBy(desc(schema.recipes.updated_at))
        .limit(12);

  const favoriteRows = await db
    .select({
      ...recipeSelection,
    })
    .from(schema.saved_recipes)
    .innerJoin(schema.recipes, eq(schema.saved_recipes.recipe_id, schema.recipes.id))
    .where(
      and(
        eq(schema.saved_recipes.user_id, userId),
        household ? eq(schema.recipes.household_id, household.id) : eq(schema.recipes.created_by, userId)
      )
    )
    .orderBy(desc(schema.saved_recipes.created_at))
    .limit(8);

  return {
    household,
    recipes: rows.map(mapRecipeListItem),
    favoriteRecipes: favoriteRows.map(mapRecipeListItem),
  };
}

export async function getRecipeDetail(userId: string, recipeId: string) {
  if (!isUuid(recipeId)) {
    return FALLBACK_RECIPE_DETAILS.find((recipe) => recipe.id === recipeId) ?? null;
  }

  const household = await getPrimaryHouseholdForUser(userId);
  const row = await db
    .select({
      id: schema.recipes.id,
      title: schema.recipes.title,
      description: schema.recipes.description,
      servings: schema.recipes.servings,
      cook_time: schema.recipes.cook_time,
      difficulty: schema.recipes.difficulty,
      ingredients: schema.recipes.ingredients,
      missing_ingredients: schema.recipes.missing_ingredients,
      instructions: schema.recipes.instructions,
      waste_notes: schema.recipes.waste_notes,
      tags: schema.recipes.tags,
      nutrition: schema.recipes.nutrition,
      metadata: schema.recipes.metadata,
      score: schema.recipes.score,
      savedId: schema.saved_recipes.id,
    })
    .from(schema.recipes)
    .leftJoin(
      schema.saved_recipes,
      and(eq(schema.saved_recipes.recipe_id, schema.recipes.id), eq(schema.saved_recipes.user_id, userId))
    )
    .where(
      and(
        eq(schema.recipes.id, recipeId),
        household ? eq(schema.recipes.household_id, household.id) : eq(schema.recipes.created_by, userId)
      )
    )
    .limit(1);

  const recipe = row[0];
  if (!recipe) return null;

  const ingredients = normalizeIngredients(recipe.ingredients);
  const missingIngredients = normalizeIngredients(recipe.missing_ingredients);
  const tags = parseJsonValue<string[]>(recipe.tags, []);
  const metadata = parseJsonValue<RecipeMetadata>(recipe.metadata, {});
  const nutrition = parseJsonValue<RecipeNutrition>(recipe.nutrition, {
    calories_kcal: 0,
    protein_g: 0,
    carbs_g: 0,
    fat_g: 0,
  });

  const steps = (recipe.instructions ?? "")
    .split("\n")
    .map((step) => step.trim())
    .filter(Boolean);

  return {
    id: recipe.id,
    title: recipe.title,
    description: recipe.description || "A pantry-friendly recommendation that helps use what you already have.",
    servings: recipe.servings ?? 2,
    cookTime: recipe.cook_time ?? 25,
    difficulty: (recipe.difficulty as "easy" | "medium" | "hard") ?? "easy",
    ingredients,
    missingIngredients,
    tags,
    source: metadata.source ?? "ai_generated",
    isSaved: Boolean(recipe.savedId),
    score: recipe.score != null ? Number(recipe.score) : null,
    steps,
    wasteReductionNote: recipe.waste_notes || "",
    nutrition,
    pantryStaples: metadata.pantry_staples ?? [],
    summary: metadata.summary ?? null,
  };
}

export function getFallbackRecipes(): RecipeListItem[] {
  return FALLBACK_RECIPE_DETAILS.map(mapFallbackRecipeListItem);
}
