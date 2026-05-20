"use client";

import { Copy } from "lucide-react";
import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { useToast } from "@/components/ui/Toast";
import { revokeHouseholdInvitationAction, type HouseholdActionState } from "@/features/household/actions";

const initialState: HouseholdActionState = {
  success: false,
  message: null,
  error: null,
};

function RevokeButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Revoking..." : "Revoke"}
    </button>
  );
}

export default function InvitationActions({
  invitationId,
  inviteUrl,
}: {
  invitationId: string;
  inviteUrl: string;
}) {
  const [state, formAction] = useActionState(revokeHouseholdInvitationAction, initialState);
  const { addToast } = useToast();

  useEffect(() => {
    if (state.error) addToast(state.error, "error");
    if (state.message) addToast(state.message, state.success ? "success" : "info");
  }, [state, addToast]);

  const copyInvite = async () => {
    await navigator.clipboard.writeText(`${window.location.origin}${inviteUrl}`);
    addToast("Invite link copied.", "success");
  };

  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={copyInvite}
        className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
      >
        <Copy className="h-3.5 w-3.5" aria-hidden="true" />
        Copy
      </button>
      <form action={formAction}>
        <input type="hidden" name="invitationId" value={invitationId} />
        <RevokeButton />
      </form>
    </div>
  );
}
