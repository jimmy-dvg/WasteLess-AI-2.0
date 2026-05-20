"use client";

import { Copy, MailPlus } from "lucide-react";
import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { useToast } from "@/components/ui/Toast";
import { inviteHouseholdMemberAction, type HouseholdActionState } from "@/features/household/actions";

const initialState: HouseholdActionState = {
  success: false,
  message: null,
  error: null,
  inviteUrl: null,
};

function InviteButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
    >
      <MailPlus className="h-4 w-4" aria-hidden="true" />
      {pending ? "Creating..." : "Create invite"}
    </button>
  );
}

export default function InviteMemberForm({ householdId }: { householdId: string }) {
  const [state, formAction] = useActionState(inviteHouseholdMemberAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const { addToast } = useToast();

  useEffect(() => {
    if (state.error) addToast(state.error, "error");
    if (state.message) addToast(state.message, state.success ? "success" : "info");
    if (state.success) formRef.current?.reset();
  }, [state, addToast]);

  const copyInvite = async () => {
    if (!state.inviteUrl) return;
    const url = `${window.location.origin}${state.inviteUrl}`;
    await navigator.clipboard.writeText(url);
    addToast("Invite link copied.", "success");
  };

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-950">Invite collaborator</h2>
      <p className="mt-1 text-sm text-slate-500">Create an invite link for a household member.</p>

      <form ref={formRef} action={formAction} className="mt-4 space-y-3">
        <input type="hidden" name="householdId" value={householdId} />
        <label className="block">
          <span className="text-xs font-semibold text-slate-600">Email</span>
          <input
            type="email"
            name="email"
            required
            placeholder="alex@example.com"
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          />
        </label>
        <label className="block">
          <span className="text-xs font-semibold text-slate-600">Role</span>
          <select
            name="role"
            defaultValue="member"
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          >
            <option value="admin">Admin</option>
            <option value="member">Member</option>
            <option value="guest">Guest</option>
          </select>
        </label>
        <InviteButton />
      </form>

      {state.inviteUrl ? (
        <div className="mt-4 rounded-lg border border-emerald-100 bg-emerald-50 p-3">
          <p className="text-xs font-semibold uppercase tracking-normal text-emerald-700">Invite link</p>
          <div className="mt-2 flex items-center gap-2">
            <code className="min-w-0 flex-1 truncate rounded bg-white px-2 py-1 text-xs text-emerald-900">
              {state.inviteUrl}
            </code>
            <button
              type="button"
              onClick={copyInvite}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
              aria-label="Copy invite link"
            >
              <Copy className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
