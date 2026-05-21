"use server";

import { ensurePersonalHouseholdForUser } from "@/db/queries/households";
import { requireUser } from "@/lib/auth";
import { canEditHouseholdInventory } from "@/features/household/constants";
import {
  addRecipeToActiveMealPlanForUser,
  favoriteMealPlanItemRecipeForUser,
  getMealPlanningPageData,
  markMealPlanItemCookedForUser,
  reopenMealPlanItemForUser,
  saveCurrentMealPlanForUser,
  skipMealPlanItemForHousehold,
} from "@/features/meal-planning/services/meal-plan.service";
import { addUniqueItemsToShoppingList } from "@/services/shopping-list.service";
import { revalidatePath } from "next/cache";
import { z } from "zod";

export type MealPlanActionState = {
  success: boolean;
  message?: string | null;
  error?: string | null;
};

const optimizerSchema = z.object({
  days: z.coerce.number().int().min(1).max(7).default(5),
  inventoryOnly: z.coerce.boolean().optional().default(false),
});

const mealPlanItemSchema = z.object({
  itemId: z.string().uuid(),
});

const recipeMealPlanSchema = z.object({
  recipeId: z.string().uuid(),
});

function revalidateMealPlanPaths() {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/meal-plan");
  revalidatePath("/dashboard/inventory");
  revalidatePath("/dashboard/shopping");
}

function cannotEditInventoryState(): MealPlanActionState {
  return {
    success: false,
    error: "You do not have permission to change this household inventory.",
  };
}

export async function addOptimizedShoppingItemsAction(
  _prevState: MealPlanActionState,
  formData: FormData
): Promise<MealPlanActionState> {
  const parsed = optimizerSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid meal plan options",
    };
  }

  const user = await requireUser();
  const household = await ensurePersonalHouseholdForUser(user);
  const data = await getMealPlanningPageData(user.id, {
    days: parsed.data.days,
    inventoryOnly: parsed.data.inventoryOnly,
  });
  const addableItems = data.shoppingSuggestions
    .filter((item) => !item.alreadyOnList)
    .map((item) => ({
      name: item.name,
      quantity: item.quantity,
      unit: item.unit,
    }));

  if (addableItems.length === 0) {
    return {
      success: true,
      message: "Your optimized items are already covered.",
    };
  }

  const result = await addUniqueItemsToShoppingList(household.id, user.id, addableItems, {
    listName: "Smart meal plan",
  });

  revalidateMealPlanPaths();

  if (result.insertedCount === 0) {
    return {
      success: true,
      message: "No new items were needed for this plan.",
    };
  }

  return {
    success: true,
    message: `${result.insertedCount} optimized item${result.insertedCount === 1 ? "" : "s"} added to shopping.`,
  };
}

export async function saveCurrentMealPlanAction(
  _prevState: MealPlanActionState,
  formData: FormData
): Promise<MealPlanActionState> {
  const parsed = optimizerSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid meal plan options",
    };
  }

  try {
    const user = await requireUser();
    const household = await ensurePersonalHouseholdForUser(user);
    const saved = await saveCurrentMealPlanForUser(user.id, household.id, {
      days: parsed.data.days,
      inventoryOnly: parsed.data.inventoryOnly,
    });

    revalidateMealPlanPaths();

    return {
      success: true,
      message: `${saved.name} saved with ${saved.itemCount} meals.`,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unable to save meal plan",
    };
  }
}

export async function addRecipeToMealPlanAction(
  _prevState: MealPlanActionState,
  formData: FormData
): Promise<MealPlanActionState> {
  const parsed = recipeMealPlanSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid recipe selection",
    };
  }

  try {
    const user = await requireUser();
    const household = await ensurePersonalHouseholdForUser(user);
    const result = await addRecipeToActiveMealPlanForUser(user.id, household.id, parsed.data.recipeId);

    revalidateMealPlanPaths();
    revalidatePath(`/dashboard/recipes/${parsed.data.recipeId}`);

    if (result.alreadyAdded) {
      return {
        success: true,
        message: `${result.title} is already in ${result.planName}.`,
      };
    }

    return {
      success: true,
      message: `${result.title} added to ${result.planName}.`,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unable to add recipe to meal plan",
    };
  }
}

export async function favoriteMealPlanItemRecipeAction(
  _prevState: MealPlanActionState,
  formData: FormData
): Promise<MealPlanActionState> {
  const parsed = mealPlanItemSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid meal selection",
    };
  }

  try {
    const user = await requireUser();
    const household = await ensurePersonalHouseholdForUser(user);
    const result = await favoriteMealPlanItemRecipeForUser(user.id, household.id, parsed.data.itemId);

    revalidateMealPlanPaths();
    revalidatePath("/dashboard/recipes");
    revalidatePath(`/dashboard/recipes/${result.recipeId}`);

    return {
      success: true,
      message: result.createdRecipe
        ? `${result.title} saved as a favorite recipe.`
        : `${result.title} added to favorite recipes.`,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unable to favorite this meal",
    };
  }
}

export async function markMealPlanItemCookedAction(
  _prevState: MealPlanActionState,
  formData: FormData
): Promise<MealPlanActionState> {
  const parsed = mealPlanItemSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid meal selection",
    };
  }

  try {
    const user = await requireUser();
    const household = await ensurePersonalHouseholdForUser(user);
    if (!canEditHouseholdInventory(household.role)) return cannotEditInventoryState();

    const result = await markMealPlanItemCookedForUser(user.id, household.id, parsed.data.itemId);

    revalidateMealPlanPaths();

    if (result.alreadyCooked) {
      return {
        success: true,
        message: `${result.title} was already marked cooked.`,
      };
    }

    return {
      success: true,
      message:
        result.usedCount > 0
          ? `${result.title} cooked. ${result.usedCount} inventory item${result.usedCount === 1 ? "" : "s"} updated.`
          : `${result.title} cooked. No inventory quantities needed changes.`,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unable to mark meal cooked",
    };
  }
}

export async function skipMealPlanItemAction(
  _prevState: MealPlanActionState,
  formData: FormData
): Promise<MealPlanActionState> {
  const parsed = mealPlanItemSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid meal selection",
    };
  }

  try {
    const user = await requireUser();
    const household = await ensurePersonalHouseholdForUser(user);
    const result = await skipMealPlanItemForHousehold(household.id, parsed.data.itemId);

    revalidateMealPlanPaths();

    return {
      success: true,
      message: `${result.title} skipped.`,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unable to skip meal",
    };
  }
}

export async function reopenMealPlanItemAction(
  _prevState: MealPlanActionState,
  formData: FormData
): Promise<MealPlanActionState> {
  const parsed = mealPlanItemSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid meal selection",
    };
  }

  try {
    const user = await requireUser();
    const household = await ensurePersonalHouseholdForUser(user);
    if (!canEditHouseholdInventory(household.role)) return cannotEditInventoryState();

    const result = await reopenMealPlanItemForUser(user.id, household.id, parsed.data.itemId);

    revalidateMealPlanPaths();

    if (result.alreadyPlanned) {
      return {
        success: true,
        message: `${result.title} is already planned.`,
      };
    }

    return {
      success: true,
      message:
        result.restoredCount > 0
          ? `${result.title} reopened. ${result.restoredCount} inventory item${result.restoredCount === 1 ? "" : "s"} restored.`
          : `${result.title} reopened.`,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unable to reopen meal",
    };
  }
}
