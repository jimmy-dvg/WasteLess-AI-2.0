import type { ExpirationStatus } from "@/lib/dashboard-utils";

const statusStyles: Record<ExpirationStatus, string> = {
  fresh: "bg-emerald-50 text-emerald-700 ring-emerald-100 before:bg-emerald-500",
  expiring: "bg-amber-50 text-amber-800 ring-amber-100 before:bg-amber-500",
  expired: "bg-rose-50 text-rose-700 ring-rose-100 before:bg-rose-500",
};

const statusLabels: Record<ExpirationStatus, string> = {
  fresh: "Fresh",
  expiring: "Expiring soon",
  expired: "Expired",
};

export default function StatusBadge({ status }: { status: ExpirationStatus }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 before:h-1.5 before:w-1.5 before:rounded-full ${statusStyles[status]}`}
    >
      {statusLabels[status]}
    </span>
  );
}
