import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { DEMO_CONTENTS } from '@/lib/mock/contents'
import type { BookMeta, ContentData, ContentStatus, RegisterContentInput, TextSection } from '@/types/content'

interface ContentStore {
  contents: ContentData[]
  /** コンテンツを登録する（楽観的UI） */
  addContent: (input: RegisterContentInput & { status?: ContentStatus }) => string
  /** コンテンツを削除する */
  removeContent: (id: string) => void
  /** 複数コンテンツを一括削除する */
  removeContents: (ids: string[]) => void
  /** IDでコンテンツを取得する */
  getContent: (id: string) => ContentData | undefined
  /** お気に入りをトグルする */
  toggleFavorite: (id: string) => void
  /** テキストセクションを追加する */
  addTextSection: (id: string, text: string, label?: string) => string
  /** テキストセクションを削除する */
  removeTextSection: (id: string, sectionId: string) => void
  /** テキストセクションのラベルを更新する */
  updateSectionLabel: (id: string, sectionId: string, label: string) => void
  /** テキストセクションの本文を更新する */
  updateSectionText: (id: string, sectionId: string, text: string) => void
  /** 著者名を更新する */
  updateAuthor: (id: string, author: string) => void
  /** 書籍メタデータを更新する */
  updateBookMeta: (id: string, meta: Partial<BookMeta>) => void
  /** 旧bodyTextからtextSectionsに移行する */
  migrateToSections: (id: string) => void
  /** 本文テキストを追記する（後方互換性） */
  appendBodyText: (id: string, text: string) => void
  /** コンテンツのステータスと本文を更新する（ジョブ完了後） */
  updateContentStatus: (
    id: string,
    status: ContentStatus,
    patch?: Partial<Pick<ContentData, 'bodyText' | 'title' | 'author' | 'aiSummary'>>,
  ) => void
}

export const useContentStore = create<ContentStore>()(
  persist(
    (set, get) => ({
      contents: DEMO_CONTENTS,

      addContent: (input) => {
        const id = `content-${Date.now()}`
        const now = new Date()
        const { status, ...rest } = input
        const newContent: ContentData = {
          id,
          userId: 'demo-user',
          status: status ?? 'ready',
          createdAt: now,
          updatedAt: now,
          markCounts: { red: 0, blue: 0, green: 0 },
          ...rest,
        }
        set((state) => ({ contents: [newContent, ...state.contents] }))
        return id
      },

      removeContent: (id) => {
        set((state) => ({ contents: state.contents.filter((c) => c.id !== id) }))
      },

      removeContents: (ids) => {
        const idSet = new Set(ids)
        set((state) => ({ contents: state.contents.filter((c) => !idSet.has(c.id)) }))
      },

      getContent: (id) => {
        return get().contents.find((c) => c.id === id)
      },

      addTextSection: (contentId, text, label) => {
        const sectionId = `sec-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`
        const section: TextSection = {
          id: sectionId,
          text,
          label,
          addedAt: new Date(),
        }
        set((state) => ({
          contents: state.contents.map((c) =>
            c.id === contentId
              ? {
                  ...c,
                  textSections: [...(c.textSections ?? []), section],
                  updatedAt: new Date(),
                }
              : c,
          ),
        }))
        return sectionId
      },

      removeTextSection: (contentId, sectionId) => {
        set((state) => ({
          contents: state.contents.map((c) =>
            c.id === contentId
              ? {
                  ...c,
                  textSections: (c.textSections ?? []).filter((s) => s.id !== sectionId),
                  updatedAt: new Date(),
                }
              : c,
          ),
        }))
      },

      updateSectionLabel: (contentId, sectionId, label) => {
        set((state) => ({
          contents: state.contents.map((c) =>
            c.id === contentId
              ? {
                  ...c,
                  textSections: (c.textSections ?? []).map((s) =>
                    s.id === sectionId ? { ...s, label } : s,
                  ),
                  updatedAt: new Date(),
                }
              : c,
          ),
        }))
      },

      updateSectionText: (contentId, sectionId, text) => {
        set((state) => ({
          contents: state.contents.map((c) =>
            c.id === contentId
              ? {
                  ...c,
                  textSections: (c.textSections ?? []).map((s) =>
                    s.id === sectionId ? { ...s, text } : s,
                  ),
                  updatedAt: new Date(),
                }
              : c,
          ),
        }))
      },

      updateAuthor: (contentId, author) => {
        set((state) => ({
          contents: state.contents.map((c) =>
            c.id === contentId ? { ...c, author, updatedAt: new Date() } : c,
          ),
        }))
      },

      updateBookMeta: (contentId, meta) => {
        set((state) => ({
          contents: state.contents.map((c) =>
            c.id === contentId
              ? { ...c, bookMeta: { ...(c.bookMeta ?? {}), ...meta }, updatedAt: new Date() }
              : c,
          ),
        }))
      },

      migrateToSections: (contentId) => {
        const content = get().contents.find((c) => c.id === contentId)
        // textSectionsが既に配列（空でも）なら移行済み → 再移行しない
        if (!content || !content.bodyText || content.textSections !== undefined) return
        // 旧separatorで分割して移行
        const separator = '────────────────'
        const parts = content.bodyText.split(separator).map((t) => t.trim()).filter(Boolean)
        const sections: TextSection[] = parts.map((text, i) => ({
          id: `sec-migrated-${i}-${Math.random().toString(36).slice(2, 5)}`,
          text,
          label: parts.length > 1 ? `セクション ${i + 1}` : undefined,
          addedAt: content.createdAt,
        }))
        set((state) => ({
          contents: state.contents.map((c) =>
            c.id === contentId
              ? { ...c, textSections: sections, bodyText: undefined, updatedAt: new Date() }
              : c,
          ),
        }))
      },

      appendBodyText: (id, text) => {
        // 新方式: textSectionsに追加
        const content = get().contents.find((c) => c.id === id)
        if (content?.textSections && content.textSections.length > 0) {
          const sectionId = `sec-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`
          const section: TextSection = { id: sectionId, text, addedAt: new Date() }
          set((state) => ({
            contents: state.contents.map((c) =>
              c.id === id
                ? { ...c, textSections: [...(c.textSections ?? []), section], updatedAt: new Date() }
                : c,
            ),
          }))
          return
        }
        // 旧方式（フォールバック）
        const separator = '\n\n────────────────\n\n'
        set((state) => ({
          contents: state.contents.map((c) =>
            c.id === id
              ? { ...c, bodyText: (c.bodyText ?? '') + separator + text, updatedAt: new Date() }
              : c,
          ),
        }))
      },

      toggleFavorite: (id) => {
        set((state) => ({
          contents: state.contents.map((c) =>
            c.id === id ? { ...c, isFavorite: !c.isFavorite, updatedAt: new Date() } : c,
          ),
        }))
      },

      updateContentStatus: (id, status, patch) => {
        set((state) => ({
          contents: state.contents.map((c) =>
            c.id === id
              ? { ...c, status, updatedAt: new Date(), ...(patch ?? {}) }
              : c,
          ),
        }))
      },
    }),
    {
      name: '3color-contents', // localStorage のキー名
    }
  )
)
