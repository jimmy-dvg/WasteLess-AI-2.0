"use server";

import { revalidatePath } from "next/cache";
import { parseDateInput } from "@/lib/date";
import { requireUserId } from "@/lib/authz";
import {
  createCategory,
  createProduct,
  deleteCategory,
  deleteProduct,
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
  const userId = await requireUserId();
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
    const created = await createProduct(userId, {
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
  const userId = await requireUserId();
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
    const updated = await updateProduct(userId, parsed.data.id, {
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
  const userId = await requireUserId();

  try {
    const deleted = await deleteProduct(userId, productId);
    if (!deleted) {
      return { success: false, error: "Product not found" };
    }

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/inventory");

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
