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
        title="Categories and Storage Zones"
        description="Create categories, define storage zones, and let AI suggest where each product belongs."
      />

      <CategoryManager categories={categories} />
    </div>
  );
}
