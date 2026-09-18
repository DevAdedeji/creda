ALTER TABLE "business_review" ALTER COLUMN "status" SET DEFAULT 'published';
--> statement-breakpoint
UPDATE "business_review" SET "status" = 'published' WHERE "status" = 'pending';
