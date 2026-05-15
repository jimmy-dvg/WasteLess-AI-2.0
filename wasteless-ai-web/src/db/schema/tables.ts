import {
  pgTable,
  uuid,
  text,
  varchar,
  timestamp,
  boolean,
  jsonb,
  integer,
  numeric,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: varchar("email", { length: 320 }).notNull(),
  email_verified_at: timestamp("email_verified_at", { mode: "string" }),
  name: text("name").notNull(),
  avatar_url: text("avatar_url"),
  password_hash: text("password_hash"),
  preferred_locale: varchar("preferred_locale", { length: 10 }).default("en"),
  meta: jsonb("meta").default({}),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

export const households = pgTable("households", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  slug: varchar("slug", { length: 100 }).notNull(),
  timezone: varchar("timezone", { length: 64 }),
  settings: jsonb("settings").default({}),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

export const household_members = pgTable("household_members", {
  id: uuid("id").defaultRandom().primaryKey(),
  household_id: uuid("household_id").notNull(),
  user_id: uuid("user_id").notNull(),
  role: varchar("role", { length: 20 }).notNull().default("member"),
  joined_at: timestamp("joined_at").defaultNow().notNull(),
  last_active_at: timestamp("last_active_at"),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

export const categories = pgTable("categories", {
  id: uuid("id").defaultRandom().primaryKey(),
  household_id: uuid("household_id"),
  name: text("name").notNull(),
  parent_id: uuid("parent_id"),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

export const products = pgTable("products", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  brand: text("brand"),
  description: text("description"),
  category_id: uuid("category_id"),
  default_unit: varchar("default_unit", { length: 32 }),
  serving_size: numeric("serving_size"),
  gtin: varchar("gtin", { length: 64 }),
  attributes: jsonb("attributes").default({}),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

export const product_barcodes = pgTable("product_barcodes", {
  id: uuid("id").defaultRandom().primaryKey(),
  product_id: uuid("product_id").notNull(),
  barcode: varchar("barcode", { length: 128 }).notNull(),
  symbology: varchar("symbology", { length: 32 }),
  metadata: jsonb("metadata").default({}),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

export const inventory_items = pgTable("inventory_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  household_id: uuid("household_id").notNull(),
  owner_user_id: uuid("owner_user_id"),
  product_id: uuid("product_id"),
  name: text("name").notNull(),
  barcode_id: uuid("barcode_id"),
  quantity: numeric("quantity", { precision: 10, scale: 2 }).notNull().default("1"),
  unit: varchar("unit", { length: 32 }),
  location: varchar("location", { length: 32 }).default("pantry"),
  is_open: boolean("is_open").default(false),
  purchase_date: timestamp("purchase_date"),
  expiration_date: timestamp("expiration_date"),
  best_before: timestamp("best_before"),
  lot_number: varchar("lot_number", { length: 128 }),
  notes: text("notes"),
  metadata: jsonb("metadata").default({}),
  last_seen_at: timestamp("last_seen_at"),
  deleted_at: timestamp("deleted_at"),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

export const shopping_lists = pgTable("shopping_lists", {
  id: uuid("id").defaultRandom().primaryKey(),
  household_id: uuid("household_id").notNull(),
  name: text("name").notNull(),
  created_by: uuid("created_by"),
  is_template: boolean("is_template").default(false),
  due_date: timestamp("due_date"),
  meta: jsonb("meta").default({}),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

export const shopping_list_items = pgTable("shopping_list_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  shopping_list_id: uuid("shopping_list_id").notNull(),
  product_id: uuid("product_id"),
  name: text("name").notNull(),
  quantity: numeric("quantity").default("1"),
  unit: varchar("unit", { length: 32 }),
  checked: boolean("checked").default(false),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

export const recipes = pgTable("recipes", {
  id: uuid("id").defaultRandom().primaryKey(),
  household_id: uuid("household_id"),
  created_by: uuid("created_by"),
  title: text("title").notNull(),
  description: text("description"),
  servings: integer("servings"),
  cook_time: integer("cook_time"),
  ingredients: jsonb("ingredients").default({}),
  instructions: text("instructions"),
  tags: jsonb("tags").default([]),
  metadata: jsonb("metadata").default({}),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

export const recipe_ingredients = pgTable("recipe_ingredients", {
  id: uuid("id").defaultRandom().primaryKey(),
  recipe_id: uuid("recipe_id").notNull(),
  product_id: uuid("product_id"),
  ingredient_text: text("ingredient_text").notNull(),
  quantity: numeric("quantity"),
  unit: varchar("unit", { length: 32 }),
  order: integer("order").default(0),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

export const notifications = pgTable("notifications", {
  id: uuid("id").defaultRandom().primaryKey(),
  user_id: uuid("user_id"),
  household_id: uuid("household_id"),
  type: varchar("type", { length: 64 }).notNull(),
  payload: jsonb("payload").default({}),
  status: varchar("status", { length: 32 }).default("pending"),
  scheduled_at: timestamp("scheduled_at"),
  sent_at: timestamp("sent_at"),
  read_at: timestamp("read_at"),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

export const waste_logs = pgTable("waste_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  household_id: uuid("household_id").notNull(),
  user_id: uuid("user_id"),
  inventory_item_id: uuid("inventory_item_id"),
  product_id: uuid("product_id"),
  quantity: numeric("quantity"),
  unit: varchar("unit", { length: 32 }),
  reason: varchar("reason", { length: 64 }),
  notes: text("notes"),
  image_url: text("image_url"),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const ai_generations = pgTable("ai_generations", {
  id: uuid("id").defaultRandom().primaryKey(),
  user_id: uuid("user_id"),
  household_id: uuid("household_id"),
  generation_type: varchar("generation_type", { length: 64 }),
  prompt: jsonb("prompt").default({}),
  result: jsonb("result").default({}),
  model: varchar("model", { length: 128 }),
  tokens: integer("tokens"),
  cost: numeric("cost"),
  status: varchar("status", { length: 32 }).default("pending"),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

export const receipts = pgTable("receipts", {
  id: uuid("id").defaultRandom().primaryKey(),
  household_id: uuid("household_id").notNull(),
  user_id: uuid("user_id"),
  image_url: text("image_url"),
  ocr_payload: jsonb("ocr_payload").default({}),
  total: numeric("total"),
  purchase_date: timestamp("purchase_date"),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

export const receipt_items = pgTable("receipt_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  receipt_id: uuid("receipt_id").notNull(),
  product_text: text("product_text").notNull(),
  quantity: numeric("quantity"),
  unit: varchar("unit", { length: 32 }),
  price: numeric("price"),
  linked_product_id: uuid("linked_product_id"),
});

export const sync_devices = pgTable("sync_devices", {
  id: uuid("id").defaultRandom().primaryKey(),
  household_id: uuid("household_id"),
  user_id: uuid("user_id"),
  device_id: varchar("device_id", { length: 256 }).notNull(),
  last_sync_at: timestamp("last_sync_at"),
  sync_token: varchar("sync_token", { length: 512 }),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

export const inventory_item_changes = pgTable("inventory_item_changes", {
  id: uuid("id").defaultRandom().primaryKey(),
  inventory_item_id: uuid("inventory_item_id").notNull(),
  changed_by: uuid("changed_by"),
  change_type: varchar("change_type", { length: 32 }).notNull(),
  diff: jsonb("diff").default({}),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const ai_generation_links = pgTable("ai_generation_links", {
  id: uuid("id").defaultRandom().primaryKey(),
  ai_generation_id: uuid("ai_generation_id").notNull(),
  object_type: varchar("object_type", { length: 64 }).notNull(),
  object_id: uuid("object_id").notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
});
