"use client";

import { useActionState, useEffect } from "react";
import { useToast } from "@/components/ui/Toast";
import { createShoppingListFromMissingAction, type RecipeActionState } from "@/features/recipes/actions";

const initialState: RecipeActionState = { success: false };

export default function AddMissingToShoppingButton({ recipeId }: { recipeId: string }) {
  const [state, formAction, isPending] = useActionState(createShoppingListFromMissingAction, initialState);
  const { addToast } = useToast();

  useEffect(() => {
    if (state.error) addToast(state.error, "error");
    if (state.message) addToast(state.message, "success");
  }, [state, addToast]);

  return (
    <form action={formAction}>
      <input type="hidden" name="recipeId" value={recipeId} />
      <button
        type="submit"
        disabled={isPending}
        className="inline-flex items-center rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isPending ? "Adding..." : "Add missing to shopping list"}
      </button>
    </form>
  );
}
