"use client";

import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { useToast } from "@/components/ui/Toast";
import {
  removeHouseholdMemberAction,
  updateHouseholdMemberRoleAction,
  type HouseholdActionState,
} from "@/features/household/actions";
import type { HouseholdRole } from "@/features/household/constants";

const initialState: HouseholdActionState = {
  success: false,
  message: null,
  error: null,
};

function SaveRoleButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Saving..." : "Save"}
    </button>
  );
}

function RemoveButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Removing..." : "Remove"}
    </button>
  );
}

export default function MemberRoleForm({
  memberId,
  role,
  disabled,
}: {
  memberId: string;
  role: HouseholdRole;
  disabled: boolean;
}) {
  const [roleState, roleAction] = useActionState(updateHouseholdMemberRoleAction, initialState);
  const [removeState, removeAction] = useActionState(removeHouseholdMemberAction, initialState);
  const { addToast } = useToast();

  useEffect(() => {
    if (roleState.error) addToast(roleState.error, "error");
    if (roleState.message) addToast(roleState.message, roleState.success ? "success" : "info");
  }, [roleState, addToast]);

  useEffect(() => {
    if (removeState.error) addToast(removeState.error, "error");
    if (removeState.message) addToast(removeState.message, removeState.success ? "success" : "info");
  }, [removeState, addToast]);

  if (disabled) return null;

  return (
    <div className="flex flex-wrap gap-2">
      <form action={roleAction} className="flex items-center gap-2">
        <input type="hidden" name="memberId" value={memberId} />
        <select
          name="role"
          defaultValue={role}
          className="rounded-lg border border-slate-200 px-2 py-2 text-xs outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
        >
          <option value="owner">Owner</option>
          <option value="admin">Admin</option>
          <option value="member">Member</option>
          <option value="guest">Guest</option>
        </select>
        <SaveRoleButton />
      </form>
      <form action={removeAction}>
        <input type="hidden" name="memberId" value={memberId} />
        <RemoveButton />
      </form>
    </div>
  );
}
