export const EXPIRATION_STATUSES = ['fresh', 'expiring', 'expired'] as const;
export const INVENTORY_STATUS_FILTERS = ['all', ...EXPIRATION_STATUSES] as const;
export const INVENTORY_SORT_OPTIONS = [
  'expiration_asc',
  'expiration_desc',
  'name_asc',
  'created_desc',
] as const;
export const STORAGE_ZONES = ['pantry', 'fridge', 'freezer', 'counter', 'cabinet'] as const;
export const QUANTITY_UNITS = [
  'pcs',
  'g',
  'kg',
  'ml',
  'l',
  'oz',
  'lb',
  'cup',
  'tbsp',
  'tsp',
  'pack',
  'can',
  'bottle',
  'box',
] as const;

export type ExpirationStatus = (typeof EXPIRATION_STATUSES)[number];
export type InventoryStatusFilter = (typeof INVENTORY_STATUS_FILTERS)[number];
export type InventorySortOption = (typeof INVENTORY_SORT_OPTIONS)[number];
export type StorageZone = (typeof STORAGE_ZONES)[number] | (string & {});
export type QuantityUnit = (typeof QUANTITY_UNITS)[number] | (string & {});
export type InventoryExpirationDate = string | null;

export type InventoryCategory = {
  id: string;
  name: string;
  color: string | null;
  createdAt: string;
};

export type InventoryItem = {
  id: string;
  name: string;
  quantity: string;
  unit: QuantityUnit | null;
  purchaseDate: string | null;
  expirationDate: InventoryExpirationDate;
  storageLocation: StorageZone | null;
  notes: string | null;
  categoryId: string | null;
  categoryName: string | null;
  categoryColor: string | null;
  createdAt: string;
  updatedAt: string;
  status: ExpirationStatus;
  lowStock: boolean;
};

export type InventoryFilters = {
  query: string;
  status: InventoryStatusFilter;
  categoryId: string | 'all';
  location: StorageZone | 'all';
  sort: InventorySortOption;
  page: number;
  pageSize: number;
};

export type InventoryPageData = {
  items: InventoryItem[];
  categories: InventoryCategory[];
  locations: StorageZone[];
  totalCount: number;
  page: number;
  pageSize: number;
  pageCount: number;
};

export type InventoryItemPayload = {
  name: string;
  quantity: string;
  unit?: QuantityUnit | '';
  categoryId?: string | null;
  purchaseDate?: string | null;
  expirationDate?: InventoryExpirationDate;
  storageLocation?: StorageZone | '';
  notes?: string | null;
};

export type CreateInventoryItemPayload = InventoryItemPayload;
export type UpdateInventoryItemPayload = InventoryItemPayload;

export type InventoryMutationResult =
  | { success: true; item?: InventoryItem }
  | { success: false; error: string };
