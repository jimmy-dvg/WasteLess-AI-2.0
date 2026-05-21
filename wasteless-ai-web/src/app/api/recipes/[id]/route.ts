import { NextResponse } from "next/server";
import { getRecipeDetail } from "@/db/queries/recipes";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  try {
    const recipe = await getRecipeDetail(user.id, id);
    if (!recipe) {
      return NextResponse.json({ success: false, error: "Recipe not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: recipe });
  } catch {
    return NextResponse.json({ success: false, error: "Recipe details failed to load" }, { status: 500 });
  }
}
