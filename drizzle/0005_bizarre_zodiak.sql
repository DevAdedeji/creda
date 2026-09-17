CREATE TABLE "business_image_upload" (
	"id" text PRIMARY KEY NOT NULL,
	"owner_user_id" text NOT NULL,
	"path" text NOT NULL,
	"url" text,
	"status" text DEFAULT 'uploading' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"delete_after" timestamp with time zone,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "business_image_upload_path_unique" UNIQUE("path"),
	CONSTRAINT "business_image_upload_url_unique" UNIQUE("url")
);
--> statement-breakpoint
ALTER TABLE "business_image_upload" ADD CONSTRAINT "business_image_upload_owner_user_id_user_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "business_image_upload_owner_created_idx" ON "business_image_upload" USING btree ("owner_user_id","created_at");--> statement-breakpoint
CREATE INDEX "business_image_upload_cleanup_idx" ON "business_image_upload" USING btree ("status","delete_after");
--> statement-breakpoint
INSERT INTO "business_image_upload" ("id", "owner_user_id", "path", "url", "status")
SELECT DISTINCT ON (image_url)
  md5('legacy:' || image_url), owner_user_id,
  substring(image_url FROM '/(businesses/[^?]+)$'), image_url, 'ready'
FROM (
  SELECT owner_user_id, logo_url AS image_url FROM business WHERE logo_url IS NOT NULL
  UNION ALL
  SELECT owner_user_id, cover_url AS image_url FROM business WHERE cover_url IS NOT NULL
  UNION ALL
  SELECT owner_user_id, unnest(gallery_urls) AS image_url FROM business
) AS existing_images
WHERE image_url LIKE 'https://cdn.byteship.cloud/f/%/businesses/%'
  AND substring(image_url FROM '/(businesses/[^?]+)$') IS NOT NULL
ON CONFLICT DO NOTHING;
