CREATE TYPE "public"."ownership_request_status" AS ENUM('pending', 'approved', 'declined', 'revoked');--> statement-breakpoint
CREATE TYPE "public"."review_status" AS ENUM('pending', 'published', 'rejected', 'removed');--> statement-breakpoint
CREATE TABLE "business_review" (
	"id" text PRIMARY KEY NOT NULL,
	"business_id" text NOT NULL,
	"author_user_id" text NOT NULL,
	"rating" integer NOT NULL,
	"body" text NOT NULL,
	"experience_month" text NOT NULL,
	"status" "review_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "business_review_rating_range" CHECK (rating BETWEEN 1 AND 5),
	CONSTRAINT "business_review_body_length" CHECK (length(trim(body)) BETWEEN 30 AND 2000),
	CONSTRAINT "business_review_experience_month_format" CHECK (experience_month ~ '^[0-9]{4}-(0[1-9]|1[0-2])$')
);
--> statement-breakpoint
CREATE TABLE "ownership_decision" (
	"id" text PRIMARY KEY NOT NULL,
	"request_id" text NOT NULL,
	"business_id" text NOT NULL,
	"actor_user_id" text NOT NULL,
	"from_status" "ownership_request_status" NOT NULL,
	"to_status" "ownership_request_status" NOT NULL,
	"reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ownership_request" (
	"id" text PRIMARY KEY NOT NULL,
	"business_id" text NOT NULL,
	"requester_user_id" text NOT NULL,
	"method" text NOT NULL,
	"evidence_note" text NOT NULL,
	"status" "ownership_request_status" DEFAULT 'pending' NOT NULL,
	"review_note" text,
	"reviewed_by_user_id" text,
	"reviewed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ownership_request_method_allowed" CHECK (method IN ('official_email', 'official_website', 'official_social', 'other')),
	CONSTRAINT "ownership_request_evidence_length" CHECK (length(trim(evidence_note)) BETWEEN 20 AND 2000)
);
--> statement-breakpoint
CREATE TABLE "review_moderation" (
	"id" text PRIMARY KEY NOT NULL,
	"review_id" text NOT NULL,
	"actor_user_id" text NOT NULL,
	"from_status" "review_status" NOT NULL,
	"to_status" "review_status" NOT NULL,
	"reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "review_reply" (
	"id" text PRIMARY KEY NOT NULL,
	"review_id" text NOT NULL,
	"owner_user_id" text NOT NULL,
	"body" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "review_reply_review_id_unique" UNIQUE("review_id"),
	CONSTRAINT "review_reply_body_length" CHECK (length(trim(body)) BETWEEN 2 AND 1000)
);
--> statement-breakpoint
ALTER TABLE "business_review" ADD CONSTRAINT "business_review_business_id_business_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."business"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_review" ADD CONSTRAINT "business_review_author_user_id_user_id_fk" FOREIGN KEY ("author_user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ownership_decision" ADD CONSTRAINT "ownership_decision_request_id_ownership_request_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."ownership_request"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ownership_decision" ADD CONSTRAINT "ownership_decision_business_id_business_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."business"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ownership_decision" ADD CONSTRAINT "ownership_decision_actor_user_id_user_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ownership_request" ADD CONSTRAINT "ownership_request_business_id_business_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."business"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ownership_request" ADD CONSTRAINT "ownership_request_requester_user_id_user_id_fk" FOREIGN KEY ("requester_user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ownership_request" ADD CONSTRAINT "ownership_request_reviewed_by_user_id_user_id_fk" FOREIGN KEY ("reviewed_by_user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_moderation" ADD CONSTRAINT "review_moderation_review_id_business_review_id_fk" FOREIGN KEY ("review_id") REFERENCES "public"."business_review"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_moderation" ADD CONSTRAINT "review_moderation_actor_user_id_user_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_reply" ADD CONSTRAINT "review_reply_review_id_business_review_id_fk" FOREIGN KEY ("review_id") REFERENCES "public"."business_review"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_reply" ADD CONSTRAINT "review_reply_owner_user_id_user_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "business_review_author_unique" ON "business_review" USING btree ("business_id","author_user_id");--> statement-breakpoint
CREATE INDEX "business_review_business_status_created_idx" ON "business_review" USING btree ("business_id","status","created_at");--> statement-breakpoint
CREATE INDEX "ownership_decision_business_created_idx" ON "ownership_decision" USING btree ("business_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "ownership_request_one_pending_per_business" ON "ownership_request" USING btree ("business_id") WHERE status = 'pending';--> statement-breakpoint
CREATE INDEX "ownership_request_business_created_idx" ON "ownership_request" USING btree ("business_id","created_at");--> statement-breakpoint
CREATE INDEX "ownership_request_status_created_idx" ON "ownership_request" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "review_moderation_review_created_idx" ON "review_moderation" USING btree ("review_id","created_at");