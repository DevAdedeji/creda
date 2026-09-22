CREATE TABLE "homepage_placement" (
	"position" integer PRIMARY KEY NOT NULL,
	"business_id" text NOT NULL,
	CONSTRAINT "homepage_placement_position_valid" CHECK ("homepage_placement"."position" between 0 and 6)
);
--> statement-breakpoint
ALTER TABLE "homepage_placement" ADD CONSTRAINT "homepage_placement_business_id_business_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."business"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "homepage_placement_featured_unique" ON "homepage_placement" USING btree ("business_id") WHERE "homepage_placement"."position" > 0;--> statement-breakpoint
CREATE INDEX "homepage_placement_business_idx" ON "homepage_placement" USING btree ("business_id");
--> statement-breakpoint
-- Preserve the homepage's existing alphabetical selections at rollout.
INSERT INTO "homepage_placement" ("position", "business_id")
SELECT 0, "id" FROM "business" WHERE "status" = 'approved' ORDER BY "name", "id" LIMIT 1;
--> statement-breakpoint
INSERT INTO "homepage_placement" ("position", "business_id")
SELECT (row_number() OVER (ORDER BY "name", "id"))::integer, "id"
FROM (SELECT "id", "name" FROM "business" WHERE "status" = 'approved' ORDER BY "name", "id" LIMIT 6) AS initial_features;
