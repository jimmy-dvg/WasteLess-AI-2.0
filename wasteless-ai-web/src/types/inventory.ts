import type { ExpirationStatus } from "@/lib/dashboard-utils";

export type InventoryCategory = {
  id: string;
  name: string;
  color: string | null;
  createdAt: Date;
};

export type InventoryProduct = {
  id: string;
  name: string;
  quantity: string;
  unit: string | null;
  purchaseDate: Date | null;
  expirationDate: Date | null;
  storageLocation: string | null;
  notes: string | null;
  categoryId: string | null;
  categoryName: string | null;
  categoryColor: string | null;
  createdAt: Date;
  updatedAt: Date;
  status: ExpirationStatus;
  lowStock: boolean;
};

export type InventoryFilters = {
  query: string;
  status: "all" | ExpirationStatus;
  categoryId: string | "all";
  location: string | "all";
  sort: "expiration_asc" | "expiration_desc" | "name_asc" | "created_desc";
  page: number;
  pageSize: number;
};

export type InventoryPageData = {
  items: InventoryProduct[];
  categories: InventoryCategory[];
  locations: string[];
  totalCount: number;
  page: number;
  pageSize: number;
  pageCount: number;
};
