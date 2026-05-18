export default function RecipeCardSkeleton() {
  return (
    <div className="flex h-full flex-col rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="h-4 w-24 animate-pulse rounded-full bg-slate-100" />
      <div className="mt-3 h-6 w-3/4 animate-pulse rounded-lg bg-slate-100" />
      <div className="mt-3 h-4 w-full animate-pulse rounded-lg bg-slate-100" />
      <div className="mt-4 flex flex-wrap gap-2">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="h-6 w-20 animate-pulse rounded-full bg-slate-100" />
        ))}
      </div>
      <div className="mt-6 space-y-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-3 w-full animate-pulse rounded-lg bg-slate-100" />
        ))}
      </div>
      <div className="mt-auto flex gap-2 pt-5">
        <div className="h-9 w-24 animate-pulse rounded-lg bg-slate-100" />
        <div className="h-9 w-24 animate-pulse rounded-lg bg-slate-100" />
      </div>
    </div>
  );
}
