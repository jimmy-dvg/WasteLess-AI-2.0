import ErrorState from "@/components/dashboard/ErrorState";
import PageHeader from "@/components/dashboard/PageHeader";
import WasteDashboard from "@/features/waste/components/WasteDashboard";
import { getWastePageData } from "@/features/waste/services/waste.service";
import { requireUser } from "@/lib/auth";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function WastePage() {
  const user = await requireUser();
  let data;

  try {
    data = await getWastePageData(user.id);
  } catch {
    return <ErrorState title="Waste tracking data is unavailable" />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Waste tracking"
        description="Track discarded inventory, spot repeat causes, and connect those signals back to meal planning."
        action={
          <Link
            href="/dashboard/inventory?status=expired"
            className="inline-flex rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
          >
            Review expired
          </Link>
        }
      />
      <WasteDashboard data={data} />
    </div>
  );
}
