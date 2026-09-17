ALTER TABLE "business" ADD COLUMN "cover_url" text;--> statement-breakpoint
ALTER TABLE "business" ADD COLUMN "gallery_urls" text[] DEFAULT '{}'::text[] NOT NULL;