import "server-only";

import { db } from "@/db";
import * as schema from "@/db/schema/tables";
import { ensurePersonalHouseholdForUser } from "@/db/queries/households";
import { getInventoryPageData } from "@/services/inventory.service";
import { buildRecipePromptPayload, buildRecipeSystemPrompt, buildRecipeUserPrompt } from "@/ai/prompts/recipes";
import { generateRecipeAiResponse, streamRecipeAiResponse } from "@/ai/services/recipe-engine";
import { computeMissingIngredients, scoreRecipe } from "@/ai/services/recipe-matching";
import { getAiSettingsForUser } from "@/ai/services/ai-settings";
import { parseJsonValue } from "@/lib/dashboard-utils";
import { hashJson } from "@/lib/hash";
import { getCachedValue, setCachedValue } from "@/lib/cache";
import { assertRateLimit } from "@/lib/rate-limit";
import { recipePreferencesSchema } from "@/validation/recipes";
import type { RecipeIngredient, RecipeInventoryItem, RecipeListItem, RecipePreferences, RecipeSuggestion } from "@/types/recipes";
import { and, eq, inArray } from "drizzle-orm";

const DEFAULT_PREFERENCES = recipePreferencesSchema.parse({});
const CACHE_TTL_MS = 5 * 60 * 1000;
const MAX_INVENTORY_PROMPT_ITEMS = 60;
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

function normalizePreferences(raw: unknown): RecipePreferences {
  const parsed = recipePreferencesSchema.safeParse(raw ?? {});
  if (parsed.success) return parsed.data;
  return DEFAULT_PREFERENCES;
}

function mergePreferences(base: RecipePreferences, override?: Partial<RecipePreferences>) {
  if (!override) return base;

  return {
    cuisines: override.cuisines && override.cuisines.length > 0 ? override.cuisines : base.cuisines,
    diets: override.diets && override.diets.length > 0 ? override.diets : base.diets,
    allergens: override.allergens && override.allergens.length > 0 ? override.allergens : base.allergens,
    dislikes: override.dislikes && override.dislikes.length > 0 ? override.dislikes : base.dislikes,
    maxCookTimeMinutes: override.maxCookTimeMinutes ?? base.maxCookTimeMinutes,
    servings: override.servings ?? base.servings,
    difficulty: override.difficulty ?? base.difficulty,
    notes: override.notes ?? base.notes,
  };
}

function limitInventory(items: RecipeInventoryItem[]) {
  if (items.length <= MAX_INVENTORY_PROMPT_ITEMS) return items;
  const expiring = items.filter((item) => item.status !== "fresh");
  const fresh = items.filter((item) => item.status === "fresh");
  return [...expiring, ...fresh].slice(0, MAX_INVENTORY_PROMPT_ITEMS);
}

function toIngredient(input: {
  name: string;
  quantity?: string | null;
  unit?: string | null;
  notes?: string | null;
  is_optional?: boolean | null;
  is_expiring?: boolean | null;
}): RecipeIngredient {
  return {
    name: input.name,
    quantity: input.quantity ?? undefined,
    unit: input.unit ?? undefined,
    notes: input.notes ?? undefined,
    isOptional: input.is_optional ?? undefined,
    isExpiring: input.is_expiring ?? undefined,
  };
}

function mergeMissingIngredients(base: RecipeIngredient[], extra: RecipeIngredient[]) {
  const map = new Map<string, RecipeIngredient>();
  const push = (item: RecipeIngredient) => {
    if (isPantryStaple(item.name)) return;
    const key = item.name.trim().toLowerCase();
    if (!map.has(key)) map.set(key, item);
  };
  base.forEach(push);
  extra.forEach(push);
  return Array.from(map.values());
}

function mapAiRecipe(recipe: {
  title: string;
  description: string;
  servings: number;
  cooking_time_minutes: number;
  difficulty: "easy" | "medium" | "hard";
  ingredients: Array<{ name: string; quantity?: string; unit?: string; notes?: string; is_optional?: boolean; is_expiring?: boolean }>;
  missing_ingredients?: Array<{ name: string; quantity?: string; unit?: string; notes?: string; is_optional?: boolean; is_expiring?: boolean }>;
  steps: string[];
  waste_reduction_note: string;
  nutrition: {
    calories_kcal: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
    fiber_g?: number;
    sugar_g?: number;
    sodium_mg?: number;
  };
  tags?: string[];
}): RecipeSuggestion {
  return {
    title: recipe.title,
    description: recipe.description,
    servings: recipe.servings,
    cookingTimeMinutes: recipe.cooking_time_minutes,
    difficulty: recipe.difficulty,
    ingredients: recipe.ingredients.map(toIngredient),
    missingIngredients: (recipe.missing_ingredients ?? []).map(toIngredient),
    steps: recipe.steps,
    wasteReductionNote: recipe.waste_reduction_note,
    nutrition: recipe.nutrition,
    tags: recipe.tags ?? [],
  };
}

async function logAiGeneration(params: {
  userId: string;
  householdId: string | null;
  prompt: unknown;
  result: unknown;
  model?: string | null;
  tokens?: number | null;
  provider?: string | null;
  cost?: number | null;
  status: "success" | "error";
}) {
  const modelLabel = params.provider && params.model ? `${params.provider}:${params.model}` : params.model ?? null;
  const rows = await db
    .insert(schema.ai_generations)
    .values({
      user_id: params.userId,
      household_id: params.householdId ?? null,
      generation_type: "recipe_recommendations",
      prompt: params.prompt ?? {},
      result: params.result ?? {},
      model: modelLabel,
      tokens: params.tokens ?? null,
      cost: params.cost != null ? String(params.cost) : null,
      status: params.status,
    })
    .returning({ id: schema.ai_generations.id });

  return rows[0]?.id ?? null;
}

async function getUserPreferences(userId: string) {
  const rows = await db
    .select({
      id: schema.users.id,
      name: schema.users.name,
      email: schema.users.email,
      meta: schema.users.meta,
    })
    .from(schema.users)
    .where(eq(schema.users.id, userId))
    .limit(1);

  const user = rows[0];
  if (!user) {
    return {
      user: null,
      preferences: DEFAULT_PREFERENCES,
    };
  }

  const meta = parseJsonValue<Record<string, unknown>>(user.meta, {});
  const preferences = normalizePreferences((meta?.preferences as RecipePreferences) ?? {});

  return {
    user,
    preferences,
  };
}

async function getInventorySnapshot(userId: string) {
  const data = await getInventoryPageData(userId, {
    query: "",
    status: "all",
    categoryId: "all",
    location: "all",
    sort: "expiration_asc",
    page: 1,
    pageSize: 150,
  });

  return data.items.map((item) => ({
    id: item.id,
    name: item.name,
    quantity: item.quantity,
    unit: item.unit,
    expirationDate: item.expirationDate,
    status: item.status,
  } satisfies RecipeInventoryItem));
}

function buildRecipeListItem(recipe: {
  id: string;
  title: string;
  description: string | null;
  servings: number | null;
  cook_time: number | null;
  difficulty: string | null;
  ingredients: unknown;
  missing_ingredients: unknown;
  tags: unknown;
  metadata: unknown;
  score: string | number | null;
}) : RecipeListItem {
  const ingredients = parseJsonValue<RecipeIngredient[]>(recipe.ingredients, []);
  const missingIngredients = parseJsonValue<RecipeIngredient[]>(recipe.missing_ingredients, []);
  const tags = parseJsonValue<string[]>(recipe.tags, []);
  const metadata = parseJsonValue<Record<string, unknown>>(recipe.metadata, {});

  return {
    id: recipe.id,
    title: recipe.title,
    description: recipe.description || "A pantry-friendly recipe designed to reduce waste.",
    servings: recipe.servings ?? 2,
    cookTime: recipe.cook_time ?? 25,
    difficulty: (recipe.difficulty as RecipeListItem["difficulty"]) ?? "easy",
    ingredients,
    missingIngredients,
    tags,
    source: String(metadata.source ?? "ai_generated"),
    isSaved: false,
    score: recipe.score != null ? Number(recipe.score) : null,
  };
}

export async function generateRecipesForUser(options: {
  userId: string;
  maxRecipes: number;
  includeExpired: boolean;
  inventoryOnly?: boolean;
  excludedRecipeTitles?: string[];
  preferencesOverride?: Partial<RecipePreferences> | undefined;
  streamTokens?: boolean;
  onToken?: (token: string) => void;
}) {
  assertRateLimit(`recipe:${options.userId}`, 4, 60_000);

  const { user, preferences: storedPreferences } = await getUserPreferences(options.userId);
  const preferences = mergePreferences(storedPreferences, options.preferencesOverride);
  const household = user ? await ensurePersonalHouseholdForUser(user) : null;
  const aiSettings = await getAiSettingsForUser(options.userId);
  const inventoryOnly = Boolean(options.inventoryOnly);
  const excludedRecipeTitles = options.excludedRecipeTitles ?? [];
  const excludedTitleSet = new Set(excludedRecipeTitles.map(normalizeName));

  const inventory = await getInventorySnapshot(options.userId);
  const filteredInventory = options.includeExpired
    ? inventory
    : inventory.filter((item) => item.status !== "expired");

  const expiringItems = filteredInventory.filter(
    (item) => item.status === "expiring" || (options.includeExpired && item.status === "expired")
  );

  const promptInventory = limitInventory(filteredInventory);
  const promptPayload = buildRecipePromptPayload({
    maxRecipes: options.maxRecipes,
    inventory: promptInventory,
    expiringItems,
    preferences,
    includeExpired: options.includeExpired,
    inventoryOnly,
    excludedRecipeTitles,
  });

  const cacheKey = hashJson({ userId: options.userId, payload: promptPayload, ai: aiSettings });
  const cached = getCachedValue<{
    recipes: RecipeListItem[];
    summary?: string;
    pantryStaples?: string[];
  }>(cacheKey);

  if (cached) {
    return {
      recipes: cached.recipes,
      summary: cached.summary ?? null,
      pantryStaples: cached.pantryStaples ?? [],
      cached: true,
    };
  }

  const systemPrompt = buildRecipeSystemPrompt();
  const userPrompt = buildRecipeUserPrompt(promptPayload);

  let aiResponse: Awaited<ReturnType<typeof generateRecipeAiResponse>>;

  try {
    if (options.streamTokens && options.onToken) {
      aiResponse = await streamRecipeAiResponse(
        systemPrompt,
        userPrompt,
        {
          providerId: aiSettings.provider,
          model: aiSettings.model,
          userId: options.userId,
        },
        options.onToken
      );
    } else {
      aiResponse = await generateRecipeAiResponse(systemPrompt, userPrompt, {
        providerId: aiSettings.provider,
        model: aiSettings.model,
        userId: options.userId,
      });
    }
  } catch (error) {
    await logAiGeneration({
      userId: options.userId,
      householdId: household?.id ?? null,
      prompt: promptPayload,
      result: { error: String(error) },
      provider: aiSettings.provider,
      model: aiSettings.model,
      status: "error",
    });
    throw error;
  }
  const recipes = aiResponse.data.recipes.map(mapAiRecipe);

  const normalized = recipes.map((recipe) => {
    const missing = computeMissingIngredients(recipe.ingredients, filteredInventory);
    const mergedMissing = mergeMissingIngredients(missing.missing, recipe.missingIngredients);
    const enrichedRecipe = {
      ...recipe,
      ingredients: missing.annotated,
      missingIngredients: mergedMissing,
    } satisfies RecipeSuggestion;

    const score = scoreRecipe(enrichedRecipe, filteredInventory, expiringItems, preferences);

    return {
      ...enrichedRecipe,
      score,
    };
  }).filter((recipe) => {
    if (excludedTitleSet.has(normalizeName(recipe.title))) return false;
    if (!inventoryOnly) return true;
    return recipe.missingIngredients.length === 0;
  });

  if (normalized.length === 0) {
    throw new Error(
      inventoryOnly
        ? "No inventory-only recipes could be generated from the current pantry. Add more items or turn off inventory-only mode."
        : "No new recipe alternatives could be generated right now."
    );
  }

  const generationId = await logAiGeneration({
    userId: options.userId,
    householdId: household?.id ?? null,
    prompt: promptPayload,
    result: aiResponse.data,
    provider: aiResponse.provider,
    model: aiResponse.model ?? null,
    tokens: aiResponse.usage.totalTokens ?? null,
    cost: aiResponse.cost ?? null,
    status: "success",
  });

  const inserted = await db
    .insert(schema.recipes)
    .values(
      normalized.map((recipe) => ({
        household_id: household?.id ?? null,
        created_by: options.userId,
        title: recipe.title,
        description: recipe.description,
        servings: recipe.servings,
        cook_time: recipe.cookingTimeMinutes,
        difficulty: recipe.difficulty,
        ingredients: recipe.ingredients,
        missing_ingredients: recipe.missingIngredients,
        nutrition: recipe.nutrition,
        instructions: recipe.steps.join("\n"),
        waste_notes: recipe.wasteReductionNote,
        tags: recipe.tags ?? [],
        score: recipe.score != null ? String(recipe.score) : null,
        metadata: {
          source: "ai_generated",
          summary: aiResponse.data.summary ?? null,
          pantry_staples: aiResponse.data.pantry_staples ?? [],
          ai_generation_id: generationId,
        },
      }))
    )
    .returning({
      id: schema.recipes.id,
      title: schema.recipes.title,
      description: schema.recipes.description,
      servings: schema.recipes.servings,
      cook_time: schema.recipes.cook_time,
      difficulty: schema.recipes.difficulty,
      ingredients: schema.recipes.ingredients,
      missing_ingredients: schema.recipes.missing_ingredients,
      tags: schema.recipes.tags,
      metadata: schema.recipes.metadata,
      score: schema.recipes.score,
    });

  if (generationId && inserted.length > 0) {
    await db.insert(schema.ai_generation_links).values(
      inserted.map((recipe) => ({
        ai_generation_id: generationId,
        object_type: "recipe",
        object_id: recipe.id,
      }))
    );
  }

  const listItems = inserted.map((recipe) => buildRecipeListItem(recipe));

  const response = {
    recipes: listItems,
    summary: aiResponse.data.summary ?? null,
    pantryStaples: aiResponse.data.pantry_staples ?? [],
    cached: false,
  };

  setCachedValue(cacheKey, response, CACHE_TTL_MS);

  return response;
}

export async function toggleSavedRecipe(userId: string, recipeId: string) {
  const existing = await db
    .select({ id: schema.saved_recipes.id })
    .from(schema.saved_recipes)
    .where(and(eq(schema.saved_recipes.user_id, userId), eq(schema.saved_recipes.recipe_id, recipeId)))
    .limit(1);

  if (existing[0]) {
    await db
      .delete(schema.saved_recipes)
      .where(and(eq(schema.saved_recipes.user_id, userId), eq(schema.saved_recipes.recipe_id, recipeId)));
    return { saved: false };
  }

  await db.insert(schema.saved_recipes).values({ user_id: userId, recipe_id: recipeId });
  return { saved: true };
}

export async function getSavedRecipeIds(userId: string, recipeIds: string[]) {
  if (recipeIds.length === 0) return new Set<string>();
  const rows = await db
    .select({ recipeId: schema.saved_recipes.recipe_id })
    .from(schema.saved_recipes)
    .where(
      and(eq(schema.saved_recipes.user_id, userId), inArray(schema.saved_recipes.recipe_id, recipeIds))
    );

  const saved = new Set(rows.map((row) => row.recipeId));
  return saved;
}

export async function getRecipePreferencesForUser(userId: string) {
  const { preferences } = await getUserPreferences(userId);
  return preferences;
}

export async function updateRecipePreferences(userId: string, preferences: RecipePreferences) {
  const rows = await db
    .select({ meta: schema.users.meta })
    .from(schema.users)
    .where(eq(schema.users.id, userId))
    .limit(1);

  const meta = parseJsonValue<Record<string, unknown>>(rows[0]?.meta ?? {}, {});
  const nextMeta = {
    ...meta,
    preferences,
  };

  await db
    .update(schema.users)
    .set({
      meta: nextMeta,
      updated_at: new Date(),
    })
    .where(eq(schema.users.id, userId));

  return preferences;
}
