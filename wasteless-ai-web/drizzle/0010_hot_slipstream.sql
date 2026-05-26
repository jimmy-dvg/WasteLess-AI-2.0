CREATE TABLE "notification_push_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"household_id" uuid,
	"expo_push_token" varchar(512) NOT NULL,
	"device_id" varchar(256),
	"platform" varchar(32),
	"device_name" text,
	"status" varchar(32) DEFAULT 'active' NOT NULL,
	"last_registered_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "notification_push_tokens" ADD CONSTRAINT "notification_push_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_push_tokens" ADD CONSTRAINT "notification_push_tokens_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "notification_push_tokens_token_unique" ON "notification_push_tokens" USING btree ("expo_push_token");--> statement-breakpoint
CREATE INDEX "notification_push_tokens_user_id_idx" ON "notification_push_tokens" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "notification_push_tokens_household_id_idx" ON "notification_push_tokens" USING btree ("household_id");--> statement-breakpoint
CREATE INDEX "notification_push_tokens_status_idx" ON "notification_push_tokens" USING btree ("status");