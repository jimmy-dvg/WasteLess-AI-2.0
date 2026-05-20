"use client";

import { ShoppingCart } from "lucide-react";
import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { useToast } from "@/components/ui/Toast";
import {
  addOptimizedShoppingItemsAction,
  type MealPlanActionState,
} from "@/features/meal-planning/actions";

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
      className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
    >
      <ShoppingCart className="h-4 w-4" aria-hidden="true" />
      {pending ? "Adding..." : "Add optimized items"}
    </button>
  );
}

export default function AddOptimizedShoppingButton({
  days,
  disabled,
}: {
  days: number;
  disabled: boolean;
}) {
  const [state, formAction] = useActionState(addOptimizedShoppingItemsAction, initialState);
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
