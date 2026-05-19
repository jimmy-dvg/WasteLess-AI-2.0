"use server";

import { requireUser } from "@/lib/auth";
import { aiSettingsSchema } from "@/validation/ai";
import { updateAiSettingsForUser } from "@/ai/services/ai-settings";
import { revalidatePath } from "next/cache";

export type AiActionState = {
  success: boolean;
  message?: string | null;
  error?: string | null;
};

export async function updateAiSettingsAction(
  _prevState: AiActionState,
  formData: FormData
): Promise<AiActionState> {
  const user = await requireUser();

  const data = {
    provider: formData.get("provider") ? String(formData.get("provider")) : undefined,
    model: formData.get("model") ? String(formData.get("model")) : undefined,
    enableStreaming: formData.get("enableStreaming") === "on",
  };

  const parsed = aiSettingsSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid AI settings" };
  }

  await updateAiSettingsForUser(user.id, parsed.data);
  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard/recipes");

  return { success: true, message: "AI settings updated." };
}
