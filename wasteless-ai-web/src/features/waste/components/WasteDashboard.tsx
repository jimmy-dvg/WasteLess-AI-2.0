import EmptyState from "@/components/dashboard/EmptyState";
import StatsCard from "@/components/dashboard/StatsCard";
import type { WastePageData } from "@/features/waste/services/waste.service";
import { formatDate } from "@/lib/dashboard-utils";
import Link from "next/link";

type WasteDashboardProps = {
  data: WastePageData;
};

export default function WasteDashboard({ data }: WasteDashboardProps) {
  const statCards = [
    {
      label: "Waste events",
      value: data.stats.totalEvents,
      description: "Logged across this household",
      marker: "W",
    },
    {
      label: "Last 30 days",
      value: data.stats.recentEvents,
      description: "Recent waste entries",
      marker: "30",
    },
    {
      label: "Top reason",
      value: data.stats.topReason,
      description: "Most common waste driver",
      marker: "R",
    },
    {
      label: "Plan saves",
      value: data.stats.preventedUpdates,
      description: "Inventory updates from cooked meal plans",
      marker: "S",
    },
  ];

  const totalReasonCount = data.reasonBreakdown.reduce((sum, item) => sum + item.count, 0);

  return (
    <div className="space-y-6">
      <section aria-label="Waste overview" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => (
          <StatsCard key={card.label} {...card} />
        ))}
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.8fr)]">
        <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-5">
            <div>
              <h2 className="text-lg font-semibold text-slate-950">Recent waste log</h2>
              <p className="mt-1 text-sm text-slate-500">Items marked from inventory as discarded.</p>
            </div>
            <Link href="/dashboard/inventory" className="text-sm font-semibold text-emerald-700 hover:text-emerald-800">
              Inventory
            </Link>
          </div>

          {data.recentLogs.length === 0 ? (
            <div className="p-5">
              <EmptyState
                title="No waste logged yet"
                description="When something is discarded, open the product detail and log the amount so trends can build up."
                action={
                  <Link
                    href="/dashboard/inventory"
                    className="inline-flex rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                  >
                    Review inventory
                  </Link>
                }
              />
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {data.recentLogs.map((log) => (
                <article key={log.id} className="p-5 transition hover:bg-slate-50">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="truncate text-sm font-semibold text-slate-950">{log.productName}</h3>
                        <span className="rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700">
                          {log.reasonLabel}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-slate-500">
                        {log.quantityLabel} - {log.categoryName} - {formatDate(log.createdAt)}
                      </p>
                      {log.notes ? <p className="mt-3 text-sm leading-6 text-slate-600">{log.notes}</p> : null}
                    </div>
                    {log.productId ? (
                      <Link
                        href={`/dashboard/inventory/${log.productId}`}
                        className="text-sm font-semibold text-emerald-700 hover:text-emerald-800"
                      >
                        View product
                      </Link>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <aside className="space-y-6">
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-950">Reason breakdown</h2>
            {data.reasonBreakdown.length === 0 ? (
              <p className="mt-3 text-sm text-slate-500">No reason data yet.</p>
            ) : (
              <ul className="mt-4 space-y-3">
                {data.reasonBreakdown.map((item) => (
                  <li key={item.reason} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-semibold text-slate-950">{item.label}</span>
                      <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200">
                        {item.count}
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-slate-500">
                      {totalReasonCount > 0 ? Math.round((item.count / totalReasonCount) * 100) : 0}% of logged events
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-lg border border-emerald-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-950">Low-waste loop</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Expired and spoiled entries should feed the next meal plan: prioritize those categories, then add only the
              missing items to shopping.
            </p>
            <div className="mt-4 grid gap-2">
              <Link
                href="/dashboard/meal-plan"
                className="rounded-lg bg-emerald-600 px-4 py-2 text-center text-sm font-semibold text-white hover:bg-emerald-700"
              >
                Open meal plan
              </Link>
              <Link
                href="/dashboard/inventory?status=expired"
                className="rounded-lg border border-slate-200 px-4 py-2 text-center text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Review expired
              </Link>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
