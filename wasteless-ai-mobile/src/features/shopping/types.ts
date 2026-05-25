export const SHOPPING_ITEM_SOURCES = ['manual', 'recipe', 'low-stock'] as const;
export const SHOPPING_FILTERS = [
  'all',
  'active',
  'checked',
  'recipe-derived',
  'low-stock',
  'manual',
] as const;

export type ShoppingItemSource = (typeof SHOPPING_ITEM_SOURCES)[number];
export type ShoppingListFilter = (typeof SHOPPING_FILTERS)[number];

export type ShoppingListItem = {
  id: string;
  userId: string;
  name: string;
  quantity: number | null;
  unit: string | null;
  category: string | null;
  note: string | null;
  checked: boolean;
  source: ShoppingItemSource;
  recipeId: string | null;
  inventoryItemId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateShoppingItemPayload = {
  name: string;
  quantity?: number | null;
  unit?: string | null;
  category?: string | null;
  note?: string | null;
  checked?: boolean;
  source?: ShoppingItemSource;
  recipeId?: string | null;
  inventoryItemId?: string | null;
};

export type UpdateShoppingItemPayload = Partial<CreateShoppingItemPayload>;

export type ShoppingIngredientInput = {
  name: string;
  quantity?: number | string | null;
  unit?: string | null;
  note?: string | null;
  notes?: string | null;
};

export type ShoppingRecipeSourceInput = {
  recipeId?: string | null;
  title?: string | null;
  missingIngredients: ShoppingIngredientInput[];
};

export type ShoppingListGenerationRequest = {
  recipeIds?: string[];
  recipes?: ShoppingRecipeSourceInput[];
  missingIngredients?: ShoppingIngredientInput[];
  includeRecipeMissing?: boolean;
  includeLowStock?: boolean;
};

export type ShoppingListGenerationResult = {
  listId: string | null;
  insertedCount: number;
  skippedCount: number;
  recipeItemCount: number;
  lowStockItemCount: number;
  items: ShoppingListItem[];
};

export type ShoppingListData = {
  list: {
    id: string;
    name: string;
  } | null;
  items: ShoppingListItem[];
};

export type ShoppingMutationResult =
  | { success: true; item?: ShoppingListItem; result?: ShoppingListGenerationResult }
  | { success: false; error: string };
