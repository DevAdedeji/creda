ALTER TABLE "business" RENAME COLUMN "business_type" TO "business_types";--> statement-breakpoint
ALTER TABLE "business" ALTER COLUMN "business_types" TYPE "business_type"[] USING ARRAY["business_types"];--> statement-breakpoint
ALTER TABLE "business" RENAME COLUMN "city" TO "location";--> statement-breakpoint
ALTER TABLE "business" RENAME COLUMN "normalized_city" TO "normalized_location";--> statement-breakpoint
ALTER TABLE "business" DROP CONSTRAINT "business_destination_required";--> statement-breakpoint
DROP INDEX "business_name_city_unique";--> statement-breakpoint
ALTER TABLE "business" ADD COLUMN "play_store_url" text;--> statement-breakpoint
UPDATE "business" SET "location" = concat_ws(', ', nullif(trim("location"), ''), nullif(trim("country"), '')), "normalized_location" = lower(concat_ws(', ', nullif(trim("location"), ''), nullif(trim("country"), '')));--> statement-breakpoint
ALTER TABLE "business" ALTER COLUMN "location" DROP NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "business_name_location_unique" ON "business" USING btree ("normalized_name","normalized_location");--> statement-breakpoint
ALTER TABLE "business" DROP COLUMN "country";--> statement-breakpoint
UPDATE "business" SET "status" = 'approved', "published_at" = coalesce("published_at", now()) WHERE "status" = 'pending';--> statement-breakpoint
ALTER TABLE "business" ALTER COLUMN "status" SET DEFAULT 'approved';--> statement-breakpoint
ALTER TABLE "business" ADD CONSTRAINT "business_types_required" CHECK (cardinality(business_types) > 0);--> statement-breakpoint
ALTER TABLE "business" ADD CONSTRAINT "business_physical_location_required" CHECK (operation_mode = 'online' OR (location IS NOT NULL AND length(trim(location)) >= 2));--> statement-breakpoint
ALTER TABLE "business" ADD CONSTRAINT "business_destination_required" CHECK (website_url IS NOT NULL OR app_store_url IS NOT NULL OR play_store_url IS NOT NULL OR social_url IS NOT NULL OR contact_url IS NOT NULL);
