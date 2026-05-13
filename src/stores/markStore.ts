import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { DEMO_MARKS } from '@/lib/mock/marks'
import type { MarkColor, MarkData } from '@/types/mark'

interface AddMarkInput {
  contentId: string
  sectionId?: string
  color: MarkColor
  markedText: string
  charOffsetStart: number
  charOffsetEnd: number
}

interface MarkStore {
  marks: MarkData[]
  addMark: (input: AddMarkInput) => string
  removeMark: (id: string) => void
  /** コンテンツIDに紐づくマークを一括削除 */
  removeMarksByContentIds: (contentIds: string[]) => void
  /** セクションIDに紐づくマークを一括削除 */
  removeMarksBySectionId: (contentId: string, sectionId: string) => void
  updateMarkColor: (id: string, color: MarkColor) => void
  updateMarkComment: (id: string, comment: string) => void
  /** SM-2 復習結果でマークを更新 */
  applyReview: (
    id: string,
    update: { reviewInterval: number; reviewEase: number; reviewCount: number; nextReviewAt: Date },
  ) => void
}

export const useMarkStore = create<MarkStore>()(
  persist(
    (set) => ({
      marks: DEMO_MARKS,

      addMark: (input) => {
        const id = `mark-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
        const newMark: MarkData = {
          id,
          ...input,
          createdAt: new Date(),
        }
        set((state) => ({ marks: [...state.marks, newMark] }))
        return id
      },

      removeMark: (id) => {
        set((state) => ({ marks: state.marks.filter((m) => m.id !== id) }))
      },

      removeMarksByContentIds: (contentIds) => {
        const idSet = new Set(contentIds)
        set((state) => ({ marks: state.marks.filter((m) => !idSet.has(m.contentId)) }))
      },

      removeMarksBySectionId: (contentId, sectionId) => {
        set((state) => ({
          marks: state.marks.filter(
            (m) => !(m.contentId === contentId && m.sectionId === sectionId),
          ),
        }))
      },

      updateMarkColor: (id, color) => {
        set((state) => ({
          marks: state.marks.map((m) => (m.id === id ? { ...m, color } : m)),
        }))
      },

      updateMarkComment: (id, comment) => {
        set((state) => ({
          marks: state.marks.map((m) => (m.id === id ? { ...m, comment } : m)),
        }))
      },

      applyReview: (id, update) => {
        set((state) => ({
          marks: state.marks.map((m) =>
            m.id === id ? { ...m, ...update, lastReviewedAt: new Date() } : m,
          ),
        }))
      },
    }),
    {
      name: '3color-marks', // localStorage のキー名
    }
  )
)
