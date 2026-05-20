import SaveRecipeButton from "./SaveRecipeButton";

type RecipeCardRecipe = {
  id: string;
  title: string;
  description: string;
  servings: number;
  cookTime: number;
  ingredients: {
    name: string;
    quantity?: string;
    unit?: string;
    isExpiring?: boolean;
  }[];
  missingIngredients: {
    name: string;
    quantity?: string;
    unit?: string;
  }[];
  tags: string[];
  source: string;
  difficulty: string;
  isSaved: boolean;
  score: number | null;
};

type RecipeCardProps = {
  recipe: RecipeCardRecipe;
  isRegenerating?: boolean;
  onRegenerate?: (recipe: Pick<RecipeCardRecipe, "id" | "title">) => void;
};

export default function RecipeCard({ recipe, isRegenerating = false, onRegenerate }: RecipeCardProps) {
  const expiringCount = recipe.ingredients.filter((ingredient) => ingredient.isExpiring).length;
  const missingPreview = recipe.missingIngredients.slice(0, 3);

  return (
    <article
      id={`recipe-${recipe.id}`}
      className="flex h-full flex-col rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:border-emerald-200 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-normal text-emerald-700">
            {recipe.source.replace(/_/g, " ")}
          </p>
          <h2 className="mt-2 text-lg font-bold text-slate-950">{recipe.title}</h2>
        </div>
        <div className="flex items-center gap-2">
          {recipe.score != null ? (
            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
              {recipe.score} match
            </span>
          ) : null}
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold capitalize text-slate-600">
            {recipe.difficulty}
          </span>
        </div>
      </div>
      <p className="mt-3 text-sm leading-6 text-slate-600">{recipe.description}</p>

      <div className="mt-4 flex flex-wrap gap-2 text-xs font-medium text-slate-600">
        <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-700">{recipe.servings} servings</span>
        <span className="rounded-full bg-slate-100 px-2.5 py-1">{recipe.cookTime} min</span>
        {expiringCount > 0 ? (
          <span className="rounded-full bg-amber-50 px-2.5 py-1 text-amber-700">
            {expiringCount} expiring
          </span>
        ) : null}
        {recipe.tags.slice(0, 3).map((tag) => (
          <span key={tag} className="rounded-full bg-slate-100 px-2.5 py-1">
            {tag}
          </span>
        ))}
      </div>

      <div className="mt-5">
        <h3 className="text-sm font-semibold text-slate-950">Ingredients</h3>
        <ul className="mt-2 space-y-2 text-sm text-slate-600">
          {recipe.ingredients.slice(0, 5).map((ingredient) => (
            <li key={ingredient.name} className="flex gap-2">
              <span
                className={`mt-2 h-1.5 w-1.5 shrink-0 rounded-full ${
                  ingredient.isExpiring ? "bg-amber-500" : "bg-emerald-500"
                }`}
              />
              <span>
                {[ingredient.quantity, ingredient.unit, ingredient.name].filter(Boolean).join(" ")}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {recipe.missingIngredients.length > 0 ? (
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50/60 p-3 text-sm text-amber-900">
          <p className="text-xs font-semibold uppercase tracking-normal text-amber-700">Missing items</p>
          <ul className="mt-2 space-y-1">
            {missingPreview.map((ingredient) => (
              <li key={ingredient.name}>
                {[ingredient.quantity, ingredient.unit, ingredient.name].filter(Boolean).join(" ")}
              </li>
            ))}
          </ul>
          {recipe.missingIngredients.length > missingPreview.length ? (
            <p className="mt-2 text-xs text-amber-700">
              +{recipe.missingIngredients.length - missingPreview.length} more
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="mt-auto flex flex-wrap gap-2 pt-5">
        <a
          href={`/dashboard/recipes/${recipe.id}`}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
        >
          View recipe
        </a>
        {onRegenerate ? (
          <button
            type="button"
            onClick={() => onRegenerate(recipe)}
            disabled={isRegenerating}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isRegenerating ? "Trying..." : "Try another"}
          </button>
        ) : null}
        <SaveRecipeButton recipeId={recipe.id} initialSaved={recipe.isSaved} />
      </div>
    </article>
  );
}
