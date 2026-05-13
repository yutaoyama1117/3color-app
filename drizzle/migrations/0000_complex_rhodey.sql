CREATE TYPE "public"."ai_summary_status" AS ENUM('pending', 'processing', 'done', 'error');--> statement-breakpoint
CREATE TYPE "public"."content_status" AS ENUM('pending', 'processing', 'ready', 'error');--> statement-breakpoint
CREATE TYPE "public"."content_type" AS ENUM('book', 'pdf', 'web', 'youtube', 'audio');--> statement-breakpoint
CREATE TYPE "public"."embedding_status" AS ENUM('pending', 'processing', 'done', 'error');--> statement-breakpoint
CREATE TYPE "public"."export_type" AS ENUM('obsidian_md', 'json', 'csv');--> statement-breakpoint
CREATE TYPE "public"."job_status" AS ENUM('queued', 'running', 'done', 'error', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."job_type" AS ENUM('ocr', 'url_fetch', 'youtube_caption', 'audio_transcribe', 'ai_summary', 'embedding_generate');--> statement-breakpoint
CREATE TYPE "public"."link_type" AS ENUM('ai_suggested', 'user_defined');--> statement-breakpoint
CREATE TYPE "public"."mark_color" AS ENUM('red', 'blue', 'green');--> statement-breakpoint
CREATE TYPE "public"."plan" AS ENUM('free', 'pro');--> statement-breakpoint
CREATE TABLE "content_tags" (
	"content_id" uuid NOT NULL,
	"tag_id" uuid NOT NULL,
	CONSTRAINT "content_tags_content_id_tag_id_pk" PRIMARY KEY("content_id","tag_id")
);
--> statement-breakpoint
CREATE TABLE "contents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" "content_type" NOT NULL,
	"status" "content_status" DEFAULT 'pending' NOT NULL,
	"title" text NOT NULL,
	"author" text,
	"source_url" text,
	"thumbnail_url" text,
	"isbn" text,
	"published_at" text,
	"body_text" text,
	"body_text_tsv" "tsvector",
	"page_count" integer,
	"duration_sec" integer,
	"ai_summary" text,
	"ai_summary_status" "ai_summary_status" DEFAULT 'pending',
	"file_path" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"last_marked_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "export_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"export_type" "export_type" NOT NULL,
	"scope" jsonb NOT NULL,
	"file_path" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"job_type" "job_type" NOT NULL,
	"status" "job_status" DEFAULT 'queued' NOT NULL,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"result" jsonb,
	"error_message" text,
	"retry_count" integer DEFAULT 0 NOT NULL,
	"max_retries" integer DEFAULT 3 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"started_at" timestamp with time zone,
	"finished_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "mark_tags" (
	"mark_id" uuid NOT NULL,
	"tag_id" uuid NOT NULL,
	CONSTRAINT "mark_tags_mark_id_tag_id_pk" PRIMARY KEY("mark_id","tag_id")
);
--> statement-breakpoint
CREATE TABLE "marks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"content_id" uuid NOT NULL,
	"color" "mark_color" NOT NULL,
	"marked_text" text NOT NULL,
	"marked_text_tsv" "tsvector",
	"comment" text,
	"comment_tsv" "tsvector",
	"page_number" integer,
	"char_offset_start" integer,
	"char_offset_end" integer,
	"timestamp_sec" integer,
	"embedding" vector(1536),
	"embedding_status" "embedding_status" DEFAULT 'pending',
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "related_links" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"from_mark_id" uuid NOT NULL,
	"to_mark_id" uuid NOT NULL,
	"link_type" "link_type" NOT NULL,
	"similarity" double precision,
	"accepted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"color_hex" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"display_name" text,
	"avatar_url" text,
	"plan" "plan" DEFAULT 'free' NOT NULL,
	"settings" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "content_tags" ADD CONSTRAINT "content_tags_content_id_contents_id_fk" FOREIGN KEY ("content_id") REFERENCES "public"."contents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_tags" ADD CONSTRAINT "content_tags_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contents" ADD CONSTRAINT "contents_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "export_logs" ADD CONSTRAINT "export_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mark_tags" ADD CONSTRAINT "mark_tags_mark_id_marks_id_fk" FOREIGN KEY ("mark_id") REFERENCES "public"."marks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mark_tags" ADD CONSTRAINT "mark_tags_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marks" ADD CONSTRAINT "marks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marks" ADD CONSTRAINT "marks_content_id_contents_id_fk" FOREIGN KEY ("content_id") REFERENCES "public"."contents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "related_links" ADD CONSTRAINT "related_links_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "related_links" ADD CONSTRAINT "related_links_from_mark_id_marks_id_fk" FOREIGN KEY ("from_mark_id") REFERENCES "public"."marks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "related_links" ADD CONSTRAINT "related_links_to_mark_id_marks_id_fk" FOREIGN KEY ("to_mark_id") REFERENCES "public"."marks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tags" ADD CONSTRAINT "tags_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_content_tags_tag_id" ON "content_tags" USING btree ("tag_id");--> statement-breakpoint
CREATE INDEX "idx_contents_user_id" ON "contents" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_contents_type" ON "contents" USING btree ("type");--> statement-breakpoint
CREATE INDEX "idx_contents_status" ON "contents" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_contents_last_marked" ON "contents" USING btree ("last_marked_at");--> statement-breakpoint
CREATE INDEX "idx_contents_deleted_at" ON "contents" USING btree ("deleted_at") WHERE deleted_at IS NULL;--> statement-breakpoint
CREATE INDEX "idx_jobs_status" ON "jobs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_jobs_user_id" ON "jobs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_jobs_created_at" ON "jobs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_mark_tags_tag_id" ON "mark_tags" USING btree ("tag_id");--> statement-breakpoint
CREATE INDEX "idx_marks_user_id" ON "marks" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_marks_content_id" ON "marks" USING btree ("content_id");--> statement-breakpoint
CREATE INDEX "idx_marks_color" ON "marks" USING btree ("color");--> statement-breakpoint
CREATE INDEX "idx_marks_created_at" ON "marks" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_marks_deleted_at" ON "marks" USING btree ("deleted_at") WHERE deleted_at IS NULL;--> statement-breakpoint
CREATE INDEX "idx_related_links_from" ON "related_links" USING btree ("from_mark_id");--> statement-breakpoint
CREATE INDEX "idx_related_links_to" ON "related_links" USING btree ("to_mark_id");--> statement-breakpoint
CREATE UNIQUE INDEX "related_links_from_to_unique" ON "related_links" USING btree ("from_mark_id","to_mark_id");--> statement-breakpoint
CREATE UNIQUE INDEX "tags_user_id_name_unique" ON "tags" USING btree ("user_id","name");