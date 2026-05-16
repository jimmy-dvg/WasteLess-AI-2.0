type RecipeCardProps = {
  recipe: {
    id: string;
    title: string;
    description: string;
    servings: number;
    cookTime: number;
    ingredients: string[];
    tags: string[];
    source: string;
    difficulty: string;
  };
};

export default function RecipeCard({ recipe }: RecipeCardProps) {
  return (
    <article
      id={`recipe-${recipe.id}`}
      className="flex h-full flex-col rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:border-emerald-200 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-normal text-emerald-700">
            {recipe.source.replace("_", " ")}
          </p>
          <h2 className="mt-2 text-lg font-bold text-slate-950">{recipe.title}</h2>
        </div>
        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold capitalize text-slate-600">
          {recipe.difficulty}
        </span>
      </div>
      <p className="mt-3 text-sm leading-6 text-slate-600">{recipe.description}</p>

      <div className="mt-4 flex flex-wrap gap-2 text-xs font-medium text-slate-600">
        <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-700">{recipe.servings} servings</span>
        <span className="rounded-full bg-slate-100 px-2.5 py-1">{recipe.cookTime} min</span>
        {recipe.tags.map((tag) => (
          <span key={tag} className="rounded-full bg-slate-100 px-2.5 py-1">
            {tag}
          </span>
        ))}
      </div>

      <div className="mt-5">
        <h3 className="text-sm font-semibold text-slate-950">Ingredients</h3>
        <ul className="mt-2 space-y-2 text-sm text-slate-600">
          {recipe.ingredients.map((ingredient) => (
            <li key={ingredient} className="flex gap-2">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
              <span>{ingredient}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-auto flex gap-2 pt-5">
        <a
          href={`/dashboard/recipes#recipe-${recipe.id}`}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
        >
          View recipe
        </a>
        <a
          href="/dashboard/inventory"
          className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          Match pantry
        </a>
      </div>
    </article>
  );
}
