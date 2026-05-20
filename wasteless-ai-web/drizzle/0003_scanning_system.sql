CREATE TABLE "barcode_products" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "barcode" varchar(128) NOT NULL,
  "name" text NOT NULL,
  "brand" text,
  "category" text,
  "metadata" jsonb DEFAULT '{}'::jsonb,
  "source" varchar(64) DEFAULT 'cache',
  "last_lookup_at" timestamp DEFAULT now() NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX "barcode_products_barcode_unique" ON "barcode_products" ("barcode");
CREATE INDEX "barcode_products_barcode_idx" ON "barcode_products" ("barcode");
CREATE INDEX "barcode_products_category_idx" ON "barcode_products" ("category");

CREATE TABLE "scan_history" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "type" varchar(40) NOT NULL,
  "barcode" varchar(128),
  "symbology" varchar(32),
  "raw_text" text,
  "status" varchar(32) DEFAULT 'processed' NOT NULL,
  "metadata" jsonb DEFAULT '{}'::jsonb,
  "created_at" timestamp DEFAULT now() NOT NULL
);

ALTER TABLE "scan_history"
  ADD CONSTRAINT "scan_history_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;

CREATE INDEX "scan_history_user_created_idx" ON "scan_history" ("user_id", "created_at");
CREATE INDEX "scan_history_type_idx" ON "scan_history" ("type");
CREATE INDEX "scan_history_barcode_idx" ON "scan_history" ("barcode");

CREATE TABLE "scanned_receipts" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "image_url" text,
  "raw_text" text,
  "extracted_data" jsonb DEFAULT '{}'::jsonb,
  "status" varchar(32) DEFAULT 'processed' NOT NULL,
  "processed_at" timestamp DEFAULT now() NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

ALTER TABLE "scanned_receipts"
  ADD CONSTRAINT "scanned_receipts_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;

CREATE INDEX "scanned_receipts_user_processed_idx" ON "scanned_receipts" ("user_id", "processed_at");
CREATE INDEX "scanned_receipts_status_idx" ON "scanned_receipts" ("status");
