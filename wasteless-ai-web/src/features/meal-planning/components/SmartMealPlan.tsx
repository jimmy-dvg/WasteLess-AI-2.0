import EmptyState from "@/components/dashboard/EmptyState";
import StatsCard from "@/components/dashboard/StatsCard";
import StatusBadge from "@/components/dashboard/StatusBadge";
import type {
  MealPlanningData,
  SavedMealPlanItem,
  ShoppingOptimizerItem,
} from "@/features/meal-planning/services/meal-plan.service";
import { formatDate } from "@/lib/dashboard-utils";
import Link from "next/link";
import AddOptimizedShoppingButton from "./AddOptimizedShoppingButton";
import FavoriteMealPlanRecipeButton from "./FavoriteMealPlanRecipeButton";
import MealPlanItemActions from "./MealPlanItemActions";
import MealPlanRecipeButton from "./MealPlanRecipeButton";
import SaveMealPlanButton from "./SaveMealPlanButton";
import SaveRecipeButton from "@/features/recipes/components/SaveRecipeButton";
import type { RecipeDetail, RecipeIngredient, RecipeListItem } from "@/types/recipes";

type SmartMealPlanProps = {
  data: MealPlanningData;
};

const priorityStyles: Record<ShoppingOptimizerItem["priority"], string> = {
  high: "bg-amber-50 text-amber-800 ring-amber-100",
  normal: "bg-slate-100 text-slate-700 ring-slate-200",
  optional: "bg-emerald-50 text-emerald-700 ring-emerald-100",
};

const mealStatusStyles: Record<SavedMealPlanItem["status"], string> = {
  planned: "bg-slate-100 text-slate-700 ring-slate-200",
  cooked: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  skipped: "bg-amber-50 text-amber-800 ring-amber-100",
};

function formatSource(source: string) {
  return source.replace(/_/g, " ");
}

function toMealPlanRecipePreview(input: {
  id: string;
  title: string;
  description: string | null;
  cookTime: number | null;
  servings: number | null;
  score: number | null;
  priorityItems: string[];
  missingItems: RecipeIngredient[];
  tags?: string[];
}): RecipeDetail {
  const ingredientMap = new Map<string, RecipeIngredient>();

  input.priorityItems.forEach((name) => {
    const key = name.toLowerCase();
    if (!ingredientMap.has(key)) ingredientMap.set(key, { name, isExpiring: true });
  });

  input.missingItems.forEach((item) => {
    const key = item.name.toLowerCase();
    if (!ingredientMap.has(key)) ingredientMap.set(key, item);
  });

  const ingredients = Array.from(ingredientMap.values());

  return {
    id: `meal-plan-${input.id}`,
    title: input.title,
    description: input.description ?? "A meal plan pick built from your current inventory and saved recipes.",
    servings: input.servings ?? 2,
    cookTime: input.cookTime ?? 25,
    difficulty: "easy",
    ingredients: ingredients.length > 0 ? ingredients : [{ name: input.title }],
    missingIngredients: input.missingItems,
    nutrition: {
      calories_kcal: 0,
      protein_g: 0,
      carbs_g: 0,
      fat_g: 0,
    },
    tags: input.tags ?? ["meal plan"],
    source: "meal_plan",
    isSaved: false,
    score: input.score,
    steps: [
      "Review the ingredients and prep anything that is close to expiring.",
      "Cook the main ingredients until tender and season as you go.",
      "Serve the meal while noting anything that should be adjusted next time.",
    ],
    wasteReductionNote: "This meal was selected to help use current household inventory before it goes unused.",
    pantryStaples: [],
    summary: null,
  };
}

function toRecipeListItem(recipe: RecipeDetail): RecipeListItem {
  return {
    id: recipe.id,
    title: recipe.title,
    description: recipe.description,
    servings: recipe.servings,
    cookTime: recipe.cookTime,
    difficulty: recipe.difficulty,
    ingredients: recipe.ingredients,
    missingIngredients: recipe.missingIngredients,
    nutrition: recipe.nutrition,
    tags: recipe.tags,
    source: recipe.source,
    isSaved: recipe.isSaved,
    score: recipe.score,
  };
}

function buildMealPlanUrl(data: MealPlanningData, nextExcludedTitle?: string) {
  const params = new URLSearchParams();
  if (data.controls.inventoryOnly) params.set("inventoryOnly", "1");

  const excludedTitles = nextExcludedTitle
    ? [...data.controls.excludedMealTitles, nextExcludedTitle]
    : data.controls.excludedMealTitles;

  excludedTitles.forEach((title) => params.append("exclude", title));
  const query = params.toString();
  return query ? `/dashboard/meal-plan?${query}` : "/dashboard/meal-plan";
}

function SavedPlanPanel({ data }: { data: MealPlanningData }) {
  const savedPlan = data.savedPlan;
  if (!savedPlan) return null;

  return (
    <section className="rounded-lg border border-emerald-200 bg-white shadow-sm">
      <div className="border-b border-emerald-100 p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-normal text-emerald-700">Active weekly plan</p>
            <h2 className="mt-2 text-lg font-bold text-slate-950">{savedPlan.name}</h2>
            <p className="mt-1 text-sm text-slate-500">
              {formatDate(savedPlan.startDate)} - {formatDate(savedPlan.endDate)}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs font-semibold">
            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-700">
              {savedPlan.stats.cookedMeals} cooked
            </span>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-700">
              {savedPlan.stats.plannedMeals} planned
            </span>
            <span className="rounded-full bg-amber-50 px-2.5 py-1 text-amber-800">
              {savedPlan.stats.skippedMeals} skipped
            </span>
          </div>
        </div>
      </div>

      <div className="divide-y divide-slate-100">
        {savedPlan.items.map((item) => {
          const previewRecipe = toMealPlanRecipePreview({
            id: item.id,
            title: item.title,
            description: item.description,
            cookTime: item.cookTime,
            servings: item.servings,
            score: item.score,
            priorityItems: item.priorityItems,
            missingItems: item.missingItems,
          });

          return (
            <article key={item.id} className="p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-xs font-semibold uppercase tracking-normal text-slate-500">{item.dateLabel}</p>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${mealStatusStyles[item.status]}`}>
                      {item.status}
                    </span>
                  </div>
                  <MealPlanRecipeButton
                    recipeId={item.recipeId}
                    title={item.title}
                    fallbackRecipe={previewRecipe}
                    className="mt-2 block cursor-pointer text-left text-base font-bold text-slate-950 hover:text-emerald-700"
                  >
                    {item.title}
                  </MealPlanRecipeButton>
                  {item.description ? <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p> : null}
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  <MealPlanRecipeButton
                    recipeId={item.recipeId}
                    title={item.title}
                    fallbackRecipe={previewRecipe}
                    className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
                  >
                    View recipe
                  </MealPlanRecipeButton>
                  <FavoriteMealPlanRecipeButton itemId={item.id} initialFavorited={item.isSaved} />
                  <MealPlanItemActions itemId={item.id} status={item.status} />
                </div>
              </div>

              {item.consumptionSuggestions.length > 0 ? (
                <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-normal text-slate-500">Inventory updates on cooked</p>
                  <ul className="mt-3 grid gap-2 text-sm text-slate-700 md:grid-cols-2">
                    {item.consumptionSuggestions.slice(0, 4).map((suggestion) => (
                      <li key={`${item.id}-${suggestion.productId}`}>
                        {suggestion.name}: {suggestion.currentQuantity} to {suggestion.nextQuantity}
                        {suggestion.unit ? ` ${suggestion.unit}` : ""}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </article>
          );
        })}
      </div>
    </section>
  );
}

export default function SmartMealPlan({ data }: SmartMealPlanProps) {
  const statCards = [
    {
      label: "Planned meals",
      value: data.stats.plannedMeals,
      description: "Built from recipes and inventory priorities",
      marker: "M",
    },
    {
      label: "Expiring used",
      value: data.stats.expiringUsed,
      description: "Items pulled into this meal plan",
      marker: "E",
    },
    {
      label: "Addable items",
      value: data.stats.addableShoppingItems,
      description: "Missing ingredients not already listed",
      marker: "A",
    },
    {
      label: "Scanner inputs",
      value: data.scanner.importedProductCount,
      description: "Imported products considered by the optimizer",
      marker: "S",
    },
  ];

  return (
    <div className="space-y-6">
      <section aria-label="Meal plan overview" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => (
          <StatsCard key={card.label} {...card} />
        ))}
      </section>

      <SavedPlanPanel data={data} />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(340px,0.75fr)]">
        <section className="space-y-4">
          {data.planDays.length === 0 ? (
            <EmptyState
              title="No meal plan yet"
              description="Add inventory items or generate recipes so the planner can build a week from what you have."
              action={
                <Link
                  href="/dashboard/inventory"
                  className="inline-flex rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                >
                  Add inventory
                </Link>
              }
            />
          ) : null}

          {data.planDays.map((day) => {
            const previewRecipe = toMealPlanRecipePreview({
              id: day.id,
              title: day.title,
              description: day.description,
              cookTime: day.cookTime,
              servings: day.servings,
              score: day.score,
              priorityItems: day.priorityItems,
              missingItems: day.missingItems,
              tags: day.tags,
            });

            return (
              <article
                key={day.id}
                className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:border-emerald-200 hover:shadow-md"
              >
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-normal text-emerald-700">
                    {day.dateLabel} - {formatSource(day.source)}
                  </p>
                  <MealPlanRecipeButton
                    recipeId={day.recipeId}
                    title={day.title}
                    fallbackRecipe={previewRecipe}
                    className="mt-2 block cursor-pointer text-left text-lg font-bold text-slate-950 hover:text-emerald-700"
                  >
                    {day.title}
                  </MealPlanRecipeButton>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{day.description}</p>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2 text-xs font-semibold">
                  <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-700">
                    {day.inventoryCoverage}% inventory
                  </span>
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-700">{day.score} score</span>
                  {data.controls.inventoryOnly ? (
                    <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-700">
                      no shopping
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2 text-xs font-medium text-slate-600">
                <span className="rounded-full bg-slate-100 px-2.5 py-1">{day.cookTime} min</span>
                <span className="rounded-full bg-slate-100 px-2.5 py-1">{day.servings} servings</span>
                {day.tags.slice(0, 3).map((tag) => (
                  <span key={tag} className="rounded-full bg-slate-100 px-2.5 py-1">
                    {tag}
                  </span>
                ))}
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <div>
                  <h3 className="text-sm font-semibold text-slate-950">Use first</h3>
                  {day.priorityItems.length > 0 ? (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {day.priorityItems.map((item) => (
                        <span key={item} className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800">
                          {item}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-2 text-sm text-slate-500">No urgent inventory required.</p>
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-950">
                    {day.missingItems.length > 0 ? "Missing" : "Shopping"}
                  </h3>
                  {day.missingItems.length > 0 ? (
                    <ul className="mt-2 space-y-1 text-sm text-slate-600">
                      {day.missingItems.slice(0, 4).map((item) => (
                        <li key={`${day.id}-${item.name}`}>
                          {[item.quantity, item.unit, item.name].filter(Boolean).join(" ")}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-2 text-sm text-emerald-700">
                      {data.controls.inventoryOnly ? "No shopping needed." : "Covered by current inventory."}
                    </p>
                  )}
                </div>
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                <Link
                  href={buildMealPlanUrl(data, day.title)}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Try another
                </Link>
                <MealPlanRecipeButton
                  recipeId={day.recipeId}
                  title={day.title}
                  fallbackRecipe={previewRecipe}
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
                >
                  View recipe
                </MealPlanRecipeButton>
                <SaveRecipeButton
                  recipeId={day.recipeId ?? previewRecipe.id}
                  initialSaved={day.isSaved}
                  recipeSnapshot={day.recipeId ? undefined : toRecipeListItem(previewRecipe)}
                />
              </div>
            </article>
            );
          })}
        </section>

        <aside className="space-y-6">
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-950">Weekly workflow</h2>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              Save this recommendation to track cooked meals and update inventory as meals happen.
            </p>
            {data.controls.inventoryOnly ? (
              <div className="mt-3 rounded-lg border border-emerald-100 bg-emerald-50 p-3 text-sm text-emerald-800">
                This plan is using only current inventory and pantry staples.
              </div>
            ) : null}
            <div className="mt-4">
              <SaveMealPlanButton
                days={Math.max(data.planDays.length, 1)}
                disabled={data.planDays.length === 0}
                inventoryOnly={data.controls.inventoryOnly}
              />
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-950">Shopping optimizer</h2>
                <p className="mt-1 text-sm text-slate-500">
                  {data.shoppingList
                    ? `${data.shoppingList.uncheckedCount} open items in ${data.shoppingList.name}`
                    : "No household shopping list yet"}
                </p>
              </div>
              <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                {data.stats.alreadyListedItems} listed
              </span>
            </div>

            <div className="mt-4">
              <AddOptimizedShoppingButton
                days={Math.max(data.planDays.length, 1)}
                disabled={data.stats.addableShoppingItems === 0}
                inventoryOnly={data.controls.inventoryOnly}
              />
            </div>

            {data.shoppingSuggestions.length === 0 ? (
              <div className="mt-4 rounded-lg border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-800">
                This plan is covered by your current inventory.
              </div>
            ) : (
              <ul className="mt-4 space-y-3">
                {data.shoppingSuggestions.map((item) => (
                  <li key={item.key} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-950">{item.name}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          {[item.quantity, item.unit].filter(Boolean).join(" ") || "1"}
                        </p>
                      </div>
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${priorityStyles[item.priority]}`}>
                        {item.alreadyOnList ? "listed" : item.priority}
                      </span>
                    </div>
                    <p className="mt-3 text-xs leading-5 text-slate-600">{item.reason}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-950">Expiration queue</h2>
            {data.expiringItems.length === 0 && data.expiredItems.length === 0 ? (
              <p className="mt-3 text-sm text-slate-500">No urgent dated items right now.</p>
            ) : null}

            {data.expiringItems.length > 0 ? (
              <ul className="mt-4 space-y-3">
                {data.expiringItems.slice(0, 5).map((item) => (
                  <li key={item.id} className="flex items-start gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-950">{item.name}</p>
                      <p className="text-xs text-slate-500">
                        {item.quantityLabel} - {item.location} - {item.relativeExpiration}
                      </p>
                    </div>
                    <StatusBadge status={item.expirationStatus} />
                  </li>
                ))}
              </ul>
            ) : null}

            {data.expiredItems.length > 0 ? (
              <div className="mt-4 rounded-lg border border-rose-100 bg-rose-50 p-4 text-sm text-rose-800">
                <p className="font-semibold">{data.expiredItems.length} item needs review before planning.</p>
                <p className="mt-1 text-xs">{data.expiredItems[0].name} was dated {formatDate(data.expiredItems[0].expirationDate)}.</p>
              </div>
            ) : null}
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-950">Scanner signal</h2>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-xs font-semibold text-slate-500">Shelf life</p>
                <p className="mt-1 text-xl font-bold text-slate-950">{data.scanner.shelfLifeKnownCount}</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-xs font-semibold text-slate-500">Receipts</p>
                <p className="mt-1 text-xl font-bold text-slate-950">{data.scanner.recentReceiptCount}</p>
              </div>
            </div>
            {data.scanner.recentActivity.length > 0 ? (
              <ul className="mt-4 space-y-2 text-sm text-slate-600">
                {data.scanner.recentActivity.map((activity) => (
                  <li key={activity}>{activity}</li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-sm text-slate-500">No recent scanner activity yet.</p>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}
