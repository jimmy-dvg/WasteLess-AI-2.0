import { db } from "./db";
import * as schema from "../schema/tables";
import { deterministicId, productDefinitions, getAllProducts } from "./helpers";

export const SEED_CATEGORIES = [
  { id: deterministicId("category:dairy"), name: "Dairy" },
  { id: deterministicId("category:produce"), name: "Produce" },
  { id: deterministicId("category:meat"), name: "Meat & Protein" },
  { id: deterministicId("category:pantry"), name: "Pantry" },
  { id: deterministicId("category:frozen"), name: "Frozen" },
  { id: deterministicId("category:beverages"), name: "Beverages" },
];

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
    // Determine category based on product definition
    let categoryId: string;
    if (productDefinitions.dairy.some((p) => p.name === product.name)) {
      categoryId = SEED_CATEGORIES[0].id;
    } else if (productDefinitions.produce.some((p) => p.name === product.name)) {
      categoryId = SEED_CATEGORIES[1].id;
    } else if (productDefinitions.meat.some((p) => p.name === product.name)) {
      categoryId = SEED_CATEGORIES[2].id;
    } else if (productDefinitions.pantry.some((p) => p.name === product.name)) {
      categoryId = SEED_CATEGORIES[3].id;
    } else if (productDefinitions.frozen.some((p) => p.name === product.name)) {
      categoryId = SEED_CATEGORIES[4].id;
    } else {
      categoryId = SEED_CATEGORIES[5].id;
    }

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
        tags: [categoryId.split(":")[1]],
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


