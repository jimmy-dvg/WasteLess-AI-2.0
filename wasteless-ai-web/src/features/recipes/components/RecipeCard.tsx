import SaveRecipeButton from "./SaveRecipeButton";
import AddRecipeToMealPlanButton from "./AddRecipeToMealPlanButton";
import type { ReactNode } from "react";
import type { RecipeListItem } from "@/types/recipes";
import { ChefHat, Clock3, Droplets, Dumbbell, Flame, RefreshCw, Send, Users, Wheat } from "lucide-react";

type RecipeCardRecipe = RecipeListItem;

type RecipeCardProps = {
  recipe: RecipeCardRecipe;
  isRegenerating?: boolean;
  onOpen?: (recipe: Pick<RecipeCardRecipe, "id" | "title">) => void;
  onFavoriteChange?: (recipe: RecipeCardRecipe, saved: boolean, savedRecipe?: RecipeCardRecipe) => void;
  onRegenerate?: (recipe: Pick<RecipeCardRecipe, "id" | "title">) => void;
};

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const TAG_STYLES = [
  "border-emerald-200 bg-emerald-50 text-emerald-700",
  "border-lime-200 bg-lime-50 text-lime-700",
  "border-cyan-200 bg-cyan-50 text-cyan-700",
  "border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700",
];

function sourceLabel(source: string) {
  return source.replace(/_/g, " ");
}

function titleCase(value: string) {
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : value;
}

function formatMacro(value: number | undefined, suffix = "") {
  if (value == null) return "0";
  return `${Math.round(value)}${suffix}`;
}

function StatTile({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: ReactNode;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-center">
      <div className="mx-auto flex h-5 w-5 items-center justify-center text-slate-500">{icon}</div>
      <p className="mt-1 text-[10px] font-bold uppercase tracking-normal text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-bold text-slate-800">{value}</p>
    </div>
  );
}

export default function RecipeCard({
  recipe,
  isRegenerating = false,
  onOpen,
  onFavoriteChange,
  onRegenerate,
}: RecipeCardProps) {
  const expiringCount = recipe.ingredients.filter((ingredient) => ingredient.isExpiring).length;
  const visibleTags = recipe.tags.slice(0, 4);
  const canSave = UUID_PATTERN.test(recipe.id);
  const nutrition = recipe.nutrition ?? {
    calories_kcal: 0,
    protein_g: 0,
    carbs_g: 0,
    fat_g: 0,
  };

  return (
    <article
      id={`recipe-${recipe.id}`}
      className="flex h-full flex-col rounded-lg border border-amber-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-amber-300 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-normal text-emerald-700">
            {sourceLabel(recipe.source)}
          </p>
          <h2 className="mt-2 text-xl font-bold leading-snug text-orange-950">{recipe.title}</h2>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => onOpen?.(recipe)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
            aria-label={`Open ${recipe.title}`}
          >
            <Send className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      <p className="mt-4 text-sm leading-6 text-orange-900/80">{recipe.description}</p>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <StatTile label="Time" value={`${recipe.cookTime} min`} icon={<Clock3 className="h-4 w-4" />} />
        <StatTile label="Difficulty" value={titleCase(recipe.difficulty)} icon={<ChefHat className="h-4 w-4" />} />
        <StatTile label="Serves" value={String(recipe.servings)} icon={<Users className="h-4 w-4" />} />
      </div>

      <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold">
        {visibleTags.map((tag, index) => (
          <span key={tag} className={`rounded-full border px-2.5 py-1 ${TAG_STYLES[index % TAG_STYLES.length]}`}>
            {tag}
          </span>
        ))}
        {expiringCount > 0 ? (
          <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-amber-700">
            {expiringCount} expiring
          </span>
        ) : null}
        {recipe.score != null ? (
          <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-emerald-700">
            {Math.round(recipe.score)} match
          </span>
        ) : null}
      </div>

      {recipe.missingIngredients.length > 0 ? (
        <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-800">
          {recipe.missingIngredients.length} missing item{recipe.missingIngredients.length === 1 ? "" : "s"}
        </p>
      ) : null}

      <div className="mt-4 grid grid-cols-4 gap-2 rounded-lg border border-slate-200 bg-white p-2 text-center">
        <div className="rounded-md bg-slate-50 px-2 py-2">
          <Flame className="mx-auto h-4 w-4 text-orange-500" aria-hidden="true" />
          <p className="mt-1 text-[10px] text-slate-500">Kcal</p>
          <p className="text-sm font-bold text-slate-800">{formatMacro(nutrition.calories_kcal)}</p>
        </div>
        <div className="rounded-md bg-slate-50 px-2 py-2">
          <Dumbbell className="mx-auto h-4 w-4 text-emerald-600" aria-hidden="true" />
          <p className="mt-1 text-[10px] text-slate-500">Protein</p>
          <p className="text-sm font-bold text-slate-800">{formatMacro(nutrition.protein_g, "g")}</p>
        </div>
        <div className="rounded-md bg-slate-50 px-2 py-2">
          <Wheat className="mx-auto h-4 w-4 text-cyan-600" aria-hidden="true" />
          <p className="mt-1 text-[10px] text-slate-500">Carbs</p>
          <p className="text-sm font-bold text-slate-800">{formatMacro(nutrition.carbs_g, "g")}</p>
        </div>
        <div className="rounded-md bg-slate-50 px-2 py-2">
          <Droplets className="mx-auto h-4 w-4 text-fuchsia-600" aria-hidden="true" />
          <p className="mt-1 text-[10px] text-slate-500">Fat</p>
          <p className="text-sm font-bold text-slate-800">{formatMacro(nutrition.fat_g, "g")}</p>
        </div>
      </div>

      <div className="mt-auto flex flex-wrap gap-2 pt-5">
        <button
          type="button"
          onClick={() => onOpen?.(recipe)}
          className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-emerald-700"
        >
          View Full Recipe
        </button>
        {canSave ? <AddRecipeToMealPlanButton recipeId={recipe.id} /> : null}
        <SaveRecipeButton
          recipeId={recipe.id}
          initialSaved={recipe.isSaved}
          recipeSnapshot={canSave ? undefined : recipe}
          onSavedChange={(saved, savedRecipe) => onFavoriteChange?.(recipe, saved, savedRecipe)}
        />
        {onRegenerate ? (
          <button
            type="button"
            onClick={() => onRegenerate(recipe)}
            disabled={isRegenerating}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw className={`h-4 w-4 ${isRegenerating ? "animate-spin" : ""}`} aria-hidden="true" />
            {isRegenerating ? "Trying..." : "Try another"}
          </button>
        ) : null}
      </div>
    </article>
  );
}
