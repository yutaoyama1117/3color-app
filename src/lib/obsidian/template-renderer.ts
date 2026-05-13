import type { ContentData } from '@/types/content'
import type { MarkData, MarkColor } from '@/types/mark'

/**
 * シンプルなテンプレートレンダラ。
 * Handlebars 風の構文（{{var}}）を簡易サポート。
 */

const COLOR_EMOJI: Record<MarkColor, string> = { red: '🔴', blue: '🔵', green: '🟢' }
const TYPE_LABEL: Record<string, string> = {
  book: '書籍', pdf: 'PDF', web: 'Web記事', youtube: 'YouTube', audio: '音声',
}
const TYPE_EMOJI: Record<string, string> = {
  book: '📖', pdf: '📄', web: '🌐', youtube: '▶️', audio: '🎙️',
}

/** ファイル名に使えない文字をサニタイズ */
export function sanitizeFilename(name: string): string {
  return name.replace(/[\\/:*?"<>|]/g, '_').slice(0, 200)
}

/** 日時を YYYY-MM-DD 形式に（persist後のstring型にも対応） */
export function formatDate(d: Date | string): string {
  return new Date(d).toISOString().slice(0, 10)
}

/** タイムスタンプ秒を MM:SS 形式に */
export function formatTimestamp(sec: number): string {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

/** コンテンツ単体の Markdown を生成 */
export function renderContentMarkdown(content: ContentData, marks: MarkData[]): string {
  const contentMarks = marks.filter((m) => m.contentId === content.id)
  const redMarks = contentMarks.filter((m) => m.color === 'red')
  const blueMarks = contentMarks.filter((m) => m.color === 'blue')
  const greenMarks = contentMarks.filter((m) => m.color === 'green')

  const lines: string[] = []

  // フロントマター
  lines.push('---')
  lines.push(`title: "${content.title}"`)
  if (content.author) lines.push(`author: "${content.author}"`)
  lines.push(`type: ${content.type}`)
  if (content.sourceUrl) lines.push(`source: "${content.sourceUrl}"`)
  lines.push(`created: ${formatDate(content.createdAt)}`)
  if (content.lastMarkedAt) lines.push(`last_marked: ${formatDate(content.lastMarkedAt)}`)
  lines.push(`synced_at: ${new Date().toISOString()}`)
  lines.push('tags:')
  lines.push('  - "3色メモ"')
  lines.push('---')
  lines.push('')

  // タイトル
  lines.push(`# ${content.title}`)
  lines.push('')
  lines.push(`> ${content.author ?? ''} | ${TYPE_LABEL[content.type]}`)
  lines.push('')

  // 色別セクション
  if (redMarks.length > 0) {
    lines.push(`## 🔴 最重要マーク（${redMarks.length}件）`)
    lines.push('')
    for (const m of redMarks) {
      lines.push(`> ${m.markedText}`)
      if (m.comment) {
        lines.push('')
        lines.push(`💬 ${m.comment}`)
      }
      lines.push(`📅 ${formatDate(m.createdAt)}`)
      lines.push('')
    }
  }

  if (blueMarks.length > 0) {
    lines.push(`## 🔵 重要マーク（${blueMarks.length}件）`)
    lines.push('')
    for (const m of blueMarks) {
      lines.push(`> ${m.markedText}`)
      if (m.comment) {
        lines.push('')
        lines.push(`💬 ${m.comment}`)
      }
      lines.push(`📅 ${formatDate(m.createdAt)}`)
      lines.push('')
    }
  }

  if (greenMarks.length > 0) {
    lines.push(`## 🟢 個人的な気づき（${greenMarks.length}件）`)
    lines.push('')
    for (const m of greenMarks) {
      lines.push(`> ${m.markedText}`)
      if (m.comment) {
        lines.push('')
        lines.push(`💬 ${m.comment}`)
      }
      lines.push(`📅 ${formatDate(m.createdAt)}`)
      lines.push('')
    }
  }

  // AI要約があれば追加
  if (content.aiSummary) {
    lines.push('## 🤖 AI要約')
    lines.push('')
    lines.push(content.aiSummary)
    lines.push('')
  }

  return lines.join('\n')
}

/** 日次まとめ Markdown */
export function renderDailyMarkdown(date: Date, marksByContent: Map<string, { content: ContentData; marks: MarkData[] }>): string {
  const lines: string[] = []
  lines.push('---')
  lines.push(`date: ${formatDate(date)}`)
  let total = 0
  for (const v of marksByContent.values()) total += v.marks.length
  lines.push(`marks_count: ${total}`)
  lines.push('---')
  lines.push('')
  lines.push(`# 📅 ${new Date(date).toLocaleDateString('ja-JP')} のマーク`)
  lines.push('')

  for (const { content, marks } of marksByContent.values()) {
    lines.push(`## ${content.title} (${TYPE_LABEL[content.type]})`)
    lines.push('')
    for (const m of marks) {
      lines.push(`- ${COLOR_EMOJI[m.color]} ${m.markedText}`)
      if (m.comment) lines.push(`  💬 ${m.comment}`)
    }
    lines.push('')
  }
  return lines.join('\n')
}

/** 目次 Markdown */
export function renderIndexMarkdown(contents: ContentData[], marks: MarkData[]): string {
  const lines: string[] = []
  lines.push('# 📚 3Color 読書メモ目次')
  lines.push('')
  lines.push(`最終同期: ${new Date().toISOString()}`)
  lines.push(`総コンテンツ数: ${contents.length}`)
  lines.push(`総マーク数: ${marks.length}`)
  lines.push('')
  lines.push('## コンテンツ一覧')
  lines.push('')
  lines.push('| タイトル | タイプ | マーク数 | 最終マーク日 |')
  lines.push('|----------|--------|----------|-------------|')
  for (const c of contents) {
    const count = marks.filter((m) => m.contentId === c.id).length
    const lastMarked = c.lastMarkedAt ? formatDate(c.lastMarkedAt) : '-'
    lines.push(`| [[${c.title}]] | ${TYPE_EMOJI[c.type]} | ${count} | ${lastMarked} |`)
  }
  return lines.join('\n')
}

/** Vault 内の相対パスを生成 */
export function buildContentPath(content: ContentData): string {
  const folder: Record<string, string> = {
    book: 'Books', pdf: 'PDF', web: 'Web', youtube: 'YouTube', audio: 'Audio',
  }
  return `${folder[content.type]}/${sanitizeFilename(content.title)}.md`
}
