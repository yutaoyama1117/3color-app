-- ──────────────────────────────────────────────────────────
-- 3Color 読書メモアプリ — 一括マイグレーション
-- Supabase Cloud の SQL Editor にそのまま貼り付けて Run してください
-- ──────────────────────────────────────────────────────────

-- ============ 1. 拡張機能 ============
CREATE EXTENSION IF NOT EXISTS vector;
-- pg_bigm は Supabase Cloud では利用不可なのでコメントアウト
-- CREATE EXTENSION IF NOT EXISTS pg_bigm;

-- ============ 2. ENUM 型 ============
DO $$ BEGIN CREATE TYPE "public"."ai_summary_status" AS ENUM('pending', 'processing', 'done', 'error'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE "public"."content_status" AS ENUM('pending', 'processing', 'ready', 'error'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE "public"."content_type" AS ENUM('book', 'pdf', 'web', 'youtube', 'audio'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE "public"."embedding_status" AS ENUM('pending', 'processing', 'done', 'error'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE "public"."export_type" AS ENUM('obsidian_md', 'json', 'csv'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE "public"."job_status" AS ENUM('queued', 'running', 'done', 'error', 'cancelled'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE "public"."job_type" AS ENUM('ocr', 'url_fetch', 'youtube_caption', 'audio_transcribe', 'ai_summary', 'embedding_generate'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE "public"."link_type" AS ENUM('ai_suggested', 'user_defined'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE "public"."mark_color" AS ENUM('red', 'blue', 'green'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE "public"."plan" AS ENUM('free', 'pro'); EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ============ 3. テーブル ============
CREATE TABLE IF NOT EXISTS "users" (
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

CREATE TABLE IF NOT EXISTS "contents" (
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

CREATE TABLE IF NOT EXISTS "tags" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "name" text NOT NULL,
  "color_hex" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "marks" (
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

CREATE TABLE IF NOT EXISTS "content_tags" (
  "content_id" uuid NOT NULL,
  "tag_id" uuid NOT NULL,
  CONSTRAINT "content_tags_content_id_tag_id_pk" PRIMARY KEY("content_id","tag_id")
);

CREATE TABLE IF NOT EXISTS "mark_tags" (
  "mark_id" uuid NOT NULL,
  "tag_id" uuid NOT NULL,
  CONSTRAINT "mark_tags_mark_id_tag_id_pk" PRIMARY KEY("mark_id","tag_id")
);

CREATE TABLE IF NOT EXISTS "related_links" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "from_mark_id" uuid NOT NULL,
  "to_mark_id" uuid NOT NULL,
  "link_type" "link_type" NOT NULL,
  "similarity" double precision,
  "accepted_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "jobs" (
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

CREATE TABLE IF NOT EXISTS "export_logs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "export_type" "export_type" NOT NULL,
  "scope" jsonb NOT NULL,
  "file_path" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- ============ 4. 外部キー制約 ============
DO $$ BEGIN
  ALTER TABLE "content_tags" ADD CONSTRAINT "content_tags_content_id_contents_id_fk" FOREIGN KEY ("content_id") REFERENCES "public"."contents"("id") ON DELETE cascade;
  ALTER TABLE "content_tags" ADD CONSTRAINT "content_tags_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE cascade;
  ALTER TABLE "contents" ADD CONSTRAINT "contents_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade;
  ALTER TABLE "export_logs" ADD CONSTRAINT "export_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade;
  ALTER TABLE "jobs" ADD CONSTRAINT "jobs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade;
  ALTER TABLE "mark_tags" ADD CONSTRAINT "mark_tags_mark_id_marks_id_fk" FOREIGN KEY ("mark_id") REFERENCES "public"."marks"("id") ON DELETE cascade;
  ALTER TABLE "mark_tags" ADD CONSTRAINT "mark_tags_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE cascade;
  ALTER TABLE "marks" ADD CONSTRAINT "marks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade;
  ALTER TABLE "marks" ADD CONSTRAINT "marks_content_id_contents_id_fk" FOREIGN KEY ("content_id") REFERENCES "public"."contents"("id") ON DELETE cascade;
  ALTER TABLE "related_links" ADD CONSTRAINT "related_links_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade;
  ALTER TABLE "related_links" ADD CONSTRAINT "related_links_from_mark_id_marks_id_fk" FOREIGN KEY ("from_mark_id") REFERENCES "public"."marks"("id") ON DELETE cascade;
  ALTER TABLE "related_links" ADD CONSTRAINT "related_links_to_mark_id_marks_id_fk" FOREIGN KEY ("to_mark_id") REFERENCES "public"."marks"("id") ON DELETE cascade;
  ALTER TABLE "tags" ADD CONSTRAINT "tags_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============ 5. インデックス ============
CREATE INDEX IF NOT EXISTS "idx_content_tags_tag_id" ON "content_tags" USING btree ("tag_id");
CREATE INDEX IF NOT EXISTS "idx_contents_user_id" ON "contents" USING btree ("user_id");
CREATE INDEX IF NOT EXISTS "idx_contents_type" ON "contents" USING btree ("type");
CREATE INDEX IF NOT EXISTS "idx_contents_status" ON "contents" USING btree ("status");
CREATE INDEX IF NOT EXISTS "idx_contents_last_marked" ON "contents" USING btree ("last_marked_at");
CREATE INDEX IF NOT EXISTS "idx_contents_deleted_at" ON "contents" USING btree ("deleted_at") WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS "idx_jobs_status" ON "jobs" USING btree ("status");
CREATE INDEX IF NOT EXISTS "idx_jobs_user_id" ON "jobs" USING btree ("user_id");
CREATE INDEX IF NOT EXISTS "idx_jobs_created_at" ON "jobs" USING btree ("created_at");
CREATE INDEX IF NOT EXISTS "idx_mark_tags_tag_id" ON "mark_tags" USING btree ("tag_id");
CREATE INDEX IF NOT EXISTS "idx_marks_user_id" ON "marks" USING btree ("user_id");
CREATE INDEX IF NOT EXISTS "idx_marks_content_id" ON "marks" USING btree ("content_id");
CREATE INDEX IF NOT EXISTS "idx_marks_color" ON "marks" USING btree ("color");
CREATE INDEX IF NOT EXISTS "idx_marks_created_at" ON "marks" USING btree ("created_at");
CREATE INDEX IF NOT EXISTS "idx_marks_deleted_at" ON "marks" USING btree ("deleted_at") WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS "idx_related_links_from" ON "related_links" USING btree ("from_mark_id");
CREATE INDEX IF NOT EXISTS "idx_related_links_to" ON "related_links" USING btree ("to_mark_id");
CREATE UNIQUE INDEX IF NOT EXISTS "related_links_from_to_unique" ON "related_links" USING btree ("from_mark_id","to_mark_id");
CREATE UNIQUE INDEX IF NOT EXISTS "tags_user_id_name_unique" ON "tags" USING btree ("user_id","name");

-- pgvector IVFFlat
CREATE INDEX IF NOT EXISTS idx_marks_embedding
  ON marks USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- ============ 6. 全文検索トリガー ============
CREATE OR REPLACE FUNCTION update_marks_tsv()
RETURNS trigger AS $$
BEGIN
  NEW.marked_text_tsv := to_tsvector('simple', coalesce(NEW.marked_text, ''));
  NEW.comment_tsv     := to_tsvector('simple', coalesce(NEW.comment, ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS marks_tsv_update ON marks;
CREATE TRIGGER marks_tsv_update
  BEFORE INSERT OR UPDATE ON marks
  FOR EACH ROW EXECUTE FUNCTION update_marks_tsv();

CREATE OR REPLACE FUNCTION update_contents_tsv()
RETURNS trigger AS $$
BEGIN
  NEW.body_text_tsv := to_tsvector('simple', coalesce(NEW.body_text, ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS contents_tsv_update ON contents;
CREATE TRIGGER contents_tsv_update
  BEFORE INSERT OR UPDATE ON contents
  FOR EACH ROW EXECUTE FUNCTION update_contents_tsv();

CREATE INDEX IF NOT EXISTS idx_marks_fts    ON marks    USING GIN(marked_text_tsv);
CREATE INDEX IF NOT EXISTS idx_contents_fts ON contents USING GIN(body_text_tsv);

-- ============ 7. RLS（Row Level Security）ポリシー ============
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "users: own data only" ON users;
CREATE POLICY "users: own data only" ON users FOR ALL
  USING (id = auth.uid()) WITH CHECK (id = auth.uid());

ALTER TABLE contents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "contents: own data only" ON contents;
CREATE POLICY "contents: own data only" ON contents FOR ALL
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

ALTER TABLE marks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "marks: own data only" ON marks;
CREATE POLICY "marks: own data only" ON marks FOR ALL
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tags: own data only" ON tags;
CREATE POLICY "tags: own data only" ON tags FOR ALL
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

ALTER TABLE content_tags ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "content_tags: own data only" ON content_tags;
CREATE POLICY "content_tags: own data only" ON content_tags FOR ALL
  USING (EXISTS (SELECT 1 FROM contents WHERE contents.id = content_tags.content_id AND contents.user_id = auth.uid()));

ALTER TABLE mark_tags ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "mark_tags: own data only" ON mark_tags;
CREATE POLICY "mark_tags: own data only" ON mark_tags FOR ALL
  USING (EXISTS (SELECT 1 FROM marks WHERE marks.id = mark_tags.mark_id AND marks.user_id = auth.uid()));

ALTER TABLE related_links ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "related_links: own data only" ON related_links;
CREATE POLICY "related_links: own data only" ON related_links FOR ALL
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "jobs: read own jobs only" ON jobs;
CREATE POLICY "jobs: read own jobs only" ON jobs FOR SELECT
  USING (user_id = auth.uid());

ALTER TABLE export_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "export_logs: own data only" ON export_logs;
CREATE POLICY "export_logs: own data only" ON export_logs FOR ALL
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ============ 8. auth.users → public.users 自動連携 ============
-- Supabase Auth でサインアップしたユーザーを public.users に自動コピー
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
