CREATE TABLE "discovery_usage" (
	"key" text PRIMARY KEY NOT NULL,
	"count" integer NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	CONSTRAINT "discovery_usage_count_positive" CHECK ("discovery_usage"."count" > 0)
);
--> statement-breakpoint
CREATE INDEX "discovery_usage_expires_at_idx" ON "discovery_usage" USING btree ("expires_at");