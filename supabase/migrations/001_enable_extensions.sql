-- pgvector: Embedding ベクトル検索に必要
CREATE EXTENSION IF NOT EXISTS vector;

-- pg_bigm: 日本語バイグラム全文検索（to_tsvector の代替）
-- Supabase では管理画面 Extensions から有効化が必要な場合あり
CREATE EXTENSION IF NOT EXISTS pg_bigm;
