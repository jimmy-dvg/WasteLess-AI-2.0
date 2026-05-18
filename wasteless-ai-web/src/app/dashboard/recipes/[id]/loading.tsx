export default function RecipeDetailLoading() {
  return (
    <div className="space-y-6">
      <div className="h-32 animate-pulse rounded-lg bg-slate-100" />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
        <div className="h-96 animate-pulse rounded-lg bg-slate-100" />
        <div className="h-96 animate-pulse rounded-lg bg-slate-100" />
      </div>
    </div>
  );
}
