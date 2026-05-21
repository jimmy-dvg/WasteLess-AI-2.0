"use client";

import { useState, useTransition } from "react";
import { Heart } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import {
  saveRecipeSnapshotAsFavoriteAction,
  toggleSavedRecipeAction,
} from "@/features/recipes/actions";
import type { RecipeListItem } from "@/types/recipes";

type SaveRecipeButtonProps = {
  recipeId: string;
  initialSaved: boolean;
  recipeSnapshot?: RecipeListItem;
  variant?: "button" | "icon";
  onSavedChange?: (saved: boolean, recipe?: RecipeListItem) => void;
};

export default function SaveRecipeButton({
  recipeId,
  initialSaved,
  recipeSnapshot,
  variant = "button",
  onSavedChange,
}: SaveRecipeButtonProps) {
  const [saved, setSaved] = useState(initialSaved);
  const [isPending, startTransition] = useTransition();
  const { addToast } = useToast();

  const handleToggle = () => {
    const previous = saved;
    const next = !saved;
    setSaved(next);

    startTransition(async () => {
      const result = recipeSnapshot
        ? await saveRecipeSnapshotAsFavoriteAction(recipeSnapshot)
        : await toggleSavedRecipeAction(recipeId);
      if (!result.success) {
        setSaved(previous);
        addToast(result.error ?? "Unable to update recipe", "error");
        return;
      }
      const nextSaved = Boolean(result.saved);
      const savedRecipe = "recipe" in result ? (result as { recipe?: RecipeListItem }).recipe : undefined;
      setSaved(nextSaved);
      onSavedChange?.(nextSaved, savedRecipe);
      if (result.message) addToast(result.message, "success");
    });
  };

  if (variant === "icon") {
    return (
      <button
        type="button"
        onClick={handleToggle}
        disabled={isPending}
        className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border bg-white text-slate-500 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 ${
          saved ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200"
        } ${isPending ? "cursor-not-allowed opacity-70" : ""}`}
        aria-label={saved ? "Remove recipe from saved recipes" : "Save recipe"}
        aria-pressed={saved}
      >
        <Heart className={`h-4 w-4 ${saved ? "fill-emerald-600" : ""}`} aria-hidden="true" />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={isPending}
      className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold transition ${
        saved
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-slate-200 text-slate-700 hover:bg-slate-50"
      } ${isPending ? "cursor-not-allowed opacity-70" : ""}`}
      aria-pressed={saved}
    >
      <Heart className={`h-4 w-4 ${saved ? "fill-emerald-600" : ""}`} aria-hidden="true" />
      {saved ? "Favorited" : "Favorite"}
    </button>
  );
}
