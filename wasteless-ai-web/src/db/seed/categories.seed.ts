import { db } from "./db";
import * as schema from "../schema/tables";
import { deterministicId, productDefinitions, getAllProducts } from "./helpers";
import { RECOMMENDED_CATEGORIES } from "../../features/categories/constants";

export const SEED_CATEGORIES = RECOMMENDED_CATEGORIES.map((category) => ({
  id: deterministicId(`category:${category.name}`),
  name: category.name,
  color: category.color,
}));

function getSeedCategoryId(name: string) {
  return SEED_CATEGORIES.find((category) => category.name === name)?.id ?? SEED_CATEGORIES[0].id;
}

function categorizeSeedProduct(productName: string) {
  if (productDefinitions.dairy.some((product) => product.name === productName)) return getSeedCategoryId("млечни");
  if (productDefinitions.meat.some((product) => product.name === productName)) return getSeedCategoryId("месо");
  if (productDefinitions.frozen.some((product) => product.name === productName)) return getSeedCategoryId("замразени");
  if (productDefinitions.beverages.some((product) => product.name === productName)) return getSeedCategoryId("напитки");
  if (/canned/i.test(productName)) return getSeedCategoryId("консерви");
  if (/rice|pasta|flour|oats|cereal|bread/i.test(productName)) return getSeedCategoryId("зърнени");
  if (/banana|apple|strawberries|orange/i.test(productName)) return getSeedCategoryId("плодове");
  return getSeedCategoryId("зеленчуци");
}

export async function seedCategories() {
  console.log("🌱 Seeding categories...");

  const categoriesData = SEED_CATEGORIES.map((category) => ({
    ...category,
    household_id: null, // Global categories
    parent_id: null,
    created_at: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
    updated_at: new Date(),
  }));

  try {
    await db.insert(schema.categories).values(categoriesData).onConflictDoNothing();
    console.log(`✅ Seeded ${categoriesData.length} categories`);
  } catch (error) {
    console.error("❌ Error seeding categories:", error);
    throw error;
  }
}

export async function seedProducts() {
  console.log("🌱 Seeding products...");

  const productsData = getAllProducts().map((product) => {
    const categoryId = categorizeSeedProduct(product.name);
    const categoryName = SEED_CATEGORIES.find((category) => category.id === categoryId)?.name ?? "зеленчуци";

    return {
      id: deterministicId(`product:${product.name}`),
      name: product.name,
      brand: product.brand,
      description: `${product.name} - ${product.brand} brand`,
      category_id: categoryId,
      default_unit: product.unit,
      serving_size: product.serving,
      gtin: null,
      attributes: JSON.stringify({
        brand: product.brand,
        unit: product.unit,
        serving_size: product.serving,
        tags: [categoryName],
      }),
      created_at: new Date(Date.now() - Math.random() * 730 * 24 * 60 * 60 * 1000),
      updated_at: new Date(),
    };
  });

  try {
    await db.insert(schema.products).values(productsData).onConflictDoNothing();
    console.log(`✅ Seeded ${productsData.length} products`);
  } catch (error) {
    console.error("❌ Error seeding products:", error);
    throw error;
  }
}


