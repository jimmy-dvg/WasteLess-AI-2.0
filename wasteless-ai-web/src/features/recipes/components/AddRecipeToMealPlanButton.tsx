"use client";

import { CalendarPlus } from "lucide-react";
import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { useToast } from "@/components/ui/Toast";
import {
  addRecipeToMealPlanAction,
  type MealPlanActionState,
} from "@/features/meal-planning/actions";

const initialState: MealPlanActionState = {
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
      className="inline-flex items-center justify-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-70"
    >
      <CalendarPlus className="h-4 w-4" aria-hidden="true" />
      {pending ? "Adding..." : "Add to meal plan"}
    </button>
  );
}

export default function AddRecipeToMealPlanButton({ recipeId }: { recipeId: string }) {
  const [state, formAction] = useActionState(addRecipeToMealPlanAction, initialState);
  const { addToast } = useToast();

  useEffect(() => {
    if (state.error) addToast(state.error, "error");
    if (state.message) addToast(state.message, state.success ? "success" : "info");
  }, [state, addToast]);

  return (
    <form action={formAction}>
      <input type="hidden" name="recipeId" value={recipeId} />
      <SubmitButton />
    </form>
  );
}
