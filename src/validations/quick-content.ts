import type { ContentType } from '@/types/content'
import type { MarkColor } from '@/types/mark'

export interface QuickContentInput {
  source: 'share_extension' | 'app' | 'web'
  type: ContentType
  url?: string
  title?: string
  text?: string
  initial_marks?: Array<{
    color: MarkColor
    marked_text: string
  }>
}

const VALID_SOURCES = ['share_extension', 'app', 'web']
const VALID_TYPES: ContentType[] = ['book', 'pdf', 'web', 'youtube', 'audio']
const VALID_COLORS: MarkColor[] = ['red', 'blue', 'green']

export function validateQuickContent(input: unknown): { ok: true; data: QuickContentInput } | { ok: false; error: string } {
  if (!input || typeof input !== 'object') return { ok: false, error: 'リクエストボディが不正です' }
  const v = input as Record<string, unknown>

  if (typeof v.source !== 'string' || !VALID_SOURCES.includes(v.source)) {
    return { ok: false, error: 'source が不正です' }
  }
  if (typeof v.type !== 'string' || !VALID_TYPES.includes(v.type as ContentType)) {
    return { ok: false, error: 'type が不正です' }
  }
  if (v.url !== undefined && typeof v.url !== 'string') return { ok: false, error: 'url は文字列' }
  if (v.title !== undefined && typeof v.title !== 'string') return { ok: false, error: 'title は文字列' }
  if (v.text !== undefined && typeof v.text !== 'string') return { ok: false, error: 'text は文字列' }

  if (v.initial_marks !== undefined) {
    if (!Array.isArray(v.initial_marks)) return { ok: false, error: 'initial_marks は配列' }
    for (const m of v.initial_marks) {
      if (!m || typeof m !== 'object') return { ok: false, error: 'initial_marks 要素が不正' }
      const mark = m as Record<string, unknown>
      if (typeof mark.color !== 'string' || !VALID_COLORS.includes(mark.color as MarkColor)) {
        return { ok: false, error: 'mark.color が不正' }
      }
      if (typeof mark.marked_text !== 'string') return { ok: false, error: 'mark.marked_text が不正' }
    }
  }

  // url か text かのどちらかは必須
  if (!v.url && !v.text) {
    return { ok: false, error: 'url または text のいずれかが必要です' }
  }

  return { ok: true, data: v as unknown as QuickContentInput }
}
