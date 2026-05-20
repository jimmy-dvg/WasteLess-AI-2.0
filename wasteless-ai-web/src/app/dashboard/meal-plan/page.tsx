import ErrorState from "@/components/dashboard/ErrorState";
import PageHeader from "@/components/dashboard/PageHeader";
import { getMealPlanningPageData } from "@/features/meal-planning/services/meal-plan.service";
import SmartMealPlan from "@/features/meal-planning/components/SmartMealPlan";
import { requireUser } from "@/lib/auth";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function MealPlanPage() {
  const user = await requireUser();
  let data;

  try {
    data = await getMealPlanningPageData(user.id);
  } catch {
    return <ErrorState title="Meal planning data is unavailable" />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Smart meal plan"
        description="A weekly plan that prioritizes expiring inventory, recipe matches, scanner imports, and a lean shopping list."
        action={
          <div className="flex flex-wrap gap-3">
            <Link
              href="/dashboard/recipes"
              className="inline-flex rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Recipes
            </Link>
            <Link
              href="/dashboard/shopping"
              className="inline-flex rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
            >
              Shopping list
            </Link>
          </div>
        }
      />
      <SmartMealPlan data={data} />
    </div>
  );
}
