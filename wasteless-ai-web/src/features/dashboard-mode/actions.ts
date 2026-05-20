"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { updateDashboardModeForUser } from "./services/dashboard-mode.service";
import { isDashboardMode, type DashboardMode } from "./constants";

export type DashboardModeActionState = {
  success: boolean;
  message?: string | null;
  error?: string | null;
  mode?: DashboardMode;
};

export async function updateDashboardModeAction(
  _prevState: DashboardModeActionState,
  formData: FormData
): Promise<DashboardModeActionState> {
  const mode = formData.get("mode");
  if (!isDashboardMode(mode)) {
    return {
      success: false,
      error: "Invalid dashboard mode",
    };
  }

  try {
    const user = await requireUser();
    const updatedMode = await updateDashboardModeForUser(user.id, mode);

    revalidatePath("/dashboard", "layout");

    return {
      success: true,
      message: "Dashboard mode updated.",
      mode: updatedMode,
    };
  } catch {
    return {
      success: false,
      error: "Unable to update dashboard mode right now",
    };
  }
}
