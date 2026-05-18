import Link from "next/link";
import { notFound } from "next/navigation";
import PageHeader from "@/components/dashboard/PageHeader";
import EditProductForm from "@/features/inventory/components/EditProductForm";
import { requireUser } from "@/lib/auth";
import { getCategoriesForUser, getProductById } from "@/services/inventory.service";

export default async function EditProductPage({ params }: { params: Promise<{ productId: string }> }) {
  const user = await requireUser();
  const { productId } = await params;

  const [product, categories] = await Promise.all([
    getProductById(user.id, productId),
    getCategoriesForUser(user.id),
  ]);

  if (!product) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Edit ${product.name}`}
        description="Update quantity, expiration, and storage details."
        action={
          <Link
            href={`/dashboard/inventory/${product.id}`}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </Link>
        }
      />

      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <EditProductForm product={product} categories={categories} />
      </section>
    </div>
  );
}
