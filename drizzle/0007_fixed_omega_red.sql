CREATE TYPE "public"."report_status" AS ENUM('open', 'dismissed', 'actioned', 'restored');--> statement-breakpoint
ALTER TYPE "public"."business_status" ADD VALUE 'suspended';--> statement-breakpoint
CREATE TABLE "content_report" (
	"id" text PRIMARY KEY NOT NULL,
	"reporter_user_id" text NOT NULL,
	"business_id" text NOT NULL,
	"review_id" text,
	"reason" text NOT NULL,
	"details" text,
	"status" "report_status" DEFAULT 'open' NOT NULL,
	"decision_reason" text,
	"reviewed_by_user_id" text,
	"reviewed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "content_report_details_length" CHECK (details IS NULL OR length(trim(details)) BETWEEN 10 AND 1000),
	CONSTRAINT "content_report_reason_allowed" CHECK (reason IN ('spam', 'misleading', 'abuse', 'conflict_of_interest', 'other'))
);
--> statement-breakpoint
CREATE TABLE "report_decision" (
	"id" text PRIMARY KEY NOT NULL,
	"report_id" text NOT NULL,
	"actor_user_id" text NOT NULL,
	"action" text NOT NULL,
	"reason" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "saved_business" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"business_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "business" ADD COLUMN "service_area" text;--> statement-breakpoint
ALTER TABLE "business" ADD COLUMN "opening_hours" text;--> statement-breakpoint
ALTER TABLE "business" ADD COLUMN "services" text[] DEFAULT '{}'::text[] NOT NULL;--> statement-breakpoint
ALTER TABLE "content_report" ADD CONSTRAINT "content_report_reporter_user_id_user_id_fk" FOREIGN KEY ("reporter_user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_report" ADD CONSTRAINT "content_report_business_id_business_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."business"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_report" ADD CONSTRAINT "content_report_review_id_business_review_id_fk" FOREIGN KEY ("review_id") REFERENCES "public"."business_review"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_report" ADD CONSTRAINT "content_report_reviewed_by_user_id_user_id_fk" FOREIGN KEY ("reviewed_by_user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "report_decision" ADD CONSTRAINT "report_decision_report_id_content_report_id_fk" FOREIGN KEY ("report_id") REFERENCES "public"."content_report"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "report_decision" ADD CONSTRAINT "report_decision_actor_user_id_user_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_business" ADD CONSTRAINT "saved_business_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_business" ADD CONSTRAINT "saved_business_business_id_business_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."business"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "content_report_open_business_unique" ON "content_report" USING btree ("reporter_user_id","business_id") WHERE status = 'open' AND review_id IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "content_report_open_review_unique" ON "content_report" USING btree ("reporter_user_id","review_id") WHERE status = 'open' AND review_id IS NOT NULL;--> statement-breakpoint
CREATE INDEX "content_report_status_created_idx" ON "content_report" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "content_report_business_idx" ON "content_report" USING btree ("business_id");--> statement-breakpoint
CREATE INDEX "content_report_review_idx" ON "content_report" USING btree ("review_id");--> statement-breakpoint
CREATE INDEX "report_decision_report_created_idx" ON "report_decision" USING btree ("report_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "saved_business_user_business_unique" ON "saved_business" USING btree ("user_id","business_id");--> statement-breakpoint
CREATE INDEX "saved_business_user_created_idx" ON "saved_business" USING btree ("user_id","created_at");