import type { ContentData } from '@/types/content'
import type { MarkData, MarkColor } from '@/types/mark'

const COLOR_META: Record<MarkColor, { heading: string; emoji: string }> = {
  red:   { heading: '🔴 客観的最重要', emoji: '🔴' },
  blue:  { heading: '🔵 客観的重要',   emoji: '🔵' },
  green: { heading: '🟢 個人的気づき', emoji: '🟢' },
}

/** ContentData と対応するマーク一覧から Obsidian 用 Markdown を生成する */
export function toMarkdown(content: ContentData, marks: MarkData[]): string {
  const lines: string[] = []

  // フロントマター
  lines.push('---')
  lines.push(`title: "${content.title}"`)
  if (content.author) lines.push(`author: "${content.author}"`)
  lines.push(`type: ${content.type}`)
  lines.push(`exported: ${new Date().toISOString().slice(0, 10)}`)
  lines.push('tags: [3色メモ]')
  lines.push('---')
  lines.push('')

  // タイトル行
  lines.push(`# ${content.title}`)
  if (content.author) lines.push(`著者: ${content.author}`)
  if (content.sourceUrl) lines.push(`URL: ${content.sourceUrl}`)
  lines.push('')

  // マークがない場合
  const contentMarks = marks.filter((m) => m.contentId === content.id)
  if (contentMarks.length === 0) {
    lines.push('> まだマークがありません')
    return lines.join('\n')
  }

  // マーク数サマリー
  const counts = {
    red:   contentMarks.filter((m) => m.color === 'red').length,
    blue:  contentMarks.filter((m) => m.color === 'blue').length,
    green: contentMarks.filter((m) => m.color === 'green').length,
  }
  lines.push(
    `🔴 ${counts.red}件 / 🔵 ${counts.blue}件 / 🟢 ${counts.green}件`,
  )
  lines.push('')
  lines.push('---')
  lines.push('')

  // セクション情報があれば色別+セクション別に出力
  const sections = content.textSections
  const hasSections = sections && sections.length > 1

  // 色別セクション
  for (const color of ['red', 'blue', 'green'] as MarkColor[]) {
    const colorMarks = contentMarks
      .filter((m) => m.color === color)
      .sort((a, b) => a.charOffsetStart - b.charOffsetStart)

    if (colorMarks.length === 0) continue

    lines.push(`## ${COLOR_META[color].heading}`)
    lines.push('')

    if (hasSections) {
      // セクションごとにグループ化
      for (const sec of sections) {
        const secMarks = colorMarks.filter((m) =>
          m.sectionId ? m.sectionId === sec.id : !m.sectionId && sec.id === sections[0].id,
        )
        if (secMarks.length === 0) continue
        lines.push(`### ${sec.label || sec.id}`)
        lines.push('')
        for (const mark of secMarks) {
          lines.push(`> ${mark.markedText}`)
          if (mark.comment) {
            lines.push('')
            lines.push(`💬 ${mark.comment}`)
          }
          lines.push('')
        }
      }
    } else {
      for (const mark of colorMarks) {
        lines.push(`> ${mark.markedText}`)
        if (mark.comment) {
          lines.push('')
          lines.push(`💬 ${mark.comment}`)
        }
        lines.push('')
      }
    }
  }

  return lines.join('\n')
}

/** Markdown 文字列をファイルとしてダウンロードさせる。
 *  Electron 環境では Vault に直接書き出すフォールバックは別途呼び出し側で行う。
 */
export function downloadMarkdown(filename: string, content: string): void {
  const blob = new Blob([content], { type: 'text/markdown; charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
