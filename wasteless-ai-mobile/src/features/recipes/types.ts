export const RECIPE_GENERATION_MODES = ['all', 'selected', 'expiring-soon'] as const;
export const RECIPE_MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'] as const;
export const RECIPE_DIFFICULTIES = ['easy', 'medium', 'hard'] as const;

export type RecipeGenerationMode = (typeof RECIPE_GENERATION_MODES)[number];
export type RecipeMealType = (typeof RECIPE_MEAL_TYPES)[number];
export type RecipeDifficulty = (typeof RECIPE_DIFFICULTIES)[number];

export type RecipeGenerationPreferences = {
  mealType?: RecipeMealType;
  cuisine?: string;
  dietary: string[];
  maxCookingTimeMinutes?: number;
  servings?: number;
  difficulty?: RecipeDifficulty;
};

export type GenerateRecipesRequest = {
  mode: RecipeGenerationMode;
  inventoryItemIds?: string[];
  preferences?: RecipeGenerationPreferences;
  maxRecipes?: number;
  includeExpired?: boolean;
  inventoryOnly?: boolean;
  excludedRecipeTitles?: string[];
};

export type RecipeIngredient = {
  name: string;
  quantity?: string;
  unit?: string;
  notes?: string;
  isOptional?: boolean;
  isExpiring?: boolean;
  available: boolean;
};

export type RecipeInstructionStep = {
  order: number;
  text: string;
};

export type RecipeNutritionEstimate = {
  caloriesKcal: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG?: number;
  sugarG?: number;
  sodiumMg?: number;
};

export type RecipeWarningNote = {
  type: 'allergen' | 'safety' | 'missing' | 'general';
  message: string;
};

export type RecipeSuggestion = {
  id: string;
  title: string;
  description: string;
  servings: number;
  cookTime: number;
  difficulty: RecipeDifficulty;
  ingredients: RecipeIngredient[];
  missingIngredients: RecipeIngredient[];
  steps: RecipeInstructionStep[];
  wasteReductionNote?: string;
  nutrition: RecipeNutritionEstimate;
  tags: string[];
  source: string;
  isSaved: boolean;
  score: number | null;
  pantryStaples: string[];
  summary?: string | null;
  warnings: RecipeWarningNote[];
};

export type RecipeGenerationResult = {
  recipes: RecipeSuggestion[];
  summary: string | null;
  pantryStaples: string[];
  fallback: boolean;
  fallbackReason: string | null;
  cached: boolean;
};

export type RecipeCollection = {
  recipes: RecipeSuggestion[];
  favoriteRecipes: RecipeSuggestion[];
  preferences?: RecipeGenerationPreferences;
};
