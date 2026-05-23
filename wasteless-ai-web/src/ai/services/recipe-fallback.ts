import type { RecipeIngredient, RecipeInventoryItem, RecipePreferences, RecipeSuggestion } from "@/types/recipes";

export const FALLBACK_PANTRY_STAPLES = ["salt", "pepper", "olive oil"];

const PANTRY_STAPLES = new Set([
  "salt",
  "pepper",
  "black pepper",
  "water",
  "olive oil",
  "oil",
  "butter",
  "flour",
  "sugar",
  "vinegar",
  "soy sauce",
  "spices",
  "herbs",
]);

const FALLBACK_RECIPE_TEMPLATES = [
  {
    title: (primary: string) => `Use-First ${primary} Skillet`,
    description: (primary: string) =>
      `A quick skillet that puts ${primary} and nearby pantry items to work before they lose freshness.`,
    cookingTimeMinutes: 25,
    difficulty: "easy" as const,
    extraIngredients: ["eggs", "cooked grains"],
    tags: ["quick", "low waste", "pantry"],
    steps: (primary: string) => [
      `Prep ${primary} and any other selected ingredients into bite-size pieces.`,
      "Warm a pan with a little oil, then cook firmer ingredients first.",
      "Fold in tender ingredients and cook until just softened.",
      "Season with salt, pepper, and any herbs you have.",
      "Serve over grains or with a simple egg if available.",
    ],
  },
  {
    title: (primary: string) => `${primary} Pantry Bowl`,
    description: (primary: string) =>
      `A flexible bowl built around ${primary}, useful leftovers, and a simple pantry dressing.`,
    cookingTimeMinutes: 20,
    difficulty: "easy" as const,
    extraIngredients: ["cooked rice", "yogurt"],
    tags: ["bowl", "flexible", "fresh"],
    steps: (primary: string) => [
      `Slice or chop ${primary} so it cooks evenly.`,
      "Warm grains or another base with a splash of water.",
      "Cook the selected ingredients until tender-crisp.",
      "Stir together a quick dressing with oil, vinegar, salt, and pepper.",
      "Layer everything in bowls and finish with herbs or crunchy leftovers.",
    ],
  },
  {
    title: (primary: string) => `${primary} Rescue Soup`,
    description: (primary: string) =>
      `A forgiving soup for turning ${primary} and softening ingredients into several low-waste servings.`,
    cookingTimeMinutes: 35,
    difficulty: "easy" as const,
    extraIngredients: ["broth", "beans"],
    tags: ["batch", "freezer", "comfort"],
    steps: (primary: string) => [
      `Chop ${primary} and the rest of the selected ingredients.`,
      "Saute the firmest ingredients with oil, salt, and pepper.",
      "Add broth or water, then simmer until everything is tender.",
      "Mash a few pieces or add beans to thicken the soup.",
      "Taste, adjust seasoning, and cool leftovers quickly for another meal.",
    ],
  },
  {
    title: (primary: string) => `Sheet-Pan ${primary} Dinner`,
    description: (primary: string) =>
      `A hands-off dinner that roasts ${primary} with compatible odds and ends from the kitchen.`,
    cookingTimeMinutes: 40,
    difficulty: "medium" as const,
    extraIngredients: ["potatoes", "chickpeas"],
    tags: ["sheet pan", "dinner", "hands off"],
    steps: (primary: string) => [
      `Cut ${primary} and the other selected ingredients into similar sizes.`,
      "Toss everything with oil, salt, pepper, and spices.",
      "Spread on a sheet pan with space between pieces.",
      "Roast until browned at the edges and tender in the center.",
      "Serve with a simple sauce or save portions for lunch.",
    ],
  },
  {
    title: (primary: string) => `${primary} Leftover Toasts`,
    description: (primary: string) =>
      `Crisp toasts topped with ${primary} and small leftover portions for a fast meal.`,
    cookingTimeMinutes: 15,
    difficulty: "easy" as const,
    extraIngredients: ["bread", "cheese"],
    tags: ["lunch", "quick", "snack"],
    steps: (primary: string) => [
      `Chop ${primary} and warm it gently with any selected ingredients.`,
      "Toast bread until crisp enough to hold toppings.",
      "Add cheese or another creamy element if available.",
      "Spoon the warm mixture over the toast.",
      "Finish with pepper, herbs, or a small squeeze of lemon.",
    ],
  },
  {
    title: (primary: string) => `${primary} Fried Rice`,
    description: (primary: string) =>
      `A fast rice-pan format that stretches ${primary} with small portions from the fridge.`,
    cookingTimeMinutes: 22,
    difficulty: "easy" as const,
    extraIngredients: ["cooked rice", "soy sauce"],
    tags: ["quick", "leftovers", "one pan"],
    steps: (primary: string) => [
      `Dice ${primary} and any other selected ingredients small.`,
      "Cook the ingredients in a hot pan until lightly browned.",
      "Add cooked rice and stir until hot and separated.",
      "Season with soy sauce or salt and pepper.",
      "Serve immediately, then chill leftovers in a shallow container.",
    ],
  },
];

function normalizeName(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isPantryStaple(name: string) {
  return PANTRY_STAPLES.has(normalizeName(name));
}

function titleCaseIngredient(name: string) {
  const cleaned = name.replace(/\s+/g, " ").trim();
  if (!cleaned) return "Pantry Ingredients";

  return cleaned
    .split(" ")
    .map((part) => (part ? `${part.charAt(0).toUpperCase()}${part.slice(1).toLowerCase()}` : part))
    .join(" ")
    .slice(0, 64);
}

function conflictsWithPreferences(name: string, preferences: RecipePreferences) {
  const normalized = normalizeName(name);
  const blockedTerms = [...preferences.allergens, ...preferences.dislikes].map(normalizeName).filter(Boolean);
  return blockedTerms.some((term) => normalized.includes(term) || term.includes(normalized));
}

function hasSimilarInventoryItem(name: string, inventory: RecipeInventoryItem[]) {
  const normalized = normalizeName(name);
  return inventory.some((item) => {
    const itemName = normalizeName(item.name);
    return itemName.includes(normalized) || normalized.includes(itemName);
  });
}

function uniqueByName(items: RecipeInventoryItem[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = normalizeName(item.name);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function inventoryIngredient(item: RecipeInventoryItem): RecipeIngredient {
  return {
    name: item.name,
    quantity: item.quantity ?? undefined,
    unit: item.unit ?? undefined,
    isExpiring: item.status === "expiring" || item.status === "expired",
  };
}

function pickRecipeInventory(items: RecipeInventoryItem[], startIndex: number, count = 3) {
  if (items.length === 0) return [];

  const picked: RecipeInventoryItem[] = [];
  const targetCount = Math.min(count, items.length);

  for (let offset = 0; picked.length < targetCount && offset < items.length; offset += 1) {
    picked.push(items[(startIndex + offset) % items.length]);
  }

  return picked;
}

function fallbackVirtualInventory(): RecipeInventoryItem[] {
  return [
    { id: "fallback-mixed-vegetables", name: "mixed vegetables", quantity: "4", unit: "cups", status: "fresh" },
    { id: "fallback-beans", name: "beans", quantity: "1", unit: "can", status: "fresh" },
    { id: "fallback-rice", name: "cooked rice", quantity: "2", unit: "cups", status: "fresh" },
    { id: "fallback-greens", name: "leafy greens", quantity: "2", unit: "cups", status: "fresh" },
  ];
}

export function buildFallbackRecipeSuggestions(params: {
  maxRecipes: number;
  inventory: RecipeInventoryItem[];
  expiringItems: RecipeInventoryItem[];
  preferences: RecipePreferences;
  inventoryOnly: boolean;
  excludedTitleSet: Set<string>;
}) {
  const usableInventory = params.inventory.filter((item) => !conflictsWithPreferences(item.name, params.preferences));
  const expiring = params.expiringItems.filter((item) => !conflictsWithPreferences(item.name, params.preferences));
  const prioritizedInventory = uniqueByName([
    ...expiring,
    ...usableInventory.filter((item) => !expiring.some((expiringItem) => expiringItem.id === item.id)),
  ]);
  const baseItems = prioritizedInventory.length > 0
    ? prioritizedInventory
    : params.inventoryOnly
      ? []
      : fallbackVirtualInventory();

  if (baseItems.length === 0) return [];

  const recipes: RecipeSuggestion[] = [];

  for (const template of FALLBACK_RECIPE_TEMPLATES) {
    if (recipes.length >= params.maxRecipes) break;

    const selectedInventory = pickRecipeInventory(baseItems, recipes.length, 3);
    const primary = titleCaseIngredient(selectedInventory[0]?.name ?? "Pantry Ingredients");
    const extraIngredients = params.inventoryOnly
      ? []
      : template.extraIngredients
          .filter((name) => !conflictsWithPreferences(name, params.preferences))
          .filter((name) => !isPantryStaple(name))
          .filter((name) => !hasSimilarInventoryItem(name, params.inventory))
          .map((name) => ({ name } satisfies RecipeIngredient));

    const title = template.title(primary);
    if (params.excludedTitleSet.has(normalizeName(title))) continue;

    const ingredients = [...selectedInventory.map(inventoryIngredient), ...extraIngredients].slice(0, 8);
    if (ingredients.length === 0) continue;

    const servings = params.preferences.servings ?? 2;
    const cookingTimeMinutes = Math.max(
      5,
      Math.min(template.cookingTimeMinutes, params.preferences.maxCookTimeMinutes ?? template.cookingTimeMinutes)
    );
    const calories = 320 + ingredients.length * 35;
    const protein = 10 + ingredients.length * 2;
    const carbs = 35 + ingredients.length * 6;
    const fat = 9 + ingredients.length;

    recipes.push({
      title,
      description: template.description(primary),
      servings,
      cookingTimeMinutes,
      difficulty: params.preferences.difficulty ?? template.difficulty,
      ingredients,
      missingIngredients: extraIngredients,
      steps: template.steps(primary),
      wasteReductionNote:
        "Prioritizes ingredients already in your kitchen, especially items closest to expiring, before suggesting extras.",
      nutrition: {
        calories_kcal: calories,
        protein_g: protein,
        carbs_g: carbs,
        fat_g: fat,
        fiber_g: Math.max(4, ingredients.length * 2),
      },
      tags: [
        ...template.tags,
        ...(params.preferences.cuisines[0] ? [params.preferences.cuisines[0].toLowerCase()] : []),
      ].slice(0, 8),
    });
  }

  return recipes;
}
