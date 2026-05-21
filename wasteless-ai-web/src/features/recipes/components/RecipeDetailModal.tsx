"use client";

import { useEffect } from "react";
import { Loader2, X } from "lucide-react";
import RecipeDetailView from "@/features/recipes/components/RecipeDetailView";
import type { RecipeDetail } from "@/types/recipes";

type RecipeDetailModalProps = {
  open: boolean;
  recipe: RecipeDetail | null;
  title?: string | null;
  isLoading: boolean;
  error?: string | null;
  onClose: () => void;
};

export default function RecipeDetailModal({
  open,
  recipe,
  title,
  isLoading,
  error,
  onClose,
}: RecipeDetailModalProps) {
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-start justify-center overflow-y-auto bg-slate-950/50 px-3 py-5 backdrop-blur-sm sm:px-6"
      role="dialog"
      aria-modal="true"
      aria-label={recipe?.title ?? title ?? "Recipe details"}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-3xl">
        {recipe ? (
          <RecipeDetailView recipe={recipe} onClose={onClose} />
        ) : (
          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xl">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 p-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-normal text-emerald-700">Recipe keeper</p>
                <h2 className="mt-2 text-xl font-bold text-orange-950">{title ?? "Recipe details"}</h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-800"
                aria-label="Close recipe"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            {isLoading ? (
              <div className="flex min-h-64 flex-col items-center justify-center p-8 text-center">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-600" aria-hidden="true" />
                <p className="mt-4 text-sm font-semibold text-slate-700">Loading recipe details...</p>
              </div>
            ) : (
              <div className="p-5">
                <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-rose-900">
                  <h3 className="text-base font-semibold">Recipe details failed to load</h3>
                  <p className="mt-2 text-sm text-rose-800">
                    {error ?? "Refresh the page and try opening the recipe again."}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
