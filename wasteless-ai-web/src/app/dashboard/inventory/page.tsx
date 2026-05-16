import ErrorState from "@/components/dashboard/ErrorState";
import PageHeader from "@/components/dashboard/PageHeader";
import { getInventoryPageData, type InventoryFilters } from "@/db/queries/inventory";
import AddInventoryItemForm from "@/features/inventory/components/AddInventoryItemForm";
import InventoryTable from "@/features/inventory/components/InventoryTable";
import { requireUser } from "@/lib/auth";
import type { ExpirationStatus } from "@/lib/dashboard-utils";

export const dynamic = "force-dynamic";

type InventoryPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function getParam(params: Record<string, string | string[] | undefined>, key: string) {
  const value = params[key];
  return Array.isArray(value) ? value[0] : value;
}

export default async function InventoryPage({ searchParams }: InventoryPageProps) {
  const user = await requireUser();
  const params = searchParams ? await searchParams : {};
  const status = getParam(params, "status") as InventoryFilters["status"];
  const filters: InventoryFilters = {
    query: getParam(params, "query") ?? "",
    status: status && ["fresh", "expiring", "expired"].includes(status) ? (status as ExpirationStatus) : "all",
    location: getParam(params, "location") ?? "all",
  };

  let data;

  try {
    data = await getInventoryPageData(user.id, filters);
  } catch {
    return <ErrorState title="Inventory data is unavailable" />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inventory"
        description="Search, filter, and monitor pantry, fridge, and freezer items before they become waste."
        action={
          <a
            href="#add-inventory-item"
            className="inline-flex rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
          >
            Add inventory item
          </a>
        }
      />

      <div id="add-inventory-item">
        <AddInventoryItemForm />
      </div>

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <form className="grid gap-3 md:grid-cols-[minmax(0,1fr)_180px_180px_auto]">
          <label>
            <span className="text-xs font-semibold text-slate-600">Search</span>
            <input
              name="query"
              type="search"
              defaultValue={filters.query}
              placeholder="Search products"
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            />
          </label>
          <label>
            <span className="text-xs font-semibold text-slate-600">Status</span>
            <select
              name="status"
              defaultValue={filters.status}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            >
              <option value="all">All statuses</option>
              <option value="fresh">Fresh</option>
              <option value="expiring">Expiring</option>
              <option value="expired">Expired</option>
            </select>
          </label>
          <label>
            <span className="text-xs font-semibold text-slate-600">Location</span>
            <select
              name="location"
              defaultValue={filters.location}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm capitalize outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            >
              <option value="all">All locations</option>
              {data.locations.map((location) => (
                <option key={location} value={location}>
                  {location}
                </option>
              ))}
            </select>
          </label>
          <div className="flex items-end gap-2">
            <button
              type="submit"
              className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Apply
            </button>
            <a
              href="/dashboard/inventory"
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Reset
            </a>
          </div>
        </form>
      </section>

      <InventoryTable items={data.items} />
    </div>
  );
}
