ALTER TYPE "public"."business_category" ADD VALUE 'home_services' BEFORE 'other';--> statement-breakpoint
ALTER TYPE "public"."business_category" ADD VALUE 'health' BEFORE 'other';--> statement-breakpoint
ALTER TYPE "public"."business_category" ADD VALUE 'beauty' BEFORE 'other';--> statement-breakpoint
ALTER TYPE "public"."business_category" ADD VALUE 'automotive' BEFORE 'other';--> statement-breakpoint
ALTER TYPE "public"."business_category" ADD VALUE 'education' BEFORE 'other';--> statement-breakpoint
ALTER TYPE "public"."business_category" ADD VALUE 'fitness' BEFORE 'other';--> statement-breakpoint
ALTER TYPE "public"."business_category" ADD VALUE 'entertainment' BEFORE 'other';--> statement-breakpoint
ALTER TYPE "public"."business_category" ADD VALUE 'travel' BEFORE 'other';--> statement-breakpoint
ALTER TYPE "public"."business_category" ADD VALUE 'pets' BEFORE 'other';--> statement-breakpoint
ALTER TYPE "public"."business_category" ADD VALUE 'finance' BEFORE 'other';--> statement-breakpoint
ALTER TABLE "business" DROP CONSTRAINT "business_types_required";--> statement-breakpoint
ALTER TABLE "business" ADD COLUMN "weekly_hours" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "business" ADD COLUMN "hours_time_zone" text;