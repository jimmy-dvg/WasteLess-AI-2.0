import { relations } from "drizzle-orm";
import { categories, products, profiles, recipes, saved_recipes, users } from "./tables";

export const usersRelations = relations(users, ({ one, many }) => ({
  profile: one(profiles, { fields: [users.id], references: [profiles.id] }),
  categories: many(categories),
  products: many(products),
  recipes: many(recipes),
  savedRecipes: many(saved_recipes),
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
