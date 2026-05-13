import type { MarkColor } from './mark'

export type ContentType = 'book' | 'pdf' | 'web' | 'youtube' | 'audio'
export type ContentStatus = 'pending' | 'processing' | 'ready' | 'error'

/** テキストセクション（コンテンツ内の個別テキスト単位） */
export interface TextSection {
  id: string
  text: string
  label?: string
  addedAt: Date
}

/** 書籍メタデータ（ISBN・出版社・発行日など） */
export interface BookMeta {
  isbn?: string
  publisher?: string
  publishedAt?: string  // "2023" または "2023-01-15"
  description?: string
  coverUrl?: string
}

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
  /** 複数テキストセクション（書籍の複数ページなど） */
  textSections?: TextSection[]
  pageCount?: number
  aiSummary?: string
  /** 書籍メタデータ（ISBN・出版社・発行日など） */
  bookMeta?: BookMeta
  isFavorite?: boolean
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
