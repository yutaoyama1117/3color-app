import {
  customType,
  doublePrecision,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'

// ---- カスタム型定義 ----

// pgvector の VECTOR型（セマンティック検索用）
const vector = customType<{
  data: number[]
  driverData: string
  config: { dimensions: number }
}>({
  dataType(config) {
    return `vector(${config?.dimensions ?? 1536})`
  },
  fromDriver(value: string): number[] {
    return value
      .slice(1, -1)
      .split(',')
      .map(Number)
  },
  toDriver(value: number[]): string {
    return `[${value.join(',')}]`
  },
})

// PostgreSQL TSVECTOR型（全文検索インデックス用。トリガーで自動更新）
const tsvector = customType<{ data: string }>({
  dataType() {
    return 'tsvector'
  },
})

// ---- Enum定義 ----

export const planEnum = pgEnum('plan', ['free', 'pro'])
export const contentTypeEnum = pgEnum('content_type', ['book', 'pdf', 'web', 'youtube', 'audio'])
export const contentStatusEnum = pgEnum('content_status', [
  'pending',
  'processing',
  'ready',
  'error',
])
export const markColorEnum = pgEnum('mark_color', ['red', 'blue', 'green'])
export const aiSummaryStatusEnum = pgEnum('ai_summary_status', [
  'pending',
  'processing',
  'done',
  'error',
])
export const embeddingStatusEnum = pgEnum('embedding_status', [
  'pending',
  'processing',
  'done',
  'error',
])
export const jobTypeEnum = pgEnum('job_type', [
  'ocr',
  'url_fetch',
  'youtube_caption',
  'audio_transcribe',
  'ai_summary',
  'embedding_generate',
])
export const jobStatusEnum = pgEnum('job_status', [
  'queued',
  'running',
  'done',
  'error',
  'cancelled',
])
export const exportTypeEnum = pgEnum('export_type', ['obsidian_md', 'json', 'csv'])
export const linkTypeEnum = pgEnum('link_type', ['ai_suggested', 'user_defined'])

// ---- usersテーブル ----

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').unique().notNull(),
  displayName: text('display_name'),
  avatarUrl: text('avatar_url'),
  plan: planEnum('plan').notNull().default('free'),
  // アプリ設定（テーマ・言語・通知設定など）
  settings: jsonb('settings').notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  // 論理削除
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
})

// ---- contentsテーブル ----

export const contents = pgTable(
  'contents',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: contentTypeEnum('type').notNull(),
    status: contentStatusEnum('status').notNull().default('pending'),
    // メタ情報
    title: text('title').notNull(),
    author: text('author'),
    sourceUrl: text('source_url'),
    thumbnailUrl: text('thumbnail_url'),
    isbn: text('isbn'),
    publishedAt: text('published_at'), // ISO 8601 日付文字列
    // 本文（OCR/URL取得後に格納）
    bodyText: text('body_text'),
    bodyTextTsv: tsvector('body_text_tsv'), // FTSトリガーで自動更新
    pageCount: integer('page_count'),
    durationSec: integer('duration_sec'), // 動画・音声の長さ（秒）
    // AI生成データ
    aiSummary: text('ai_summary'),
    aiSummaryStatus: aiSummaryStatusEnum('ai_summary_status').default('pending'),
    // PDF・音声ファイルへの参照パス（Supabase Storage）
    filePath: text('file_path'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
    lastMarkedAt: timestamp('last_marked_at', { withTimezone: true }),
  },
  (table) => [
    index('idx_contents_user_id').on(table.userId),
    index('idx_contents_type').on(table.type),
    index('idx_contents_status').on(table.status),
    index('idx_contents_last_marked').on(table.lastMarkedAt),
    // 論理削除済みを除外したインデックス
    index('idx_contents_deleted_at').on(table.deletedAt).where(sql`deleted_at IS NULL`),
  ]
)

// ---- marksテーブル ----

export const marks = pgTable(
  'marks',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    contentId: uuid('content_id')
      .notNull()
      .references(() => contents.id, { onDelete: 'cascade' }),
    color: markColorEnum('color').notNull(),
    // マーク本文
    markedText: text('marked_text').notNull(),
    markedTextTsv: tsvector('marked_text_tsv'), // FTSトリガーで自動更新
    comment: text('comment'),
    commentTsv: tsvector('comment_tsv'),
    // 位置情報（書籍・PDF用）
    pageNumber: integer('page_number'),
    charOffsetStart: integer('char_offset_start'),
    charOffsetEnd: integer('char_offset_end'),
    // 位置情報（動画・音声用）
    timestampSec: integer('timestamp_sec'),
    // pgvector Embedding（関連マーク検索用）
    embedding: vector('embedding', { dimensions: 1536 }),
    embeddingStatus: embeddingStatusEnum('embedding_status').default('pending'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (table) => [
    index('idx_marks_user_id').on(table.userId),
    index('idx_marks_content_id').on(table.contentId),
    index('idx_marks_color').on(table.color),
    index('idx_marks_created_at').on(table.createdAt),
    index('idx_marks_deleted_at').on(table.deletedAt).where(sql`deleted_at IS NULL`),
    // IVFFlat インデックスは Supabase マイグレーションSQLで別途追加（Drizzle非対応）
  ]
)

// ---- tagsテーブル ----

export const tags = pgTable(
  'tags',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    colorHex: text('color_hex'), // タグ表示色（例: "#EF4444"）
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex('tags_user_id_name_unique').on(table.userId, table.name)]
)

// ---- content_tagsテーブル（コンテンツ↔タグ中間テーブル）----

export const contentTags = pgTable(
  'content_tags',
  {
    contentId: uuid('content_id')
      .notNull()
      .references(() => contents.id, { onDelete: 'cascade' }),
    tagId: uuid('tag_id')
      .notNull()
      .references(() => tags.id, { onDelete: 'cascade' }),
  },
  (table) => [
    primaryKey({ columns: [table.contentId, table.tagId] }),
    index('idx_content_tags_tag_id').on(table.tagId),
  ]
)

// ---- mark_tagsテーブル（マーク↔タグ中間テーブル）----

export const markTags = pgTable(
  'mark_tags',
  {
    markId: uuid('mark_id')
      .notNull()
      .references(() => marks.id, { onDelete: 'cascade' }),
    tagId: uuid('tag_id')
      .notNull()
      .references(() => tags.id, { onDelete: 'cascade' }),
  },
  (table) => [
    primaryKey({ columns: [table.markId, table.tagId] }),
    index('idx_mark_tags_tag_id').on(table.tagId),
  ]
)

// ---- related_linksテーブル（マーク間の関連リンク）----

export const relatedLinks = pgTable(
  'related_links',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    fromMarkId: uuid('from_mark_id')
      .notNull()
      .references(() => marks.id, { onDelete: 'cascade' }),
    toMarkId: uuid('to_mark_id')
      .notNull()
      .references(() => marks.id, { onDelete: 'cascade' }),
    linkType: linkTypeEnum('link_type').notNull(),
    // AI提案時のコサイン類似度スコア（0〜1）
    similarity: doublePrecision('similarity'),
    acceptedAt: timestamp('accepted_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('idx_related_links_from').on(table.fromMarkId),
    index('idx_related_links_to').on(table.toMarkId),
    uniqueIndex('related_links_from_to_unique').on(table.fromMarkId, table.toMarkId),
  ]
)

// ---- jobsテーブル（非同期ジョブ管理）----

export const jobs = pgTable(
  'jobs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    jobType: jobTypeEnum('job_type').notNull(),
    status: jobStatusEnum('status').notNull().default('queued'),
    payload: jsonb('payload').notNull().default({}),
    result: jsonb('result'),
    errorMessage: text('error_message'),
    retryCount: integer('retry_count').notNull().default(0),
    maxRetries: integer('max_retries').notNull().default(3),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    startedAt: timestamp('started_at', { withTimezone: true }),
    finishedAt: timestamp('finished_at', { withTimezone: true }),
  },
  (table) => [
    index('idx_jobs_status').on(table.status),
    index('idx_jobs_user_id').on(table.userId),
    index('idx_jobs_created_at').on(table.createdAt),
  ]
)

// ---- export_logsテーブル（エクスポート履歴）----

export const exportLogs = pgTable('export_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  exportType: exportTypeEnum('export_type').notNull(),
  // エクスポート対象の指定（例: { type: 'content', content_id: '...' }）
  scope: jsonb('scope').notNull(),
  filePath: text('file_path'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})
