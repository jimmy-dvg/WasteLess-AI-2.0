"use client";

import { useActionState, useEffect } from "react";
import { useToast } from "@/components/ui/Toast";
import type { RecipePreferences } from "@/types/recipes";
import { updateRecipePreferencesAction, type RecipeActionState } from "@/features/recipes/actions";

const initialState: RecipeActionState = { success: false };

export default function RecipePreferencesForm({ initialPreferences }: { initialPreferences: RecipePreferences }) {
  const [state, formAction, isPending] = useActionState(updateRecipePreferencesAction, initialState);
  const { addToast } = useToast();

  useEffect(() => {
    if (state.error) addToast(state.error, "error");
    if (state.message) addToast(state.message, "success");
  }, [state, addToast]);

  return (
    <form action={formAction} className="space-y-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div>
        <p className="text-sm font-semibold text-slate-900">Preferences</p>
        <p className="mt-1 text-xs text-slate-500">Use commas to separate multiple values.</p>
      </div>

      <label className="block">
        <span className="text-xs font-semibold text-slate-600">Cuisines</span>
        <input
          name="cuisines"
          defaultValue={initialPreferences.cuisines.join(", ")}
          placeholder="Mediterranean, Mexican"
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
        />
      </label>

      <label className="block">
        <span className="text-xs font-semibold text-slate-600">Diets</span>
        <input
          name="diets"
          defaultValue={initialPreferences.diets.join(", ")}
          placeholder="Vegetarian, High protein"
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
        />
      </label>

      <label className="block">
        <span className="text-xs font-semibold text-slate-600">Allergens</span>
        <input
          name="allergens"
          defaultValue={initialPreferences.allergens.join(", ")}
          placeholder="Peanuts, Shellfish"
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
        />
      </label>

      <label className="block">
        <span className="text-xs font-semibold text-slate-600">Dislikes</span>
        <input
          name="dislikes"
          defaultValue={initialPreferences.dislikes.join(", ")}
          placeholder="Mushrooms, Olives"
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
        />
      </label>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="text-xs font-semibold text-slate-600">Max cook time (min)</span>
          <input
            name="maxCookTimeMinutes"
            type="number"
            min={5}
            max={240}
            defaultValue={initialPreferences.maxCookTimeMinutes ?? ""}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          />
        </label>
        <label className="block">
          <span className="text-xs font-semibold text-slate-600">Servings</span>
          <input
            name="servings"
            type="number"
            min={1}
            max={12}
            defaultValue={initialPreferences.servings ?? ""}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          />
        </label>
      </div>

      <label className="block">
        <span className="text-xs font-semibold text-slate-600">Difficulty</span>
        <select
          name="difficulty"
          defaultValue={initialPreferences.difficulty ?? ""}
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
        >
          <option value="">No preference</option>
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>
      </label>

      <label className="block">
        <span className="text-xs font-semibold text-slate-600">Notes</span>
        <textarea
          name="notes"
          defaultValue={initialPreferences.notes ?? ""}
          rows={3}
          placeholder="Quick weeknight meals, high fiber..."
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
        />
      </label>

      <button
        type="submit"
        disabled={isPending}
        className="inline-flex w-full items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isPending ? "Saving..." : "Save preferences"}
      </button>
    </form>
  );
}
