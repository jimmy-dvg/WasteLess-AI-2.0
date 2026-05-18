import "server-only";

import { db } from "@/db";
import * as schema from "@/db/schema/tables";
import { parseJsonValue } from "@/lib/dashboard-utils";
import { and, desc, eq } from "drizzle-orm";
import { getPrimaryHouseholdForUser } from "./households";

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
  tags: unknown;
  metadata: unknown;
  score: string | number | null;
  savedId: string | null;
}) {
  const ingredients = normalizeIngredients(recipe.ingredients);
  const missingIngredients = normalizeIngredients(recipe.missing_ingredients);
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
    tags,
    source: metadata.source ?? "ai_generated",
    isSaved: Boolean(recipe.savedId),
    score: recipe.score != null ? Number(recipe.score) : null,
  };
}

export async function getRecipesPageData(userId: string) {
  const household = await getPrimaryHouseholdForUser(userId);

  const baseQuery = db
    .select({
      id: schema.recipes.id,
      title: schema.recipes.title,
      description: schema.recipes.description,
      servings: schema.recipes.servings,
      cook_time: schema.recipes.cook_time,
      difficulty: schema.recipes.difficulty,
      ingredients: schema.recipes.ingredients,
      missing_ingredients: schema.recipes.missing_ingredients,
      tags: schema.recipes.tags,
      metadata: schema.recipes.metadata,
      score: schema.recipes.score,
      savedId: schema.saved_recipes.id,
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

  return {
    household,
    recipes: rows.map(mapRecipeListItem),
  };
}

export async function getRecipeDetail(userId: string, recipeId: string) {
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

export function getFallbackRecipes() {
  return [
    {
      id: "fallback-greens-bowl",
      title: "Clean-Out-the-Fridge Greens Bowl",
      description: "A fast bowl built around tender greens, grains, and any crisp vegetables nearing their date.",
      servings: 2,
      cookTime: 20,
      ingredients: [
        { name: "leafy greens" },
        { name: "cooked rice" },
        { name: "carrots" },
        { name: "yogurt sauce" },
        { name: "lemon" },
      ],
      missingIngredients: [],
      tags: ["quick", "fresh", "low-waste"],
      source: "ai_recommendation",
      difficulty: "easy",
      isSaved: false,
      score: null,
    },
    {
      id: "fallback-soup",
      title: "Pantry Vegetable Soup",
      description: "A flexible soup for using soft vegetables, herbs, canned beans, and broth before they go unused.",
      servings: 4,
      cookTime: 35,
      ingredients: [
        { name: "mixed vegetables" },
        { name: "beans" },
        { name: "broth" },
        { name: "tomato paste" },
        { name: "herbs" },
      ],
      missingIngredients: [],
      tags: ["batch", "freezer", "comfort"],
      source: "ai_recommendation",
      difficulty: "easy",
      isSaved: false,
      score: null,
    },
    {
      id: "fallback-toast",
      title: "Savory Leftover Toasts",
      description: "Crisp toast topped with odds and ends from the pantry for a low-effort lunch.",
      servings: 2,
      cookTime: 12,
      ingredients: [
        { name: "bread" },
        { name: "cheese" },
        { name: "tomatoes" },
        { name: "greens" },
        { name: "olive oil" },
      ],
      missingIngredients: [],
      tags: ["lunch", "quick", "snack"],
      source: "ai_recommendation",
      difficulty: "easy",
      isSaved: false,
      score: null,
    },
  ];
}
