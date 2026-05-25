import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth";
import { clearCheckedShoppingItems } from "@/services/shopping-list.service";
import { getShoppingHousehold, revalidateShoppingPaths, shoppingError } from "../_utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  const auth = await requireApiUser();
  if (!auth.success) return auth.response;

  try {
    const household = await getShoppingHousehold(auth.user);
    const deletedCount = await clearCheckedShoppingItems(household.id);

    if (deletedCount > 0) revalidateShoppingPaths();

    return NextResponse.json({ success: true, data: { deletedCount } }, { status: 200 });
  } catch {
    return shoppingError("Unable to clear checked shopping items right now", 500);
  }
}
