"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import RecipeDetailModal from "@/features/recipes/components/RecipeDetailModal";
import type { RecipeDetail } from "@/types/recipes";

type RecipeDetailResponse = {
  success: boolean;
  data?: RecipeDetail;
  error?: string;
};

type MealPlanRecipeButtonProps = {
  recipeId?: string | null;
  title: string;
  fallbackRecipe?: RecipeDetail;
  className?: string;
  children?: ReactNode;
};

export default function MealPlanRecipeButton({
  recipeId,
  title,
  fallbackRecipe,
  className,
  children,
}: MealPlanRecipeButtonProps) {
  const [open, setOpen] = useState(false);
  const [recipe, setRecipe] = useState<RecipeDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openRecipe = async () => {
    setOpen(true);
    setError(null);

    if (recipe) return;

    if (!recipeId) {
      if (fallbackRecipe) {
        setRecipe(fallbackRecipe);
        return;
      }
      setError("Recipe details are not available for this meal.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/recipes/${encodeURIComponent(recipeId)}`);
      const payload = (await response.json()) as RecipeDetailResponse;

      if (!response.ok || !payload.success || !payload.data) {
        throw new Error(payload.error || "Recipe details failed to load");
      }

      setRecipe(payload.data);
    } catch (loadError) {
      if (fallbackRecipe) {
        setRecipe(fallbackRecipe);
        return;
      }
      setError(loadError instanceof Error ? loadError.message : "Recipe details failed to load");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button type="button" onClick={openRecipe} className={className}>
        {children ?? title}
      </button>
      <RecipeDetailModal
        open={open}
        recipe={recipe}
        title={title}
        isLoading={isLoading}
        error={error}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
