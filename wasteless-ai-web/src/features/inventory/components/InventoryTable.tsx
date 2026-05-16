import EmptyState from "@/components/dashboard/EmptyState";
import StatusBadge from "@/components/dashboard/StatusBadge";
import { formatDate, formatRelativeExpiration, type ExpirationStatus } from "@/lib/dashboard-utils";

export type InventoryTableItem = {
  id: string;
  product: string;
  quantity: string;
  category: string;
  expirationDate: unknown;
  location: string;
  status: ExpirationStatus;
};

type InventoryTableProps = {
  items: InventoryTableItem[];
};

const rowStyles: Record<ExpirationStatus, string> = {
  fresh: "bg-white",
  expiring: "bg-amber-50/40",
  expired: "bg-rose-50/50",
};

export default function InventoryTable({ items }: InventoryTableProps) {
  if (items.length === 0) {
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
              {["Product", "Quantity", "Category", "Expiration date", "Storage", "Status"].map((heading) => (
                <th
                  key={heading}
                  scope="col"
                  className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-normal text-slate-500"
                >
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((item) => (
              <tr key={item.id} className={`${rowStyles[item.status]} transition hover:bg-slate-50`}>
                <td className="px-4 py-4 text-sm font-semibold text-slate-950">{item.product}</td>
                <td className="px-4 py-4 text-sm text-slate-600">{item.quantity}</td>
                <td className="px-4 py-4 text-sm text-slate-600">{item.category}</td>
                <td className="px-4 py-4">
                  <p className="text-sm font-medium text-slate-800">{formatDate(item.expirationDate)}</p>
                  <p className="text-xs text-slate-500">{formatRelativeExpiration(item.expirationDate)}</p>
                </td>
                <td className="px-4 py-4 text-sm capitalize text-slate-600">{item.location}</td>
                <td className="px-4 py-4">
                  <StatusBadge status={item.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid gap-3 p-3 md:hidden">
        {items.map((item) => (
          <article key={item.id} className={`${rowStyles[item.status]} rounded-lg border border-slate-200 p-4`}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-slate-950">{item.product}</h2>
                <p className="mt-1 text-sm text-slate-500">
                  {item.quantity} in {item.location}
                </p>
              </div>
              <StatusBadge status={item.status} />
            </div>
            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-xs font-semibold text-slate-500">Category</dt>
                <dd className="mt-1 text-slate-800">{item.category}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-slate-500">Expiration</dt>
                <dd className="mt-1 text-slate-800">{formatDate(item.expirationDate)}</dd>
              </div>
            </dl>
          </article>
        ))}
      </div>
    </section>
  );
}
