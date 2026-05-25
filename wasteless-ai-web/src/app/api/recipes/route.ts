import { NextResponse } from "next/server";
import { getRecipesPageData } from "@/db/queries/recipes";
import { requireApiUser } from "@/lib/auth";
import { getRecipePreferencesForUser } from "@/services/recipes.service";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireApiUser();
  if (!auth.success) return auth.response;

  try {
    const [data, preferences] = await Promise.all([
      getRecipesPageData(auth.user.id),
      getRecipePreferencesForUser(auth.user.id),
    ]);

    return NextResponse.json(
      {
        success: true,
        data: {
          recipes: data.recipes,
          favoriteRecipes: data.favoriteRecipes,
          preferences,
        },
      },
      { status: 200 }
    );
  } catch {
    return NextResponse.json({ success: false, error: "Recipe data is unavailable" }, { status: 500 });
  }
}
