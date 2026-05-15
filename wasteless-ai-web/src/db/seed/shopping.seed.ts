import { faker } from "@faker-js/faker";
import { db } from "./db";
import * as schema from "../schema/tables";
import {
  deterministicId,
  generateShoppingListName,
  units,
  getAllProducts,
  randomInt,
  randomElement,
  randomBoolean,
  randomFloat,
} from "./helpers";
import { SEED_HOUSEHOLDS } from "./households.seed";
import { SEED_USERS } from "./users.seed";

export async function seedShoppingLists() {
  console.log("🌱 Seeding shopping lists...");

  const shoppingLists = [];
  const products = getAllProducts();

  // Create 2-3 shopping lists per household
  for (const household of SEED_HOUSEHOLDS) {
    const listsCount = randomInt(2, 3);

    for (let i = 0; i < listsCount; i++) {
      shoppingLists.push({
        id: deterministicId(`shopping_list:${household.id}:${i}`),
        household_id: household.id,
        name: generateShoppingListName(),
        created_by: SEED_USERS[0].id,
        is_template: randomBoolean(0.2),
        due_date: new Date(Date.now() + Math.random() * 7 * 24 * 60 * 60 * 1000),
        meta: JSON.stringify({
          priority: randomElement(["low", "medium", "high"]),
          shared_with: randomInt(0, 2),
        }),
        created_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
        updated_at: new Date(),
      });
    }
  }

  try {
    await db
      .insert(schema.shopping_lists)
      .values(shoppingLists)
      .onConflictDoNothing();
    console.log(`✅ Seeded ${shoppingLists.length} shopping lists`);
  } catch (error) {
    console.error("❌ Error seeding shopping lists:", error);
    throw error;
  }

  // Seed shopping list items
  await seedShoppingListItems(shoppingLists, products);
}

export async function seedShoppingListItems(
  shoppingLists: any[],
  products: any[]
) {
  console.log("🌱 Seeding shopping list items...");

  const shoppingListItems = [];

  for (const list of shoppingLists) {
    // 5-15 items per list
    const itemsCount = randomInt(5, 15);

    for (let i = 0; i < itemsCount; i++) {
      const product = randomElement(products);
      const unit = randomElement(units);

      shoppingListItems.push({
        id: deterministicId(`shopping_list_item:${list.id}:${i}`),
        shopping_list_id: list.id,
        product_id: deterministicId(`product:${product.name}`),
        name: product.name,
        quantity: randomFloat(1, 5, 1),
        unit: unit,
        checked: randomBoolean(0.4),
        created_at: list.created_at,
        updated_at: new Date(),
      });
    }
  }

  try {
    // Insert in batches
    const batchSize = 50;
    for (let i = 0; i < shoppingListItems.length; i += batchSize) {
      const batch = shoppingListItems.slice(i, i + batchSize);
      await db
        .insert(schema.shopping_list_items)
        .values(batch)
        .onConflictDoNothing();
    }
    console.log(`✅ Seeded ${shoppingListItems.length} shopping list items`);
  } catch (error) {
    console.error("❌ Error seeding shopping list items:", error);
    throw error;
  }
}

