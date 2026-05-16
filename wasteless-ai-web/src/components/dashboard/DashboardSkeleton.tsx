export default function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-24 animate-pulse rounded-lg bg-slate-100" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-36 animate-pulse rounded-lg bg-slate-100" />
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,0.8fr)]">
        <div className="h-80 animate-pulse rounded-lg bg-slate-100" />
        <div className="h-80 animate-pulse rounded-lg bg-slate-100" />
      </div>
    </div>
  );
}
