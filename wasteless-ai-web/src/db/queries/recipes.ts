import "server-only";

import { db } from "@/db";
import * as schema from "@/db/schema/tables";
import { parseJsonValue } from "@/lib/dashboard-utils";
import { desc, eq } from "drizzle-orm";
import { getPrimaryHouseholdForUser } from "./households";

type RecipeIngredient = {
  name?: string;
  quantity?: string;
  unit?: string;
};

type RecipeMetadata = {
  source?: string;
  difficulty?: string;
  cuisine?: string;
};

export async function getRecipesPageData(userId: string) {
  const household = await getPrimaryHouseholdForUser(userId);
  const rows = household
    ? await db
        .select()
        .from(schema.recipes)
        .where(eq(schema.recipes.household_id, household.id))
        .orderBy(desc(schema.recipes.updated_at))
        .limit(12)
    : await db
        .select()
        .from(schema.recipes)
        .where(eq(schema.recipes.created_by, userId))
        .orderBy(desc(schema.recipes.updated_at))
        .limit(12);

  return {
    household,
    recipes: rows.map((recipe) => {
      const ingredients = parseJsonValue<RecipeIngredient[]>(recipe.ingredients, []);
      const tags = parseJsonValue<string[]>(recipe.tags, []);
      const metadata = parseJsonValue<RecipeMetadata>(recipe.metadata, {});

      return {
        id: recipe.id,
        title: recipe.title,
        description:
          recipe.description ||
          "A pantry-friendly recommendation that helps use what you already have.",
        servings: recipe.servings ?? 2,
        cookTime: recipe.cook_time ?? 25,
        ingredients: ingredients.slice(0, 5).map((ingredient) => {
          if (ingredient.name) {
            return [ingredient.quantity, ingredient.unit, ingredient.name].filter(Boolean).join(" ");
          }

          return String(ingredient);
        }),
        tags: tags.slice(0, 3),
        source: metadata.source ?? "ai_generated",
        difficulty: metadata.difficulty ?? "easy",
      };
    }),
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
      ingredients: ["leafy greens", "cooked rice", "carrots", "yogurt sauce", "lemon"],
      tags: ["quick", "fresh", "low-waste"],
      source: "ai_recommendation",
      difficulty: "easy",
    },
    {
      id: "fallback-soup",
      title: "Pantry Vegetable Soup",
      description: "A flexible soup for using soft vegetables, herbs, canned beans, and broth before they go unused.",
      servings: 4,
      cookTime: 35,
      ingredients: ["mixed vegetables", "beans", "broth", "tomato paste", "herbs"],
      tags: ["batch", "freezer", "comfort"],
      source: "ai_recommendation",
      difficulty: "easy",
    },
    {
      id: "fallback-toast",
      title: "Savory Leftover Toasts",
      description: "Crisp toast topped with odds and ends from the pantry for a low-effort lunch.",
      servings: 2,
      cookTime: 12,
      ingredients: ["bread", "cheese", "tomatoes", "greens", "olive oil"],
      tags: ["lunch", "quick", "snack"],
      source: "ai_recommendation",
      difficulty: "easy",
    },
  ];
}
