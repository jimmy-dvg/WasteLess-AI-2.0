import "server-only";

import { and, eq, isNull, or } from "drizzle-orm";
import { db } from "@/db";
import { ensurePersonalHouseholdForUser, type DashboardUser } from "@/db/queries/households";
import * as schema from "@/db/schema/tables";
import { canEditHouseholdInventory } from "@/features/household/constants";
import { RECOMMENDED_CATEGORIES, normalizeTaxonomyName } from "@/features/categories/constants";
import { suggestProductStorageFallback } from "@/features/categories/services/storage-organizer.service";

type CategoryRow = {
  id: string;
  name: string;
  color: string | null;
};

export type InventoryOrganizationResult = {
  totalProducts: number;
  updatedProducts: number;
  categoryUpdates: number;
  storageUpdates: number;
  createdCategories: number;
};

function mapCategoriesByName(categories: CategoryRow[]) {
  return new Map(categories.map((category) => [normalizeTaxonomyName(category.name), category]));
}

async function getScopedCategories(userId: string, householdId: string) {
  return db
    .select({
      id: schema.categories.id,
      name: schema.categories.name,
      color: schema.categories.color,
    })
    .from(schema.categories)
    .where(or(eq(schema.categories.user_id, userId), eq(schema.categories.household_id, householdId))!);
}

async function ensureRecommendedCategories(userId: string, householdId: string) {
  const existingCategories = await getScopedCategories(userId, householdId);
  const existingByName = mapCategoriesByName(existingCategories);
  let createdCategories = 0;

  for (const category of RECOMMENDED_CATEGORIES) {
    if (existingByName.has(normalizeTaxonomyName(category.name))) continue;

    const created = await db
      .insert(schema.categories)
      .values({
        user_id: userId,
        name: category.name,
        color: category.color,
      })
      .returning({
        id: schema.categories.id,
        name: schema.categories.name,
        color: schema.categories.color,
      });

    if (created[0]) {
      existingCategories.push(created[0]);
      existingByName.set(normalizeTaxonomyName(created[0].name), created[0]);
      createdCategories += 1;
    }
  }

  return {
    categories: existingCategories,
    createdCategories,
  };
}

export async function organizeExistingInventoryForUser(user: DashboardUser): Promise<InventoryOrganizationResult> {
  const household = await ensurePersonalHouseholdForUser(user);
  if (!canEditHouseholdInventory(household.role)) {
    throw new Error("You do not have permission to change this household inventory.");
  }

  const productCondition = or(
    eq(schema.products.household_id, household.id),
    and(isNull(schema.products.household_id), eq(schema.products.user_id, user.id))
  )!;

  const { categories, createdCategories } = await ensureRecommendedCategories(user.id, household.id);
  const categoryByName = mapCategoriesByName(categories);

  const products = await db
    .select({
      id: schema.products.id,
      name: schema.products.name,
      categoryId: schema.products.category_id,
      categoryName: schema.categories.name,
      storageLocation: schema.products.storage_location,
    })
    .from(schema.products)
    .leftJoin(schema.categories, eq(schema.products.category_id, schema.categories.id))
    .where(productCondition);

  let updatedProducts = 0;
  let categoryUpdates = 0;
  let storageUpdates = 0;

  for (const product of products) {
    const suggestion = suggestProductStorageFallback(product.name, product.categoryName);
    const nextCategory = categoryByName.get(normalizeTaxonomyName(suggestion.category));
    if (!nextCategory) continue;

    const categoryChanged = product.categoryId !== nextCategory.id;
    const storageChanged = product.storageLocation !== suggestion.storageZone;

    if (!categoryChanged && !storageChanged) continue;

    await db
      .update(schema.products)
      .set({
        category_id: nextCategory.id,
        storage_location: suggestion.storageZone,
        updated_at: new Date(),
      })
      .where(and(eq(schema.products.id, product.id), productCondition));

    updatedProducts += 1;
    if (categoryChanged) categoryUpdates += 1;
    if (storageChanged) storageUpdates += 1;
  }

  return {
    totalProducts: products.length,
    updatedProducts,
    categoryUpdates,
    storageUpdates,
    createdCategories,
  };
}
