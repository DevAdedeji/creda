CREATE TABLE "business_slug" (
	"slug" text PRIMARY KEY NOT NULL,
	"business_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "business_slug" ADD CONSTRAINT "business_slug_business_id_business_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."business"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "business_slug_business_idx" ON "business_slug" USING btree ("business_id");--> statement-breakpoint
INSERT INTO "business_slug" ("slug", "business_id") SELECT "slug", "id" FROM "business";
