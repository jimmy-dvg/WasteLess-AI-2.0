import "server-only";

import { computeMissingIngredients, matchIngredientsToInventory } from "@/ai/services/recipe-matching";
import { db } from "@/db";
import { getPrimaryHouseholdForUser, type UserHousehold } from "@/db/queries/households";
import * as schema from "@/db/schema/tables";
import {
  addDays,
  formatDate,
  formatQuantity,
  formatRelativeExpiration,
  getExpirationStatus,
  parseJsonValue,
  startOfDay,
  toDate,
  type ExpirationStatus,
} from "@/lib/dashboard-utils";
import type { RecipeIngredient, RecipeInventoryItem } from "@/types/recipes";
import { and, asc, desc, eq, or } from "drizzle-orm";

const DEFAULT_PLAN_DAYS = 5;
const MAX_PLAN_DAYS = 7;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

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

type ProductAttributes = {
  scan?: {
    source?: string | null;
    receiptId?: string | null;
    confidence?: number | string | null;
    shelfLifeDays?: number | string | null;
    price?: number | string | null;
  };
};

type RecipeCandidate = {
  id: string | null;
  title: string;
  description: string;
  source: string;
  cookTime: number;
  servings: number;
  score: number;
  coverage: number;
  ingredients: RecipeIngredient[];
  missingItems: RecipeIngredient[];
  priorityItems: string[];
  tags: string[];
};

export type MealPlanConsumptionSuggestion = {
  productId: string;
  name: string;
  ingredientName: string;
  quantity: string;
  unit: string | null;
  currentQuantity: string;
  nextQuantity: string;
  confidence: "high" | "estimated";
  reason: string;
};

export type MealPlanInventoryItem = {
  id: string;
  name: string;
  quantityLabel: string;
  quantityValue: number;
  unit: string | null;
  category: string;
  location: string;
  expirationDate: Date | null;
  expirationStatus: ExpirationStatus;
  relativeExpiration: string;
  daysUntilExpiration: number | null;
  scanned: boolean;
  scanSource: string | null;
  shelfLifeDays: number | null;
  priorityScore: number;
};

export type MealPlanDay = {
  id: string;
  date: Date;
  dateLabel: string;
  title: string;
  description: string;
  source: string;
  recipeId: string | null;
  cookTime: number;
  servings: number;
  score: number;
  inventoryCoverage: number;
  priorityItems: string[];
  missingItems: RecipeIngredient[];
  consumptionSuggestions: MealPlanConsumptionSuggestion[];
  tags: string[];
};

export type ShoppingOptimizerItem = {
  key: string;
  name: string;
  quantity: string;
  unit: string | null;
  priority: "high" | "normal" | "optional";
  alreadyOnList: boolean;
  sourceMeals: string[];
  sourceRecipeIds: string[];
  reason: string;
};

export type MealPlanningData = {
  household: UserHousehold | null;
  savedPlan: SavedMealPlan | null;
  controls: {
    inventoryOnly: boolean;
    excludedMealTitles: string[];
  };
  planDays: MealPlanDay[];
  shoppingSuggestions: ShoppingOptimizerItem[];
  expiringItems: MealPlanInventoryItem[];
  expiredItems: MealPlanInventoryItem[];
  lowStockItems: MealPlanInventoryItem[];
  scanner: {
    importedProductCount: number;
    shelfLifeKnownCount: number;
    recentImportCount: number;
    recentReceiptCount: number;
    recentActivity: string[];
  };
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

export type SavedMealPlanItem = {
  id: string;
  date: Date;
  dateLabel: string;
  title: string;
  description: string | null;
  status: "planned" | "cooked" | "skipped";
  recipeId: string | null;
  cookTime: number | null;
  servings: number | null;
  score: number | null;
  priorityItems: string[];
  missingItems: RecipeIngredient[];
  consumptionSuggestions: MealPlanConsumptionSuggestion[];
  cookedAt: Date | null;
  skippedAt: Date | null;
};

export type SavedMealPlan = {
  id: string;
  name: string;
  status: string;
  startDate: Date;
  endDate: Date;
  createdAt: Date;
  updatedAt: Date;
  items: SavedMealPlanItem[];
  stats: {
    totalMeals: number;
    cookedMeals: number;
    skippedMeals: number;
    plannedMeals: number;
  };
};

function clampPlanDays(days?: number) {
  if (!days || !Number.isFinite(days)) return DEFAULT_PLAN_DAYS;
  return Math.max(1, Math.min(MAX_PLAN_DAYS, Math.round(days)));
}

function normalizeName(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isPantryStaple(name: string) {
  const normalized = normalizeName(name);
  return PANTRY_STAPLES.has(normalized);
}

function toOptionalString(value: unknown) {
  if (value == null) return undefined;
  const text = String(value).trim();
  return text ? text : undefined;
}

function toNumber(value: unknown) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function toNullableNumber(value: unknown) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function formatDecimal(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(2).replace(/\.?0+$/, "");
}

function parseIngredientQuantity(value?: string) {
  if (!value) return null;
  const normalized = value.trim().toLowerCase().replace(",", ".");
  const mixedFraction = normalized.match(/^(\d+)\s+(\d+)\/(\d+)$/);
  if (mixedFraction) {
    const whole = Number(mixedFraction[1]);
    const numerator = Number(mixedFraction[2]);
    const denominator = Number(mixedFraction[3]);
    if (denominator > 0) return whole + numerator / denominator;
  }

  const fraction = normalized.match(/^(\d+)\/(\d+)$/);
  if (fraction) {
    const numerator = Number(fraction[1]);
    const denominator = Number(fraction[2]);
    if (denominator > 0) return numerator / denominator;
  }

  const decimal = normalized.match(/\d+(\.\d+)?/);
  if (!decimal) return null;

  const parsed = Number(decimal[0]);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function normalizeUnit(unit?: string | null) {
  if (!unit) return null;
  const normalized = unit.toLowerCase().trim();
  const aliases: Record<string, string> = {
    gram: "g",
    grams: "g",
    g: "g",
    kilogram: "kg",
    kilograms: "kg",
    kg: "kg",
    milliliter: "ml",
    milliliters: "ml",
    ml: "ml",
    liter: "l",
    liters: "l",
    l: "l",
    teaspoon: "tsp",
    teaspoons: "tsp",
    tsp: "tsp",
    tablespoon: "tbsp",
    tablespoons: "tbsp",
    tbsp: "tbsp",
    ounce: "oz",
    ounces: "oz",
    oz: "oz",
    pound: "lb",
    pounds: "lb",
    lb: "lb",
    cup: "cup",
    cups: "cup",
    can: "can",
    cans: "can",
    pack: "pack",
    packs: "pack",
    package: "pack",
    packages: "pack",
    piece: "item",
    pieces: "item",
    item: "item",
    items: "item",
    pc: "item",
    pcs: "item",
    ct: "item",
  };

  return aliases[normalized] ?? normalized;
}

function unitsAreCompatible(inventoryUnit?: string | null, ingredientUnit?: string) {
  const normalizedInventoryUnit = normalizeUnit(inventoryUnit);
  const normalizedIngredientUnit = normalizeUnit(ingredientUnit);
  if (!normalizedInventoryUnit || !normalizedIngredientUnit) return true;
  return normalizedInventoryUnit === normalizedIngredientUnit;
}

function daysUntil(value: unknown) {
  const date = toDate(value);
  if (!date) return null;

  const target = startOfDay(date).getTime();
  const today = startOfDay().getTime();
  return Math.round((target - today) / MS_PER_DAY);
}

function getPriorityScore(status: ExpirationStatus, daysUntilExpiration: number | null, scanned: boolean) {
  if (status === "expired") return 0;
  if (status === "expiring") {
    const dayPenalty = Math.max(daysUntilExpiration ?? 7, 0) * 7;
    return Math.max(55, 100 - dayPenalty + (scanned ? 5 : 0));
  }

  if (daysUntilExpiration == null) return scanned ? 25 : 20;
  return Math.max(15, 45 - Math.min(daysUntilExpiration, 30));
}

function parseIngredients(input: unknown): RecipeIngredient[] {
  const raw = parseJsonValue<unknown[]>(input, []);

  return raw
    .map((item): RecipeIngredient | null => {
      if (typeof item === "string") {
        return { name: item };
      }

      if (!item || typeof item !== "object") {
        return null;
      }

      const record = item as Record<string, unknown>;
      const name = toOptionalString(record.name);
      if (!name) return null;

      const ingredient: RecipeIngredient = {
        name,
      };
      const quantity = toOptionalString(record.quantity);
      const unit = toOptionalString(record.unit);
      const notes = toOptionalString(record.notes);

      if (quantity) ingredient.quantity = quantity;
      if (unit) ingredient.unit = unit;
      if (notes) ingredient.notes = notes;
      if (record.isOptional ?? record.is_optional) ingredient.isOptional = true;
      if (record.isExpiring ?? record.is_expiring) ingredient.isExpiring = true;

      return ingredient;
    })
    .filter((item): item is RecipeIngredient => Boolean(item));
}

function formatPlanDate(date: Date) {
  return new Intl.DateTimeFormat("en", {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(date);
}

function getInventorySnapshot(items: MealPlanInventoryItem[]): RecipeInventoryItem[] {
  return items.map((item) => ({
    id: item.id,
    name: item.name,
    quantity: String(item.quantityValue || ""),
    unit: item.unit,
    expirationDate: item.expirationDate,
    status: item.expirationStatus,
  }));
}

function buildConsumptionSuggestions(
  ingredients: RecipeIngredient[],
  inventory: MealPlanInventoryItem[]
): MealPlanConsumptionSuggestion[] {
  const inventorySnapshot = getInventorySnapshot(inventory);
  const { annotated, matched } = matchIngredientsToInventory(ingredients, inventorySnapshot);
  const inventoryById = new Map(inventory.map((item) => [item.id, item]));
  const suggestions = new Map<string, MealPlanConsumptionSuggestion>();

  annotated.forEach((ingredient) => {
    const match = matched.get(ingredient.name);
    if (!match) return;

    const inventoryItem = inventoryById.get(match.id);
    if (!inventoryItem || inventoryItem.expirationStatus === "expired" || inventoryItem.quantityValue <= 0) {
      return;
    }

    const parsedQuantity = parseIngredientQuantity(ingredient.quantity);
    const compatibleUnits = unitsAreCompatible(inventoryItem.unit, ingredient.unit);
    if (parsedQuantity && !compatibleUnits) return;

    const estimatedQuantity = Math.min(1, inventoryItem.quantityValue);
    const requestedQuantity = parsedQuantity ?? estimatedQuantity;
    const existing = suggestions.get(inventoryItem.id);
    const existingQuantity = existing ? Number(existing.quantity) : 0;
    const quantity = Math.min(inventoryItem.quantityValue, existingQuantity + requestedQuantity);
    if (!Number.isFinite(quantity) || quantity <= 0) return;

    const confidence: MealPlanConsumptionSuggestion["confidence"] =
      parsedQuantity && compatibleUnits ? "high" : "estimated";
    const nextQuantity = Math.max(0, inventoryItem.quantityValue - quantity);
    const reason =
      inventoryItem.expirationStatus === "expiring"
        ? `${inventoryItem.name} is in the expiration queue`
        : `Matched to ${ingredient.name}`;

    suggestions.set(inventoryItem.id, {
      productId: inventoryItem.id,
      name: inventoryItem.name,
      ingredientName: ingredient.name,
      quantity: formatDecimal(quantity),
      unit: inventoryItem.unit,
      currentQuantity: formatDecimal(inventoryItem.quantityValue),
      nextQuantity: formatDecimal(nextQuantity),
      confidence,
      reason,
    });
  });

  return Array.from(suggestions.values())
    .sort((a, b) => {
      const aInventory = inventoryById.get(a.productId);
      const bInventory = inventoryById.get(b.productId);
      return (bInventory?.priorityScore ?? 0) - (aInventory?.priorityScore ?? 0);
    })
    .slice(0, 8);
}

async function getMealPlanningInventory(userId: string): Promise<MealPlanInventoryItem[]> {
  const rows = await db
    .select({
      id: schema.products.id,
      name: schema.products.name,
      quantity: schema.products.quantity,
      unit: schema.products.unit,
      expirationDate: schema.products.expiration_date,
      location: schema.products.storage_location,
      attributes: schema.products.attributes,
      categoryName: schema.categories.name,
    })
    .from(schema.products)
    .leftJoin(schema.categories, eq(schema.products.category_id, schema.categories.id))
    .where(eq(schema.products.user_id, userId))
    .orderBy(asc(schema.products.expiration_date), asc(schema.products.name))
    .limit(200);

  return rows.map((row) => {
    const attributes = parseJsonValue<ProductAttributes>(row.attributes, {});
    const scanSource = attributes.scan?.source ?? null;
    const expirationStatus = getExpirationStatus(row.expirationDate);
    const expirationDistance = daysUntil(row.expirationDate);
    const scanned = Boolean(scanSource);

    return {
      id: row.id,
      name: row.name,
      quantityLabel: formatQuantity(row.quantity, row.unit),
      quantityValue: toNumber(row.quantity),
      unit: row.unit ?? null,
      category: row.categoryName ?? "Uncategorized",
      location: row.location ?? "pantry",
      expirationDate: toDate(row.expirationDate),
      expirationStatus,
      relativeExpiration: formatRelativeExpiration(row.expirationDate),
      daysUntilExpiration: expirationDistance,
      scanned,
      scanSource,
      shelfLifeDays: toNullableNumber(attributes.scan?.shelfLifeDays),
      priorityScore: getPriorityScore(expirationStatus, expirationDistance, scanned),
    };
  });
}

async function getMealPlanningRecipes(userId: string, household: UserHousehold | null) {
  const ownershipCondition = household
    ? or(eq(schema.recipes.household_id, household.id), eq(schema.recipes.created_by, userId))
    : eq(schema.recipes.created_by, userId);

  const rows = await db
    .select({
      id: schema.recipes.id,
      title: schema.recipes.title,
      description: schema.recipes.description,
      cookTime: schema.recipes.cook_time,
      servings: schema.recipes.servings,
      difficulty: schema.recipes.difficulty,
      ingredients: schema.recipes.ingredients,
      missingIngredients: schema.recipes.missing_ingredients,
      tags: schema.recipes.tags,
      score: schema.recipes.score,
      metadata: schema.recipes.metadata,
      savedId: schema.saved_recipes.id,
      updatedAt: schema.recipes.updated_at,
    })
    .from(schema.recipes)
    .leftJoin(
      schema.saved_recipes,
      and(eq(schema.saved_recipes.recipe_id, schema.recipes.id), eq(schema.saved_recipes.user_id, userId))
    )
    .where(ownershipCondition)
    .orderBy(desc(schema.saved_recipes.created_at), desc(schema.recipes.updated_at))
    .limit(30);

  return rows.map((row) => {
    const metadata = parseJsonValue<Record<string, unknown>>(row.metadata, {});
    return {
      id: row.id,
      title: row.title,
      description: row.description ?? "A pantry-friendly meal built around current household inventory.",
      cookTime: row.cookTime ?? 25,
      servings: row.servings ?? 2,
      difficulty: row.difficulty ?? "easy",
      ingredients: parseIngredients(row.ingredients),
      storedMissingIngredients: parseIngredients(row.missingIngredients),
      tags: parseJsonValue<string[]>(row.tags, []),
      score: row.score != null ? Number(row.score) : null,
      source: String(metadata.source ?? (row.savedId ? "saved_recipe" : "recipe")),
      isSaved: Boolean(row.savedId),
      updatedAt: row.updatedAt,
    };
  });
}

async function getShoppingSnapshot(household: UserHousehold | null) {
  if (!household) {
    return {
      list: null,
      items: [],
    };
  }

  const lists = await db
    .select({
      id: schema.shopping_lists.id,
      name: schema.shopping_lists.name,
      updatedAt: schema.shopping_lists.updated_at,
    })
    .from(schema.shopping_lists)
    .where(eq(schema.shopping_lists.household_id, household.id))
    .orderBy(desc(schema.shopping_lists.updated_at))
    .limit(1);

  const list = lists[0] ?? null;
  if (!list) {
    return {
      list: null,
      items: [],
    };
  }

  const items = await db
    .select({
      id: schema.shopping_list_items.id,
      name: schema.shopping_list_items.name,
      quantity: schema.shopping_list_items.quantity,
      unit: schema.shopping_list_items.unit,
      checked: schema.shopping_list_items.checked,
    })
    .from(schema.shopping_list_items)
    .where(eq(schema.shopping_list_items.shopping_list_id, list.id));

  return {
    list,
    items: items.map((item) => ({
      id: item.id,
      name: item.name,
      quantity: String(item.quantity ?? "1"),
      unit: item.unit ?? null,
      checked: Boolean(item.checked),
    })),
  };
}

async function getScannerSignals(userId: string, inventory: MealPlanInventoryItem[]) {
  const [importRows, receiptRows, historyRows] = await Promise.all([
    db
      .select({
        source: schema.scan_import_batches.source,
        importedCount: schema.scan_import_batches.imported_count,
        status: schema.scan_import_batches.status,
        createdAt: schema.scan_import_batches.created_at,
      })
      .from(schema.scan_import_batches)
      .where(eq(schema.scan_import_batches.user_id, userId))
      .orderBy(desc(schema.scan_import_batches.created_at))
      .limit(6),
    db
      .select({
        status: schema.scanned_receipts.status,
        processedAt: schema.scanned_receipts.processed_at,
      })
      .from(schema.scanned_receipts)
      .where(eq(schema.scanned_receipts.user_id, userId))
      .orderBy(desc(schema.scanned_receipts.processed_at))
      .limit(6),
    db
      .select({
        type: schema.scan_history.type,
        status: schema.scan_history.status,
        createdAt: schema.scan_history.created_at,
      })
      .from(schema.scan_history)
      .where(eq(schema.scan_history.user_id, userId))
      .orderBy(desc(schema.scan_history.created_at))
      .limit(4),
  ]);

  const recentActivity = historyRows.map((item) => {
    const label = item.type.replace(/_/g, " ");
    return `${label} ${item.status} on ${formatDate(item.createdAt)}`;
  });

  return {
    importedProductCount: inventory.filter((item) => item.scanned).length,
    shelfLifeKnownCount: inventory.filter((item) => item.shelfLifeDays != null).length,
    recentImportCount: importRows.filter((item) => item.status === "active").length,
    recentReceiptCount: receiptRows.length,
    recentActivity,
  };
}

function buildRecipeCandidates(
  recipes: Awaited<ReturnType<typeof getMealPlanningRecipes>>,
  usableInventory: MealPlanInventoryItem[],
  options: { inventoryOnly: boolean; excludedMealTitles: string[] }
): RecipeCandidate[] {
  const inventorySnapshot = getInventorySnapshot(usableInventory);
  const excludedTitles = new Set(options.excludedMealTitles.map(normalizeName));

  return recipes
    .filter((recipe) => recipe.ingredients.length > 0)
    .map((recipe) => {
      const computed = computeMissingIngredients(recipe.ingredients, inventorySnapshot);
      const missingByName = new Map<string, RecipeIngredient>();

      computed.missing.forEach((item) => missingByName.set(normalizeName(item.name), item));
      recipe.storedMissingIngredients.forEach((item) => {
        const key = normalizeName(item.name);
        if (!missingByName.has(key)) missingByName.set(key, item);
      });

      const missingItems = Array.from(missingByName.values());
      const expiringIngredients = computed.annotated
        .filter((ingredient) => ingredient.isExpiring)
        .map((ingredient) => ingredient.name);
      const coverage =
        recipe.ingredients.length === 0
          ? 0
          : (recipe.ingredients.length - computed.missing.length) / recipe.ingredients.length;
      const savedBonus = recipe.isSaved ? 10 : 0;
      const storedScore = recipe.score != null ? Math.min(recipe.score / 3, 25) : 0;
      const score = Math.round(
        coverage * 55 + expiringIngredients.length * 14 + savedBonus + storedScore - missingItems.length * 6
      );

      return {
        id: recipe.id,
        title: recipe.title,
        description: recipe.description,
        source: recipe.source,
        cookTime: recipe.cookTime,
        servings: recipe.servings,
        score: Math.max(0, Math.min(100, score)),
        coverage,
        ingredients: recipe.ingredients,
        missingItems,
        priorityItems: expiringIngredients.slice(0, 4),
        tags: recipe.tags,
      };
    })
    .filter((candidate) => !excludedTitles.has(normalizeName(candidate.title)))
    .filter((candidate) => (options.inventoryOnly ? candidate.missingItems.length === 0 : true))
    .sort((a, b) => b.score - a.score);
}

function buildFallbackCandidate(
  primary: MealPlanInventoryItem,
  index: number,
  usableInventory: MealPlanInventoryItem[],
  inventoryOnly: boolean
): RecipeCandidate {
  const templates = [
    {
      title: `Use-up ${primary.name} skillet`,
      description: `A flexible skillet meal that puts ${primary.name} first and uses supporting pantry items around it.`,
      support: ["eggs", "onion", "rice"],
      tags: ["use-up", "quick"],
    },
    {
      title: `${primary.name} clean-out bowl`,
      description: `A simple bowl for combining ${primary.name} with grains, crisp vegetables, and a bright dressing.`,
      support: ["rice", "lemon", "greens"],
      tags: ["bowl", "low-waste"],
    },
    {
      title: `${primary.name} soup base`,
      description: `A warm batch meal that stretches ${primary.name} with broth and shelf-stable staples.`,
      support: ["broth", "beans", "onion"],
      tags: ["batch", "freezer"],
    },
  ];

  const template = templates[index % templates.length];
  const inventorySupport = usableInventory
    .filter((item) => item.id !== primary.id && item.expirationStatus !== "expired")
    .slice(0, 3)
    .map((item) => item.name);
  const ingredientNames = inventoryOnly
    ? [primary.name, ...inventorySupport]
    : [primary.name, ...template.support];
  const ingredients = ingredientNames.map((name) => ({ name }));
  const computed = computeMissingIngredients(ingredients, getInventorySnapshot(usableInventory));

  return {
    id: null,
    title: template.title,
    description: template.description,
    source: "inventory_use_up",
    cookTime: index % 2 === 0 ? 25 : 35,
    servings: 2,
    score: Math.max(55, primary.priorityScore),
    coverage: (ingredients.length - computed.missing.length) / ingredients.length,
    ingredients,
    missingItems: computed.missing,
    priorityItems: [primary.name],
    tags: template.tags,
  };
}

function buildPlanDays(
  recipes: Awaited<ReturnType<typeof getMealPlanningRecipes>>,
  inventory: MealPlanInventoryItem[],
  days: number,
  options: { inventoryOnly: boolean; excludedMealTitles: string[] }
): MealPlanDay[] {
  const usableInventory = inventory.filter((item) => item.expirationStatus !== "expired");
  const expiringItems = usableInventory
    .filter((item) => item.expirationStatus === "expiring")
    .sort((a, b) => b.priorityScore - a.priorityScore);
  const fallbackItems = [...expiringItems, ...usableInventory].filter(
    (item, index, list) => list.findIndex((candidate) => candidate.id === item.id) === index
  );

  const candidates = buildRecipeCandidates(recipes, usableInventory, options);
  let fallbackIndex = 0;

  while (candidates.length < days && fallbackIndex < fallbackItems.length) {
    const fallback = buildFallbackCandidate(
      fallbackItems[fallbackIndex],
      fallbackIndex,
      usableInventory,
      options.inventoryOnly
    );
    if (!options.excludedMealTitles.map(normalizeName).includes(normalizeName(fallback.title))) {
      candidates.push(fallback);
    }
    fallbackIndex += 1;
  }

  return candidates.slice(0, days).map((candidate, index) => {
    const date = addDays(startOfDay(), index);
    const consumptionSuggestions = buildConsumptionSuggestions(candidate.ingredients, usableInventory);
    return {
      id: `${candidate.id ?? "fallback"}-${index}`,
      date,
      dateLabel: formatPlanDate(date),
      title: candidate.title,
      description: candidate.description,
      source: candidate.source,
      recipeId: candidate.id,
      cookTime: candidate.cookTime,
      servings: candidate.servings,
      score: candidate.score,
      inventoryCoverage: Math.round(candidate.coverage * 100),
      priorityItems: candidate.priorityItems,
      missingItems: candidate.missingItems.filter((item) => !isPantryStaple(item.name)),
      consumptionSuggestions,
      tags: candidate.tags,
    };
  });
}

function mergeQuantity(current: string, next: string | undefined, currentUnit: string | null, nextUnit?: string) {
  if (!next) return current;
  if (currentUnit !== (nextUnit ?? null)) return current;

  const currentNumber = Number(current);
  const nextNumber = Number(next);
  if (!Number.isFinite(currentNumber) || !Number.isFinite(nextNumber)) return current;

  const total = currentNumber + nextNumber;
  return Number.isInteger(total) ? String(total) : total.toFixed(2).replace(/\.?0+$/, "");
}

function buildShoppingSuggestions(
  planDays: MealPlanDay[],
  shoppingItems: Array<{ name: string; checked: boolean }>
): ShoppingOptimizerItem[] {
  const existingShoppingNames = new Set(shoppingItems.map((item) => normalizeName(item.name)));
  const drafts = new Map<
    string,
    Omit<ShoppingOptimizerItem, "sourceMeals" | "reason"> & { sourceMeals: Set<string> }
  >();

  planDays.forEach((day) => {
    day.missingItems.forEach((item) => {
      const key = normalizeName(item.name);
      if (!key || isPantryStaple(item.name)) return;

      const existing = drafts.get(key);
      if (existing) {
        existing.quantity = mergeQuantity(existing.quantity, item.quantity, existing.unit, item.unit);
        existing.sourceMeals.add(day.title);
        if (day.recipeId) existing.sourceRecipeIds.push(day.recipeId);
        if (existing.sourceMeals.size > 1) existing.priority = "high";
        return;
      }

      drafts.set(key, {
        key,
        name: item.name,
        quantity: item.quantity ?? "1",
        unit: item.unit ?? null,
        priority: item.isOptional ? "optional" : day.priorityItems.length > 0 ? "high" : "normal",
        alreadyOnList: existingShoppingNames.has(key),
        sourceMeals: new Set([day.title]),
        sourceRecipeIds: day.recipeId ? [day.recipeId] : [],
      });
    });
  });

  const priorityRank = { high: 0, normal: 1, optional: 2 };

  return Array.from(drafts.values())
    .map((item) => {
      const sourceMeals = Array.from(item.sourceMeals);
      return {
        ...item,
        sourceMeals,
        sourceRecipeIds: Array.from(new Set(item.sourceRecipeIds)),
        reason:
          sourceMeals.length > 1
            ? `Covers ${sourceMeals.length} planned meals`
            : `Completes ${sourceMeals[0]}`,
      };
    })
    .sort((a, b) => {
      if (a.alreadyOnList !== b.alreadyOnList) return a.alreadyOnList ? 1 : -1;
      return priorityRank[a.priority] - priorityRank[b.priority] || a.name.localeCompare(b.name);
    });
}

function parseConsumptionSuggestions(input: unknown): MealPlanConsumptionSuggestion[] {
  return parseJsonValue<MealPlanConsumptionSuggestion[]>(input, []).filter((item) => {
    return Boolean(item?.productId && item?.name && item?.quantity);
  });
}

function parseSavedMealStatus(value: string): SavedMealPlanItem["status"] {
  if (value === "cooked" || value === "skipped") return value;
  return "planned";
}

async function getActiveSavedMealPlan(household: UserHousehold | null): Promise<SavedMealPlan | null> {
  if (!household) return null;

  const plans = await db
    .select({
      id: schema.meal_plans.id,
      name: schema.meal_plans.name,
      status: schema.meal_plans.status,
      startDate: schema.meal_plans.start_date,
      endDate: schema.meal_plans.end_date,
      createdAt: schema.meal_plans.created_at,
      updatedAt: schema.meal_plans.updated_at,
    })
    .from(schema.meal_plans)
    .where(and(eq(schema.meal_plans.household_id, household.id), eq(schema.meal_plans.status, "active")))
    .orderBy(desc(schema.meal_plans.updated_at))
    .limit(1);

  const plan = plans[0] ?? null;
  if (!plan) return null;

  const itemRows = await db
    .select({
      id: schema.meal_plan_items.id,
      recipeId: schema.meal_plan_items.recipe_id,
      date: schema.meal_plan_items.meal_date,
      title: schema.meal_plan_items.title,
      description: schema.meal_plan_items.description,
      status: schema.meal_plan_items.status,
      cookTime: schema.meal_plan_items.cook_time,
      servings: schema.meal_plan_items.servings,
      score: schema.meal_plan_items.score,
      priorityItems: schema.meal_plan_items.priority_items,
      missingItems: schema.meal_plan_items.missing_items,
      consumptionSuggestions: schema.meal_plan_items.consumption_suggestions,
      cookedAt: schema.meal_plan_items.cooked_at,
      skippedAt: schema.meal_plan_items.skipped_at,
    })
    .from(schema.meal_plan_items)
    .where(eq(schema.meal_plan_items.meal_plan_id, plan.id))
    .orderBy(asc(schema.meal_plan_items.meal_date));

  const items = itemRows.map((item) => ({
    id: item.id,
    date: item.date,
    dateLabel: formatPlanDate(item.date),
    title: item.title,
    description: item.description ?? null,
    status: parseSavedMealStatus(item.status),
    recipeId: item.recipeId ?? null,
    cookTime: item.cookTime ?? null,
    servings: item.servings ?? null,
    score: item.score != null ? Number(item.score) : null,
    priorityItems: parseJsonValue<string[]>(item.priorityItems, []),
    missingItems: parseIngredients(item.missingItems),
    consumptionSuggestions: parseConsumptionSuggestions(item.consumptionSuggestions),
    cookedAt: item.cookedAt ?? null,
    skippedAt: item.skippedAt ?? null,
  }));

  const cookedMeals = items.filter((item) => item.status === "cooked").length;
  const skippedMeals = items.filter((item) => item.status === "skipped").length;

  return {
    id: plan.id,
    name: plan.name,
    status: plan.status,
    startDate: plan.startDate,
    endDate: plan.endDate,
    createdAt: plan.createdAt,
    updatedAt: plan.updatedAt,
    items,
    stats: {
      totalMeals: items.length,
      cookedMeals,
      skippedMeals,
      plannedMeals: Math.max(0, items.length - cookedMeals - skippedMeals),
    },
  };
}

export async function getMealPlanningPageData(
  userId: string,
  options: { days?: number; inventoryOnly?: boolean; excludedMealTitles?: string[] } = {}
): Promise<MealPlanningData> {
  const days = clampPlanDays(options.days);
  const inventoryOnly = Boolean(options.inventoryOnly);
  const excludedMealTitles = options.excludedMealTitles ?? [];
  const household = await getPrimaryHouseholdForUser(userId);

  const [inventory, recipes, shopping, savedPlan] = await Promise.all([
    getMealPlanningInventory(userId),
    getMealPlanningRecipes(userId, household),
    getShoppingSnapshot(household),
    getActiveSavedMealPlan(household),
  ]);
  const scanner = await getScannerSignals(userId, inventory);

  const planDays = buildPlanDays(recipes, inventory, days, { inventoryOnly, excludedMealTitles });
  const shoppingSuggestions = buildShoppingSuggestions(planDays, shopping.items);
  const expiringItems = inventory
    .filter((item) => item.expirationStatus === "expiring")
    .sort((a, b) => b.priorityScore - a.priorityScore)
    .slice(0, 8);
  const expiredItems = inventory
    .filter((item) => item.expirationStatus === "expired")
    .sort((a, b) => (a.daysUntilExpiration ?? 0) - (b.daysUntilExpiration ?? 0))
    .slice(0, 6);
  const lowStockItems = inventory
    .filter((item) => item.expirationStatus !== "expired" && item.quantityValue > 0 && item.quantityValue <= 1)
    .sort((a, b) => a.quantityValue - b.quantityValue)
    .slice(0, 5);
  const usedExpiringNames = new Set(planDays.flatMap((day) => day.priorityItems.map(normalizeName)));

  return {
    household,
    savedPlan,
    controls: {
      inventoryOnly,
      excludedMealTitles,
    },
    planDays,
    shoppingSuggestions,
    expiringItems,
    expiredItems,
    lowStockItems,
    scanner,
    shoppingList: shopping.list
      ? {
          id: shopping.list.id,
          name: shopping.list.name,
          itemCount: shopping.items.length,
          uncheckedCount: shopping.items.filter((item) => !item.checked).length,
        }
      : null,
    stats: {
      plannedMeals: planDays.length,
      expiringUsed: expiringItems.filter((item) => usedExpiringNames.has(normalizeName(item.name))).length,
      addableShoppingItems: shoppingSuggestions.filter((item) => !item.alreadyOnList).length,
      alreadyListedItems: shoppingSuggestions.filter((item) => item.alreadyOnList).length,
    },
  };
}

export async function saveCurrentMealPlanForUser(
  userId: string,
  householdId: string,
  options: { days?: number; inventoryOnly?: boolean; excludedMealTitles?: string[] } = {}
) {
  const data = await getMealPlanningPageData(userId, options);
  if (data.planDays.length === 0) {
    throw new Error("No meal plan recommendations are available to save");
  }

  const startDate = data.planDays[0].date;
  const endDate = data.planDays[data.planDays.length - 1].date;
  const name = `Smart plan ${formatPlanDate(startDate)} - ${formatPlanDate(endDate)}`;

  return db.transaction(async (tx) => {
    await tx
      .update(schema.meal_plans)
      .set({
        status: "archived",
        updated_at: new Date(),
      })
      .where(and(eq(schema.meal_plans.household_id, householdId), eq(schema.meal_plans.status, "active")));

    const insertedPlans = await tx
      .insert(schema.meal_plans)
      .values({
        household_id: householdId,
        created_by: userId,
        name,
        status: "active",
        source: "smart_planner",
        start_date: startDate,
        end_date: endDate,
        snapshot: {
          generatedAt: new Date().toISOString(),
          scanner: data.scanner,
          shoppingSuggestions: data.shoppingSuggestions,
          expiringItems: data.expiringItems.map((item) => ({
            id: item.id,
            name: item.name,
            relativeExpiration: item.relativeExpiration,
          })),
        },
        stats: data.stats,
      })
      .returning({ id: schema.meal_plans.id });

    const plan = insertedPlans[0];
    if (!plan) throw new Error("Unable to save meal plan");

    await tx.insert(schema.meal_plan_items).values(
      data.planDays.map((day) => ({
        meal_plan_id: plan.id,
        recipe_id: day.recipeId,
        meal_date: day.date,
        slot: "dinner",
        title: day.title,
        description: day.description,
        status: "planned",
        cook_time: day.cookTime,
        servings: day.servings,
        score: String(day.score),
        priority_items: day.priorityItems,
        missing_items: day.missingItems,
        consumption_suggestions: day.consumptionSuggestions,
        metadata: {
          source: day.source,
          inventoryCoverage: day.inventoryCoverage,
          tags: day.tags,
        },
      }))
    );

    return {
      id: plan.id,
      itemCount: data.planDays.length,
      name,
    };
  });
}

async function getMealPlanItemForHousehold(itemId: string, householdId: string) {
  const rows = await db
    .select({
      id: schema.meal_plan_items.id,
      status: schema.meal_plan_items.status,
      title: schema.meal_plan_items.title,
      consumptionSuggestions: schema.meal_plan_items.consumption_suggestions,
      planId: schema.meal_plans.id,
    })
    .from(schema.meal_plan_items)
    .innerJoin(schema.meal_plans, eq(schema.meal_plan_items.meal_plan_id, schema.meal_plans.id))
    .where(and(eq(schema.meal_plan_items.id, itemId), eq(schema.meal_plans.household_id, householdId)))
    .limit(1);

  return rows[0] ?? null;
}

export async function markMealPlanItemCookedForUser(userId: string, householdId: string, itemId: string) {
  const existing = await getMealPlanItemForHousehold(itemId, householdId);
  if (!existing) throw new Error("Meal plan item was not found");

  if (existing.status === "cooked") {
    return {
      usedCount: 0,
      alreadyCooked: true,
      title: existing.title,
    };
  }
  if (existing.status === "skipped") {
    throw new Error("Skipped meals cannot be marked cooked");
  }

  const suggestions = parseConsumptionSuggestions(existing.consumptionSuggestions);

  return db.transaction(async (tx) => {
    let usedCount = 0;

    for (const suggestion of suggestions) {
      const productRows = await tx
        .select({
          id: schema.products.id,
          name: schema.products.name,
          quantity: schema.products.quantity,
          unit: schema.products.unit,
        })
        .from(schema.products)
        .where(and(eq(schema.products.id, suggestion.productId), eq(schema.products.user_id, userId)))
        .limit(1);

      const product = productRows[0];
      if (!product) continue;

      if (!unitsAreCompatible(product.unit, suggestion.unit ?? undefined)) continue;

      const previousQuantity = toNumber(product.quantity);
      const requestedQuantity = toNumber(suggestion.quantity);
      const usedQuantity = Math.min(previousQuantity, requestedQuantity);
      if (usedQuantity <= 0) continue;

      const nextQuantity = Math.max(0, previousQuantity - usedQuantity);

      await tx
        .update(schema.products)
        .set({
          quantity: formatDecimal(nextQuantity),
          updated_at: new Date(),
        })
        .where(and(eq(schema.products.id, product.id), eq(schema.products.user_id, userId)));

      await tx.insert(schema.meal_plan_inventory_usages).values({
        meal_plan_item_id: itemId,
        product_id: product.id,
        product_name: product.name,
        quantity: formatDecimal(usedQuantity),
        unit: product.unit ?? null,
        previous_quantity: formatDecimal(previousQuantity),
        next_quantity: formatDecimal(nextQuantity),
        metadata: {
          ingredientName: suggestion.ingredientName,
          confidence: suggestion.confidence,
          reason: suggestion.reason,
        },
      });

      usedCount += 1;
    }

    await tx
      .update(schema.meal_plan_items)
      .set({
        status: "cooked",
        cooked_at: new Date(),
        skipped_at: null,
        updated_at: new Date(),
      })
      .where(eq(schema.meal_plan_items.id, itemId));

    return {
      usedCount,
      alreadyCooked: false,
      title: existing.title,
    };
  });
}

export async function skipMealPlanItemForHousehold(householdId: string, itemId: string) {
  const existing = await getMealPlanItemForHousehold(itemId, householdId);
  if (!existing) throw new Error("Meal plan item was not found");
  if (existing.status === "cooked") {
    throw new Error("Cooked meals cannot be skipped");
  }

  await db
    .update(schema.meal_plan_items)
    .set({
      status: "skipped",
      skipped_at: new Date(),
      updated_at: new Date(),
    })
    .where(eq(schema.meal_plan_items.id, itemId));

  return {
    title: existing.title,
  };
}

export async function reopenMealPlanItemForUser(userId: string, householdId: string, itemId: string) {
  const existing = await getMealPlanItemForHousehold(itemId, householdId);
  if (!existing) throw new Error("Meal plan item was not found");

  if (existing.status === "planned") {
    return {
      title: existing.title,
      restoredCount: 0,
      alreadyPlanned: true,
    };
  }

  return db.transaction(async (tx) => {
    let restoredCount = 0;

    if (existing.status === "cooked") {
      const usages = await tx
        .select({
          id: schema.meal_plan_inventory_usages.id,
          productId: schema.meal_plan_inventory_usages.product_id,
          quantity: schema.meal_plan_inventory_usages.quantity,
          unit: schema.meal_plan_inventory_usages.unit,
        })
        .from(schema.meal_plan_inventory_usages)
        .where(eq(schema.meal_plan_inventory_usages.meal_plan_item_id, itemId));

      for (const usage of usages) {
        const productRows = await tx
          .select({
            id: schema.products.id,
            quantity: schema.products.quantity,
            unit: schema.products.unit,
          })
          .from(schema.products)
          .where(and(eq(schema.products.id, usage.productId), eq(schema.products.user_id, userId)))
          .limit(1);

        const product = productRows[0];
        if (!product || !unitsAreCompatible(product.unit, usage.unit ?? undefined)) continue;

        const currentQuantity = toNumber(product.quantity);
        const restoreQuantity = toNumber(usage.quantity);
        if (restoreQuantity <= 0) continue;

        await tx
          .update(schema.products)
          .set({
            quantity: formatDecimal(currentQuantity + restoreQuantity),
            updated_at: new Date(),
          })
          .where(and(eq(schema.products.id, product.id), eq(schema.products.user_id, userId)));

        restoredCount += 1;
      }

      await tx
        .delete(schema.meal_plan_inventory_usages)
        .where(eq(schema.meal_plan_inventory_usages.meal_plan_item_id, itemId));
    }

    await tx
      .update(schema.meal_plan_items)
      .set({
        status: "planned",
        cooked_at: null,
        skipped_at: null,
        updated_at: new Date(),
      })
      .where(eq(schema.meal_plan_items.id, itemId));

    return {
      title: existing.title,
      restoredCount,
      alreadyPlanned: false,
    };
  });
}
