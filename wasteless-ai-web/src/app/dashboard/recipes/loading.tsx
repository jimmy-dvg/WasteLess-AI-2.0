import RecipeCardSkeleton from "@/features/recipes/components/RecipeCardSkeleton";

export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="h-24 animate-pulse rounded-lg bg-slate-100" />
      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <RecipeCardSkeleton key={index} />
        ))}
      </div>
    </div>
  );
}
