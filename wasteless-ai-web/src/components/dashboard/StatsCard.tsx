type StatsCardProps = {
  label: string;
  value: string | number;
  description: string;
  marker: string;
};

export default function StatsCard({ label, value, description, marker }: StatsCardProps) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:border-emerald-200 hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-2 text-3xl font-bold tracking-normal text-slate-950">{value}</p>
        </div>
        <span className="grid h-10 w-10 place-items-center rounded-lg bg-emerald-50 text-sm font-bold text-emerald-700 ring-1 ring-emerald-100">
          {marker}
        </span>
      </div>
      <p className="mt-4 text-sm text-slate-500">{description}</p>
    </article>
  );
}
