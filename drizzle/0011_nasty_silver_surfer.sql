CREATE TYPE "public"."listing_source" AS ENUM('member', 'curated');--> statement-breakpoint
ALTER TABLE "business" ALTER COLUMN "owner_user_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "business" ADD COLUMN "listing_source" "listing_source" DEFAULT 'member' NOT NULL;--> statement-breakpoint
ALTER TABLE "business" ADD COLUMN "curation_source_url" text;--> statement-breakpoint
ALTER TABLE "business" ADD COLUMN "curation_checked_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "business" ADD CONSTRAINT "business_listing_source_owner" CHECK ((listing_source = 'member' AND owner_user_id IS NOT NULL) OR (listing_source = 'curated' AND owner_user_id IS NULL AND ownership_status = 'unverified' AND curation_source_url IS NOT NULL));