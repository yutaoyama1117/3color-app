-- 全文検索（FTS）用トリガー
-- marks.marked_text / comment を tsvector に自動変換する
-- pg_bigm 拡張が有効な場合は bigm_tsvector を使うが、
-- ここでは互換性のため simple 設定を使用（pg_bigm は GIN インデックスで別途対応）

-- ---- marks テーブル ----
CREATE OR REPLACE FUNCTION update_marks_tsv()
RETURNS trigger AS $$
BEGIN
  NEW.marked_text_tsv := to_tsvector('simple', coalesce(NEW.marked_text, ''));
  NEW.comment_tsv     := to_tsvector('simple', coalesce(NEW.comment, ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER marks_tsv_update
  BEFORE INSERT OR UPDATE ON marks
  FOR EACH ROW EXECUTE FUNCTION update_marks_tsv();

-- ---- contents テーブル ----
CREATE OR REPLACE FUNCTION update_contents_tsv()
RETURNS trigger AS $$
BEGIN
  NEW.body_text_tsv := to_tsvector('simple', coalesce(NEW.body_text, ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER contents_tsv_update
  BEFORE INSERT OR UPDATE ON contents
  FOR EACH ROW EXECUTE FUNCTION update_contents_tsv();

-- GIN インデックス（FTS 高速化）
CREATE INDEX IF NOT EXISTS idx_marks_fts     ON marks    USING GIN(marked_text_tsv);
CREATE INDEX IF NOT EXISTS idx_contents_fts  ON contents USING GIN(body_text_tsv);
