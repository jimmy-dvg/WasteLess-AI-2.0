import ErrorState from "@/components/dashboard/ErrorState";
import PageHeader from "@/components/dashboard/PageHeader";
import { getShoppingPageData } from "@/db/queries/shopping";
import { getHouseholdPreferencesForUser } from "@/features/household/services/household-preferences.service";
import ShoppingList from "@/features/shopping/components/ShoppingList";
import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function ShoppingPage() {
  const user = await requireUser();
  let data;
  let preferences;

  try {
    [data, preferences] = await Promise.all([
      getShoppingPageData(user.id),
      getHouseholdPreferencesForUser(user.id),
    ]);
  } catch {
    return <ErrorState title="Shopping list data is unavailable" />;
  }

  const cadenceLabels = {
    weekly: "Weekly",
    biweekly: "Every 2 weeks",
    as_needed: "As needed",
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Shopping list"
        description={`Plan only what your household needs and check items off while you shop. Current cadence: ${cadenceLabels[preferences.shoppingCadence]}.`}
      />
      <ShoppingList
        list={data.list}
        items={data.items}
        shoppingCadenceLabel={cadenceLabels[preferences.shoppingCadence]}
      />
    </div>
  );
}
