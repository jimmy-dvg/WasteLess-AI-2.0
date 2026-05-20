"use client";

import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { useToast } from "@/components/ui/Toast";
import { switchActiveHouseholdAction, type HouseholdActionState } from "@/features/household/actions";
import type { UserHousehold } from "@/db/queries/households";

const initialState: HouseholdActionState = {
  success: false,
  message: null,
  error: null,
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Switching..." : "Switch"}
    </button>
  );
}

export default function HouseholdSwitcher({
  households,
  currentHouseholdId,
}: {
  households: UserHousehold[];
  currentHouseholdId: string;
}) {
  const [state, formAction] = useActionState(switchActiveHouseholdAction, initialState);
  const { addToast } = useToast();

  useEffect(() => {
    if (state.error) addToast(state.error, "error");
    if (state.message) addToast(state.message, state.success ? "success" : "info");
  }, [state, addToast]);

  if (households.length <= 1) return null;

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-2">
      <label className="block">
        <span className="text-xs font-semibold text-slate-600">Active household</span>
        <select
          name="householdId"
          defaultValue={currentHouseholdId}
          className="mt-1 min-w-52 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
        >
          {households.map((household) => (
            <option key={household.id} value={household.id}>
              {household.name} ({household.role})
            </option>
          ))}
        </select>
      </label>
      <SubmitButton />
    </form>
  );
}
