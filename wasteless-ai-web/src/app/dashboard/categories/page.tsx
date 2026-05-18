import PageHeader from "@/components/dashboard/PageHeader";
import CategoryManager from "@/features/categories/components/CategoryManager";
import { requireUser } from "@/lib/auth";
import { getCategoriesForUser } from "@/services/inventory.service";

export default async function CategoriesPage() {
  const user = await requireUser();
  const categories = await getCategoriesForUser(user.id);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Categories"
        description="Create and manage product categories for faster filtering."
      />

      <CategoryManager categories={categories} />
    </div>
  );
}
