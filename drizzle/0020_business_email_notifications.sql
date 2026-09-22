CREATE TABLE "email_outbox" (
	"id" text PRIMARY KEY NOT NULL,
	"dedupe_key" text NOT NULL,
	"payload" jsonb NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"available_at" timestamp with time zone DEFAULT now() NOT NULL,
	"first_attempt_at" timestamp with time zone,
	"locked_at" timestamp with time zone,
	"lock_token" text,
	"provider_id" text,
	"last_error" text,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "email_outbox_status_valid" CHECK ("email_outbox"."status" in ('pending', 'sending', 'sent', 'failed')),
	CONSTRAINT "email_outbox_attempts_valid" CHECK ("email_outbox"."attempts" between 0 and 8),
	CONSTRAINT "email_outbox_lock_valid" CHECK (("email_outbox"."status" = 'sending' and "email_outbox"."locked_at" is not null and "email_outbox"."lock_token" is not null) or ("email_outbox"."status" <> 'sending' and "email_outbox"."locked_at" is null and "email_outbox"."lock_token" is null)),
	CONSTRAINT "email_outbox_completion_valid" CHECK (("email_outbox"."status" in ('sent', 'failed')) = ("email_outbox"."completed_at" is not null))
);
--> statement-breakpoint
CREATE UNIQUE INDEX "email_outbox_dedupe_unique" ON "email_outbox" USING btree ("dedupe_key");--> statement-breakpoint
CREATE INDEX "email_outbox_available_idx" ON "email_outbox" USING btree ("available_at") WHERE "email_outbox"."status" = 'pending';--> statement-breakpoint
CREATE INDEX "email_outbox_locked_idx" ON "email_outbox" USING btree ("locked_at") WHERE "email_outbox"."status" = 'sending';--> statement-breakpoint
CREATE INDEX "email_outbox_completed_idx" ON "email_outbox" USING btree ("completed_at");