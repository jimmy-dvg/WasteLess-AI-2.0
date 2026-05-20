"use server";

import { ensurePersonalHouseholdForUser } from "@/db/queries/households";
import { requireUser } from "@/lib/auth";
import { getMealPlanningPageData } from "@/features/meal-planning/services/meal-plan.service";
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

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/meal-plan");
  revalidatePath("/dashboard/shopping");

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
