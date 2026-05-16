import EmptyState from "@/components/dashboard/EmptyState";
import ErrorState from "@/components/dashboard/ErrorState";
import PageHeader from "@/components/dashboard/PageHeader";
import { getFallbackRecipes, getRecipesPageData } from "@/db/queries/recipes";
import RecipeCard from "@/features/recipes/components/RecipeCard";
import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function RecipesPage() {
  const user = await requireUser();
  let data;

  try {
    data = await getRecipesPageData(user.id);
  } catch {
    return <ErrorState title="Recipe data is unavailable" />;
  }

  const recipes = data.recipes.length > 0 ? data.recipes : getFallbackRecipes();

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI recipes"
        description="Recipe recommendations built around expiring ingredients and pantry staples."
      />

      {recipes.length === 0 ? (
        <EmptyState
          title="No recipe recommendations yet"
          description="Add inventory items so WasteLessAI can recommend recipes that use what is already in your kitchen."
        />
      ) : (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {recipes.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </section>
      )}
    </div>
  );
}
