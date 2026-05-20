"use client";

import { CalendarPlus } from "lucide-react";
import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { useToast } from "@/components/ui/Toast";
import { saveCurrentMealPlanAction, type MealPlanActionState } from "@/features/meal-planning/actions";

const initialState: MealPlanActionState = {
  success: false,
  message: null,
  error: null,
};

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={disabled || pending}
      className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
    >
      <CalendarPlus className="h-4 w-4" aria-hidden="true" />
      {pending ? "Saving..." : "Save weekly plan"}
    </button>
  );
}

export default function SaveMealPlanButton({ days, disabled }: { days: number; disabled: boolean }) {
  const [state, formAction] = useActionState(saveCurrentMealPlanAction, initialState);
  const { addToast } = useToast();

  useEffect(() => {
    if (state.error) addToast(state.error, "error");
    if (state.message) addToast(state.message, state.success ? "success" : "info");
  }, [state, addToast]);

  return (
    <form action={formAction}>
      <input type="hidden" name="days" value={days} />
      <SubmitButton disabled={disabled} />
    </form>
  );
}
