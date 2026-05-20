"use server";

import { requireUser } from "@/lib/auth";
import {
  acceptHouseholdInvitation,
  declineHouseholdInvitation,
  inviteHouseholdMember,
  removeHouseholdMember,
  revokeHouseholdInvitation,
  switchActiveHouseholdForUser,
  updateHouseholdMemberRole,
} from "@/features/household/services/household.service";
import {
  activeHouseholdSchema,
  householdInvitationIdSchema,
  householdInvitationSchema,
  householdInvitationTokenSchema,
  householdMemberIdSchema,
  householdMemberRoleSchema,
} from "@/validation/household";
import { revalidatePath } from "next/cache";

export type HouseholdActionState = {
  success: boolean;
  message?: string | null;
  error?: string | null;
  inviteUrl?: string | null;
};

const initialError = "Unable to update household right now";

function revalidateHouseholdPaths() {
  revalidatePath("/dashboard", "layout");
  revalidatePath("/dashboard/household");
  revalidatePath("/dashboard/shopping");
  revalidatePath("/dashboard/meal-plan");
}

export async function inviteHouseholdMemberAction(
  _prevState: HouseholdActionState,
  formData: FormData
): Promise<HouseholdActionState> {
  const parsed = householdInvitationSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid invitation",
    };
  }

  try {
    const user = await requireUser();
    const result = await inviteHouseholdMember({
      actor: user,
      householdId: String(formData.get("householdId") ?? ""),
      email: parsed.data.email,
      role: parsed.data.role,
    });

    revalidateHouseholdPaths();

    return {
      success: true,
      message: `Invitation created for ${result.email}.`,
      inviteUrl: result.inviteUrl,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : initialError,
    };
  }
}

export async function revokeHouseholdInvitationAction(
  _prevState: HouseholdActionState,
  formData: FormData
): Promise<HouseholdActionState> {
  const parsed = householdInvitationIdSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { success: false, error: "Invalid invitation" };

  try {
    const user = await requireUser();
    await revokeHouseholdInvitation({ actor: user, invitationId: parsed.data.invitationId });
    revalidateHouseholdPaths();

    return { success: true, message: "Invitation revoked." };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : initialError };
  }
}

export async function updateHouseholdMemberRoleAction(
  _prevState: HouseholdActionState,
  formData: FormData
): Promise<HouseholdActionState> {
  const parsed = householdMemberRoleSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { success: false, error: "Invalid member role" };

  try {
    const user = await requireUser();
    await updateHouseholdMemberRole({ actor: user, memberId: parsed.data.memberId, role: parsed.data.role });
    revalidateHouseholdPaths();

    return { success: true, message: "Member role updated." };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : initialError };
  }
}

export async function removeHouseholdMemberAction(
  _prevState: HouseholdActionState,
  formData: FormData
): Promise<HouseholdActionState> {
  const parsed = householdMemberIdSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { success: false, error: "Invalid household member" };

  try {
    const user = await requireUser();
    await removeHouseholdMember({ actor: user, memberId: parsed.data.memberId });
    revalidateHouseholdPaths();

    return { success: true, message: "Member removed." };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : initialError };
  }
}

export async function switchActiveHouseholdAction(
  _prevState: HouseholdActionState,
  formData: FormData
): Promise<HouseholdActionState> {
  const parsed = activeHouseholdSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { success: false, error: "Invalid household" };

  try {
    const user = await requireUser();
    await switchActiveHouseholdForUser(user.id, parsed.data.householdId);
    revalidateHouseholdPaths();

    return { success: true, message: "Household switched." };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : initialError };
  }
}

export async function acceptHouseholdInvitationAction(
  _prevState: HouseholdActionState,
  formData: FormData
): Promise<HouseholdActionState> {
  const parsed = householdInvitationTokenSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { success: false, error: "Invalid invitation link" };

  try {
    const user = await requireUser();
    const householdName = await acceptHouseholdInvitation({ user, token: parsed.data.token });
    revalidateHouseholdPaths();

    return { success: true, message: `You joined ${householdName}.` };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : initialError };
  }
}

export async function declineHouseholdInvitationAction(
  _prevState: HouseholdActionState,
  formData: FormData
): Promise<HouseholdActionState> {
  const parsed = householdInvitationTokenSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { success: false, error: "Invalid invitation link" };

  try {
    const user = await requireUser();
    await declineHouseholdInvitation({ user, token: parsed.data.token });
    revalidateHouseholdPaths();

    return { success: true, message: "Invitation declined." };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : initialError };
  }
}
