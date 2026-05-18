ALTER TABLE "recipes" ADD COLUMN "difficulty" varchar(20);
ALTER TABLE "recipes" ADD COLUMN "missing_ingredients" jsonb DEFAULT '[]'::jsonb;
ALTER TABLE "recipes" ADD COLUMN "nutrition" jsonb DEFAULT '{}'::jsonb;
ALTER TABLE "recipes" ADD COLUMN "waste_notes" text;
ALTER TABLE "recipes" ADD COLUMN "score" numeric(6,2);
ALTER TABLE "recipes" ALTER COLUMN "ingredients" SET DEFAULT '[]'::jsonb;

CREATE TABLE "saved_recipes" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "recipe_id" uuid NOT NULL,
  "user_id" uuid NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

ALTER TABLE "saved_recipes"
  ADD CONSTRAINT "saved_recipes_recipe_id_fkey"
  FOREIGN KEY ("recipe_id") REFERENCES "recipes"("id") ON DELETE CASCADE;

ALTER TABLE "saved_recipes"
  ADD CONSTRAINT "saved_recipes_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;

CREATE UNIQUE INDEX "saved_recipes_user_recipe_unique" ON "saved_recipes" ("user_id", "recipe_id");
CREATE INDEX "saved_recipes_user_id_idx" ON "saved_recipes" ("user_id");
