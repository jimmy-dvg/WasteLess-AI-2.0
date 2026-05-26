import { NextResponse } from "next/server";
import { z } from "zod";
import { getMealPlanningPageData } from "@/features/meal-planning/services/meal-plan.service";
import { requireApiUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

const mealPlanQuerySchema = z.object({
  days: z.coerce.number().int().min(1).max(7).optional().default(5),
  inventoryOnly: z
    .string()
    .optional()
    .transform((value) => value === "true" || value === "1"),
});

export async function GET(request: Request) {
  const auth = await requireApiUser();
  if (!auth.success) return auth.response;

  const url = new URL(request.url);
  const parsed = mealPlanQuerySchema.safeParse(Object.fromEntries(url.searchParams.entries()));

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.issues[0]?.message ?? "Invalid meal plan options" },
      { status: 400 }
    );
  }

  try {
    const data = await getMealPlanningPageData(auth.user.id, parsed.data);
    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch {
    return NextResponse.json({ success: false, error: "Meal plan data is unavailable" }, { status: 500 });
  }
}
