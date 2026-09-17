ALTER TABLE "business" ADD COLUMN "city" text;--> statement-breakpoint
ALTER TABLE "business" ADD COLUMN "state" text;--> statement-breakpoint
CREATE INDEX "business_status_state_city_idx" ON "business" USING btree ("status","state","city");