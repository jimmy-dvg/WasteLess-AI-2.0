import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { ensurePersonalHouseholdForUser } from "@/db/queries/households";
import type { AuthenticatedUser } from "@/lib/auth";

export function shoppingError(error: string, status: number): NextResponse<{ success: false; error: string }> {
  return NextResponse.json({ success: false, error }, { status });
}

export async function getShoppingHousehold(user: AuthenticatedUser) {
  return ensurePersonalHouseholdForUser(user);
}

export function revalidateShoppingPaths() {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/shopping");
  revalidatePath("/dashboard/meal-plan");
}
