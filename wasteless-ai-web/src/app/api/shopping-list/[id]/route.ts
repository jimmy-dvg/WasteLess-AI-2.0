import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiUser } from "@/lib/auth";
import {
  deleteShoppingItem,
  updateShoppingItem,
} from "@/services/shopping-list.service";
import { shoppingItemUpdateSchema } from "@/validation/shopping";
import { getShoppingHousehold, revalidateShoppingPaths, shoppingError } from "../_utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string }>;
};

async function getItemId(context: RouteContext) {
  const { id } = await context.params;
  return id;
}

function isUuid(value: string) {
  return z.string().uuid().safeParse(value).success;
}

export async function PATCH(request: Request, context: RouteContext) {
  const auth = await requireApiUser();
  if (!auth.success) return auth.response;

  const id = await getItemId(context);
  if (!isUuid(id)) return shoppingError("Invalid shopping item id", 400);

  const body = await request.json().catch(() => null);
  const parsed = shoppingItemUpdateSchema.safeParse(body);

  if (!parsed.success) {
    return shoppingError(parsed.error.issues[0]?.message ?? "Invalid shopping item update", 400);
  }

  try {
    const household = await getShoppingHousehold(auth.user);
    const item = await updateShoppingItem(household.id, auth.user.id, id, parsed.data);

    if (!item) return shoppingError("Shopping item not found", 404);

    revalidateShoppingPaths();

    return NextResponse.json({ success: true, data: { item } }, { status: 200 });
  } catch {
    return shoppingError("Unable to update shopping item right now", 500);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const auth = await requireApiUser();
  if (!auth.success) return auth.response;

  const id = await getItemId(context);
  if (!isUuid(id)) return shoppingError("Invalid shopping item id", 400);

  try {
    const household = await getShoppingHousehold(auth.user);
    const deleted = await deleteShoppingItem(household.id, id);

    if (!deleted) return shoppingError("Shopping item not found", 404);

    revalidateShoppingPaths();

    return new NextResponse(null, { status: 204 });
  } catch {
    return shoppingError("Unable to delete shopping item right now", 500);
  }
}
