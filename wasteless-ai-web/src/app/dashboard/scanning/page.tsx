import ErrorState from "@/components/dashboard/ErrorState";
import PageHeader from "@/components/dashboard/PageHeader";
import ScannerWorkspace from "@/scanning/components/ScannerWorkspace";
import { requireUser } from "@/lib/auth";
import { getCategoriesForUser } from "@/services/inventory.service";
import { getScannerDiagnostics } from "@/scanning/diagnostics";
import { getRecentImportBatches, getRecentScanHistory } from "@/scanning/scan-history.service";

export const dynamic = "force-dynamic";

export default async function ScanningPage() {
  const user = await requireUser();
  let data;

  try {
    data = await Promise.all([
      getCategoriesForUser(user.id),
      getRecentScanHistory(user.id, 12),
      getRecentImportBatches(user.id, 8),
      Promise.resolve(getScannerDiagnostics()),
    ]);
  } catch {
    return <ErrorState title="Scanner is unavailable" />;
  }

  const [categories, history, importBatches, diagnostics] = data;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Scanner"
        description="Add products from live barcodes, receipt OCR, or AI shelf and fridge photo recognition before confirming inventory imports."
      />
      <ScannerWorkspace
        categories={categories}
        initialHistory={history}
        initialImportBatches={importBatches}
        initialDiagnostics={diagnostics}
      />
    </div>
  );
}
