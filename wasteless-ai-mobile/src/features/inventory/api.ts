import { API_ENDPOINTS } from '@/services/api/endpoints';
import { ApiError, apiRequest } from '@/services/api/client';
import type {
  CreateInventoryItemPayload,
  ExpirationStatus,
  InventoryCategory,
  InventoryFilters,
  InventoryItem,
  InventoryPageData,
  InventoryStatusFilter,
  InventorySortOption,
  QuantityUnit,
  StorageZone,
  UpdateInventoryItemPayload,
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

function readNumber(value: unknown, fallback: number) {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function isExpirationStatus(value: unknown): value is ExpirationStatus {
  return value === 'fresh' || value === 'expiring' || value === 'expired';
}

function parseCategory(value: unknown): InventoryCategory {
  if (!isRecord(value)) {
    throw new ApiError('Invalid inventory category response from server.', 0);
  }

  const id = readString(value.id);
  const name = readString(value.name);
  if (!id || !name) {
    throw new ApiError('Invalid inventory category response from server.', 0);
  }

  return {
    id,
    name,
    color: readNullableString(value.color),
    createdAt: readString(value.createdAt),
  };
}

function parseInventoryItem(value: unknown): InventoryItem {
  if (!isRecord(value)) {
    throw new ApiError('Invalid inventory item response from server.', 0);
  }

  const id = readString(value.id);
  const name = readString(value.name);
  const status = isExpirationStatus(value.status) ? value.status : 'fresh';

  if (!id || !name) {
    throw new ApiError('Invalid inventory item response from server.', 0);
  }

  return {
    id,
    name,
    quantity: readString(value.quantity, '0'),
    unit: readNullableString(value.unit) as QuantityUnit | null,
    purchaseDate: readNullableString(value.purchaseDate),
    expirationDate: readNullableString(value.expirationDate),
    storageLocation: readNullableString(value.storageLocation) as StorageZone | null,
    notes: readNullableString(value.notes),
    categoryId: readNullableString(value.categoryId),
    categoryName: readNullableString(value.categoryName),
    categoryColor: readNullableString(value.categoryColor),
    createdAt: readString(value.createdAt),
    updatedAt: readString(value.updatedAt),
    status,
    lowStock: value.lowStock === true,
  };
}

function parseInventoryPageData(payload: unknown): InventoryPageData {
  const data = getSuccessData(payload, 'Invalid inventory response from server.');
  if (!isRecord(data)) {
    throw new ApiError('Invalid inventory response from server.', 0);
  }

  const items = Array.isArray(data.items) ? data.items.map(parseInventoryItem) : [];
  const categories = Array.isArray(data.categories) ? data.categories.map(parseCategory) : [];
  const locations = Array.isArray(data.locations)
    ? data.locations.filter((location): location is StorageZone => typeof location === 'string')
    : [];

  return {
    items,
    categories,
    locations,
    totalCount: readNumber(data.totalCount, items.length),
    page: readNumber(data.page, 1),
    pageSize: readNumber(data.pageSize, items.length),
    pageCount: readNumber(data.pageCount, 1),
  };
}

function parseInventoryItemResponse(payload: unknown): InventoryItem {
  const data = getSuccessData(payload, 'Invalid inventory item response from server.');
  if (!isRecord(data)) {
    throw new ApiError('Invalid inventory item response from server.', 0);
  }

  return parseInventoryItem(data.item);
}

function appendFilterParam(params: URLSearchParams, key: string, value: string | number) {
  if (typeof value === 'string' && value.trim().length === 0) return;

  params.set(key, String(value));
}

function buildInventoryQuery(filters: Partial<InventoryFilters>) {
  const params = new URLSearchParams();

  appendFilterParam(params, 'query', filters.query ?? '');
  appendFilterParam(params, 'status', filters.status ?? 'all');
  appendFilterParam(params, 'categoryId', filters.categoryId ?? 'all');
  appendFilterParam(params, 'location', filters.location ?? 'all');
  appendFilterParam(params, 'sort', filters.sort ?? 'expiration_asc');
  appendFilterParam(params, 'page', filters.page ?? 1);
  appendFilterParam(params, 'pageSize', filters.pageSize ?? 50);

  const query = params.toString();
  return query ? `?${query}` : '';
}

function toApiPayload(payload: CreateInventoryItemPayload | UpdateInventoryItemPayload) {
  return {
    name: payload.name.trim(),
    quantity: payload.quantity.trim(),
    unit: payload.unit?.trim() ?? '',
    category_id: payload.categoryId ?? '',
    purchase_date: payload.purchaseDate ?? '',
    expiration_date: payload.expirationDate ?? '',
    storage_location: payload.storageLocation?.trim() ?? '',
    notes: payload.notes?.trim() ?? '',
  };
}

export async function listInventoryItems(
  token: string,
  filters: Partial<InventoryFilters> = {},
): Promise<InventoryPageData> {
  const payload = await apiRequest<unknown>(
    `${API_ENDPOINTS.inventory.list}${buildInventoryQuery(filters)}`,
    {
      authToken: token,
    },
  );

  return parseInventoryPageData(payload);
}

export async function getInventoryItem(token: string, id: string): Promise<InventoryItem> {
  const payload = await apiRequest<unknown>(API_ENDPOINTS.inventory.item(id), {
    authToken: token,
  });

  return parseInventoryItemResponse(payload);
}

export async function createInventoryItem(
  token: string,
  item: CreateInventoryItemPayload,
): Promise<InventoryItem> {
  const payload = await apiRequest<unknown>(API_ENDPOINTS.inventory.create, {
    authToken: token,
    method: 'POST',
    body: JSON.stringify(toApiPayload(item)),
  });

  return parseInventoryItemResponse(payload);
}

export async function updateInventoryItem(
  token: string,
  id: string,
  item: UpdateInventoryItemPayload,
): Promise<InventoryItem> {
  const payload = await apiRequest<unknown>(API_ENDPOINTS.inventory.item(id), {
    authToken: token,
    method: 'PATCH',
    body: JSON.stringify(toApiPayload(item)),
  });

  return parseInventoryItemResponse(payload);
}

export async function deleteInventoryItem(token: string, id: string): Promise<void> {
  await apiRequest<void>(API_ENDPOINTS.inventory.item(id), {
    authToken: token,
    method: 'DELETE',
  });
}

export const defaultInventoryFilters: InventoryFilters = {
  query: '',
  status: 'all' satisfies InventoryStatusFilter,
  categoryId: 'all',
  location: 'all',
  sort: 'expiration_asc' satisfies InventorySortOption,
  page: 1,
  pageSize: 50,
};
