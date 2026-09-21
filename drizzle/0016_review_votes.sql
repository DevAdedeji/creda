CREATE TABLE "review_vote" (
	"id" text PRIMARY KEY NOT NULL,
	"review_id" text NOT NULL,
	"voter_user_id" text NOT NULL,
	"value" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "review_vote_value_valid" CHECK (value IN ('useful', 'not_useful'))
);
--> statement-breakpoint
ALTER TABLE "review_vote" ADD CONSTRAINT "review_vote_review_id_business_review_id_fk" FOREIGN KEY ("review_id") REFERENCES "public"."business_review"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_vote" ADD CONSTRAINT "review_vote_voter_user_id_user_id_fk" FOREIGN KEY ("voter_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "review_vote_review_voter_unique" ON "review_vote" USING btree ("review_id","voter_user_id");--> statement-breakpoint
CREATE INDEX "review_vote_voter_idx" ON "review_vote" USING btree ("voter_user_id");