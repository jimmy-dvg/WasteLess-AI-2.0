"use server";

import { revalidatePath } from "next/cache";
import { parseDateInput } from "@/lib/date";
import { requireUser } from "@/lib/auth";
import { requireUserId } from "@/lib/authz";
import { ensurePersonalHouseholdForUser } from "@/db/queries/households";
import { recordHouseholdActivity } from "@/features/household/services/household.service";
import {
  createCategory,
  createProduct,
  deleteCategory,
  deleteProduct,
  getProductById,
  updateCategory,
  updateProduct,
} from "@/services/inventory.service";
import { categorySchema, productSchema, productUpdateSchema } from "@/validation/inventory";
import { z } from "zod";

export type InventoryActionState = {
  success: boolean;
  message?: string | null;
  error?: string | null;
};

function parseQuantity(value: string) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) return null;
  return value;
}

export async function createProductAction(
  _prevState: InventoryActionState,
  formData: FormData
): Promise<InventoryActionState> {
  const user = await requireUser();
  const parsed = productSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Unable to add product",
    };
  }

  const quantity = parseQuantity(parsed.data.quantity);
  if (!quantity) {
    return {
      success: false,
      error: "Quantity must be a positive number",
    };
  }

  const purchaseDate = parseDateInput(parsed.data.purchase_date);
  const expirationDate = parseDateInput(parsed.data.expiration_date);

  if (parsed.data.purchase_date && !purchaseDate) {
    return { success: false, error: "Enter a valid purchase date" };
  }

  if (parsed.data.expiration_date && !expirationDate) {
    return { success: false, error: "Enter a valid expiration date" };
  }

  try {
    const household = await ensurePersonalHouseholdForUser(user);
    const created = await createProduct(user.id, {
      name: parsed.data.name,
      quantity,
      unit: parsed.data.unit || null,
      categoryId: parsed.data.category_id || null,
      purchaseDate,
      expirationDate,
      storageLocation: parsed.data.storage_location || null,
      notes: parsed.data.notes || null,
    });

    if (!created) {
      return { success: false, error: "Unable to add product" };
    }

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/inventory");
    revalidatePath("/dashboard/household");

    await recordHouseholdActivity({
      householdId: household.id,
      actorUserId: user.id,
      eventType: "inventory_product_created",
      objectType: "product",
      objectId: created.id,
      summary: `${user.name} added ${parsed.data.name} to inventory.`,
      metadata: {
        quantity,
        unit: parsed.data.unit || null,
      },
    }).catch(() => undefined);

    return {
      success: true,
      message: `${parsed.data.name} was added to your inventory.`,
    };
  } catch {
    return {
      success: false,
      error: "Unable to add product right now",
    };
  }
}

export async function updateProductAction(
  _prevState: InventoryActionState,
  formData: FormData
): Promise<InventoryActionState> {
  const user = await requireUser();
  const parsed = productUpdateSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Unable to update product",
    };
  }

  const parsedQuantity = parsed.data.quantity ? parseQuantity(parsed.data.quantity) : undefined;
  if (parsed.data.quantity && !parsedQuantity) {
    return {
      success: false,
      error: "Quantity must be a positive number",
    };
  }
  const quantity = parsedQuantity ?? undefined;

  const purchaseDate = parsed.data.purchase_date ? parseDateInput(parsed.data.purchase_date) : undefined;
  const expirationDate = parsed.data.expiration_date ? parseDateInput(parsed.data.expiration_date) : undefined;

  if (parsed.data.purchase_date && !purchaseDate) {
    return { success: false, error: "Enter a valid purchase date" };
  }

  if (parsed.data.expiration_date && !expirationDate) {
    return { success: false, error: "Enter a valid expiration date" };
  }

  try {
    const household = await ensurePersonalHouseholdForUser(user);
    const updated = await updateProduct(user.id, parsed.data.id, {
      name: parsed.data.name,
      quantity,
      unit: parsed.data.unit || null,
      categoryId: parsed.data.category_id || null,
      purchaseDate: purchaseDate ?? null,
      expirationDate: expirationDate ?? null,
      storageLocation: parsed.data.storage_location || null,
      notes: parsed.data.notes || null,
    });

    if (!updated) {
      return { success: false, error: "Product not found" };
    }

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/inventory");
    revalidatePath("/dashboard/household");

    await recordHouseholdActivity({
      householdId: household.id,
      actorUserId: user.id,
      eventType: "inventory_product_updated",
      objectType: "product",
      objectId: parsed.data.id,
      summary: `${user.name} updated ${parsed.data.name ?? "an inventory item"}.`,
    }).catch(() => undefined);

    return {
      success: true,
      message: "Product updated.",
    };
  } catch {
    return {
      success: false,
      error: "Unable to update product right now",
    };
  }
}

export async function deleteProductAction(productId: string): Promise<InventoryActionState> {
  const user = await requireUser();

  try {
    const household = await ensurePersonalHouseholdForUser(user);
    const product = await getProductById(user.id, productId);
    const deleted = await deleteProduct(user.id, productId);
    if (!deleted) {
      return { success: false, error: "Product not found" };
    }

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/inventory");
    revalidatePath("/dashboard/household");

    await recordHouseholdActivity({
      householdId: household.id,
      actorUserId: user.id,
      eventType: "inventory_product_deleted",
      objectType: "product",
      objectId: productId,
      summary: `${user.name} removed ${product?.name ?? "an inventory item"} from inventory.`,
    }).catch(() => undefined);

    return {
      success: true,
      message: "Product removed from inventory.",
    };
  } catch {
    return { success: false, error: "Unable to delete product right now" };
  }
}

export async function createCategoryAction(
  _prevState: InventoryActionState,
  formData: FormData
): Promise<InventoryActionState> {
  const userId = await requireUserId();
  const parsed = categorySchema.safeParse(Object.fromEntries(formData.entries()));

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Unable to create category",
    };
  }

  try {
    const created = await createCategory(userId, {
      name: parsed.data.name,
      color: parsed.data.color ? parsed.data.color : null,
    });

    if (!created) {
      return { success: false, error: "Unable to create category" };
    }

    revalidatePath("/dashboard/categories");
    revalidatePath("/dashboard/inventory");

    return {
      success: true,
      message: `${parsed.data.name} created.`,
    };
  } catch {
    return { success: false, error: "Unable to create category right now" };
  }
}

export async function updateCategoryAction(
  _prevState: InventoryActionState,
  formData: FormData
): Promise<InventoryActionState> {
  const userId = await requireUserId();

  const data = Object.fromEntries(formData.entries());
  const parsed = categorySchema.extend({ id: z.string().uuid() }).safeParse(data);

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Unable to update category",
    };
  }

  try {
    const updated = await updateCategory(userId, parsed.data.id, {
      name: parsed.data.name,
      color: parsed.data.color ? parsed.data.color : null,
    });

    if (!updated) {
      return { success: false, error: "Category not found" };
    }

    revalidatePath("/dashboard/categories");
    revalidatePath("/dashboard/inventory");

    return {
      success: true,
      message: "Category updated.",
    };
  } catch {
    return { success: false, error: "Unable to update category right now" };
  }
}

export async function deleteCategoryAction(categoryId: string): Promise<InventoryActionState> {
  const userId = await requireUserId();

  try {
    const deleted = await deleteCategory(userId, categoryId);
    if (!deleted) {
      return { success: false, error: "Category not found" };
    }

    revalidatePath("/dashboard/categories");
    revalidatePath("/dashboard/inventory");

    return {
      success: true,
      message: "Category deleted.",
    };
  } catch {
    return { success: false, error: "Unable to delete category right now" };
  }
}
