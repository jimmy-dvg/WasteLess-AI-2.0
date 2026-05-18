import ErrorState from "@/components/dashboard/ErrorState";
import { getRecipeDetail } from "@/db/queries/recipes";
import RecipeDetailView from "@/features/recipes/components/RecipeDetailView";
import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

type RecipeDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function RecipeDetailPage({ params }: RecipeDetailPageProps) {
  const user = await requireUser();
  const { id } = await params;

  const recipe = await getRecipeDetail(user.id, id);
  if (!recipe) {
    return <ErrorState title="Recipe not found" description="Try another recommendation from your dashboard." />;
  }

  return <RecipeDetailView recipe={recipe} />;
}
