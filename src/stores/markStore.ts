import { create } from 'zustand'
import { DEMO_MARKS } from '@/lib/mock/marks'
import type { MarkColor, MarkData } from '@/types/mark'

interface AddMarkInput {
  contentId: string
  color: MarkColor
  markedText: string
  charOffsetStart: number
  charOffsetEnd: number
}

interface MarkStore {
  marks: MarkData[]
  addMark: (input: AddMarkInput) => void
  removeMark: (id: string) => void
  updateMarkColor: (id: string, color: MarkColor) => void
  updateMarkComment: (id: string, comment: string) => void
  /** SM-2 復習結果でマークを更新 */
  applyReview: (
    id: string,
    update: { reviewInterval: number; reviewEase: number; reviewCount: number; nextReviewAt: Date },
  ) => void
}

export const useMarkStore = create<MarkStore>((set) => ({
  marks: DEMO_MARKS,

  addMark: (input) => {
    const newMark: MarkData = {
      id: `mark-${Date.now()}`,
      ...input,
      createdAt: new Date(),
    }

    // 楽観的UI更新: 即座にstateに追加
    set((state) => ({ marks: [...state.marks, newMark] }))

    // 本番実装では API 呼び出し + エラー時ロールバック
    // simulateApiCall(newMark).catch(() => {
    //   set((state) => ({ marks: state.marks.filter((m) => m.id !== newMark.id) }))
    //   toast.error('マークの保存に失敗しました')
    // })
  },

  removeMark: (id) => {
    // 楽観的UI更新: 即座に削除
    set((state) => ({ marks: state.marks.filter((m) => m.id !== id) }))
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
}))
