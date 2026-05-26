import { API_ENDPOINTS } from '@/services/api/endpoints';
import { apiRequest } from '@/services/api/client';
import {
  getSuccessData,
  isRecord,
  readBoolean,
  readNullableString,
  readNumber,
  readString,
  readStringArray,
} from '@/services/api/response';
import type {
  MealPlanConsumptionSuggestion,
  MealPlanDay,
  MealPlanIngredient,
  MealPlanInventoryItem,
  MealPlanItemAction,
  MealPlanOptions,
  MealPlanningData,
  SavedMealPlan,
  SavedMealPlanItem,
  ShoppingOptimizerItem,
} from './types';

function readOptionalNumber(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  return null;
}

function parseIngredient(value: unknown): MealPlanIngredient | null {
  if (!isRecord(value)) return null;

  const name = readString(value.name);
  if (!name) return null;

  return {
    name,
    quantity: readString(value.quantity) || undefined,
    unit: readString(value.unit) || undefined,
    notes: readString(value.notes) || undefined,
    isOptional: readBoolean(value.isOptional),
    isExpiring: readBoolean(value.isExpiring),
  };
}

function parseIngredients(value: unknown) {
  return Array.isArray(value)
    ? value.map(parseIngredient).filter((item): item is MealPlanIngredient => Boolean(item))
    : [];
}

function parseConsumptionSuggestion(value: unknown): MealPlanConsumptionSuggestion | null {
  if (!isRecord(value)) return null;

  const productId = readString(value.productId);
  if (!productId) return null;

  return {
    productId,
    name: readString(value.name),
    ingredientName: readString(value.ingredientName),
    quantity: readString(value.quantity),
    unit: readNullableString(value.unit),
    reason: readString(value.reason),
  };
}

function parseConsumptionSuggestions(value: unknown) {
  return Array.isArray(value)
    ? value
        .map(parseConsumptionSuggestion)
        .filter((item): item is MealPlanConsumptionSuggestion => Boolean(item))
    : [];
}

function parseInventoryItem(value: unknown): MealPlanInventoryItem | null {
  if (!isRecord(value)) return null;

  const id = readString(value.id);
  if (!id) return null;

  return {
    id,
    name: readString(value.name),
    quantityLabel: readString(value.quantityLabel),
    category: readString(value.category, 'Uncategorized'),
    location: readString(value.location, 'storage'),
    relativeExpiration: readString(value.relativeExpiration),
    expirationStatus: readString(value.expirationStatus, 'fresh'),
    priorityScore: readNumber(value.priorityScore),
  };
}

function parsePlanDay(value: unknown): MealPlanDay | null {
  if (!isRecord(value)) return null;

  const id = readString(value.id);
  const title = readString(value.title);
  if (!id || !title) return null;

  return {
    id,
    dateLabel: readString(value.dateLabel),
    title,
    description: readString(value.description),
    source: readString(value.source),
    cookTime: readNumber(value.cookTime),
    servings: readNumber(value.servings),
    score: readNumber(value.score),
    inventoryCoverage: readNumber(value.inventoryCoverage),
    priorityItems: readStringArray(value.priorityItems),
    missingItems: parseIngredients(value.missingItems),
    consumptionSuggestions: parseConsumptionSuggestions(value.consumptionSuggestions),
    tags: readStringArray(value.tags),
    isSaved: readBoolean(value.isSaved),
  };
}

function parseSavedItem(value: unknown): SavedMealPlanItem | null {
  if (!isRecord(value)) return null;

  const id = readString(value.id);
  const title = readString(value.title);
  if (!id || !title) return null;

  const status = readString(value.status, 'planned');

  return {
    id,
    dateLabel: readString(value.dateLabel),
    title,
    description: readNullableString(value.description),
    status: status === 'cooked' || status === 'skipped' ? status : 'planned',
    cookTime: readOptionalNumber(value.cookTime),
    servings: readOptionalNumber(value.servings),
    priorityItems: readStringArray(value.priorityItems),
    missingItems: parseIngredients(value.missingItems),
    consumptionSuggestions: parseConsumptionSuggestions(value.consumptionSuggestions),
    isSaved: readBoolean(value.isSaved),
  };
}

function parseSavedPlan(value: unknown): SavedMealPlan | null {
  if (!isRecord(value)) return null;

  const id = readString(value.id);
  if (!id) return null;

  const rawStats = isRecord(value.stats) ? value.stats : {};

  return {
    id,
    name: readString(value.name, 'Saved meal plan'),
    status: readString(value.status, 'active'),
    items: Array.isArray(value.items)
      ? value.items.map(parseSavedItem).filter((item): item is SavedMealPlanItem => Boolean(item))
      : [],
    stats: {
      totalMeals: readNumber(rawStats.totalMeals),
      cookedMeals: readNumber(rawStats.cookedMeals),
      skippedMeals: readNumber(rawStats.skippedMeals),
      plannedMeals: readNumber(rawStats.plannedMeals),
    },
  };
}

function parseShoppingSuggestion(value: unknown): ShoppingOptimizerItem | null {
  if (!isRecord(value)) return null;

  const key = readString(value.key);
  const name = readString(value.name);
  if (!key || !name) return null;

  return {
    key,
    name,
    quantity: readString(value.quantity),
    unit: readNullableString(value.unit),
    priority: readString(value.priority, 'normal'),
    alreadyOnList: readBoolean(value.alreadyOnList),
    sourceMeals: readStringArray(value.sourceMeals),
    reason: readString(value.reason),
  };
}

function parseMealPlanningData(payload: unknown): MealPlanningData {
  const data = getSuccessData(payload, 'Invalid meal plan response from server.');
  if (!isRecord(data)) {
    throw new Error('Invalid meal plan response from server.');
  }

  const rawShoppingList = isRecord(data.shoppingList) ? data.shoppingList : null;
  const rawStats = isRecord(data.stats) ? data.stats : {};

  return {
    savedPlan: parseSavedPlan(data.savedPlan),
    planDays: Array.isArray(data.planDays)
      ? data.planDays.map(parsePlanDay).filter((item): item is MealPlanDay => Boolean(item))
      : [],
    shoppingSuggestions: Array.isArray(data.shoppingSuggestions)
      ? data.shoppingSuggestions
          .map(parseShoppingSuggestion)
          .filter((item): item is ShoppingOptimizerItem => Boolean(item))
      : [],
    expiringItems: Array.isArray(data.expiringItems)
      ? data.expiringItems
          .map(parseInventoryItem)
          .filter((item): item is MealPlanInventoryItem => Boolean(item))
      : [],
    expiredItems: Array.isArray(data.expiredItems)
      ? data.expiredItems
          .map(parseInventoryItem)
          .filter((item): item is MealPlanInventoryItem => Boolean(item))
      : [],
    lowStockItems: Array.isArray(data.lowStockItems)
      ? data.lowStockItems
          .map(parseInventoryItem)
          .filter((item): item is MealPlanInventoryItem => Boolean(item))
      : [],
    shoppingList: rawShoppingList
      ? {
          id: readString(rawShoppingList.id),
          name: readString(rawShoppingList.name, 'Shopping list'),
          itemCount: readNumber(rawShoppingList.itemCount),
          uncheckedCount: readNumber(rawShoppingList.uncheckedCount),
        }
      : null,
    stats: {
      plannedMeals: readNumber(rawStats.plannedMeals),
      expiringUsed: readNumber(rawStats.expiringUsed),
      addableShoppingItems: readNumber(rawStats.addableShoppingItems),
      alreadyListedItems: readNumber(rawStats.alreadyListedItems),
    },
  };
}

function optionsToQuery(options: MealPlanOptions) {
  const params = new URLSearchParams();
  params.set('days', String(options.days));
  params.set('inventoryOnly', options.inventoryOnly ? 'true' : 'false');
  return `?${params.toString()}`;
}

function parseMessageResponse(payload: unknown, invalidMessage: string) {
  const data = getSuccessData(payload, invalidMessage);
  if (!isRecord(data)) return 'Done.';

  return readString(data.message, 'Done.');
}

export async function getMealPlanData(
  token: string,
  options: MealPlanOptions,
): Promise<MealPlanningData> {
  const payload = await apiRequest<unknown>(
    `${API_ENDPOINTS.mealPlan.detail}${optionsToQuery(options)}`,
    { authToken: token },
  );

  return parseMealPlanningData(payload);
}

export async function saveMealPlan(token: string, options: MealPlanOptions): Promise<string> {
  const payload = await apiRequest<unknown>(API_ENDPOINTS.mealPlan.save, {
    authToken: token,
    method: 'POST',
    body: JSON.stringify(options),
  });

  return parseMessageResponse(payload, 'Invalid save meal plan response from server.');
}

export async function addMealPlanShoppingItems(
  token: string,
  options: MealPlanOptions,
): Promise<string> {
  const payload = await apiRequest<unknown>(API_ENDPOINTS.mealPlan.shoppingItems, {
    authToken: token,
    method: 'POST',
    body: JSON.stringify(options),
  });

  return parseMessageResponse(payload, 'Invalid meal plan shopping response from server.');
}

export async function updateMealPlanItem(
  token: string,
  itemId: string,
  action: MealPlanItemAction,
): Promise<string> {
  const payload = await apiRequest<unknown>(API_ENDPOINTS.mealPlan.item(itemId), {
    authToken: token,
    method: 'PATCH',
    body: JSON.stringify({ action }),
  });

  return parseMessageResponse(payload, 'Invalid meal plan item response from server.');
}
