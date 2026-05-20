import dotenv from "dotenv";
dotenv.config();

import { db, closeDB } from "./db";
import * as schema from "../schema/tables";

async function resetDatabase() {
  console.log("🧹 Starting database reset...\n");

  const tables = [
    // Order matters: foreign keys must be dropped last
    schema.ai_generation_links,
    schema.ai_generations,
    schema.household_activity_events,
    schema.household_invitations,
    schema.inventory_item_changes,
    schema.waste_logs,
    schema.notifications,
    schema.receipt_items,
    schema.receipts,
    schema.sync_devices,
    schema.recipe_ingredients,
    schema.recipes,
    schema.shopping_list_items,
    schema.shopping_lists,
    schema.inventory_items,
    schema.product_barcodes,
    schema.products,
    schema.categories,
    schema.household_members,
    schema.households,
    schema.profiles,
    schema.users,
  ];

  try {
    for (const table of tables) {
      const tableName = table._.name;
      console.log(`🗑️  Truncating ${tableName}...`);

      // Use raw SQL to truncate with CASCADE
      await db.execute(`TRUNCATE TABLE "${tableName}" CASCADE`);
    }

    console.log("\n✅ Database reset completed successfully!");
    console.log("💡 Tip: Run 'npm run db:seed' to repopulate with seed data.\n");
  } catch (error) {
    console.error("\n❌ Reset failed:", error);
    process.exit(1);
  } finally {
    await closeDB();
  }
}

resetDatabase();
