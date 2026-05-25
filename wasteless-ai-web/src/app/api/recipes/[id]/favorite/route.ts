import { NextResponse } from "next/server";
import { z } from "zod";
import { getRecipeDetail } from "@/db/queries/recipes";
import { requireApiUser } from "@/lib/auth";
import { saveRecipeForUser, unsaveRecipeForUser } from "@/services/recipes.service";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string }>;
};

async function getRecipeId(context: RouteContext) {
  const { id } = await context.params;
  return id;
}

function recipeError(error: string, status: number) {
  return NextResponse.json({ success: false as const, error }, { status });
}

export async function POST(_request: Request, context: RouteContext) {
  const auth = await requireApiUser();
  if (!auth.success) return auth.response;

  const recipeId = await getRecipeId(context);
  const parsedRecipeId = z.string().uuid().safeParse(recipeId);
  if (!parsedRecipeId.success) return recipeError("Invalid recipe id", 400);

  try {
    const recipe = await getRecipeDetail(auth.user.id, parsedRecipeId.data);
    if (!recipe) return recipeError("Recipe not found", 404);

    const result = await saveRecipeForUser(auth.user.id, parsedRecipeId.data);
    return NextResponse.json({ success: true, data: result }, { status: 200 });
  } catch {
    return recipeError("Unable to save recipe", 500);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const auth = await requireApiUser();
  if (!auth.success) return auth.response;

  const recipeId = await getRecipeId(context);
  const parsedRecipeId = z.string().uuid().safeParse(recipeId);
  if (!parsedRecipeId.success) return recipeError("Invalid recipe id", 400);

  try {
    const result = await unsaveRecipeForUser(auth.user.id, parsedRecipeId.data);
    return NextResponse.json({ success: true, data: result }, { status: 200 });
  } catch {
    return recipeError("Unable to update recipe", 500);
  }
}
