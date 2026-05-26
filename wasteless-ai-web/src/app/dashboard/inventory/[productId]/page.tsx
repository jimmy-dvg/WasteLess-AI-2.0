import Link from "next/link";
import { notFound } from "next/navigation";
import PageHeader from "@/components/dashboard/PageHeader";
import StatusBadge from "@/components/dashboard/StatusBadge";
import { requireUser } from "@/lib/auth";
import { formatDate, formatQuantity, formatRelativeExpiration } from "@/lib/dashboard-utils";
import { getProductById } from "@/services/inventory.service";
import ProductActions from "@/features/inventory/components/ProductActions";

export default async function ProductDetailsPage({ params }: { params: Promise<{ productId: string }> }) {
  const user = await requireUser();
  const { productId } = await params;
  const product = await getProductById(user.id, productId);

  if (!product) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={product.name}
        description="Review quantity, expiration, and notes for this item."
        action={
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Link
              href={`/dashboard/inventory/${product.id}/edit`}
              className="inline-flex justify-center rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Edit
            </Link>
            <ProductActions
              productId={product.id}
              productName={product.name}
              quantity={product.quantity}
              unit={product.unit}
            />
          </div>
        }
      />

      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <p className="text-sm text-slate-500">Quantity</p>
            <p className="mt-1 text-lg font-semibold text-slate-950">
              {formatQuantity(product.quantity, product.unit)}
            </p>
          </div>
          <div>
            <p className="text-sm text-slate-500">Status</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <StatusBadge status={product.status} />
              {product.lowStock ? (
                <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 ring-1 ring-amber-100">
                  Low stock
                </span>
              ) : null}
            </div>
          </div>
          <div>
            <p className="text-sm text-slate-500">Expiration</p>
            <p className="mt-1 text-sm font-semibold text-slate-950">{formatDate(product.expirationDate)}</p>
            <p className="text-xs text-slate-500">{formatRelativeExpiration(product.expirationDate)}</p>
          </div>
        </div>

        <dl className="mt-5 grid gap-4 md:grid-cols-2">
          <div>
            <dt className="text-xs font-semibold text-slate-500">Category</dt>
            <dd className="mt-1 text-sm text-slate-800">{product.categoryName ?? "Uncategorized"}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold text-slate-500">Storage</dt>
            <dd className="mt-1 text-sm text-slate-800">{product.storageLocation ?? "-"}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold text-slate-500">Purchase date</dt>
            <dd className="mt-1 text-sm text-slate-800">{formatDate(product.purchaseDate)}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold text-slate-500">Added</dt>
            <dd className="mt-1 text-sm text-slate-800">{formatDate(product.createdAt)}</dd>
          </div>
        </dl>

        <div className="mt-5">
          <h3 className="text-xs font-semibold text-slate-500">Notes</h3>
          <p className="mt-2 text-sm text-slate-700">{product.notes || "No notes added."}</p>
        </div>
      </section>

      <Link
        href="/dashboard/inventory"
        className="inline-flex w-fit rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800"
      >
        Back to inventory
      </Link>
    </div>
  );
}
