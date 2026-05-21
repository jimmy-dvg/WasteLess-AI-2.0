export default function RecipeCardSkeleton() {
  return (
    <div className="flex h-full flex-col rounded-lg border border-amber-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="h-4 w-24 animate-pulse rounded-full bg-emerald-100" />
          <div className="mt-3 h-7 w-3/4 animate-pulse rounded-lg bg-slate-100" />
        </div>
        <div className="flex gap-2">
          <div className="h-10 w-10 animate-pulse rounded-full bg-slate-100" />
          <div className="h-10 w-10 animate-pulse rounded-full bg-slate-100" />
        </div>
      </div>
      <div className="mt-4 h-4 w-full animate-pulse rounded-lg bg-slate-100" />
      <div className="mt-2 h-4 w-4/5 animate-pulse rounded-lg bg-slate-100" />
      <div className="mt-4 grid grid-cols-3 gap-2">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="h-20 animate-pulse rounded-lg border border-slate-200 bg-slate-50" />
        ))}
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-6 w-20 animate-pulse rounded-full bg-slate-100" />
        ))}
      </div>
      <div className="mt-4 grid grid-cols-4 gap-2 rounded-lg border border-slate-200 bg-white p-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-16 animate-pulse rounded-md bg-slate-50" />
        ))}
      </div>
      <div className="mt-auto flex gap-2 pt-5">
        <div className="h-9 w-32 animate-pulse rounded-lg bg-emerald-100" />
        <div className="h-9 w-28 animate-pulse rounded-lg bg-slate-100" />
      </div>
    </div>
  );
}
