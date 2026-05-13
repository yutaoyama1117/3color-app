import type { MarkColor } from './mark'

export type ContentType = 'book' | 'pdf' | 'web' | 'youtube' | 'audio'
export type ContentStatus = 'pending' | 'processing' | 'ready' | 'error'

export interface ContentData {
  id: string
  userId: string
  type: ContentType
  status: ContentStatus
  title: string
  author?: string
  sourceUrl?: string
  thumbnailUrl?: string
  bodyText?: string
  pageCount?: number
  aiSummary?: string
  createdAt: Date
  updatedAt: Date
  lastMarkedAt?: Date
  /** このコンテンツについたマーク数（色別） */
  markCounts?: Record<MarkColor, number>
}

export interface RegisterContentInput {
  type: ContentType
  title: string
  author?: string
  sourceUrl?: string
  bodyText?: string
}

/** URL取得APIのレスポンス */
export interface UrlFetchResult {
  title: string
  description?: string
  content: string
  url: string
  publishedAt?: string
}
