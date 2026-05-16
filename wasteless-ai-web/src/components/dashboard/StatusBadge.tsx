import type { ExpirationStatus } from "@/lib/dashboard-utils";

const statusStyles: Record<ExpirationStatus, string> = {
  fresh: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  expiring: "bg-amber-50 text-amber-800 ring-amber-100",
  expired: "bg-rose-50 text-rose-700 ring-rose-100",
};

export default function StatusBadge({ status }: { status: ExpirationStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold capitalize ring-1 ${statusStyles[status]}`}
    >
      {status}
    </span>
  );
}
