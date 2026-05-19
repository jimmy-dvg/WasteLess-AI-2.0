import type { RecipeIngredient, RecipeInventoryItem, RecipePreferences, RecipeSuggestion } from "@/types/recipes";

const STOPWORDS = new Set([
  "fresh",
  "frozen",
  "organic",
  "large",
  "small",
  "medium",
  "chopped",
  "diced",
  "sliced",
  "minced",
  "ground",
  "crushed",
  "to",
  "taste",
  "and",
  "or",
  "of",
  "the",
]);

const SYNONYMS: Record<string, string> = {
  "bell pepper": "pepper",
  "capsicum": "pepper",
  "scallion": "green onion",
  "spring onion": "green onion",
  "courgette": "zucchini",
  "garbanzo bean": "chickpea",
  "cilantro": "coriander",
};

function normalizeName(name: string) {
  const lowered = name.toLowerCase();
  const normalized = Object.entries(SYNONYMS).reduce((acc, [key, value]) => acc.replace(key, value), lowered);
  const tokens = normalized
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .filter((token) => !STOPWORDS.has(token));

  return Array.from(new Set(tokens));
}

function jaccardSimilarity(a: string[], b: string[]) {
  if (a.length === 0 || b.length === 0) return 0;
  const setA = new Set(a);
  const setB = new Set(b);
  let intersection = 0;
  setA.forEach((token) => {
    if (setB.has(token)) intersection += 1;
  });
  const union = new Set([...a, ...b]).size;
  return union === 0 ? 0 : intersection / union;
}

function findBestMatch(ingredientName: string, inventory: RecipeInventoryItem[]) {
  const ingredientTokens = normalizeName(ingredientName);
  let best: { item: RecipeInventoryItem; score: number } | null = null;

  for (const item of inventory) {
    const tokens = normalizeName(item.name);
    const score = jaccardSimilarity(ingredientTokens, tokens);
    if (!best || score > best.score) {
      best = { item, score };
    }
  }

  return best;
}

export function matchIngredientsToInventory(
  ingredients: RecipeIngredient[],
  inventory: RecipeInventoryItem[],
  minScore = 0.62
) {
  const matched = new Map<string, RecipeInventoryItem>();
  const annotated = ingredients.map((ingredient) => {
    const match = findBestMatch(ingredient.name, inventory);
    if (match && match.score >= minScore) {
      matched.set(ingredient.name, match.item);
      return {
        ...ingredient,
        isExpiring: match.item.status === "expiring" || match.item.status === "expired",
      };
    }

    return ingredient;
  });

  return { annotated, matched };
}

export function computeMissingIngredients(
  ingredients: RecipeIngredient[],
  inventory: RecipeInventoryItem[],
  minScore = 0.62
) {
  const { annotated, matched } = matchIngredientsToInventory(ingredients, inventory, minScore);
  const missing = annotated.filter((ingredient) => !matched.has(ingredient.name));
  return { annotated, missing };
}

export function scoreRecipe(
  recipe: RecipeSuggestion,
  inventory: RecipeInventoryItem[],
  expiringItems: RecipeInventoryItem[],
  preferences: RecipePreferences
) {
  const { annotated, missing } = computeMissingIngredients(recipe.ingredients, inventory);
  const expiringSet = new Set(expiringItems.map((item) => item.id));
  const expiringMatched = annotated.filter((ingredient) => {
    const match = findBestMatch(ingredient.name, inventory);
    return match && expiringSet.has(match.item.id);
  });

  const ingredientCoverage = annotated.length === 0 ? 0 : (annotated.length - missing.length) / annotated.length;
  const expiringCoverage = expiringItems.length === 0 ? 0 : expiringMatched.length / expiringItems.length;
  const missingPenalty = Math.min(missing.length * 4, 20);
  const preferenceBonus = preferences.maxCookTimeMinutes && recipe.cookingTimeMinutes <= preferences.maxCookTimeMinutes ? 8 : 0;

  const score = Math.round(ingredientCoverage * 55 + expiringCoverage * 35 + preferenceBonus - missingPenalty + 10);
  return Math.max(0, Math.min(100, score));
}
