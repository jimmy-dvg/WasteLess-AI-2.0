import ErrorState from "@/components/dashboard/ErrorState";
import PageHeader from "@/components/dashboard/PageHeader";
import { getShoppingPageData } from "@/db/queries/shopping";
import ShoppingList from "@/features/shopping/components/ShoppingList";
import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function ShoppingPage() {
  const user = await requireUser();
  let data;

  try {
    data = await getShoppingPageData(user.id);
  } catch {
    return <ErrorState title="Shopping list data is unavailable" />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Shopping list"
        description="Plan only what your household needs and check items off while you shop."
      />
      <ShoppingList list={data.list} items={data.items} />
    </div>
  );
}
