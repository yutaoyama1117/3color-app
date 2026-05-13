# プロジェクト概要
齋藤孝の３色ボールペン理論をデジタル化した読書メモ管理アプリ。

# 技術スタック
- Frontend: Next.js 15 (App Router) / TypeScript / Tailwind CSS / shadcn/ui
- State: Zustand + TanStack Query v5
- Backend: Hono on Cloudflare Workers
- DB: Supabase (PostgreSQL + pgvector + RLS)
- Cache/Queue: Upstash Redis
- ORM: Drizzle ORM
- Test: Vitest + Playwright

# ディレクトリ構成（遵守すること）
src/
  app/          Next.js App Router pages
  components/   atoms / molecules / organisms / templates
  hooks/        カスタムフック
  stores/       Zustand stores
  lib/          外部サービスクライアント
  types/        共通型定義
  validations/  Zodスキーマ

# コーディングルール
- any 型禁止
- コンポーネントはすべて named export
- API呼び出しはすべて /src/lib/api/ 経由
- エラーハンドリングは必ず実装（loading/error/empty状態）
- コメントは日本語でOK
