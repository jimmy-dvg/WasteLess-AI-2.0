import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth";
import { generateShoppingListItems } from "@/services/shopping-list.service";
import { shoppingListGenerationSchema } from "@/validation/shopping";
import { getShoppingHousehold, revalidateShoppingPaths, shoppingError } from "../_utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const auth = await requireApiUser();
  if (!auth.success) return auth.response;

  const body = await request.json().catch(() => null);
  const parsed = shoppingListGenerationSchema.safeParse(body ?? {});

  if (!parsed.success) {
    return shoppingError(parsed.error.issues[0]?.message ?? "Invalid shopping list generation request", 400);
  }

  try {
    const household = await getShoppingHousehold(auth.user);
    const result = await generateShoppingListItems(household.id, auth.user.id, parsed.data);

    if (result.insertedCount > 0) revalidateShoppingPaths();

    return NextResponse.json({ success: true, data: { result } }, { status: 200 });
  } catch {
    return shoppingError("Unable to generate shopping list right now", 500);
  }
}
