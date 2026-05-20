import "server-only";

import { computeMissingIngredients } from "@/ai/services/recipe-matching";
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
  missingItems: RecipeIngredient[];
  priorityItems: string[];
  tags: string[];
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
  usableInventory: MealPlanInventoryItem[]
): RecipeCandidate[] {
  const inventorySnapshot = getInventorySnapshot(usableInventory);

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
        missingItems,
        priorityItems: expiringIngredients.slice(0, 4),
        tags: recipe.tags,
      };
    })
    .sort((a, b) => b.score - a.score);
}

function buildFallbackCandidate(
  primary: MealPlanInventoryItem,
  index: number,
  usableInventory: MealPlanInventoryItem[]
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
  const ingredientNames = [primary.name, ...template.support];
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
    missingItems: computed.missing,
    priorityItems: [primary.name],
    tags: template.tags,
  };
}

function buildPlanDays(
  recipes: Awaited<ReturnType<typeof getMealPlanningRecipes>>,
  inventory: MealPlanInventoryItem[],
  days: number
): MealPlanDay[] {
  const usableInventory = inventory.filter((item) => item.expirationStatus !== "expired");
  const expiringItems = usableInventory
    .filter((item) => item.expirationStatus === "expiring")
    .sort((a, b) => b.priorityScore - a.priorityScore);
  const fallbackItems = [...expiringItems, ...usableInventory].filter(
    (item, index, list) => list.findIndex((candidate) => candidate.id === item.id) === index
  );

  const candidates = buildRecipeCandidates(recipes, usableInventory);
  let fallbackIndex = 0;

  while (candidates.length < days && fallbackIndex < fallbackItems.length) {
    candidates.push(buildFallbackCandidate(fallbackItems[fallbackIndex], fallbackIndex, usableInventory));
    fallbackIndex += 1;
  }

  return candidates.slice(0, days).map((candidate, index) => {
    const date = addDays(startOfDay(), index);
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

export async function getMealPlanningPageData(
  userId: string,
  options: { days?: number } = {}
): Promise<MealPlanningData> {
  const days = clampPlanDays(options.days);
  const household = await getPrimaryHouseholdForUser(userId);

  const [inventory, recipes, shopping] = await Promise.all([
    getMealPlanningInventory(userId),
    getMealPlanningRecipes(userId, household),
    getShoppingSnapshot(household),
  ]);
  const scanner = await getScannerSignals(userId, inventory);

  const planDays = buildPlanDays(recipes, inventory, days);
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
