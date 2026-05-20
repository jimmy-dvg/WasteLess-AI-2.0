CREATE TABLE "meal_plans" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "household_id" uuid NOT NULL,
  "created_by" uuid,
  "name" text NOT NULL,
  "status" varchar(32) DEFAULT 'active' NOT NULL,
  "source" varchar(64) DEFAULT 'smart_planner' NOT NULL,
  "start_date" timestamp NOT NULL,
  "end_date" timestamp NOT NULL,
  "snapshot" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "stats" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "meal_plan_items" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "meal_plan_id" uuid NOT NULL,
  "recipe_id" uuid,
  "meal_date" timestamp NOT NULL,
  "slot" varchar(32) DEFAULT 'dinner' NOT NULL,
  "title" text NOT NULL,
  "description" text,
  "status" varchar(32) DEFAULT 'planned' NOT NULL,
  "cook_time" integer,
  "servings" integer,
  "score" numeric(6, 2),
  "priority_items" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "missing_items" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "consumption_suggestions" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "cooked_at" timestamp,
  "skipped_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "meal_plan_inventory_usages" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "meal_plan_item_id" uuid NOT NULL,
  "product_id" uuid NOT NULL,
  "product_name" text NOT NULL,
  "quantity" numeric(10, 2) NOT NULL,
  "unit" varchar(32),
  "previous_quantity" numeric(10, 2) NOT NULL,
  "next_quantity" numeric(10, 2) NOT NULL,
  "metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "meal_plan_items"
  ADD CONSTRAINT "meal_plan_items_meal_plan_id_meal_plans_id_fk"
  FOREIGN KEY ("meal_plan_id") REFERENCES "meal_plans"("id") ON DELETE CASCADE;
--> statement-breakpoint
ALTER TABLE "meal_plan_items"
  ADD CONSTRAINT "meal_plan_items_recipe_id_recipes_id_fk"
  FOREIGN KEY ("recipe_id") REFERENCES "recipes"("id") ON DELETE SET NULL;
--> statement-breakpoint
ALTER TABLE "meal_plan_inventory_usages"
  ADD CONSTRAINT "meal_plan_inventory_usages_meal_plan_item_id_meal_plan_items_id_fk"
  FOREIGN KEY ("meal_plan_item_id") REFERENCES "meal_plan_items"("id") ON DELETE CASCADE;
--> statement-breakpoint
ALTER TABLE "meal_plan_inventory_usages"
  ADD CONSTRAINT "meal_plan_inventory_usages_product_id_products_id_fk"
  FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE;
--> statement-breakpoint
CREATE INDEX "meal_plans_household_status_idx" ON "meal_plans" ("household_id", "status");
--> statement-breakpoint
CREATE INDEX "meal_plans_created_by_idx" ON "meal_plans" ("created_by");
--> statement-breakpoint
CREATE INDEX "meal_plan_items_plan_date_idx" ON "meal_plan_items" ("meal_plan_id", "meal_date");
--> statement-breakpoint
CREATE INDEX "meal_plan_items_status_idx" ON "meal_plan_items" ("status");
--> statement-breakpoint
CREATE INDEX "meal_plan_items_recipe_id_idx" ON "meal_plan_items" ("recipe_id");
--> statement-breakpoint
CREATE INDEX "meal_plan_inventory_usages_item_idx" ON "meal_plan_inventory_usages" ("meal_plan_item_id");
--> statement-breakpoint
CREATE INDEX "meal_plan_inventory_usages_product_idx" ON "meal_plan_inventory_usages" ("product_id");
