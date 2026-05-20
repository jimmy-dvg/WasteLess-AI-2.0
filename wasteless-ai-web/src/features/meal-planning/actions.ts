"use server";

import { ensurePersonalHouseholdForUser } from "@/db/queries/households";
import { requireUser } from "@/lib/auth";
import {
  getMealPlanningPageData,
  markMealPlanItemCookedForUser,
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
});

const mealPlanItemSchema = z.object({
  itemId: z.string().uuid(),
});

function revalidateMealPlanPaths() {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/meal-plan");
  revalidatePath("/dashboard/inventory");
  revalidatePath("/dashboard/shopping");
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
  const data = await getMealPlanningPageData(user.id, { days: parsed.data.days });
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
    const saved = await saveCurrentMealPlanForUser(user.id, household.id, { days: parsed.data.days });

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
