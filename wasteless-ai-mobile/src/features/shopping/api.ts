import { API_ENDPOINTS } from '@/services/api/endpoints';
import { ApiError, apiRequest } from '@/services/api/client';
import type {
  CreateShoppingItemPayload,
  ShoppingIngredientInput,
  ShoppingItemSource,
  ShoppingListData,
  ShoppingListGenerationRequest,
  ShoppingListGenerationResult,
  ShoppingListItem,
  UpdateShoppingItemPayload,
} from './types';

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
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

function readString(value: unknown, fallback = '') {
  return typeof value === 'string' ? value : fallback;
}

function readNullableString(value: unknown) {
  return typeof value === 'string' && value.length > 0 ? value : null;
}

function readNumber(value: unknown, fallback: number): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }

  return fallback;
}

function readNullableNumber(value: unknown) {
  if (value == null || value === '') return null;

  const parsed = readNumber(value, Number.NaN);
  return Number.isFinite(parsed) ? parsed : null;
}

function isShoppingItemSource(value: unknown): value is ShoppingItemSource {
  return value === 'manual' || value === 'recipe' || value === 'low-stock';
}

function parseShoppingItem(value: unknown): ShoppingListItem {
  if (!isRecord(value)) {
    throw new ApiError('Invalid shopping item response from server.', 0);
  }

  const id = readString(value.id);
  const userId = readString(value.userId);
  const name = readString(value.name);

  if (!id || !name) {
    throw new ApiError('Invalid shopping item response from server.', 0);
  }

  return {
    id,
    userId,
    name,
    quantity: readNullableNumber(value.quantity),
    unit: readNullableString(value.unit),
    category: readNullableString(value.category),
    note: readNullableString(value.note),
    checked: value.checked === true,
    source: isShoppingItemSource(value.source) ? value.source : 'manual',
    recipeId: readNullableString(value.recipeId),
    inventoryItemId: readNullableString(value.inventoryItemId),
    createdAt: readString(value.createdAt),
    updatedAt: readString(value.updatedAt),
  };
}

function parseShoppingListData(payload: unknown): ShoppingListData {
  const data = getSuccessData(payload, 'Invalid shopping list response from server.');
  if (!isRecord(data)) {
    throw new ApiError('Invalid shopping list response from server.', 0);
  }

  const list = isRecord(data.list)
    ? {
        id: readString(data.list.id),
        name: readString(data.list.name, 'Shopping list'),
      }
    : null;

  return {
    list: list?.id ? list : null,
    items: Array.isArray(data.items) ? data.items.map(parseShoppingItem) : [],
  };
}

function parseShoppingItemResponse(payload: unknown): ShoppingListItem {
  const data = getSuccessData(payload, 'Invalid shopping item response from server.');
  if (!isRecord(data)) {
    throw new ApiError('Invalid shopping item response from server.', 0);
  }

  return parseShoppingItem(data.item);
}

function parseGenerationResult(payload: unknown): ShoppingListGenerationResult {
  const data = getSuccessData(payload, 'Invalid shopping list generation response from server.');
  if (!isRecord(data) || !isRecord(data.result)) {
    throw new ApiError('Invalid shopping list generation response from server.', 0);
  }

  const result = data.result;

  return {
    listId: readNullableString(result.listId),
    insertedCount: readNumber(result.insertedCount, 0),
    skippedCount: readNumber(result.skippedCount, 0),
    recipeItemCount: readNumber(result.recipeItemCount, 0),
    lowStockItemCount: readNumber(result.lowStockItemCount, 0),
    items: Array.isArray(result.items) ? result.items.map(parseShoppingItem) : [],
  };
}

function cleanText(value: string | null | undefined) {
  const text = value?.trim();
  return text ? text : null;
}

function cleanQuantity(value: number | null | undefined) {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : null;
}

function cleanIngredient(ingredient: ShoppingIngredientInput) {
  return {
    name: ingredient.name.trim(),
    quantity: ingredient.quantity ?? null,
    unit: cleanText(ingredient.unit),
    note: cleanText(ingredient.note),
    notes: cleanText(ingredient.notes),
  };
}

function toApiPayload(payload: CreateShoppingItemPayload | UpdateShoppingItemPayload) {
  return {
    ...('name' in payload ? { name: payload.name?.trim() } : {}),
    ...('quantity' in payload ? { quantity: cleanQuantity(payload.quantity) } : {}),
    ...('unit' in payload ? { unit: cleanText(payload.unit) } : {}),
    ...('category' in payload ? { category: cleanText(payload.category) } : {}),
    ...('note' in payload ? { note: cleanText(payload.note) } : {}),
    ...('checked' in payload ? { checked: payload.checked } : {}),
    ...('source' in payload ? { source: payload.source } : {}),
    ...('recipeId' in payload ? { recipeId: cleanText(payload.recipeId) } : {}),
    ...('inventoryItemId' in payload ? { inventoryItemId: cleanText(payload.inventoryItemId) } : {}),
  };
}

function toGenerationPayload(request: ShoppingListGenerationRequest) {
  return {
    recipeIds: request.recipeIds ?? [],
    recipes: (request.recipes ?? []).map((recipe) => ({
      recipeId: recipe.recipeId ?? null,
      title: cleanText(recipe.title),
      missingIngredients: recipe.missingIngredients.map(cleanIngredient).filter((item) => item.name),
    })),
    missingIngredients: (request.missingIngredients ?? [])
      .map(cleanIngredient)
      .filter((item) => item.name),
    includeRecipeMissing: request.includeRecipeMissing ?? true,
    includeLowStock: request.includeLowStock ?? true,
  };
}

export async function listShoppingItems(token: string): Promise<ShoppingListData> {
  const payload = await apiRequest<unknown>(API_ENDPOINTS.shoppingList.list, {
    authToken: token,
  });

  return parseShoppingListData(payload);
}

export async function createShoppingItem(
  token: string,
  item: CreateShoppingItemPayload,
): Promise<ShoppingListItem> {
  const payload = await apiRequest<unknown>(API_ENDPOINTS.shoppingList.create, {
    authToken: token,
    method: 'POST',
    body: JSON.stringify(toApiPayload(item)),
  });

  return parseShoppingItemResponse(payload);
}

export async function updateShoppingItem(
  token: string,
  id: string,
  item: UpdateShoppingItemPayload,
): Promise<ShoppingListItem> {
  const payload = await apiRequest<unknown>(API_ENDPOINTS.shoppingList.item(id), {
    authToken: token,
    method: 'PATCH',
    body: JSON.stringify(toApiPayload(item)),
  });

  return parseShoppingItemResponse(payload);
}

export async function deleteShoppingItem(token: string, id: string): Promise<void> {
  await apiRequest<void>(API_ENDPOINTS.shoppingList.item(id), {
    authToken: token,
    method: 'DELETE',
  });
}

export async function clearCheckedShoppingItems(token: string): Promise<number> {
  const payload = await apiRequest<unknown>(API_ENDPOINTS.shoppingList.clearChecked, {
    authToken: token,
    method: 'POST',
  });
  const data = getSuccessData(payload, 'Invalid clear checked response from server.');

  if (!isRecord(data)) return 0;
  return readNumber(data.deletedCount, 0);
}

export async function generateShoppingList(
  token: string,
  request: ShoppingListGenerationRequest,
): Promise<ShoppingListGenerationResult> {
  const payload = await apiRequest<unknown>(API_ENDPOINTS.shoppingList.generate, {
    authToken: token,
    method: 'POST',
    body: JSON.stringify(toGenerationPayload(request)),
  });

  return parseGenerationResult(payload);
}
