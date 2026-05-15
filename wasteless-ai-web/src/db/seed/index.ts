import dotenv from "dotenv";
dotenv.config();

import { db, closeDB } from "./db";
import { seedUsers } from "./users.seed";
import { seedHouseholds, seedHouseholdMembers } from "./households.seed";
import { seedCategories, seedProducts } from "./categories.seed";
import { seedInventoryItems } from "./inventory.seed";
import { seedShoppingLists } from "./shopping.seed";
import { seedRecipes } from "./recipes.seed";
import { seedNotifications, seedWasteLogs, seedAIGenerations } from "./events.seed";

async function main() {
  console.log("🚀 Starting WasteLessAI database seed...\n");

  try {
    // Core setup: users and households first
    await seedUsers();
    await seedHouseholds();
    await seedHouseholdMembers();

    // Catalog: categories and products
    await seedCategories();
    await seedProducts();

    // Primary features
    await seedInventoryItems();
    await seedShoppingLists();
    await seedRecipes();

    // Analytics and events
    await seedNotifications();
    await seedWasteLogs();
    await seedAIGenerations();

    console.log("\n✨ Database seed completed successfully!");
  } catch (error) {
    console.error("\n❌ Seed failed:", error);
    process.exit(1);
  } finally {
    await closeDB();
  }
}

main();

