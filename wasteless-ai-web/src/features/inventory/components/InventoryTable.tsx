"use client";

import { useOptimistic, useState, useTransition } from "react";
import Link from "next/link";
import EmptyState from "@/components/dashboard/EmptyState";
import StatusBadge from "@/components/dashboard/StatusBadge";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";
import { deleteProductAction } from "../actions";
import { formatDate, formatQuantity, formatRelativeExpiration } from "@/lib/dashboard-utils";
import type { InventoryProduct } from "@/types/inventory";

export default function InventoryTable({ items }: { items: InventoryProduct[] }) {
  const [optimisticItems, removeOptimistic] = useOptimistic(items, (state, id: string) =>
    state.filter((item) => item.id !== id)
  );
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const { addToast } = useToast();

  const handleDelete = () => {
    if (!pendingDeleteId) return;
    const id = pendingDeleteId;
    setPendingDeleteId(null);
    removeOptimistic(id);

    startTransition(async () => {
      const result = await deleteProductAction(id);
      if (!result.success) {
        addToast(result.error ?? "Unable to delete product", "error");
        return;
      }
      if (result.message) addToast(result.message, "success");
    });
  };

  if (optimisticItems.length === 0) {
    return (
      <EmptyState
        title="No inventory items found"
        description="Add pantry, fridge, and freezer items to begin tracking expiration dates and waste patterns."
      />
    );
  }

  return (
    <section id="inventory-list" className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="hidden overflow-x-auto md:block">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              {["Product", "Quantity", "Category", "Expiration", "Storage", "Status", "Actions"].map(
                (heading) => (
                  <th
                    key={heading}
                    scope="col"
                    className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-normal text-slate-500"
                  >
                    {heading}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {optimisticItems.map((item) => (
              <tr key={item.id} className="transition hover:bg-slate-50">
                <td className="px-4 py-4 text-sm font-semibold text-slate-950">
                  <div className="flex items-center gap-2">
                    <span>{item.name}</span>
                    {item.lowStock ? (
                      <span className="rounded-full bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-700">
                        Low stock
                      </span>
                    ) : null}
                  </div>
                </td>
                <td className="px-4 py-4 text-sm text-slate-600">
                  {formatQuantity(item.quantity, item.unit)}
                </td>
                <td className="px-4 py-4 text-sm text-slate-600">{item.categoryName ?? "Uncategorized"}</td>
                <td className="px-4 py-4">
                  <p className="text-sm font-medium text-slate-800">{formatDate(item.expirationDate)}</p>
                  <p className="text-xs text-slate-500">{formatRelativeExpiration(item.expirationDate)}</p>
                </td>
                <td className="px-4 py-4 text-sm capitalize text-slate-600">
                  {item.storageLocation ?? "-"}
                </td>
                <td className="px-4 py-4">
                  <StatusBadge status={item.status} />
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/dashboard/inventory/${item.id}`}
                      className="text-xs font-semibold text-emerald-700 hover:text-emerald-800"
                    >
                      View
                    </Link>
                    <Link
                      href={`/dashboard/inventory/${item.id}/edit`}
                      className="text-xs font-semibold text-slate-600 hover:text-slate-900"
                    >
                      Edit
                    </Link>
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => setPendingDeleteId(item.id)}
                      className="text-xs font-semibold text-rose-600 hover:text-rose-700 disabled:opacity-60"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid gap-3 p-3 md:hidden">
        {optimisticItems.map((item) => (
          <article key={item.id} className="rounded-lg border border-slate-200 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-slate-950">{item.name}</h2>
                <p className="mt-1 text-sm text-slate-500">
                  {formatQuantity(item.quantity, item.unit)} in {item.storageLocation ?? "storage"}
                </p>
              </div>
              <StatusBadge status={item.status} />
            </div>
            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-xs font-semibold text-slate-500">Category</dt>
                <dd className="mt-1 text-slate-800">{item.categoryName ?? "Uncategorized"}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-slate-500">Expiration</dt>
                <dd className="mt-1 text-slate-800">{formatDate(item.expirationDate)}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-slate-500">Status</dt>
                <dd className="mt-1 text-slate-800">
                  {item.lowStock ? "Low stock" : ""}
                </dd>
              </div>
            </dl>
            <div className="mt-4 flex items-center gap-3 text-xs font-semibold">
              <Link href={`/dashboard/inventory/${item.id}`} className="text-emerald-700">
                View
              </Link>
              <Link href={`/dashboard/inventory/${item.id}/edit`} className="text-slate-600">
                Edit
              </Link>
              <button
                type="button"
                disabled={isPending}
                onClick={() => setPendingDeleteId(item.id)}
                className="text-rose-600"
              >
                Delete
              </button>
            </div>
          </article>
        ))}
      </div>

      <ConfirmDialog
        open={Boolean(pendingDeleteId)}
        title="Delete product?"
        description="This removes the item from your inventory."
        confirmLabel="Delete"
        onCancel={() => setPendingDeleteId(null)}
        onConfirm={handleDelete}
      />
    </section>
  );
}
