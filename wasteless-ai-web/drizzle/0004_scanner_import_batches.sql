CREATE TABLE "scan_import_batches" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "source" varchar(40) NOT NULL,
  "receipt_id" uuid,
  "product_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "imported_count" integer DEFAULT 0 NOT NULL,
  "status" varchar(32) DEFAULT 'active' NOT NULL,
  "metadata" jsonb DEFAULT '{}'::jsonb,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "reverted_at" timestamp
);

ALTER TABLE "scan_import_batches"
  ADD CONSTRAINT "scan_import_batches_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;

CREATE INDEX "scan_import_batches_user_created_idx" ON "scan_import_batches" ("user_id", "created_at");
CREATE INDEX "scan_import_batches_status_idx" ON "scan_import_batches" ("status");
