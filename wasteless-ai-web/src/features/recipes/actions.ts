"use server";

import { z } from "zod";
import { db } from "@/db";
import * as schema from "@/db/schema/tables";
import { requireUser } from "@/lib/auth";
import { ensurePersonalHouseholdForUser } from "@/db/queries/households";
import { getRecipeDetail } from "@/db/queries/recipes";
import { toggleSavedRecipe, updateRecipePreferences } from "@/services/recipes.service";
import { recipePreferencesSchema } from "@/validation/recipes";
import type { RecipeListItem } from "@/types/recipes";
import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";

export type RecipeActionState = {
  success: boolean;
  message?: string | null;
  error?: string | null;
};

const recipeSnapshotSchema = z.object({
  id: z.string().min(1),
  title: z.string().trim().min(3).max(160),
  description: z.string().trim().min(3).max(500),
  servings: z.number().int().min(1).max(24),
  cookTime: z.number().int().min(1).max(300),
  difficulty: z.enum(["easy", "medium", "hard"]),
  ingredients: z
    .array(
      z.object({
        name: z.string().trim().min(1).max(160),
        quantity: z.string().trim().max(64).optional(),
        unit: z.string().trim().max(64).optional(),
        notes: z.string().trim().max(160).optional(),
        isOptional: z.boolean().optional(),
        isExpiring: z.boolean().optional(),
      })
    )
    .default([]),
  missingIngredients: z
    .array(
      z.object({
        name: z.string().trim().min(1).max(160),
        quantity: z.string().trim().max(64).optional(),
        unit: z.string().trim().max(64).optional(),
        notes: z.string().trim().max(160).optional(),
        isOptional: z.boolean().optional(),
        isExpiring: z.boolean().optional(),
      })
    )
    .default([]),
  nutrition: z.object({
    calories_kcal: z.number().min(0).max(5000),
    protein_g: z.number().min(0).max(500),
    carbs_g: z.number().min(0).max(800),
    fat_g: z.number().min(0).max(500),
    fiber_g: z.number().min(0).max(300).optional(),
    sugar_g: z.number().min(0).max(500).optional(),
    sodium_mg: z.number().min(0).max(20000).optional(),
  }),
  tags: z.array(z.string().trim().min(1).max(40)).max(12).default([]),
  source: z.string().trim().min(1).max(80),
  isSaved: z.boolean(),
  score: z.number().nullable(),
});

function parseList(value: FormDataEntryValue | null) {
  if (!value) return [];
  return String(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export async function updateRecipePreferencesAction(
  _prevState: RecipeActionState,
  formData: FormData
): Promise<RecipeActionState> {
  const user = await requireUser();

  const data = {
    cuisines: parseList(formData.get("cuisines")),
    diets: parseList(formData.get("diets")),
    allergens: parseList(formData.get("allergens")),
    dislikes: parseList(formData.get("dislikes")),
    maxCookTimeMinutes: formData.get("maxCookTimeMinutes")
      ? Number(formData.get("maxCookTimeMinutes"))
      : undefined,
    servings: formData.get("servings") ? Number(formData.get("servings")) : undefined,
    difficulty: formData.get("difficulty") ? String(formData.get("difficulty")) : undefined,
    notes: formData.get("notes") ? String(formData.get("notes")) : undefined,
  };

  const parsed = recipePreferencesSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid preferences" };
  }

  await updateRecipePreferences(user.id, parsed.data);
  revalidatePath("/dashboard/recipes");

  return { success: true, message: "Recipe preferences updated." };
}

export async function toggleSavedRecipeAction(recipeId: string): Promise<RecipeActionState & { saved?: boolean }> {
  const parsedRecipeId = z.string().uuid().safeParse(recipeId);
  if (!parsedRecipeId.success) {
    return { success: false, error: "Only generated recipes can be saved." };
  }

  const user = await requireUser();
  const recipe = await getRecipeDetail(user.id, parsedRecipeId.data);
  if (!recipe) {
    return { success: false, error: "Recipe not found" };
  }

  const result = await toggleSavedRecipe(user.id, parsedRecipeId.data);
  revalidatePath("/dashboard/recipes");
  revalidatePath(`/dashboard/recipes/${parsedRecipeId.data}`);

  return {
    success: true,
    message: result.saved ? "Recipe saved." : "Recipe removed from favorites.",
    saved: result.saved,
  };
}

export async function saveRecipeSnapshotAsFavoriteAction(
  snapshot: RecipeListItem
): Promise<RecipeActionState & { saved?: boolean; recipe?: RecipeListItem }> {
  const parsed = recipeSnapshotSchema.safeParse(snapshot);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid recipe" };
  }

  const user = await requireUser();
  const household = await ensurePersonalHouseholdForUser(user);
  const recipe = parsed.data;

  const inserted = await db
    .insert(schema.recipes)
    .values({
      household_id: household.id,
      created_by: user.id,
      title: recipe.title,
      description: recipe.description,
      difficulty: recipe.difficulty,
      servings: recipe.servings,
      cook_time: recipe.cookTime,
      ingredients: recipe.ingredients,
      missing_ingredients: recipe.missingIngredients,
      nutrition: recipe.nutrition,
      instructions: [
        "Review the ingredients and prep anything that is close to expiring.",
        "Cook the main ingredients until tender and season as you go.",
        "Serve while warm and note any useful adjustments for next time.",
      ].join("\n"),
      waste_notes: "Saved from a recipe card to help reduce household food waste.",
      tags: recipe.tags,
      score: recipe.score != null ? String(recipe.score) : null,
      metadata: {
        source: recipe.source,
        original_id: recipe.id,
      },
    })
    .returning({ id: schema.recipes.id });

  const savedRecipeId = inserted[0]?.id;
  if (!savedRecipeId) {
    return { success: false, error: "Unable to save recipe" };
  }

  await db
    .insert(schema.saved_recipes)
    .values({ recipe_id: savedRecipeId, user_id: user.id })
    .onConflictDoNothing();

  revalidatePath("/dashboard/recipes");
  revalidatePath(`/dashboard/recipes/${savedRecipeId}`);

  return {
    success: true,
    message: "Recipe saved to favorites.",
    saved: true,
    recipe: {
      ...recipe,
      id: savedRecipeId,
      isSaved: true,
    },
  };
}

const shoppingListSchema = z.object({
  recipeId: z.string().uuid(),
  listId: z.string().uuid().optional().or(z.literal("")),
});

async function getOwnedShoppingList(listId: string, householdId: string) {
  const lists = await db
    .select({ id: schema.shopping_lists.id })
    .from(schema.shopping_lists)
    .where(and(eq(schema.shopping_lists.id, listId), eq(schema.shopping_lists.household_id, householdId)))
    .limit(1);

  return lists[0] ?? null;
}

async function getOrCreateShoppingList(householdId: string, userId: string, listId?: string) {
  if (listId) {
    const ownedList = await getOwnedShoppingList(listId, householdId);
    if (ownedList) return ownedList;
  }

  const existing = await db
    .select({ id: schema.shopping_lists.id })
    .from(schema.shopping_lists)
    .where(eq(schema.shopping_lists.household_id, householdId))
    .limit(1);

  if (existing[0]) return existing[0];

  const inserted = await db
    .insert(schema.shopping_lists)
    .values({
      household_id: householdId,
      name: "Recipe essentials",
      created_by: userId,
    })
    .returning({ id: schema.shopping_lists.id });

  return inserted[0];
}

export async function createShoppingListFromMissingAction(
  _prevState: RecipeActionState,
  formData: FormData
): Promise<RecipeActionState> {
  const user = await requireUser();
  const parsed = shoppingListSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid recipe selection" };
  }

  const recipe = await getRecipeDetail(user.id, parsed.data.recipeId);
  if (!recipe) {
    return { success: false, error: "Recipe not found" };
  }

  if (recipe.missingIngredients.length === 0) {
    return { success: false, error: "No missing ingredients for this recipe" };
  }

  const household = await ensurePersonalHouseholdForUser(user);
  const list = await getOrCreateShoppingList(household.id, user.id, parsed.data.listId || undefined);

  const existingItems = await db
    .select({ name: schema.shopping_list_items.name })
    .from(schema.shopping_list_items)
    .where(eq(schema.shopping_list_items.shopping_list_id, list.id));

  const existingNames = new Set(existingItems.map((item) => item.name.toLowerCase()));
  const toInsert = recipe.missingIngredients.filter(
    (item) => !existingNames.has(item.name.toLowerCase())
  );

  if (toInsert.length === 0) {
    return { success: true, message: "Missing items are already in your shopping list." };
  }

  await db.insert(schema.shopping_list_items).values(
    toInsert.map((item) => ({
      shopping_list_id: list.id,
      name: item.name,
      quantity: item.quantity || "1",
      unit: item.unit || null,
      checked: false,
    }))
  );

  revalidatePath("/dashboard/shopping");

  return { success: true, message: `${toInsert.length} items added to your shopping list.` };
}
