"use client";

import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { useToast } from "@/components/ui/Toast";
import { STORAGE_ZONES } from "@/features/categories/constants";
import { updateHouseholdPreferencesAction, type HouseholdActionState } from "@/features/household/actions";
import type { HouseholdPreferences } from "@/features/household/services/household-preferences.service";

const initialState: HouseholdActionState = {
  success: false,
  message: null,
  error: null,
};

const storageOptions = STORAGE_ZONES.map((zone) => ({ value: zone.name, label: zone.name }));

const cadenceOptions = [
  { value: "weekly", label: "Weekly" },
  { value: "biweekly", label: "Every 2 weeks" },
  { value: "as_needed", label: "As needed" },
] as const;

function SaveButton({ disabled }: { disabled?: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending || disabled}
      className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
    >
      {pending ? "Saving..." : "Save defaults"}
    </button>
  );
}

export default function HouseholdSettingsForm({
  preferences,
  canManage,
}: {
  preferences: HouseholdPreferences;
  canManage: boolean;
}) {
  const [state, formAction] = useActionState(updateHouseholdPreferencesAction, initialState);
  const { addToast } = useToast();

  useEffect(() => {
    if (state.error) addToast(state.error, "error");
    if (state.message) addToast(state.message, state.success ? "success" : "info");
  }, [addToast, state]);

  return (
    <form action={formAction} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-950">Household settings</h2>
          <p className="mt-1 text-sm text-slate-500">
            Defaults used by product entry, shopping planning, and household workflows.
          </p>
        </div>
        {!canManage ? (
          <span className="rounded-lg bg-amber-50 px-3 py-1 text-xs font-bold text-amber-800 ring-1 ring-amber-100">
            Admin only
          </span>
        ) : null}
      </div>

      <fieldset disabled={!canManage} className="mt-4 grid gap-3 md:grid-cols-2 disabled:opacity-70">
        <label>
          <span className="text-xs font-semibold text-slate-600">Default storage location</span>
          <select
            name="defaultStorageLocation"
            defaultValue={preferences.defaultStorageLocation}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          >
            {storageOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span className="text-xs font-semibold text-slate-600">Shopping cadence</span>
          <select
            name="shoppingCadence"
            defaultValue={preferences.shoppingCadence}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          >
            {cadenceOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </fieldset>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <SaveButton disabled={!canManage} />
        {state.error ? <p className="text-sm font-medium text-rose-700">{state.error}</p> : null}
        {state.message ? <p className="text-sm font-medium text-emerald-700">{state.message}</p> : null}
      </div>
    </form>
  );
}
