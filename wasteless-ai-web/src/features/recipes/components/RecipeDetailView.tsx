"use client";

import { useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  ChefHat,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Droplets,
  Dumbbell,
  Flame,
  Leaf,
  Mic,
  Minus,
  Plus,
  Sparkles,
  Users,
  Wheat,
  X,
} from "lucide-react";
import SaveRecipeButton from "@/features/recipes/components/SaveRecipeButton";
import AddMissingToShoppingButton from "@/features/recipes/components/AddMissingToShoppingButton";
import type { RecipeDetail, RecipeIngredient } from "@/types/recipes";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const TAG_STYLES = [
  "border-emerald-200 bg-emerald-50 text-emerald-700",
  "border-lime-200 bg-lime-50 text-lime-700",
  "border-cyan-200 bg-cyan-50 text-cyan-700",
  "border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700",
];

function titleCase(value: string) {
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : value;
}

function formatNumber(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1).replace(/\.0$/, "");
}

function scaleQuantity(quantity: string | undefined, baseServings: number, servings: number) {
  if (!quantity) return undefined;
  const parsed = Number(quantity);
  if (!Number.isFinite(parsed)) return quantity;

  return formatNumber((parsed * servings) / Math.max(baseServings, 1));
}

function formatIngredient(ingredient: RecipeIngredient, baseServings: number, servings: number) {
  return [scaleQuantity(ingredient.quantity, baseServings, servings), ingredient.unit, ingredient.name]
    .filter(Boolean)
    .join(" ");
}

function stepMinutes(totalMinutes: number, stepCount: number) {
  return Math.max(3, Math.round(totalMinutes / Math.max(stepCount, 1)));
}

function MetricTile({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: ReactNode;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-4 text-center">
      <div className="mx-auto flex h-6 w-6 items-center justify-center text-slate-500">{icon}</div>
      <p className="mt-2 text-[11px] font-bold uppercase tracking-normal text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-bold text-slate-800">{value}</p>
    </div>
  );
}

function NutritionTile({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: ReactNode;
}) {
  return (
    <div className="rounded-lg bg-slate-100 px-3 py-3 text-center">
      <div className="mx-auto flex h-5 w-5 items-center justify-center text-slate-500">{icon}</div>
      <p className="mt-1 text-[11px] text-slate-500">{label}</p>
      <p className="text-sm font-bold text-slate-800">{value}</p>
    </div>
  );
}

export default function RecipeDetailView({ recipe, onClose }: { recipe: RecipeDetail; onClose?: () => void }) {
  const [servings, setServings] = useState(recipe.servings);
  const [currentStep, setCurrentStep] = useState(0);
  const [voiceMode, setVoiceMode] = useState(false);
  const [notes, setNotes] = useState("");
  const [advice, setAdvice] = useState<string | null>(null);
  const canUseRecipeActions = UUID_PATTERN.test(recipe.id);
  const steps = useMemo(
    () =>
      recipe.steps.length > 0
        ? recipe.steps
        : ["Prepare the ingredients.", "Cook until everything is tender.", "Season, taste, and serve."],
    [recipe.steps]
  );
  const perStepMinutes = stepMinutes(recipe.cookTime, steps.length);

  const handleAdvice = () => {
    if (!notes.trim()) {
      setAdvice("Add a quick cooking note first, then ask for an adjustment.");
      return;
    }

    setAdvice("Try one small adjustment at a time, taste again, and keep the texture of the expiring ingredients gentle.");
  };

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="flex items-start justify-between gap-4 p-5">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-normal text-emerald-700">Recipe keeper</p>
            <h1 className="mt-2 text-2xl font-bold leading-tight text-orange-950 sm:text-3xl">{recipe.title}</h1>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {canUseRecipeActions ? (
              <SaveRecipeButton recipeId={recipe.id} initialSaved={recipe.isSaved} variant="icon" />
            ) : null}
            {onClose ? (
              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-800"
                aria-label="Close recipe"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            ) : (
              <Link
                href="/dashboard/recipes"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-800"
                aria-label="Back to recipes"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </Link>
            )}
          </div>
        </div>

        <div className="border-t border-slate-100 p-5">
          <p className="max-w-3xl text-base leading-7 text-orange-900/80">{recipe.description}</p>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setCurrentStep(0)}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              <ChefHat className="h-4 w-4" aria-hidden="true" />
              Cook Mode
            </button>
            <p className="text-sm font-bold text-slate-500">
              Step {currentStep + 1}/{steps.length}
            </p>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <MetricTile label="Time" value={`${recipe.cookTime} min`} icon={<Clock3 className="h-5 w-5" />} />
            <MetricTile label="Difficulty" value={titleCase(recipe.difficulty)} icon={<ChefHat className="h-5 w-5" />} />
            <MetricTile label="Serves" value={String(servings)} icon={<Users className="h-5 w-5" />} />
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-amber-300 bg-amber-50/40 p-5">
        <p className="text-xs font-bold uppercase tracking-normal text-orange-700">Servings scale</p>
        <div className="mt-3 flex items-center gap-4">
          <button
            type="button"
            onClick={() => setServings((value) => Math.max(1, value - 1))}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-amber-300 bg-white text-orange-700 transition hover:bg-amber-50"
            aria-label="Decrease servings"
          >
            <Minus className="h-4 w-4" aria-hidden="true" />
          </button>
          <span className="min-w-10 text-center text-base font-bold text-orange-950">{servings}</span>
          <button
            type="button"
            onClick={() => setServings((value) => Math.min(12, value + 1))}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-amber-300 bg-white text-orange-700 transition hover:bg-amber-50"
            aria-label="Increase servings"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-sm font-bold uppercase tracking-normal text-slate-600">Nutrition per serving</p>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <NutritionTile
            label="Kcal"
            value={formatNumber(recipe.nutrition.calories_kcal)}
            icon={<Flame className="h-4 w-4 text-orange-500" />}
          />
          <NutritionTile
            label="Protein"
            value={`${formatNumber(recipe.nutrition.protein_g)}g`}
            icon={<Dumbbell className="h-4 w-4 text-emerald-600" />}
          />
          <NutritionTile
            label="Carbs"
            value={`${formatNumber(recipe.nutrition.carbs_g)}g`}
            icon={<Wheat className="h-4 w-4 text-cyan-600" />}
          />
          <NutritionTile
            label="Fat"
            value={`${formatNumber(recipe.nutrition.fat_g)}g`}
            icon={<Droplets className="h-4 w-4 text-fuchsia-600" />}
          />
        </div>
      </section>

      <section className="rounded-lg border border-emerald-200 bg-emerald-50/60 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-bold uppercase tracking-normal text-emerald-700">Ingredients</p>
            <p className="mt-1 text-xs font-semibold text-emerald-700">Scaled for {servings} serving{servings === 1 ? "" : "s"}</p>
          </div>
          {recipe.missingIngredients.length > 0 && canUseRecipeActions ? (
            <AddMissingToShoppingButton recipeId={recipe.id} />
          ) : null}
        </div>
        <ul className="mt-4 grid gap-3 md:grid-cols-2">
          {recipe.ingredients.map((ingredient) => (
            <li
              key={ingredient.name}
              className="flex items-center justify-between gap-3 rounded-lg border border-emerald-200 bg-white px-3 py-3 text-sm text-slate-700"
            >
              <span>{formatIngredient(ingredient, recipe.servings, servings)}</span>
              <span
                className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                  ingredient.isExpiring ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"
                }`}
                aria-hidden="true"
              >
                {ingredient.isExpiring ? <Clock3 className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {recipe.missingIngredients.length > 0 ? (
        <section className="rounded-lg border border-amber-200 bg-amber-50 p-5">
          <p className="text-sm font-bold uppercase tracking-normal text-amber-800">Missing ingredients</p>
          <ul className="mt-3 grid gap-2 text-sm text-amber-900 sm:grid-cols-2">
            {recipe.missingIngredients.map((ingredient) => (
              <li key={ingredient.name} className="rounded-lg border border-amber-200 bg-white px-3 py-2">
                {formatIngredient(ingredient, recipe.servings, servings)}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="rounded-lg border border-orange-300 bg-orange-50/40 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-bold uppercase tracking-normal text-orange-700">Step by step</p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCurrentStep((value) => Math.max(0, value - 1))}
              className="inline-flex items-center gap-1 rounded-lg border border-orange-300 bg-white px-3 py-2 text-sm font-semibold text-orange-700 transition hover:bg-orange-50"
              disabled={currentStep === 0}
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
              Prev
            </button>
            <button
              type="button"
              onClick={() => setCurrentStep((value) => Math.min(steps.length - 1, value + 1))}
              className="inline-flex items-center gap-1 rounded-lg border border-orange-300 bg-white px-3 py-2 text-sm font-semibold text-orange-700 transition hover:bg-orange-50"
              disabled={currentStep === steps.length - 1}
            >
              Next
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>

        <ol className="mt-4 space-y-3">
          {steps.map((step, index) => (
            <li
              key={`${recipe.id}-step-${index}`}
              className={`rounded-lg border bg-white p-4 transition ${
                index === currentStep ? "border-orange-300 shadow-sm" : "border-orange-100"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-base font-bold text-orange-900">Step {index + 1}</h2>
                <span className="inline-flex items-center gap-1 rounded-lg border border-orange-200 bg-orange-50 px-2.5 py-1 text-xs font-bold text-orange-700">
                  <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
                  {perStepMinutes}m
                </span>
              </div>
              <p className="mt-2 leading-6 text-slate-700">{step}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="rounded-lg border border-indigo-200 bg-indigo-50 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-bold uppercase tracking-normal text-indigo-700">Hands-free voice</p>
          <button
            type="button"
            onClick={() => setVoiceMode((value) => !value)}
            className="inline-flex items-center gap-2 rounded-lg border border-indigo-300 bg-white px-3 py-2 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-50"
          >
            <Mic className="h-4 w-4" aria-hidden="true" />
            {voiceMode ? "Stop" : "Start"}
          </button>
        </div>
        <p className="mt-3 text-sm text-indigo-700">Voice mode is {voiceMode ? "on" : "off"}.</p>
      </section>

      <section className="rounded-lg border border-sky-200 bg-sky-50 p-5">
        <p className="text-sm font-bold uppercase tracking-normal text-sky-700">Personal notes + cooking coach</p>
        <textarea
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          rows={4}
          placeholder="Example: I used less sugar. What should I adjust next?"
          className="mt-4 w-full rounded-lg border border-sky-200 bg-white px-3 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
        />
        <button
          type="button"
          onClick={handleAdvice}
          className="mt-3 inline-flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-sky-700"
        >
          <Sparkles className="h-4 w-4" aria-hidden="true" />
          Get cooking advice
        </button>
        {advice ? <p className="mt-3 rounded-lg bg-white px-3 py-2 text-sm text-sky-800">{advice}</p> : null}
      </section>

      <section className="rounded-lg border border-emerald-200 bg-white p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
            <Leaf className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <p className="text-sm font-bold uppercase tracking-normal text-emerald-700">Waste reduction</p>
            <p className="mt-2 text-sm leading-6 text-emerald-900">{recipe.wasteReductionNote}</p>
            {recipe.pantryStaples.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {recipe.pantryStaples.map((item, index) => (
                  <span
                    key={item}
                    className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${
                      TAG_STYLES[index % TAG_STYLES.length]
                    }`}
                  >
                    {item}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </section>
    </div>
  );
}
