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
  index,
  uniqueIndex,
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

export const profiles = pgTable(
  "profiles",
  {
    id: uuid("id")
      .primaryKey()
      .references(() => users.id, { onDelete: "cascade" }),
    email: varchar("email", { length: 320 }).notNull(),
    created_at: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    emailIdx: uniqueIndex("profiles_email_unique").on(table.email),
  })
);

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

export const categories = pgTable(
  "categories",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    user_id: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
    household_id: uuid("household_id"),
    name: text("name").notNull(),
    color: varchar("color", { length: 24 }),
    parent_id: uuid("parent_id"),
    created_at: timestamp("created_at").defaultNow().notNull(),
    updated_at: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    userIdx: index("categories_user_id_idx").on(table.user_id),
    nameIdx: index("categories_name_idx").on(table.name),
    userNameUnique: uniqueIndex("categories_user_name_unique").on(table.user_id, table.name),
  })
);

export const products = pgTable(
  "products",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    user_id: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
    category_id: uuid("category_id").references(() => categories.id, { onDelete: "set null" }),
    name: text("name").notNull(),
    quantity: numeric("quantity", { precision: 10, scale: 2 }).default("1"),
    unit: varchar("unit", { length: 32 }),
    purchase_date: timestamp("purchase_date"),
    expiration_date: timestamp("expiration_date"),
    storage_location: varchar("storage_location", { length: 32 }),
    notes: text("notes"),
    brand: text("brand"),
    description: text("description"),
    default_unit: varchar("default_unit", { length: 32 }),
    serving_size: numeric("serving_size"),
    gtin: varchar("gtin", { length: 64 }),
    attributes: jsonb("attributes").default({}),
    created_at: timestamp("created_at").defaultNow().notNull(),
    updated_at: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    userIdx: index("products_user_id_idx").on(table.user_id),
    categoryIdx: index("products_category_id_idx").on(table.category_id),
    expirationIdx: index("products_expiration_idx").on(table.expiration_date),
    nameIdx: index("products_name_idx").on(table.name),
  })
);

export const product_barcodes = pgTable("product_barcodes", {
  id: uuid("id").defaultRandom().primaryKey(),
  product_id: uuid("product_id").notNull(),
  barcode: varchar("barcode", { length: 128 }).notNull(),
  symbology: varchar("symbology", { length: 32 }),
  metadata: jsonb("metadata").default({}),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

export const barcode_products = pgTable(
  "barcode_products",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    barcode: varchar("barcode", { length: 128 }).notNull(),
    name: text("name").notNull(),
    brand: text("brand"),
    category: text("category"),
    metadata: jsonb("metadata").default({}),
    source: varchar("source", { length: 64 }).default("cache"),
    last_lookup_at: timestamp("last_lookup_at").defaultNow().notNull(),
    created_at: timestamp("created_at").defaultNow().notNull(),
    updated_at: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    barcodeUnique: uniqueIndex("barcode_products_barcode_unique").on(table.barcode),
    barcodeIdx: index("barcode_products_barcode_idx").on(table.barcode),
    categoryIdx: index("barcode_products_category_idx").on(table.category),
  })
);

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
  difficulty: varchar("difficulty", { length: 20 }),
  servings: integer("servings"),
  cook_time: integer("cook_time"),
  ingredients: jsonb("ingredients").default([]),
  missing_ingredients: jsonb("missing_ingredients").default([]),
  nutrition: jsonb("nutrition").default({}),
  instructions: text("instructions"),
  waste_notes: text("waste_notes"),
  tags: jsonb("tags").default([]),
  score: numeric("score", { precision: 6, scale: 2 }),
  metadata: jsonb("metadata").default({}),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

export const saved_recipes = pgTable(
  "saved_recipes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    recipe_id: uuid("recipe_id")
      .notNull()
      .references(() => recipes.id, { onDelete: "cascade" }),
    user_id: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    created_at: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    userRecipeUnique: uniqueIndex("saved_recipes_user_recipe_unique").on(
      table.user_id,
      table.recipe_id
    ),
    userIdx: index("saved_recipes_user_id_idx").on(table.user_id),
  })
);

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

export const meal_plans = pgTable(
  "meal_plans",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    household_id: uuid("household_id").notNull(),
    created_by: uuid("created_by"),
    name: text("name").notNull(),
    status: varchar("status", { length: 32 }).default("active").notNull(),
    source: varchar("source", { length: 64 }).default("smart_planner").notNull(),
    start_date: timestamp("start_date").notNull(),
    end_date: timestamp("end_date").notNull(),
    snapshot: jsonb("snapshot").default({}).notNull(),
    stats: jsonb("stats").default({}).notNull(),
    created_at: timestamp("created_at").defaultNow().notNull(),
    updated_at: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    householdStatusIdx: index("meal_plans_household_status_idx").on(table.household_id, table.status),
    createdByIdx: index("meal_plans_created_by_idx").on(table.created_by),
  })
);

export const meal_plan_items = pgTable(
  "meal_plan_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    meal_plan_id: uuid("meal_plan_id")
      .notNull()
      .references(() => meal_plans.id, { onDelete: "cascade" }),
    recipe_id: uuid("recipe_id").references(() => recipes.id, { onDelete: "set null" }),
    meal_date: timestamp("meal_date").notNull(),
    slot: varchar("slot", { length: 32 }).default("dinner").notNull(),
    title: text("title").notNull(),
    description: text("description"),
    status: varchar("status", { length: 32 }).default("planned").notNull(),
    cook_time: integer("cook_time"),
    servings: integer("servings"),
    score: numeric("score", { precision: 6, scale: 2 }),
    priority_items: jsonb("priority_items").default([]).notNull(),
    missing_items: jsonb("missing_items").default([]).notNull(),
    consumption_suggestions: jsonb("consumption_suggestions").default([]).notNull(),
    metadata: jsonb("metadata").default({}).notNull(),
    cooked_at: timestamp("cooked_at"),
    skipped_at: timestamp("skipped_at"),
    created_at: timestamp("created_at").defaultNow().notNull(),
    updated_at: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    planDateIdx: index("meal_plan_items_plan_date_idx").on(table.meal_plan_id, table.meal_date),
    statusIdx: index("meal_plan_items_status_idx").on(table.status),
    recipeIdx: index("meal_plan_items_recipe_id_idx").on(table.recipe_id),
  })
);

export const meal_plan_inventory_usages = pgTable(
  "meal_plan_inventory_usages",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    meal_plan_item_id: uuid("meal_plan_item_id")
      .notNull()
      .references(() => meal_plan_items.id, { onDelete: "cascade" }),
    product_id: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    product_name: text("product_name").notNull(),
    quantity: numeric("quantity", { precision: 10, scale: 2 }).notNull(),
    unit: varchar("unit", { length: 32 }),
    previous_quantity: numeric("previous_quantity", { precision: 10, scale: 2 }).notNull(),
    next_quantity: numeric("next_quantity", { precision: 10, scale: 2 }).notNull(),
    metadata: jsonb("metadata").default({}).notNull(),
    created_at: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    itemIdx: index("meal_plan_inventory_usages_item_idx").on(table.meal_plan_item_id),
    productIdx: index("meal_plan_inventory_usages_product_idx").on(table.product_id),
  })
);

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

export const scan_history = pgTable(
  "scan_history",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    user_id: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: varchar("type", { length: 40 }).notNull(),
    barcode: varchar("barcode", { length: 128 }),
    symbology: varchar("symbology", { length: 32 }),
    raw_text: text("raw_text"),
    status: varchar("status", { length: 32 }).default("processed").notNull(),
    metadata: jsonb("metadata").default({}),
    created_at: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    userCreatedIdx: index("scan_history_user_created_idx").on(table.user_id, table.created_at),
    typeIdx: index("scan_history_type_idx").on(table.type),
    barcodeIdx: index("scan_history_barcode_idx").on(table.barcode),
  })
);

export const scanned_receipts = pgTable(
  "scanned_receipts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    user_id: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    image_url: text("image_url"),
    raw_text: text("raw_text"),
    extracted_data: jsonb("extracted_data").default({}),
    status: varchar("status", { length: 32 }).default("processed").notNull(),
    processed_at: timestamp("processed_at").defaultNow().notNull(),
    created_at: timestamp("created_at").defaultNow().notNull(),
    updated_at: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    userProcessedIdx: index("scanned_receipts_user_processed_idx").on(table.user_id, table.processed_at),
    statusIdx: index("scanned_receipts_status_idx").on(table.status),
  })
);

export const scan_import_batches = pgTable(
  "scan_import_batches",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    user_id: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    source: varchar("source", { length: 40 }).notNull(),
    receipt_id: uuid("receipt_id"),
    product_ids: jsonb("product_ids").default([]).notNull(),
    imported_count: integer("imported_count").default(0).notNull(),
    status: varchar("status", { length: 32 }).default("active").notNull(),
    metadata: jsonb("metadata").default({}),
    created_at: timestamp("created_at").defaultNow().notNull(),
    reverted_at: timestamp("reverted_at"),
  },
  (table) => ({
    userCreatedIdx: index("scan_import_batches_user_created_idx").on(table.user_id, table.created_at),
    statusIdx: index("scan_import_batches_status_idx").on(table.status),
  })
);

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
