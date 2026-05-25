import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth";
import {
  createShoppingItem,
  getShoppingListData,
} from "@/services/shopping-list.service";
import { shoppingItemCreateSchema } from "@/validation/shopping";
import { getShoppingHousehold, revalidateShoppingPaths, shoppingError } from "./_utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireApiUser();
  if (!auth.success) return auth.response;

  try {
    const household = await getShoppingHousehold(auth.user);
    const data = await getShoppingListData(household.id, auth.user.id);

    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch {
    return shoppingError("Shopping list data is unavailable", 500);
  }
}

export async function POST(request: Request) {
  const auth = await requireApiUser();
  if (!auth.success) return auth.response;

  const body = await request.json().catch(() => null);
  const parsed = shoppingItemCreateSchema.safeParse(body);

  if (!parsed.success) {
    return shoppingError(parsed.error.issues[0]?.message ?? "Invalid shopping item", 400);
  }

  try {
    const household = await getShoppingHousehold(auth.user);
    const item = await createShoppingItem(household.id, auth.user.id, parsed.data);

    revalidateShoppingPaths();

    return NextResponse.json({ success: true, data: { item } }, { status: 201 });
  } catch {
    return shoppingError("Unable to add shopping item right now", 500);
  }
}
