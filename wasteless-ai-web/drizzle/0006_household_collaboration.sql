ALTER TABLE "household_members"
  ADD CONSTRAINT "household_members_household_id_households_id_fk"
  FOREIGN KEY ("household_id") REFERENCES "households"("id") ON DELETE CASCADE;
--> statement-breakpoint
ALTER TABLE "household_members"
  ADD CONSTRAINT "household_members_user_id_users_id_fk"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;
--> statement-breakpoint
CREATE INDEX "household_members_household_id_idx" ON "household_members" ("household_id");
--> statement-breakpoint
CREATE INDEX "household_members_user_id_idx" ON "household_members" ("user_id");
--> statement-breakpoint
CREATE UNIQUE INDEX "household_members_household_user_unique" ON "household_members" ("household_id", "user_id");
--> statement-breakpoint
CREATE TABLE "household_invitations" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "household_id" uuid NOT NULL,
  "email" varchar(320) NOT NULL,
  "role" varchar(20) DEFAULT 'member' NOT NULL,
  "token" varchar(128) NOT NULL,
  "status" varchar(32) DEFAULT 'pending' NOT NULL,
  "invited_by" uuid,
  "accepted_by" uuid,
  "expires_at" timestamp NOT NULL,
  "accepted_at" timestamp,
  "declined_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  "metadata" jsonb DEFAULT '{}'::jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "household_activity_events" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "household_id" uuid NOT NULL,
  "actor_user_id" uuid,
  "event_type" varchar(64) NOT NULL,
  "object_type" varchar(64),
  "object_id" uuid,
  "summary" text NOT NULL,
  "metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "household_invitations"
  ADD CONSTRAINT "household_invitations_household_id_households_id_fk"
  FOREIGN KEY ("household_id") REFERENCES "households"("id") ON DELETE CASCADE;
--> statement-breakpoint
ALTER TABLE "household_invitations"
  ADD CONSTRAINT "household_invitations_invited_by_users_id_fk"
  FOREIGN KEY ("invited_by") REFERENCES "users"("id") ON DELETE SET NULL;
--> statement-breakpoint
ALTER TABLE "household_invitations"
  ADD CONSTRAINT "household_invitations_accepted_by_users_id_fk"
  FOREIGN KEY ("accepted_by") REFERENCES "users"("id") ON DELETE SET NULL;
--> statement-breakpoint
ALTER TABLE "household_activity_events"
  ADD CONSTRAINT "household_activity_events_household_id_households_id_fk"
  FOREIGN KEY ("household_id") REFERENCES "households"("id") ON DELETE CASCADE;
--> statement-breakpoint
ALTER TABLE "household_activity_events"
  ADD CONSTRAINT "household_activity_events_actor_user_id_users_id_fk"
  FOREIGN KEY ("actor_user_id") REFERENCES "users"("id") ON DELETE SET NULL;
--> statement-breakpoint
CREATE UNIQUE INDEX "household_invitations_token_unique" ON "household_invitations" ("token");
--> statement-breakpoint
CREATE INDEX "household_invitations_household_status_idx" ON "household_invitations" ("household_id", "status");
--> statement-breakpoint
CREATE INDEX "household_invitations_email_status_idx" ON "household_invitations" ("email", "status");
--> statement-breakpoint
CREATE INDEX "household_activity_events_household_created_idx" ON "household_activity_events" ("household_id", "created_at");
--> statement-breakpoint
CREATE INDEX "household_activity_events_actor_created_idx" ON "household_activity_events" ("actor_user_id", "created_at");
