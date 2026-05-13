-- Row Level Security（RLS）ポリシー設定
-- auth.uid() は Supabase Auth が提供する関数。ログイン中のユーザーIDを返す。
-- Drizzle マイグレーション適用後にこのファイルを実行すること。

-- ---- users ----
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users: own data only"
  ON users FOR ALL
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- ---- contents ----
ALTER TABLE contents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "contents: own data only"
  ON contents FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ---- marks ----
ALTER TABLE marks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "marks: own data only"
  ON marks FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ---- tags ----
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tags: own data only"
  ON tags FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ---- content_tags（contents 経由でアクセス制御）----
ALTER TABLE content_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "content_tags: own data only"
  ON content_tags FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM contents
      WHERE contents.id = content_tags.content_id
        AND contents.user_id = auth.uid()
    )
  );

-- ---- mark_tags（marks 経由でアクセス制御）----
ALTER TABLE mark_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mark_tags: own data only"
  ON mark_tags FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM marks
      WHERE marks.id = mark_tags.mark_id
        AND marks.user_id = auth.uid()
    )
  );

-- ---- related_links ----
ALTER TABLE related_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "related_links: own data only"
  ON related_links FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ---- jobs（参照のみ。作成・更新はサーバーサイドのみ）----
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "jobs: read own jobs only"
  ON jobs FOR SELECT
  USING (user_id = auth.uid());

-- ---- export_logs ----
ALTER TABLE export_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "export_logs: own data only"
  ON export_logs FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ---- pgvector IVFFlat インデックス（marks.embedding 用）----
-- 001_enable_extensions.sql で vector 拡張を有効化してから実行すること
CREATE INDEX IF NOT EXISTS idx_marks_embedding
  ON marks USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);
