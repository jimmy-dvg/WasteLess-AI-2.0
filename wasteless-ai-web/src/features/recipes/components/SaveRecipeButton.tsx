"use client";

import { useState, useTransition } from "react";
import { useToast } from "@/components/ui/Toast";
import { toggleSavedRecipeAction } from "@/features/recipes/actions";

export default function SaveRecipeButton({ recipeId, initialSaved }: { recipeId: string; initialSaved: boolean }) {
  const [saved, setSaved] = useState(initialSaved);
  const [isPending, startTransition] = useTransition();
  const { addToast } = useToast();

  const handleToggle = () => {
    const previous = saved;
    const next = !saved;
    setSaved(next);

    startTransition(async () => {
      const result = await toggleSavedRecipeAction(recipeId);
      if (!result.success) {
        setSaved(previous);
        addToast(result.error ?? "Unable to update recipe", "error");
        return;
      }
      setSaved(Boolean(result.saved));
      if (result.message) addToast(result.message, "success");
    });
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={isPending}
      className={`rounded-lg border px-4 py-2 text-sm font-semibold transition ${
        saved
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-slate-200 text-slate-700 hover:bg-slate-50"
      } ${isPending ? "cursor-not-allowed opacity-70" : ""}`}
      aria-pressed={saved}
    >
      {saved ? "Saved" : "Save"}
    </button>
  );
}
