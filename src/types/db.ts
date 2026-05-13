import type { InferInsertModel, InferSelectModel } from 'drizzle-orm'
import type {
  contents,
  contentTags,
  exportLogs,
  jobs,
  marks,
  markTags,
  relatedLinks,
  tags,
  users,
} from '@/db/schema'

// ---- SELECT型（DBから取得した行の型）----
export type User = InferSelectModel<typeof users>
export type Content = InferSelectModel<typeof contents>
export type Mark = InferSelectModel<typeof marks>
export type Tag = InferSelectModel<typeof tags>
export type ContentTag = InferSelectModel<typeof contentTags>
export type MarkTag = InferSelectModel<typeof markTags>
export type RelatedLink = InferSelectModel<typeof relatedLinks>
export type Job = InferSelectModel<typeof jobs>
export type ExportLog = InferSelectModel<typeof exportLogs>

// ---- INSERT型（新規作成時の入力型）----
export type NewUser = InferInsertModel<typeof users>
export type NewContent = InferInsertModel<typeof contents>
export type NewMark = InferInsertModel<typeof marks>
export type NewTag = InferInsertModel<typeof tags>
export type NewContentTag = InferInsertModel<typeof contentTags>
export type NewMarkTag = InferInsertModel<typeof markTags>
export type NewRelatedLink = InferInsertModel<typeof relatedLinks>
export type NewJob = InferInsertModel<typeof jobs>
export type NewExportLog = InferInsertModel<typeof exportLogs>
