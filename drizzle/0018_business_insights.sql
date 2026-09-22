CREATE TABLE "business_insight_daily" (
	"id" text PRIMARY KEY NOT NULL,
	"business_id" text NOT NULL,
	"day" date NOT NULL,
	"metric" text NOT NULL,
	"count" integer DEFAULT 1 NOT NULL,
	CONSTRAINT "business_insight_daily_metric" CHECK (metric IN ('profile_view', 'bio_view', 'website', 'whatsapp', 'phone', 'app_store', 'play_store', 'social', 'email', 'contact')),
	CONSTRAINT "business_insight_daily_positive" CHECK (count > 0)
);
--> statement-breakpoint
CREATE TABLE "business_insight_guard" (
	"key" text PRIMARY KEY NOT NULL,
	"count" integer DEFAULT 1 NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	CONSTRAINT "business_insight_guard_positive" CHECK (count > 0)
);
--> statement-breakpoint
ALTER TABLE "business_insight_daily" ADD CONSTRAINT "business_insight_daily_business_id_business_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."business"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "business_insight_daily_unique" ON "business_insight_daily" USING btree ("business_id","day","metric");--> statement-breakpoint
CREATE INDEX "business_insight_guard_expiry_idx" ON "business_insight_guard" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "saved_business_business_idx" ON "saved_business" USING btree ("business_id");