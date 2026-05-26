"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { InventoryCategory, InventoryFilters } from "@/types/inventory";
import { useDebounce } from "@/hooks/useDebounce";

type InventoryFiltersProps = {
  categories: InventoryCategory[];
  locations: string[];
  filters: InventoryFilters;
  resultCount?: number;
};

export default function InventoryFilters({ categories, locations, filters, resultCount }: InventoryFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(filters.query);
  const debouncedQuery = useDebounce(query, 400);

  const updateParams = (updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (!value || value === "all") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });
    params.set("page", "1");
    router.replace(`${pathname}?${params.toString()}`);
  };

  useEffect(() => {
    if (debouncedQuery !== filters.query) {
      updateParams({ query: debouncedQuery });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery]);

  const categoryOptions = useMemo(
    () => [{ id: "all", name: "All categories" }, ...categories],
    [categories]
  );

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-950">Find products</h2>
          <p className="text-sm text-slate-500">Filter by status, category, storage location, or product name.</p>
        </div>
        {typeof resultCount === "number" ? (
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
            {resultCount} result{resultCount === 1 ? "" : "s"}
          </span>
        ) : null}
      </div>
      <div className="grid gap-3 md:grid-cols-[minmax(0,1.5fr)_180px_180px_180px_180px]">
        <label>
          <span className="text-xs font-semibold text-slate-600">Search</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            name="query"
            type="search"
            placeholder="Search products"
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          />
        </label>
        <label>
          <span className="text-xs font-semibold text-slate-600">Status</span>
          <select
            name="status"
            defaultValue={filters.status}
            onChange={(event) => updateParams({ status: event.target.value })}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          >
            <option value="all">All statuses</option>
            <option value="fresh">Fresh</option>
            <option value="expiring">Expiring</option>
            <option value="expired">Expired</option>
          </select>
        </label>
        <label>
          <span className="text-xs font-semibold text-slate-600">Category</span>
          <select
            name="categoryId"
            defaultValue={filters.categoryId}
            onChange={(event) => updateParams({ categoryId: event.target.value })}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          >
            {categoryOptions.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="text-xs font-semibold text-slate-600">Location</span>
          <select
            name="location"
            defaultValue={filters.location}
            onChange={(event) => updateParams({ location: event.target.value })}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm capitalize outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          >
            <option value="all">All locations</option>
            {locations.map((location) => (
              <option key={location} value={location}>
                {location}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="text-xs font-semibold text-slate-600">Sort</span>
          <select
            name="sort"
            defaultValue={filters.sort}
            onChange={(event) => updateParams({ sort: event.target.value })}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          >
            <option value="expiration_asc">Expiration (Soonest)</option>
            <option value="expiration_desc">Expiration (Latest)</option>
            <option value="name_asc">Name (A-Z)</option>
            <option value="created_desc">Recently added</option>
          </select>
        </label>
      </div>
    </section>
  );
}
