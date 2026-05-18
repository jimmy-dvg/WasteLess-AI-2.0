import { relations } from "drizzle-orm";
import { categories, products, profiles, users } from "./tables";

export const usersRelations = relations(users, ({ one, many }) => ({
  profile: one(profiles, { fields: [users.id], references: [profiles.id] }),
  categories: many(categories),
  products: many(products),
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
