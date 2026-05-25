ALTER TABLE "shopping_list_items" ADD COLUMN "created_by" uuid;--> statement-breakpoint
ALTER TABLE "shopping_list_items" ADD COLUMN "category" text;--> statement-breakpoint
ALTER TABLE "shopping_list_items" ADD COLUMN "note" text;--> statement-breakpoint
ALTER TABLE "shopping_list_items" ADD COLUMN "source" varchar(32) DEFAULT 'manual' NOT NULL;--> statement-breakpoint
ALTER TABLE "shopping_list_items" ADD COLUMN "recipe_id" uuid;--> statement-breakpoint
ALTER TABLE "shopping_list_items" ADD COLUMN "inventory_item_id" uuid;--> statement-breakpoint
CREATE INDEX "shopping_list_items_list_id_idx" ON "shopping_list_items" USING btree ("shopping_list_id");--> statement-breakpoint
CREATE INDEX "shopping_list_items_source_idx" ON "shopping_list_items" USING btree ("source");--> statement-breakpoint
CREATE INDEX "shopping_list_items_recipe_id_idx" ON "shopping_list_items" USING btree ("recipe_id");--> statement-breakpoint
CREATE INDEX "shopping_list_items_inventory_item_id_idx" ON "shopping_list_items" USING btree ("inventory_item_id");