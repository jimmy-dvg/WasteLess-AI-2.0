"use server";

import { db } from "@/db";
import { ensurePersonalHouseholdForUser } from "@/db/queries/households";
import * as schema from "@/db/schema/tables";
import { requireUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";

export type InventoryActionState = {
  success: boolean;
  message?: string | null;
  error?: string | null;
};

const inventoryItemSchema = z.object({
  name: z.string().trim().min(2, "Product name must be at least 2 characters").max(120),
  quantity: z.string().trim().min(1, "Quantity is required").max(20),
  unit: z.string().trim().max(32).optional(),
  category: z.string().trim().max(80).optional(),
  expiration_date: z.string().trim().optional(),
  location: z.string().trim().min(2, "Storage location is required").max(32),
});

export async function addInventoryItem(
  _prevState: InventoryActionState,
  formData: FormData
): Promise<InventoryActionState> {
  const user = await requireUser();
  const parsed = inventoryItemSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Unable to add inventory item",
    };
  }

  const expirationDate = parsed.data.expiration_date ? new Date(parsed.data.expiration_date) : null;

  if (expirationDate && Number.isNaN(expirationDate.getTime())) {
    return {
      success: false,
      error: "Enter a valid expiration date",
    };
  }

  try {
    const household = await ensurePersonalHouseholdForUser(user);

    await db.insert(schema.inventory_items).values({
      household_id: household.id,
      owner_user_id: user.id,
      name: parsed.data.name,
      quantity: parsed.data.quantity,
      unit: parsed.data.unit || null,
      location: parsed.data.location,
      expiration_date: expirationDate,
      metadata: {
        category: parsed.data.category || "Uncategorized",
        source: "dashboard",
      },
      last_seen_at: new Date(),
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/inventory");

    return {
      success: true,
      message: `${parsed.data.name} was added to your inventory.`,
    };
  } catch {
    return {
      success: false,
      error: "Unable to add inventory item right now",
    };
  }
}
