import { Loader2 } from "lucide-react";

type LoadingStateProps = {
  title?: string;
  description?: string;
};

export default function LoadingState({
  title = "Loading",
  description = "Getting the latest household data ready.",
}: LoadingStateProps) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-6 text-center shadow-sm">
      <Loader2 className="mx-auto h-6 w-6 animate-spin text-emerald-600" aria-hidden="true" />
      <h2 className="mt-4 text-base font-semibold text-slate-950">{title}</h2>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">{description}</p>
    </section>
  );
}
