import EmptyState from "@/components/dashboard/EmptyState";
import StatsCard from "@/components/dashboard/StatsCard";
import StatusBadge from "@/components/dashboard/StatusBadge";
import type {
  MealPlanningData,
  ShoppingOptimizerItem,
} from "@/features/meal-planning/services/meal-plan.service";
import { formatDate } from "@/lib/dashboard-utils";
import Link from "next/link";
import AddOptimizedShoppingButton from "./AddOptimizedShoppingButton";

type SmartMealPlanProps = {
  data: MealPlanningData;
};

const priorityStyles: Record<ShoppingOptimizerItem["priority"], string> = {
  high: "bg-amber-50 text-amber-800 ring-amber-100",
  normal: "bg-slate-100 text-slate-700 ring-slate-200",
  optional: "bg-emerald-50 text-emerald-700 ring-emerald-100",
};

function formatSource(source: string) {
  return source.replace(/_/g, " ");
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

          {data.planDays.map((day) => (
            <article
              key={day.id}
              className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:border-emerald-200 hover:shadow-md"
            >
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-normal text-emerald-700">
                    {day.dateLabel} - {formatSource(day.source)}
                  </p>
                  {day.recipeId ? (
                    <Link
                      href={`/dashboard/recipes/${day.recipeId}`}
                      className="mt-2 block text-lg font-bold text-slate-950 hover:text-emerald-700"
                    >
                      {day.title}
                    </Link>
                  ) : (
                    <h2 className="mt-2 text-lg font-bold text-slate-950">{day.title}</h2>
                  )}
                  <p className="mt-2 text-sm leading-6 text-slate-600">{day.description}</p>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2 text-xs font-semibold">
                  <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-700">
                    {day.inventoryCoverage}% inventory
                  </span>
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-700">{day.score} score</span>
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
                  <h3 className="text-sm font-semibold text-slate-950">Missing</h3>
                  {day.missingItems.length > 0 ? (
                    <ul className="mt-2 space-y-1 text-sm text-slate-600">
                      {day.missingItems.slice(0, 4).map((item) => (
                        <li key={`${day.id}-${item.name}`}>
                          {[item.quantity, item.unit, item.name].filter(Boolean).join(" ")}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-2 text-sm text-emerald-700">Covered by current inventory.</p>
                  )}
                </div>
              </div>
            </article>
          ))}
        </section>

        <aside className="space-y-6">
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
