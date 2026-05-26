import { API_ENDPOINTS } from '@/services/api/endpoints';
import { apiRequest } from '@/services/api/client';
import {
  getSuccessData,
  isRecord,
  readNullableString,
  readString,
} from '@/services/api/response';
import type { Category, CategoryPayload, StorageSuggestion } from './types';

function parseCategory(value: unknown): Category | null {
  if (!isRecord(value)) return null;

  const id = readString(value.id);
  const name = readString(value.name);
  if (!id || !name) return null;

  return {
    id,
    name,
    color: readNullableString(value.color),
    createdAt: readString(value.createdAt),
  };
}

function parseCategoryListResponse(payload: unknown): Category[] {
  const data = getSuccessData(payload, 'Invalid categories response from server.');
  if (!isRecord(data) || !Array.isArray(data.categories)) return [];

  return data.categories.map(parseCategory).filter((item): item is Category => Boolean(item));
}

function parseCategoryMutationResponse(payload: unknown): Category | null {
  const data = getSuccessData(payload, 'Invalid category response from server.');
  if (!isRecord(data)) return null;

  return parseCategory(data.category);
}

function parseSuggestionResponse(payload: unknown): StorageSuggestion {
  const data = getSuccessData(payload, 'Invalid storage suggestion response from server.');
  if (!isRecord(data)) {
    throw new Error('Invalid storage suggestion response from server.');
  }

  return {
    productName: readString(data.productName),
    category: readString(data.category),
    storageZone: readString(data.storageZone),
    reason: readString(data.reason),
    source: readString(data.source, 'fallback'),
  };
}

export async function listCategories(token: string): Promise<Category[]> {
  const payload = await apiRequest<unknown>(API_ENDPOINTS.categories.list, {
    authToken: token,
  });

  return parseCategoryListResponse(payload);
}

export async function createCategory(token: string, category: CategoryPayload): Promise<Category | null> {
  const payload = await apiRequest<unknown>(API_ENDPOINTS.categories.create, {
    authToken: token,
    method: 'POST',
    body: JSON.stringify(category),
  });

  return parseCategoryMutationResponse(payload);
}

export async function deleteCategory(token: string, id: string): Promise<void> {
  await apiRequest<unknown>(API_ENDPOINTS.categories.item(id), {
    authToken: token,
    method: 'DELETE',
  });
}

export async function suggestProductStorage(
  token: string,
  productName: string,
): Promise<StorageSuggestion> {
  const payload = await apiRequest<unknown>(API_ENDPOINTS.categories.suggest, {
    authToken: token,
    method: 'POST',
    body: JSON.stringify({ productName }),
  });

  return parseSuggestionResponse(payload);
}
