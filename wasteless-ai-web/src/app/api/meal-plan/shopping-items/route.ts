import { NextResponse } from "next/server";
import { z } from "zod";
import { ensurePersonalHouseholdForUser } from "@/db/queries/households";
import { getMealPlanningPageData } from "@/features/meal-planning/services/meal-plan.service";
import { requireApiUser } from "@/lib/auth";
import { safeRouteErrorMessage } from "@/lib/api-response";
import { addUniqueItemsToShoppingList } from "@/services/shopping-list.service";

export const dynamic = "force-dynamic";

const shoppingItemsSchema = z.object({
  days: z.coerce.number().int().min(1).max(7).optional().default(5),
  inventoryOnly: z.coerce.boolean().optional().default(false),
});

export async function POST(request: Request) {
  const auth = await requireApiUser();
  if (!auth.success) return auth.response;

  const body = await request.json().catch(() => null);
  const parsed = shoppingItemsSchema.safeParse(body ?? {});

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.issues[0]?.message ?? "Invalid meal plan options" },
      { status: 400 }
    );
  }

  try {
    const household = await ensurePersonalHouseholdForUser(auth.user);
    const data = await getMealPlanningPageData(auth.user.id, parsed.data);
    const addableItems = data.shoppingSuggestions
      .filter((item) => !item.alreadyOnList)
      .map((item) => ({
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
      }));

    if (addableItems.length === 0) {
      return NextResponse.json(
        { success: true, data: { insertedCount: 0, message: "Your optimized items are already covered." } },
        { status: 200 }
      );
    }

    const result = await addUniqueItemsToShoppingList(household.id, auth.user.id, addableItems, {
      listName: "Smart meal plan",
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          ...result,
          message:
            result.insertedCount > 0
              ? `${result.insertedCount} optimized item${result.insertedCount === 1 ? "" : "s"} added to shopping.`
              : "No new items were needed for this plan.",
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("POST /api/meal-plan/shopping-items failed", error);
    return NextResponse.json(
      {
        success: false,
        error: safeRouteErrorMessage(error, "Unable to add optimized shopping items"),
      },
      { status: 500 }
    );
  }
}
