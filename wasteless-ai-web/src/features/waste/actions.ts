"use server";

import { ensurePersonalHouseholdForUser } from "@/db/queries/households";
import { logProductWasteForUser } from "@/features/waste/services/waste.service";
import { requireUser } from "@/lib/auth";
import { wasteLogSchema } from "@/validation/waste";
import { revalidatePath } from "next/cache";

export type WasteActionState = {
  success: boolean;
  message?: string | null;
  error?: string | null;
};

const revalidateWastePaths = (productId: string) => {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/inventory");
  revalidatePath(`/dashboard/inventory/${productId}`);
  revalidatePath("/dashboard/waste");
};

export async function logProductWasteAction(
  _prevState: WasteActionState,
  formData: FormData
): Promise<WasteActionState> {
  const parsed = wasteLogSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Unable to log waste",
    };
  }

  try {
    const user = await requireUser();
    const household = await ensurePersonalHouseholdForUser(user);
    const result = await logProductWasteForUser({
      userId: user.id,
      householdId: household.id,
      productId: parsed.data.productId,
      quantity: parsed.data.quantity,
      reason: parsed.data.reason,
      notes: parsed.data.notes,
    });

    revalidateWastePaths(parsed.data.productId);

    return {
      success: true,
      message: `${result.quantityLabel} of ${result.productName} logged as waste.`,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unable to log waste right now",
    };
  }
}
