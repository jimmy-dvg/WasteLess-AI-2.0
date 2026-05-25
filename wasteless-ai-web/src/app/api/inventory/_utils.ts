import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { ensurePersonalHouseholdForUser } from "@/db/queries/households";
import { canEditHouseholdInventory } from "@/features/household/constants";
import { parseDateInput } from "@/lib/date";
import type { AuthenticatedUser } from "@/lib/auth";
import { getCategoriesForUser } from "@/services/inventory.service";
import { productSchema } from "@/validation/inventory";

export const INVENTORY_PERMISSION_ERROR = "You do not have permission to change this household inventory.";

export type ProductMutationData = {
  householdId: string;
  name: string;
  quantity: string;
  unit: string | null;
  categoryId: string | null;
  purchaseDate: Date | null;
  expirationDate: Date | null;
  storageLocation: string | null;
  notes: string | null;
};

export function inventoryError(error: string, status: number): NextResponse<{ success: false; error: string }> {
  return NextResponse.json({ success: false as const, error }, { status });
}

export async function getEditableInventoryHousehold(user: AuthenticatedUser) {
  const household = await ensurePersonalHouseholdForUser(user);

  if (!canEditHouseholdInventory(household.role)) {
    return {
      success: false as const,
      response: inventoryError(INVENTORY_PERMISSION_ERROR, 403),
    };
  }

  return { success: true as const, household };
}

function parseQuantity(value: string) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) return null;
  return value;
}

async function validateCategory(userId: string, categoryId: string | null) {
  if (!categoryId) return true;

  const categories = await getCategoriesForUser(userId);
  return categories.some((category) => category.id === categoryId);
}

export async function parseProductMutationRequest(
  body: unknown,
  userId: string,
  householdId: string
): Promise<
  | { success: true; data: ProductMutationData }
  | { success: false; response: NextResponse<{ success: false; error: string }> }
> {
  const parsed = productSchema.safeParse(body);

  if (!parsed.success) {
    return {
      success: false,
      response: inventoryError(parsed.error.issues[0]?.message ?? "Invalid inventory item", 400),
    };
  }

  const quantity = parseQuantity(parsed.data.quantity);
  if (!quantity) {
    return {
      success: false,
      response: inventoryError("Quantity must be a positive number", 400),
    };
  }

  const purchaseDate = parseDateInput(parsed.data.purchase_date);
  const expirationDate = parseDateInput(parsed.data.expiration_date);

  if (parsed.data.purchase_date && !purchaseDate) {
    return {
      success: false,
      response: inventoryError("Enter a valid purchase date", 400),
    };
  }

  if (parsed.data.expiration_date && !expirationDate) {
    return {
      success: false,
      response: inventoryError("Enter a valid expiration date", 400),
    };
  }

  const categoryId = parsed.data.category_id || null;
  const categoryIsAllowed = await validateCategory(userId, categoryId);
  if (!categoryIsAllowed) {
    return {
      success: false,
      response: inventoryError("Selected category is unavailable", 403),
    };
  }

  return {
    success: true,
    data: {
      householdId,
      name: parsed.data.name,
      quantity,
      unit: parsed.data.unit || null,
      categoryId,
      purchaseDate,
      expirationDate,
      storageLocation: parsed.data.storage_location || null,
      notes: parsed.data.notes || null,
    },
  };
}

export function isUuid(value: string) {
  return z.string().uuid().safeParse(value).success;
}

export function revalidateInventoryPaths() {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/inventory");
  revalidatePath("/dashboard/household");
}
