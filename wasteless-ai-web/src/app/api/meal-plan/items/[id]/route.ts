import { NextResponse } from "next/server";
import { z } from "zod";
import { ensurePersonalHouseholdForUser } from "@/db/queries/households";
import { canEditHouseholdInventory } from "@/features/household/constants";
import {
  markMealPlanItemCookedForUser,
  reopenMealPlanItemForUser,
  skipMealPlanItemForHousehold,
} from "@/features/meal-planning/services/meal-plan.service";
import { requireApiUser } from "@/lib/auth";
import { safeRouteErrorMessage } from "@/lib/api-response";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string }>;
};

const actionSchema = z.object({
  action: z.enum(["cooked", "skipped", "planned"]),
});

async function getMealPlanItemId(context: RouteContext) {
  const { id } = await context.params;
  return id;
}

export async function PATCH(request: Request, context: RouteContext) {
  const auth = await requireApiUser();
  if (!auth.success) return auth.response;

  const id = await getMealPlanItemId(context);
  const parsedId = z.string().uuid().safeParse(id);
  if (!parsedId.success) {
    return NextResponse.json({ success: false, error: "Invalid meal plan item" }, { status: 400 });
  }

  const body = await request.json().catch(() => null);
  const parsed = actionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.issues[0]?.message ?? "Invalid meal plan action" },
      { status: 400 }
    );
  }

  try {
    const household = await ensurePersonalHouseholdForUser(auth.user);

    if (parsed.data.action === "skipped") {
      const result = await skipMealPlanItemForHousehold(household.id, parsedId.data);
      return NextResponse.json({ success: true, data: { message: `${result.title} skipped.` } }, { status: 200 });
    }

    if (!canEditHouseholdInventory(household.role)) {
      return NextResponse.json(
        { success: false, error: "You do not have permission to change this household inventory." },
        { status: 403 }
      );
    }

    if (parsed.data.action === "cooked") {
      const result = await markMealPlanItemCookedForUser(auth.user.id, household.id, parsedId.data);
      return NextResponse.json(
        {
          success: true,
          data: {
            message: result.alreadyCooked
              ? `${result.title} was already marked cooked.`
              : `${result.title} cooked. ${result.usedCount} inventory item${result.usedCount === 1 ? "" : "s"} updated.`,
          },
        },
        { status: 200 }
      );
    }

    const result = await reopenMealPlanItemForUser(auth.user.id, household.id, parsedId.data);
    return NextResponse.json(
      {
        success: true,
        data: {
          message: result.alreadyPlanned
            ? `${result.title} is already planned.`
            : `${result.title} reopened.`,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("PATCH /api/meal-plan/items/[id] failed", error);
    return NextResponse.json(
      { success: false, error: safeRouteErrorMessage(error, "Unable to update meal plan item") },
      { status: 500 }
    );
  }
}
