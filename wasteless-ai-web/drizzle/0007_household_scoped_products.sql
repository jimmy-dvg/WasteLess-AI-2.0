ALTER TABLE "products" ADD COLUMN "household_id" uuid;
--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "owner_user_id" uuid;
--> statement-breakpoint
UPDATE "products"
SET "owner_user_id" = "user_id"
WHERE "owner_user_id" IS NULL;
--> statement-breakpoint
UPDATE "products" AS product
SET "household_id" = primary_household."household_id"
FROM (
  SELECT DISTINCT ON ("user_id") "user_id", "household_id"
  FROM "household_members"
  ORDER BY "user_id", "joined_at" ASC
) AS primary_household
WHERE product."user_id" = primary_household."user_id"
  AND product."household_id" IS NULL;
--> statement-breakpoint
ALTER TABLE "products"
  ADD CONSTRAINT "products_household_id_households_id_fk"
  FOREIGN KEY ("household_id") REFERENCES "households"("id") ON DELETE CASCADE;
--> statement-breakpoint
ALTER TABLE "products"
  ADD CONSTRAINT "products_owner_user_id_users_id_fk"
  FOREIGN KEY ("owner_user_id") REFERENCES "users"("id") ON DELETE SET NULL;
--> statement-breakpoint
CREATE INDEX "products_household_id_idx" ON "products" ("household_id");
--> statement-breakpoint
CREATE INDEX "products_owner_user_id_idx" ON "products" ("owner_user_id");
