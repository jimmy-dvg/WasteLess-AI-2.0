import { NextResponse } from "next/server";
import { z } from "zod";
import { ensurePersonalHouseholdForUser } from "@/db/queries/households";
import { saveCurrentMealPlanForUser } from "@/features/meal-planning/services/meal-plan.service";
import { requireApiUser } from "@/lib/auth";
import { safeRouteErrorMessage } from "@/lib/api-response";

export const dynamic = "force-dynamic";

const saveMealPlanSchema = z.object({
  days: z.coerce.number().int().min(1).max(7).optional().default(5),
  inventoryOnly: z.coerce.boolean().optional().default(false),
});

export async function POST(request: Request) {
  const auth = await requireApiUser();
  if (!auth.success) return auth.response;

  const body = await request.json().catch(() => null);
  const parsed = saveMealPlanSchema.safeParse(body ?? {});

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.issues[0]?.message ?? "Invalid meal plan options" },
      { status: 400 }
    );
  }

  try {
    const household = await ensurePersonalHouseholdForUser(auth.user);
    const saved = await saveCurrentMealPlanForUser(auth.user.id, household.id, parsed.data);

    return NextResponse.json(
      {
        success: true,
        data: {
          saved,
          message: `${saved.name} saved with ${saved.itemCount} meals.`,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/meal-plan/save failed", error);
    return NextResponse.json(
      {
        success: false,
        error: safeRouteErrorMessage(error, "Unable to save meal plan"),
      },
      { status: 500 }
    );
  }
}
