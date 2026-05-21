"use client";

import { Heart } from "lucide-react";
import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { useToast } from "@/components/ui/Toast";
import {
  favoriteMealPlanItemRecipeAction,
  type MealPlanActionState,
} from "@/features/meal-planning/actions";

const initialState: MealPlanActionState = {
  success: false,
  message: null,
  error: null,
};

function SubmitButton({ favorited }: { favorited: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending || favorited}
      className={`inline-flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-80 ${
        favorited
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-slate-200 text-slate-700 hover:bg-slate-50"
      }`}
    >
      <Heart className={`h-4 w-4 ${favorited ? "fill-emerald-600" : ""}`} aria-hidden="true" />
      {pending ? "Saving..." : favorited ? "Favorited" : "Favorite"}
    </button>
  );
}

export default function FavoriteMealPlanRecipeButton({
  itemId,
  initialFavorited,
}: {
  itemId: string;
  initialFavorited: boolean;
}) {
  const [state, formAction] = useActionState(favoriteMealPlanItemRecipeAction, initialState);
  const { addToast } = useToast();
  const favorited = initialFavorited || state.success;

  useEffect(() => {
    if (state.error) addToast(state.error, "error");
    if (state.message) {
      addToast(state.message, state.success ? "success" : "info");
    }
  }, [state, addToast]);

  return (
    <form action={formAction}>
      <input type="hidden" name="itemId" value={itemId} />
      <SubmitButton favorited={favorited} />
    </form>
  );
}
