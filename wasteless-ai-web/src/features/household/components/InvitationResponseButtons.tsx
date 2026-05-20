"use client";

import { useActionState, useEffect } from "react";
import { useToast } from "@/components/ui/Toast";
import {
  acceptHouseholdInvitationAction,
  declineHouseholdInvitationAction,
  type HouseholdActionState,
} from "@/features/household/actions";
import Link from "next/link";

const initialState: HouseholdActionState = {
  success: false,
  message: null,
  error: null,
};

export default function InvitationResponseButtons({ token, disabled }: { token: string; disabled: boolean }) {
  const [acceptState, acceptAction] = useActionState(acceptHouseholdInvitationAction, initialState);
  const [declineState, declineAction] = useActionState(declineHouseholdInvitationAction, initialState);
  const { addToast } = useToast();
  const successMessage = acceptState.success ? acceptState.message : declineState.success ? declineState.message : null;

  useEffect(() => {
    if (acceptState.error) addToast(acceptState.error, "error");
    if (acceptState.message) addToast(acceptState.message, acceptState.success ? "success" : "info");
  }, [acceptState, addToast]);

  useEffect(() => {
    if (declineState.error) addToast(declineState.error, "error");
    if (declineState.message) addToast(declineState.message, declineState.success ? "success" : "info");
  }, [declineState, addToast]);

  if (successMessage) {
    return (
      <Link
        href="/dashboard/household"
        className="inline-flex rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
      >
        Open household
      </Link>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      <form action={acceptAction}>
        <input type="hidden" name="token" value={token} />
        <button
          type="submit"
          disabled={disabled}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
        >
          Accept invite
        </button>
      </form>
      <form action={declineAction}>
        <input type="hidden" name="token" value={token} />
        <button
          type="submit"
          disabled={disabled}
          className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Decline
        </button>
      </form>
    </div>
  );
}
