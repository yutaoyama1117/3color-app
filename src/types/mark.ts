export type MarkColor = 'red' | 'blue' | 'green'

export interface MarkData {
  id: string
  contentId: string
  color: MarkColor
  markedText: string
  charOffsetStart: number
  charOffsetEnd: number
  comment?: string
  createdAt: Date
  // Phase 3-5: SM-2 復習関連
  reviewInterval?: number
  reviewEase?: number
  reviewCount?: number
  nextReviewAt?: Date
  lastReviewedAt?: Date
}

export interface PendingSelection {
  text: string
  startOffset: number
  endOffset: number
  /** ビューポート座標（ColorTooltipの表示位置に使用） */
  position: { x: number; y: number }
}

/** テキストをマーク境界で分割した1セグメント */
export type TextSegment =
  | { type: 'plain'; text: string }
  | { type: 'marked'; text: string; mark: MarkData }
