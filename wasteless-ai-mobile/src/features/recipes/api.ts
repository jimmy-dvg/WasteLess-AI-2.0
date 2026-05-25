import { API_ENDPOINTS } from '@/services/api/endpoints';
import { ApiError, apiRequest } from '@/services/api/client';
import type {
  GenerateRecipesRequest,
  RecipeCollection,
  RecipeDifficulty,
  RecipeGenerationPreferences,
  RecipeGenerationResult,
  RecipeIngredient,
  RecipeInstructionStep,
  RecipeMealType,
  RecipeNutritionEstimate,
  RecipeSuggestion,
  RecipeWarningNote,
} from './types';

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function readString(value: unknown, fallback = '') {
  return typeof value === 'string' ? value.trim() : fallback;
}

function readOptionalString(value: unknown) {
  const text = readString(value);
  return text.length > 0 ? text : undefined;
}

function readNullableString(value: unknown) {
  const text = readString(value);
  return text.length > 0 ? text : null;
}

function readNumber(value: unknown, fallback: number) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }

  return fallback;
}

function readOptionalNumber(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }

  return undefined;
}

function readBoolean(value: unknown, fallback = false) {
  return typeof value === 'boolean' ? value : fallback;
}

function readStringArray(value: unknown) {
  if (!Array.isArray(value)) return [];

  return value
    .map(readOptionalString)
    .filter((item): item is string => Boolean(item));
}

function getResponseError(payload: unknown) {
  if (!isRecord(payload) || payload.success !== false) return null;

  return typeof payload.error === 'string' ? payload.error : 'Request failed.';
}

function getSuccessData(payload: unknown, invalidMessage: string) {
  const responseError = getResponseError(payload);
  if (responseError) {
    throw new ApiError(responseError, 0);
  }

  if (!isRecord(payload) || payload.success !== true || !('data' in payload)) {
    throw new ApiError(invalidMessage, 0);
  }

  return payload.data;
}

function isDifficulty(value: unknown): value is RecipeDifficulty {
  return value === 'easy' || value === 'medium' || value === 'hard';
}

function isMealType(value: unknown): value is RecipeMealType {
  return value === 'breakfast' || value === 'lunch' || value === 'dinner' || value === 'snack';
}

function parseNutrition(value: unknown): RecipeNutritionEstimate {
  const record = isRecord(value) ? value : {};

  return {
    caloriesKcal: Math.max(
      0,
      readNumber(record.calories_kcal ?? record.caloriesKcal ?? record.calories, 0),
    ),
    proteinG: Math.max(0, readNumber(record.protein_g ?? record.proteinG ?? record.protein, 0)),
    carbsG: Math.max(0, readNumber(record.carbs_g ?? record.carbsG ?? record.carbs, 0)),
    fatG: Math.max(0, readNumber(record.fat_g ?? record.fatG ?? record.fat, 0)),
    fiberG: readOptionalNumber(record.fiber_g ?? record.fiberG ?? record.fiber),
    sugarG: readOptionalNumber(record.sugar_g ?? record.sugarG ?? record.sugar),
    sodiumMg: readOptionalNumber(record.sodium_mg ?? record.sodiumMg ?? record.sodium),
  };
}

function parseIngredient(value: unknown, available: boolean): RecipeIngredient | null {
  if (typeof value === 'string') {
    const name = value.trim();
    return name ? { name, available } : null;
  }

  if (!isRecord(value)) return null;

  const name = readString(value.name);
  if (!name) return null;

  return {
    name,
    quantity: readOptionalString(value.quantity),
    unit: readOptionalString(value.unit),
    notes: readOptionalString(value.notes),
    isOptional: value.isOptional === true || value.is_optional === true,
    isExpiring: value.isExpiring === true || value.is_expiring === true,
    available,
  };
}

function parseIngredientList(value: unknown, available: boolean) {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => parseIngredient(item, available))
    .filter((item): item is RecipeIngredient => Boolean(item));
}

function parseSteps(value: unknown): RecipeInstructionStep[] {
  if (!Array.isArray(value)) return [];

  return value
    .map(readOptionalString)
    .filter((text): text is string => Boolean(text))
    .slice(0, 16)
    .map((text, index) => ({ order: index + 1, text }));
}

function parseWarnings(value: unknown): RecipeWarningNote[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((item): RecipeWarningNote | null => {
      if (typeof item === 'string') {
        const message = item.trim();
        return message ? { type: 'general', message } : null;
      }

      if (!isRecord(item)) return null;
      const message = readString(item.message);
      if (!message) return null;

      const type =
        item.type === 'allergen' ||
        item.type === 'safety' ||
        item.type === 'missing' ||
        item.type === 'general'
          ? item.type
          : 'general';

      return { type, message };
    })
    .filter((item): item is RecipeWarningNote => Boolean(item));
}

function parseRecipe(value: unknown): RecipeSuggestion {
  if (!isRecord(value)) {
    throw new ApiError('Invalid recipe response from server.', 0);
  }

  const id = readString(value.id);
  const title = readString(value.title);
  if (!id || !title) {
    throw new ApiError('Invalid recipe response from server.', 0);
  }

  const difficulty = isDifficulty(value.difficulty) ? value.difficulty : 'easy';
  const missingIngredients = parseIngredientList(
    value.missingIngredients ?? value.missing_ingredients,
    false,
  );

  return {
    id,
    title,
    description:
      readString(value.description) ||
      'A pantry-friendly recipe designed around your current inventory.',
    servings: Math.max(1, Math.min(24, readNumber(value.servings, 2))),
    cookTime: Math.max(
      1,
      Math.min(300, readNumber(value.cookTime ?? value.cookingTimeMinutes, 25)),
    ),
    difficulty,
    ingredients: parseIngredientList(value.ingredients, true),
    missingIngredients,
    steps: parseSteps(value.steps ?? value.instructions),
    wasteReductionNote:
      readNullableString(value.wasteReductionNote ?? value.waste_reduction_note) ?? undefined,
    nutrition: parseNutrition(value.nutrition),
    tags: readStringArray(value.tags).slice(0, 8),
    source: readString(value.source, 'ai_generated'),
    isSaved: readBoolean(value.isSaved ?? value.saved, false),
    score:
      value.score === null || value.score === undefined
        ? null
        : Math.max(0, Math.min(100, readNumber(value.score, 0))),
    pantryStaples: readStringArray(value.pantryStaples ?? value.pantry_staples),
    summary: readNullableString(value.summary),
    warnings: parseWarnings(value.warnings ?? value.allergenNotes ?? value.allergen_notes),
  };
}

function parseGenerationResponse(payload: unknown): RecipeGenerationResult {
  if (isRecord(payload) && payload.success === false) {
    throw new ApiError(readString(payload.error, 'Recipe generation failed.'), 0);
  }

  if (!isRecord(payload)) {
    throw new ApiError('Invalid recipe generation response from server.', 0);
  }

  const recipes = Array.isArray(payload.recipes) ? payload.recipes.map(parseRecipe) : [];
  if (recipes.length === 0) {
    throw new ApiError('No recipes were returned from the server.', 0);
  }

  return {
    recipes,
    summary: readNullableString(payload.summary),
    pantryStaples: readStringArray(payload.pantryStaples ?? payload.pantry_staples),
    fallback: readBoolean(payload.fallback, false),
    fallbackReason: readNullableString(payload.fallbackReason ?? payload.fallback_reason),
    cached: readBoolean(payload.cached, false),
  };
}

function parseRecipeCollection(payload: unknown): RecipeCollection {
  const data = getSuccessData(payload, 'Invalid recipe list response from server.');
  if (!isRecord(data)) {
    throw new ApiError('Invalid recipe list response from server.', 0);
  }

  const rawPreferences = isRecord(data.preferences) ? data.preferences : {};

  return {
    recipes: Array.isArray(data.recipes) ? data.recipes.map(parseRecipe) : [],
    favoriteRecipes: Array.isArray(data.favoriteRecipes)
      ? data.favoriteRecipes.map(parseRecipe)
      : [],
    preferences: {
      mealType: isMealType(rawPreferences.mealType) ? rawPreferences.mealType : undefined,
      cuisine: Array.isArray(rawPreferences.cuisines)
        ? readString(rawPreferences.cuisines[0])
        : undefined,
      dietary: Array.isArray(rawPreferences.diets) ? readStringArray(rawPreferences.diets) : [],
      maxCookingTimeMinutes: readOptionalNumber(rawPreferences.maxCookTimeMinutes),
      servings: readOptionalNumber(rawPreferences.servings),
      difficulty: isDifficulty(rawPreferences.difficulty) ? rawPreferences.difficulty : undefined,
    },
  };
}

function parseRecipeDetailResponse(payload: unknown): RecipeSuggestion {
  const data = getSuccessData(payload, 'Invalid recipe detail response from server.');
  return parseRecipe(data);
}

function parseFavoriteResponse(payload: unknown) {
  const data = getSuccessData(payload, 'Invalid favorite response from server.');
  if (!isRecord(data)) {
    throw new ApiError('Invalid favorite response from server.', 0);
  }

  return { saved: data.saved === true };
}

function cleanPreferences(preferences?: RecipeGenerationPreferences) {
  if (!preferences) return undefined;

  return {
    mealType: preferences.mealType,
    cuisine: preferences.cuisine?.trim() || undefined,
    dietary: preferences.dietary.map((item) => item.trim()).filter(Boolean),
    maxCookingTimeMinutes: preferences.maxCookingTimeMinutes,
    servings: preferences.servings,
    difficulty: preferences.difficulty,
  };
}

function buildGeneratePayload(request: GenerateRecipesRequest) {
  return {
    maxRecipes: request.maxRecipes ?? 3,
    mode: request.mode,
    inventoryItemIds: request.mode === 'selected' ? request.inventoryItemIds ?? [] : [],
    preferences: cleanPreferences(request.preferences),
    includeExpired: request.includeExpired ?? false,
    inventoryOnly: request.inventoryOnly ?? false,
    excludedRecipeTitles: request.excludedRecipeTitles ?? [],
  };
}

export async function generateRecipes(
  token: string,
  request: GenerateRecipesRequest,
): Promise<RecipeGenerationResult> {
  const payload = await apiRequest<unknown>(API_ENDPOINTS.recipes.generate, {
    authToken: token,
    body: JSON.stringify(buildGeneratePayload(request)),
    method: 'POST',
  });

  return parseGenerationResponse(payload);
}

export async function listRecipes(token: string): Promise<RecipeCollection> {
  const payload = await apiRequest<unknown>(API_ENDPOINTS.recipes.list, {
    authToken: token,
  });

  return parseRecipeCollection(payload);
}

export async function getRecipeDetail(token: string, id: string): Promise<RecipeSuggestion> {
  const payload = await apiRequest<unknown>(API_ENDPOINTS.recipes.detail(id), {
    authToken: token,
  });

  return parseRecipeDetailResponse(payload);
}

export async function saveRecipe(token: string, id: string) {
  const payload = await apiRequest<unknown>(API_ENDPOINTS.recipes.favorite(id), {
    authToken: token,
    method: 'POST',
  });

  return parseFavoriteResponse(payload);
}

export async function deleteSavedRecipe(token: string, id: string) {
  const payload = await apiRequest<unknown>(API_ENDPOINTS.recipes.favorite(id), {
    authToken: token,
    method: 'DELETE',
  });

  return parseFavoriteResponse(payload);
}
