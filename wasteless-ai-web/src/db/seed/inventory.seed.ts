import { faker } from "@faker-js/faker";
import { db } from "./db";
import * as schema from "../schema/tables";
import {
  deterministicId,
  generateExpirationDate,
  generatePurchaseDate,
  locations,
  units,
  getAllProducts,
  randomInt,
  randomFloat,
  randomBoolean,
  randomElement,
} from "./helpers";
import { SEED_HOUSEHOLDS } from "./households.seed";
import { SEED_USERS } from "./users.seed";
import { getAllProducts as getProductsFromSchema } from "./categories.seed";

export async function seedInventoryItems() {
  console.log("🌱 Seeding inventory items...");

  const allProducts = getAllProducts();
  const inventoryItems = [];

  // Create inventory for each household
  for (let householdIndex = 0; householdIndex < SEED_HOUSEHOLDS.length; householdIndex++) {
    const household = SEED_HOUSEHOLDS[householdIndex];

    // Add 15-25 items per household
    const itemsPerHousehold = randomInt(15, 25);

    for (let i = 0; i < itemsPerHousehold; i++) {
      const product = randomElement(allProducts);
      const expirationDate = generateExpirationDate();
      const purchaseDate = generatePurchaseDate();
      const location = randomElement(locations);
      const unit = randomElement(units);

      inventoryItems.push({
        id: deterministicId(
          `inventory:${household.id}:${product.name}:${i}`
        ),
        household_id: household.id,
        owner_user_id: SEED_USERS[householdIndex % SEED_USERS.length].id,
        product_id: deterministicId(`product:${product.name}`),
        name: product.name,
        barcode_id: null,
        quantity: randomFloat(0.5, 10, 1),
        unit: unit,
        location: location,
        is_open: randomBoolean(0.4),
        purchase_date: purchaseDate,
        expiration_date: expirationDate,
        best_before: new Date(expirationDate.getTime() + 7 * 24 * 60 * 60 * 1000),
        lot_number: Math.random().toString(36).substring(2, 10),
        notes: randomBoolean(0.3) ? "Sample note" : null,
        metadata: JSON.stringify({
          source: "grocery_store",
          price_paid: randomFloat(1, 50, 2),
          quantity_original: randomInt(1, 5),
        }),
        last_seen_at: new Date(Date.now() - Math.random() * 14 * 24 * 60 * 60 * 1000),
        deleted_at: null,
        created_at: purchaseDate,
        updated_at: new Date(),
      });
    }
  }

  try {
    // Insert in batches to avoid overwhelming the database
    const batchSize = 50;
    for (let i = 0; i < inventoryItems.length; i += batchSize) {
      const batch = inventoryItems.slice(i, i + batchSize);
      await db
        .insert(schema.inventory_items)
        .values(batch)
        .onConflictDoNothing();
    }
    console.log(`✅ Seeded ${inventoryItems.length} inventory items`);
  } catch (error) {
    console.error("❌ Error seeding inventory items:", error);
    throw error;
  }
}
