import SaveRecipeButton from "@/features/recipes/components/SaveRecipeButton";
import AddMissingToShoppingButton from "@/features/recipes/components/AddMissingToShoppingButton";
import type { RecipeDetail } from "@/types/recipes";

function formatIngredient(ingredient: { name: string; quantity?: string; unit?: string }) {
  return [ingredient.quantity, ingredient.unit, ingredient.name].filter(Boolean).join(" ");
}

export default function RecipeDetailView({ recipe }: { recipe: RecipeDetail }) {
  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-normal text-emerald-700">AI recipe</p>
            <h1 className="mt-2 text-2xl font-bold text-slate-950 sm:text-3xl">{recipe.title}</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-600">{recipe.description}</p>
          </div>
          <SaveRecipeButton recipeId={recipe.id} initialSaved={recipe.isSaved} />
        </div>

        <div className="mt-5 flex flex-wrap gap-2 text-xs font-semibold text-slate-600">
          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-700">{recipe.servings} servings</span>
          <span className="rounded-full bg-slate-100 px-2.5 py-1">{recipe.cookTime} min</span>
          <span className="rounded-full bg-slate-100 px-2.5 py-1 capitalize">{recipe.difficulty}</span>
          {recipe.score != null ? (
            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-700">{recipe.score} match</span>
          ) : null}
          {recipe.tags.map((tag) => (
            <span key={tag} className="rounded-full bg-slate-100 px-2.5 py-1">
              {tag}
            </span>
          ))}
        </div>

        {recipe.summary ? (
          <div className="mt-4 rounded-lg border border-emerald-100 bg-emerald-50/60 p-4 text-sm text-emerald-800">
            {recipe.summary}
          </div>
        ) : null}
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
        <section className="space-y-6">
          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-950">Ingredients</h2>
            <ul className="mt-4 space-y-2 text-sm text-slate-700">
              {recipe.ingredients.map((ingredient) => (
                <li key={ingredient.name} className="flex items-start gap-2">
                  <span
                    className={`mt-2 h-2 w-2 rounded-full ${
                      ingredient.isExpiring ? "bg-amber-500" : "bg-emerald-500"
                    }`}
                  />
                  <span>{formatIngredient(ingredient)}</span>
                </li>
              ))}
            </ul>
          </div>

          {recipe.missingIngredients.length > 0 ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50/70 p-6 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-amber-900">Missing ingredients</h2>
                  <p className="mt-1 text-sm text-amber-800">Add these to your next shopping list.</p>
                </div>
                <AddMissingToShoppingButton recipeId={recipe.id} />
              </div>
              <ul className="mt-4 space-y-2 text-sm text-amber-900">
                {recipe.missingIngredients.map((ingredient) => (
                  <li key={ingredient.name}>{formatIngredient(ingredient)}</li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-950">Preparation</h2>
            <ol className="mt-4 space-y-3 text-sm text-slate-700">
              {recipe.steps.map((step, index) => (
                <li key={`${recipe.id}-step-${index}`} className="flex gap-3">
                  <span className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-50 text-xs font-semibold text-emerald-700">
                    {index + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="space-y-6">
          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-950">Nutrition estimate</h2>
            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm text-slate-700">
              <div>
                <dt className="text-xs font-semibold text-slate-500">Calories</dt>
                <dd className="mt-1 text-slate-900">{recipe.nutrition.calories_kcal} kcal</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-slate-500">Protein</dt>
                <dd className="mt-1 text-slate-900">{recipe.nutrition.protein_g} g</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-slate-500">Carbs</dt>
                <dd className="mt-1 text-slate-900">{recipe.nutrition.carbs_g} g</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-slate-500">Fat</dt>
                <dd className="mt-1 text-slate-900">{recipe.nutrition.fat_g} g</dd>
              </div>
              {recipe.nutrition.fiber_g != null ? (
                <div>
                  <dt className="text-xs font-semibold text-slate-500">Fiber</dt>
                  <dd className="mt-1 text-slate-900">{recipe.nutrition.fiber_g} g</dd>
                </div>
              ) : null}
              {recipe.nutrition.sugar_g != null ? (
                <div>
                  <dt className="text-xs font-semibold text-slate-500">Sugar</dt>
                  <dd className="mt-1 text-slate-900">{recipe.nutrition.sugar_g} g</dd>
                </div>
              ) : null}
              {recipe.nutrition.sodium_mg != null ? (
                <div>
                  <dt className="text-xs font-semibold text-slate-500">Sodium</dt>
                  <dd className="mt-1 text-slate-900">{recipe.nutrition.sodium_mg} mg</dd>
                </div>
              ) : null}
            </dl>
          </div>

          <div className="rounded-lg border border-emerald-200 bg-emerald-50/70 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-emerald-900">Waste reduction</h2>
            <p className="mt-2 text-sm text-emerald-900">{recipe.wasteReductionNote}</p>
          </div>

          {recipe.pantryStaples.length > 0 ? (
            <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-950">Pantry staples used</h2>
              <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-slate-600">
                {recipe.pantryStaples.map((item) => (
                  <span key={item} className="rounded-full bg-slate-100 px-2.5 py-1">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
}
