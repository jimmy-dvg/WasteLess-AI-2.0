import { relations } from "drizzle-orm";
import {
  barcode_products,
  categories,
  household_activity_events,
  household_invitations,
  household_members,
  households,
  meal_plan_inventory_usages,
  meal_plan_items,
  meal_plans,
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
  householdMemberships: many(household_members),
  householdInvitationsSent: many(household_invitations),
  householdActivityEvents: many(household_activity_events),
  categories: many(categories),
  products: many(products),
  mealPlans: many(meal_plans),
  recipes: many(recipes),
  savedRecipes: many(saved_recipes),
  scanHistory: many(scan_history),
  scannedReceipts: many(scanned_receipts),
  scanImportBatches: many(scan_import_batches),
}));

export const profilesRelations = relations(profiles, ({ one }) => ({
  user: one(users, { fields: [profiles.id], references: [users.id] }),
}));

export const householdsRelations = relations(households, ({ many }) => ({
  members: many(household_members),
  invitations: many(household_invitations),
  activityEvents: many(household_activity_events),
}));

export const householdMembersRelations = relations(household_members, ({ one }) => ({
  household: one(households, { fields: [household_members.household_id], references: [households.id] }),
  user: one(users, { fields: [household_members.user_id], references: [users.id] }),
}));

export const householdInvitationsRelations = relations(household_invitations, ({ one }) => ({
  household: one(households, { fields: [household_invitations.household_id], references: [households.id] }),
  invitedBy: one(users, { fields: [household_invitations.invited_by], references: [users.id] }),
  acceptedBy: one(users, { fields: [household_invitations.accepted_by], references: [users.id] }),
}));

export const householdActivityEventsRelations = relations(household_activity_events, ({ one }) => ({
  household: one(households, { fields: [household_activity_events.household_id], references: [households.id] }),
  actor: one(users, { fields: [household_activity_events.actor_user_id], references: [users.id] }),
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
  mealPlanItems: many(meal_plan_items),
}));

export const mealPlansRelations = relations(meal_plans, ({ one, many }) => ({
  household: one(households, { fields: [meal_plans.household_id], references: [households.id] }),
  creator: one(users, { fields: [meal_plans.created_by], references: [users.id] }),
  items: many(meal_plan_items),
}));

export const mealPlanItemsRelations = relations(meal_plan_items, ({ one, many }) => ({
  plan: one(meal_plans, { fields: [meal_plan_items.meal_plan_id], references: [meal_plans.id] }),
  recipe: one(recipes, { fields: [meal_plan_items.recipe_id], references: [recipes.id] }),
  inventoryUsages: many(meal_plan_inventory_usages),
}));

export const mealPlanInventoryUsagesRelations = relations(meal_plan_inventory_usages, ({ one }) => ({
  item: one(meal_plan_items, {
    fields: [meal_plan_inventory_usages.meal_plan_item_id],
    references: [meal_plan_items.id],
  }),
  product: one(products, { fields: [meal_plan_inventory_usages.product_id], references: [products.id] }),
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
