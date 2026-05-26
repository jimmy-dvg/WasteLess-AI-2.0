import { AlertTriangle } from "lucide-react";

type ErrorStateProps = {
  title?: string;
  description?: string;
  action?: React.ReactNode;
};

export default function ErrorState({
  title = "Dashboard data is unavailable",
  description = "Refresh the page in a moment. If the issue continues, try again after checking your connection.",
  action,
}: ErrorStateProps) {
  return (
    <section className="rounded-lg border border-rose-200 bg-rose-50 p-5 text-rose-900 shadow-sm">
      <div className="flex items-start gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white text-rose-700 ring-1 ring-rose-100">
          <AlertTriangle className="h-4 w-4" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <h2 className="text-base font-semibold">{title}</h2>
          <p className="mt-2 text-sm leading-6 text-rose-800">{description}</p>
          {action ? <div className="mt-4">{action}</div> : null}
        </div>
      </div>
    </section>
  );
}
