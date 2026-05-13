import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { DEMO_CONTENTS } from '@/lib/mock/contents'
import type { ContentData, ContentStatus, RegisterContentInput } from '@/types/content'

interface ContentStore {
  contents: ContentData[]
  /** コンテンツを登録する（楽観的UI） */
  addContent: (input: RegisterContentInput & { status?: ContentStatus }) => string
  /** コンテンツを削除する */
  removeContent: (id: string) => void
  /** IDでコンテンツを取得する */
  getContent: (id: string) => ContentData | undefined
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

      getContent: (id) => {
        return get().contents.find((c) => c.id === id)
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
