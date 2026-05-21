import EmptyState from "@/components/dashboard/EmptyState";
import ErrorState from "@/components/dashboard/ErrorState";
import PageHeader from "@/components/dashboard/PageHeader";
import StatsCard from "@/components/dashboard/StatsCard";
import StatusBadge from "@/components/dashboard/StatusBadge";
import { getDashboardOverview } from "@/db/queries/dashboard";
import { requireUser } from "@/lib/auth";
import { formatDate, formatRelativeExpiration } from "@/lib/dashboard-utils";
import { Barcode, CalendarClock, ChefHat, ClipboardList, Leaf, ShoppingBasket } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await requireUser();
  let data;

  try {
    data = await getDashboardOverview(user.id);
  } catch {
    return <ErrorState />;
  }

  const statCards = [
    {
      label: "Total products",
      value: data.stats.totalProducts,
      description: "Tracked across pantry, fridge, and freezer",
      marker: "P",
    },
    {
      label: "Expiring soon",
      value: data.stats.expiringSoon,
      description: "Items with dates in the next 7 days",
      marker: "E",
    },
    {
      label: "Expired items",
      value: data.stats.expiredItems,
      description: "Needs review before meal planning",
      marker: "X",
    },
    {
      label: "Categories",
      value: data.stats.categoriesCount,
      description: "Categories used to organize products",
      marker: "C",
    },
  ];

  const quickActions = [
    {
      label: "Add inventory",
      description: "Track a new pantry, fridge, or freezer item.",
      href: "/dashboard/inventory#add-inventory-item",
      icon: ClipboardList,
    },
    {
      label: "Scan products",
      description: "Use barcode, receipt, or photo import.",
      href: "/dashboard/scanning",
      icon: Barcode,
    },
    {
      label: "Generate recipes",
      description: "Use expiring ingredients in meal ideas.",
      href: "/dashboard/recipes",
      icon: ChefHat,
    },
    {
      label: "Plan week",
      description: "Build meals around current inventory.",
      href: "/dashboard/meal-plan",
      icon: CalendarClock,
    },
    {
      label: "Shop gaps",
      description: "Review missing ingredients and open items.",
      href: "/dashboard/shopping",
      icon: ShoppingBasket,
    },
    {
      label: "Review waste",
      description: "Find patterns in discarded products.",
      href: "/dashboard/waste",
      icon: Leaf,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome back, ${user.name.split(" ")[0] || user.name}`}
        description="Keep your household inventory visible, act on expiration dates, and plan meals from what you already own."
        action={
          <Link
            href="/dashboard/inventory"
            className="inline-flex rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
          >
            Manage inventory
          </Link>
        }
      />

      <section aria-label="Dashboard overview" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => (
          <StatsCard key={card.label} {...card} />
        ))}
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">Quick actions</h2>
            <p className="text-sm text-slate-500">Start the most common waste-reduction workflows from one place.</p>
          </div>
          <Link href="/dashboard/recipes" className="text-sm font-semibold text-emerald-700 hover:text-emerald-800">
            Smart suggestions
          </Link>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {quickActions.map((action) => {
            const Icon = action.icon;

            return (
              <Link
                key={action.href}
                href={action.href}
                className="group rounded-lg border border-slate-200 bg-slate-50 p-4 transition hover:border-emerald-200 hover:bg-emerald-50"
              >
                <div className="flex items-start gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-white text-emerald-700 ring-1 ring-slate-200 group-hover:ring-emerald-200">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-slate-950">{action.label}</h3>
                    <p className="mt-1 text-xs leading-5 text-slate-500">{action.description}</p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,0.8fr)]">
        <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between gap-4 border-b border-slate-200 p-5">
            <div>
              <h2 className="text-lg font-semibold text-slate-950">Recent inventory</h2>
              <p className="text-sm text-slate-500">Latest items and expiration status</p>
            </div>
            <Link href="/dashboard/inventory" className="text-sm font-semibold text-emerald-700 hover:text-emerald-800">
              View all
            </Link>
          </div>

          {data.recentInventory.length === 0 ? (
            <div className="p-5">
              <EmptyState
                title="No inventory yet"
                description="Add products to start tracking quantities, locations, and expiration dates."
                action={
                  <Link
                    href="/dashboard/inventory"
                    className="inline-flex rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                  >
                    Add product
                  </Link>
                }
              />
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {data.recentInventory.map((item) => (
                <article key={item.id} className="flex items-center gap-4 p-4 transition hover:bg-slate-50">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-emerald-50 text-sm font-bold text-emerald-700">
                    {item.name[0]?.toUpperCase() ?? "I"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h3 className="truncate text-sm font-semibold text-slate-950">{item.name}</h3>
                        <p className="text-xs capitalize text-slate-500">
                          {item.quantity} in {item.location}
                        </p>
                      </div>
                      <StatusBadge status={item.status} />
                    </div>
                    <p className="mt-2 text-xs text-slate-500">
                      {formatDate(item.expirationDate)} - {formatRelativeExpiration(item.expirationDate)}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-950">Smart insights</h2>
              <p className="text-sm text-slate-500">Generated from household activity</p>
            </div>
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
              AI ready
            </span>
          </div>
          <ul className="mt-5 space-y-3">
            {data.insights.map((insight) => (
              <li key={insight} className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                {insight}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
