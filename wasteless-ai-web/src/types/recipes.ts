export type RecipeDifficulty = "easy" | "medium" | "hard";

export type RecipeIngredient = {
  name: string;
  quantity?: string;
  unit?: string;
  notes?: string;
  isOptional?: boolean;
  isExpiring?: boolean;
};

export type RecipeNutrition = {
  calories_kcal: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g?: number;
  sugar_g?: number;
  sodium_mg?: number;
};

export type RecipeSuggestion = {
  title: string;
  description: string;
  servings: number;
  cookingTimeMinutes: number;
  difficulty: RecipeDifficulty;
  ingredients: RecipeIngredient[];
  missingIngredients: RecipeIngredient[];
  steps: string[];
  wasteReductionNote: string;
  nutrition: RecipeNutrition;
  tags?: string[];
};

export type RecipeAiResponse = {
  recipes: RecipeSuggestion[];
  summary?: string;
  pantryStaples?: string[];
};

export type RecipePreferences = {
  cuisines: string[];
  diets: string[];
  allergens: string[];
  dislikes: string[];
  maxCookTimeMinutes?: number;
  servings?: number;
  difficulty?: RecipeDifficulty;
  notes?: string;
};

export type RecipeInventoryItem = {
  id: string;
  name: string;
  quantity?: string | null;
  unit?: string | null;
  expirationDate?: Date | null;
  status: "fresh" | "expiring" | "expired";
};

export type RecipeListItem = {
  id: string;
  title: string;
  description: string;
  servings: number;
  cookTime: number;
  difficulty: RecipeDifficulty;
  ingredients: RecipeIngredient[];
  missingIngredients: RecipeIngredient[];
  tags: string[];
  source: string;
  isSaved: boolean;
  score: number | null;
};

export type RecipeDetail = RecipeListItem & {
  steps: string[];
  wasteReductionNote: string;
  nutrition: RecipeNutrition;
  pantryStaples: string[];
  summary: string | null;
};
