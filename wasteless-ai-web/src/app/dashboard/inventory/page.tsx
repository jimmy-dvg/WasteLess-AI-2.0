import ErrorState from "@/components/dashboard/ErrorState";
import PageHeader from "@/components/dashboard/PageHeader";
import Pagination from "@/components/ui/Pagination";
import AddProductForm from "@/features/inventory/components/AddProductForm";
import InventoryFilters from "@/features/inventory/components/InventoryFilters";
import InventoryTable from "@/features/inventory/components/InventoryTable";
import { getHouseholdPreferencesForUser } from "@/features/household/services/household-preferences.service";
import { requireUser } from "@/lib/auth";
import { getInventoryPageData } from "@/services/inventory.service";
import { inventoryFilterSchema } from "@/validation/inventory";

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
  const parsedFilters = inventoryFilterSchema.safeParse({
    query: getParam(params, "query"),
    status: getParam(params, "status"),
    categoryId: getParam(params, "categoryId"),
    location: getParam(params, "location"),
    sort: getParam(params, "sort"),
    page: getParam(params, "page"),
    pageSize: getParam(params, "pageSize"),
  });

  if (!parsedFilters.success) {
    return <ErrorState title="Inventory filters are invalid" />;
  }

  let data;
  let preferences;

  try {
    [data, preferences] = await Promise.all([
      getInventoryPageData(user.id, parsedFilters.data),
      getHouseholdPreferencesForUser(user.id),
    ]);
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
            Add product
          </a>
        }
      />

      <div id="add-inventory-item">
        <AddProductForm categories={data.categories} defaultStorageLocation={preferences.defaultStorageLocation} />
      </div>

      <InventoryFilters
        categories={data.categories}
        locations={data.locations}
        filters={parsedFilters.data}
        resultCount={data.totalCount}
      />

      <InventoryTable items={data.items} />

      <Pagination page={data.page} pageCount={data.pageCount} />
    </div>
  );
}
