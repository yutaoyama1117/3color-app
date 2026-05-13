import type { ContentData } from '@/types/content'
import type { MarkData } from '@/types/mark'
import { getElectronAPI } from '@/lib/platform'
import {
  renderContentMarkdown,
  renderDailyMarkdown,
  renderIndexMarkdown,
  buildContentPath,
  formatDate,
} from './template-renderer'

const DEBOUNCE_MS = 5000

let debounceTimer: ReturnType<typeof setTimeout> | null = null
const pendingContents: Map<string, { content: ContentData; marks: MarkData[] }> = new Map()

/** Vault パスが設定されているか確認 */
export async function isVaultConfigured(): Promise<boolean> {
  const api = getElectronAPI()
  if (!api) return false
  const path = await api.obsidianGetVaultPath()
  return !!path
}

/** 単一コンテンツの変更を検知してデバウンス書き出し */
export function scheduleSync(content: ContentData, marks: MarkData[]): void {
  pendingContents.set(content.id, { content, marks })

  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    void flushPending()
  }, DEBOUNCE_MS)
}

async function flushPending(): Promise<void> {
  const api = getElectronAPI()
  if (!api) {
    pendingContents.clear()
    return
  }

  const items = Array.from(pendingContents.values())
  pendingContents.clear()

  for (const { content, marks } of items) {
    const md = renderContentMarkdown(content, marks)
    const path = buildContentPath(content)
    try {
      await api.obsidianSyncFile(path, md)
    } catch (err) {
      console.error('Obsidian 同期失敗:', err)
    }
  }
}

/** 全コンテンツを一括同期 */
export async function syncAll(contents: ContentData[], marks: MarkData[]): Promise<{ written: number }> {
  const api = getElectronAPI()
  if (!api) throw new Error('Electron 環境でのみ利用可能です')

  const files: Array<{ path: string; content: string }> = []

  // 個別コンテンツ
  for (const c of contents) {
    files.push({
      path: buildContentPath(c),
      content: renderContentMarkdown(c, marks),
    })
  }

  // 目次
  files.push({
    path: '_index.md',
    content: renderIndexMarkdown(contents, marks),
  })

  // 日次まとめ（過去30日）
  const dailyMap = new Map<string, Map<string, { content: ContentData; marks: MarkData[] }>>()
  for (const m of marks) {
    const dateKey = formatDate(m.createdAt)
    if (!dailyMap.has(dateKey)) dailyMap.set(dateKey, new Map())
    const dayMap = dailyMap.get(dateKey)!
    const c = contents.find((cc) => cc.id === m.contentId)
    if (!c) continue
    if (!dayMap.has(c.id)) dayMap.set(c.id, { content: c, marks: [] })
    dayMap.get(c.id)!.marks.push(m)
  }

  for (const [dateKey, byContent] of dailyMap.entries()) {
    files.push({
      path: `_daily/${dateKey}.md`,
      content: renderDailyMarkdown(new Date(dateKey), byContent),
    })
  }

  return api.obsidianSyncAll(files)
}
