import ErrorState from "@/components/dashboard/ErrorState";
import PageHeader from "@/components/dashboard/PageHeader";
import { getMealPlanningPageData } from "@/features/meal-planning/services/meal-plan.service";
import SmartMealPlan from "@/features/meal-planning/components/SmartMealPlan";
import { requireUser } from "@/lib/auth";
import Link from "next/link";

export const dynamic = "force-dynamic";

type MealPlanPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function getParam(params: Record<string, string | string[] | undefined>, key: string) {
  const value = params[key];
  return Array.isArray(value) ? value[0] : value;
}

function getParamList(params: Record<string, string | string[] | undefined>, key: string) {
  const value = params[key];
  if (!value) return [];
  return Array.isArray(value) ? value.filter(Boolean) : [value].filter(Boolean);
}

export default async function MealPlanPage({ searchParams }: MealPlanPageProps) {
  const user = await requireUser();
  const params = searchParams ? await searchParams : {};
  const inventoryOnly = getParam(params, "inventoryOnly") === "1";
  const excludedMealTitles = getParamList(params, "exclude");
  let data;

  try {
    data = await getMealPlanningPageData(user.id, { inventoryOnly, excludedMealTitles });
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
              href={inventoryOnly ? "/dashboard/meal-plan" : "/dashboard/meal-plan?inventoryOnly=1"}
              className="inline-flex rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              {inventoryOnly ? "Allow shopping items" : "Only current inventory"}
            </Link>
            <Link
              href="/dashboard/recipes"
              className="inline-flex rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
            >
              Recipes
            </Link>
          </div>
        }
      />
      <SmartMealPlan data={data} />
    </div>
  );
}
