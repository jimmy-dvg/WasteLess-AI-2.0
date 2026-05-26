import { ClipboardList } from "lucide-react";

type EmptyStateProps = {
  title: string;
  description: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
};

export default function EmptyState({ title, description, action, icon }: EmptyStateProps) {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 bg-white p-6 text-center shadow-sm sm:p-8">
      <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-lg bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
        {icon ?? <ClipboardList className="h-5 w-5" aria-hidden="true" />}
      </div>
      <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">{description}</p>
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </div>
  );
}
