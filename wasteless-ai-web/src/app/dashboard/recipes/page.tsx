import ErrorState from "@/components/dashboard/ErrorState";
import { getFallbackRecipes, getRecipesPageData } from "@/db/queries/recipes";
import RecipeRecommendations from "@/features/recipes/components/RecipeRecommendations";
import { requireUser } from "@/lib/auth";
import { getRecipePreferencesForUser } from "@/services/recipes.service";
import { getAiSettingsForUser } from "@/ai/services/ai-settings";

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
  const preferences = await getRecipePreferencesForUser(user.id);
  const aiSettings = await getAiSettingsForUser(user.id);

  return (
    <RecipeRecommendations
      initialRecipes={recipes}
      initialFavoriteRecipes={data.favoriteRecipes}
      preferences={preferences}
      aiSettings={aiSettings}
    />
  );
}
