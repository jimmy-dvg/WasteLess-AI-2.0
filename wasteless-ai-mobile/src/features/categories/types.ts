import type { InventoryCategory } from '@/features/inventory/types';

export type Category = InventoryCategory;

export type CategoryPayload = {
  name: string;
  color?: string | null;
};

export type StorageSuggestion = {
  productName: string;
  category: string;
  storageZone: string;
  reason: string;
  source: string;
};
