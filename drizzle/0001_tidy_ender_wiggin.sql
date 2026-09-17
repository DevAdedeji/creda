CREATE TYPE "public"."business_category" AS ENUM('software', 'creative', 'retail', 'services', 'food', 'other');--> statement-breakpoint
CREATE TYPE "public"."business_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."business_type" AS ENUM('web_app', 'mobile_app', 'desktop_app', 'online_store', 'service_business', 'physical_business');--> statement-breakpoint
CREATE TYPE "public"."operation_mode" AS ENUM('online', 'physical', 'hybrid');--> statement-breakpoint
CREATE TYPE "public"."ownership_status" AS ENUM('unverified', 'pending', 'verified', 'revoked');--> statement-breakpoint
CREATE TABLE "business" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"owner_user_id" text NOT NULL,
	"name" text NOT NULL,
	"normalized_name" text NOT NULL,
	"description" text NOT NULL,
	"category" "business_category" NOT NULL,
	"business_type" "business_type" NOT NULL,
	"operation_mode" "operation_mode" NOT NULL,
	"country" text DEFAULT 'Nigeria' NOT NULL,
	"city" text NOT NULL,
	"normalized_city" text NOT NULL,
	"website_url" text,
	"app_store_url" text,
	"social_url" text,
	"contact_url" text,
	"logo_url" text,
	"status" "business_status" DEFAULT 'pending' NOT NULL,
	"ownership_status" "ownership_status" DEFAULT 'unverified' NOT NULL,
	"rejection_reason" text,
	"reviewed_by_user_id" text,
	"reviewed_at" timestamp with time zone,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "business_slug_unique" UNIQUE("slug"),
	CONSTRAINT "business_destination_required" CHECK (website_url IS NOT NULL OR app_store_url IS NOT NULL OR social_url IS NOT NULL OR contact_url IS NOT NULL)
);
--> statement-breakpoint
CREATE TABLE "business_moderation" (
	"id" text PRIMARY KEY NOT NULL,
	"business_id" text NOT NULL,
	"actor_user_id" text NOT NULL,
	"from_status" "business_status" NOT NULL,
	"to_status" "business_status" NOT NULL,
	"reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "business" ADD CONSTRAINT "business_owner_user_id_user_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business" ADD CONSTRAINT "business_reviewed_by_user_id_user_id_fk" FOREIGN KEY ("reviewed_by_user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_moderation" ADD CONSTRAINT "business_moderation_business_id_business_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."business"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_moderation" ADD CONSTRAINT "business_moderation_actor_user_id_user_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "business_name_city_unique" ON "business" USING btree ("normalized_name","normalized_city");--> statement-breakpoint
CREATE INDEX "business_status_name_idx" ON "business" USING btree ("status","name");--> statement-breakpoint
CREATE INDEX "business_owner_idx" ON "business" USING btree ("owner_user_id");--> statement-breakpoint
CREATE INDEX "business_moderation_business_idx" ON "business_moderation" USING btree ("business_id","created_at");