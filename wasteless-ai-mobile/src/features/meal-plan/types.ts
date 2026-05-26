export type MealPlanIngredient = {
  name: string;
  quantity?: string;
  unit?: string;
  notes?: string;
  isOptional?: boolean;
  isExpiring?: boolean;
};

export type MealPlanInventoryItem = {
  id: string;
  name: string;
  quantityLabel: string;
  category: string;
  location: string;
  relativeExpiration: string;
  expirationStatus: string;
  priorityScore: number;
};

export type MealPlanConsumptionSuggestion = {
  productId: string;
  name: string;
  ingredientName: string;
  quantity: string;
  unit: string | null;
  reason: string;
};

export type MealPlanDay = {
  id: string;
  dateLabel: string;
  title: string;
  description: string;
  source: string;
  cookTime: number;
  servings: number;
  score: number;
  inventoryCoverage: number;
  priorityItems: string[];
  missingItems: MealPlanIngredient[];
  consumptionSuggestions: MealPlanConsumptionSuggestion[];
  tags: string[];
  isSaved: boolean;
};

export type SavedMealPlanItem = {
  id: string;
  dateLabel: string;
  title: string;
  description: string | null;
  status: 'planned' | 'cooked' | 'skipped';
  cookTime: number | null;
  servings: number | null;
  priorityItems: string[];
  missingItems: MealPlanIngredient[];
  consumptionSuggestions: MealPlanConsumptionSuggestion[];
  isSaved: boolean;
};

export type SavedMealPlan = {
  id: string;
  name: string;
  status: string;
  items: SavedMealPlanItem[];
  stats: {
    totalMeals: number;
    cookedMeals: number;
    skippedMeals: number;
    plannedMeals: number;
  };
};

export type ShoppingOptimizerItem = {
  key: string;
  name: string;
  quantity: string;
  unit: string | null;
  priority: string;
  alreadyOnList: boolean;
  sourceMeals: string[];
  reason: string;
};

export type MealPlanningData = {
  savedPlan: SavedMealPlan | null;
  planDays: MealPlanDay[];
  shoppingSuggestions: ShoppingOptimizerItem[];
  expiringItems: MealPlanInventoryItem[];
  expiredItems: MealPlanInventoryItem[];
  lowStockItems: MealPlanInventoryItem[];
  shoppingList: {
    id: string;
    name: string;
    itemCount: number;
    uncheckedCount: number;
  } | null;
  stats: {
    plannedMeals: number;
    expiringUsed: number;
    addableShoppingItems: number;
    alreadyListedItems: number;
  };
};

export type MealPlanOptions = {
  days: number;
  inventoryOnly: boolean;
};

export type MealPlanItemAction = 'cooked' | 'skipped' | 'planned';
