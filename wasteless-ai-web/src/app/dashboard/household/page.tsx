import ErrorState from "@/components/dashboard/ErrorState";
import PageHeader from "@/components/dashboard/PageHeader";
import HouseholdCollaborationDashboard from "@/features/household/components/HouseholdCollaborationDashboard";
import { getHouseholdCollaborationData } from "@/features/household/services/household.service";
import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function HouseholdPage() {
  const user = await requireUser();
  let data;

  try {
    data = await getHouseholdCollaborationData(user);
  } catch {
    return <ErrorState title="Household data is unavailable" />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Household"
        description="Manage shared access, roles, invitations, and collaboration activity for your WasteLessAI household."
      />
      <HouseholdCollaborationDashboard data={data} />
    </div>
  );
}
