CREATE TABLE "profiles" (
	"id" uuid PRIMARY KEY NOT NULL,
	"email" varchar(320) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "profiles_email_unique" UNIQUE("email"),
	CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "public"."users"("id") ON DELETE cascade
);
--> statement-breakpoint
ALTER TABLE "categories" ADD COLUMN "user_id" uuid;
--> statement-breakpoint
ALTER TABLE "categories" ADD COLUMN "color" varchar(24);
--> statement-breakpoint
ALTER TABLE "categories" ADD CONSTRAINT "categories_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade;
--> statement-breakpoint
CREATE INDEX "categories_user_id_idx" ON "categories" ("user_id");
--> statement-breakpoint
CREATE INDEX "categories_name_idx" ON "categories" ("name");
--> statement-breakpoint
CREATE UNIQUE INDEX "categories_user_name_unique" ON "categories" ("user_id", "name");
--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "user_id" uuid;
--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "quantity" numeric(10, 2) DEFAULT 1;
--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "unit" varchar(32);
--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "purchase_date" timestamp;
--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "expiration_date" timestamp;
--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "storage_location" varchar(32);
--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "notes" text;
--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade;
--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null;
--> statement-breakpoint
CREATE INDEX "products_user_id_idx" ON "products" ("user_id");
--> statement-breakpoint
CREATE INDEX "products_category_id_idx" ON "products" ("category_id");
--> statement-breakpoint
CREATE INDEX "products_expiration_idx" ON "products" ("expiration_date");
--> statement-breakpoint
CREATE INDEX "products_name_idx" ON "products" ("name");
