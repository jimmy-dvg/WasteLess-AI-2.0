import { relations } from "drizzle-orm";
import {
  barcode_products,
  categories,
  products,
  profiles,
  recipes,
  saved_recipes,
  scan_import_batches,
  scan_history,
  scanned_receipts,
  users,
} from "./tables";

export const usersRelations = relations(users, ({ one, many }) => ({
  profile: one(profiles, { fields: [users.id], references: [profiles.id] }),
  categories: many(categories),
  products: many(products),
  recipes: many(recipes),
  savedRecipes: many(saved_recipes),
  scanHistory: many(scan_history),
  scannedReceipts: many(scanned_receipts),
  scanImportBatches: many(scan_import_batches),
}));

export const profilesRelations = relations(profiles, ({ one }) => ({
  user: one(users, { fields: [profiles.id], references: [users.id] }),
}));

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  user: one(users, { fields: [categories.user_id], references: [users.id] }),
  products: many(products),
}));

export const productsRelations = relations(products, ({ one }) => ({
  user: one(users, { fields: [products.user_id], references: [users.id] }),
  category: one(categories, { fields: [products.category_id], references: [categories.id] }),
}));

export const recipesRelations = relations(recipes, ({ one, many }) => ({
  creator: one(users, { fields: [recipes.created_by], references: [users.id] }),
  savedBy: many(saved_recipes),
}));

export const savedRecipesRelations = relations(saved_recipes, ({ one }) => ({
  recipe: one(recipes, { fields: [saved_recipes.recipe_id], references: [recipes.id] }),
  user: one(users, { fields: [saved_recipes.user_id], references: [users.id] }),
}));

export const scanHistoryRelations = relations(scan_history, ({ one }) => ({
  user: one(users, { fields: [scan_history.user_id], references: [users.id] }),
}));

export const scannedReceiptsRelations = relations(scanned_receipts, ({ one }) => ({
  user: one(users, { fields: [scanned_receipts.user_id], references: [users.id] }),
}));

export const barcodeProductsRelations = relations(barcode_products, () => ({}));

export const scanImportBatchesRelations = relations(scan_import_batches, ({ one }) => ({
  user: one(users, { fields: [scan_import_batches.user_id], references: [users.id] }),
}));
