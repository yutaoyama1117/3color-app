'use client'

import { useState } from 'react'
import type { MarkData } from '@/types/mark'
import type { ContentData } from '@/types/content'
import { GradeButtons } from '@/components/molecules/GradeButtons'
import type { ReviewGrade } from '@/lib/review/sm2'

interface ReviewCardProps {
  mark: MarkData
  content?: ContentData
  /** 評価後に呼ばれる。次回復習までの日数を渡す */
  onGrade: (grade: ReviewGrade) => void
}

const COLOR_EMOJI = { red: '🔴', blue: '🔵', green: '🟢' } as const

export function ReviewCard({ mark, content, onGrade }: ReviewCardProps) {
  const [showDetails, setShowDetails] = useState(false)

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-4 text-3xl">{COLOR_EMOJI[mark.color]}</div>

      <blockquote className="mb-4 border-l-4 border-gray-200 pl-4 text-lg leading-relaxed text-gray-800">
        「{mark.markedText}」
      </blockquote>

      {content && (
        <p className="mb-1 text-xs text-gray-500">📚 {content.title}</p>
      )}
      <p className="mb-4 text-xs text-gray-400">
        📅 {mark.createdAt.toLocaleDateString('ja-JP')} にマーク
      </p>

      {!showDetails && (
        <button
          type="button"
          onClick={() => setShowDetails(true)}
          className="mb-4 w-full rounded-lg border border-gray-200 bg-gray-50 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
        >
          内容を表示
        </button>
      )}

      {showDetails && mark.comment && (
        <div className="mb-4 rounded-lg bg-blue-50 p-3 text-sm text-gray-700">
          💬 {mark.comment}
        </div>
      )}

      <div className="border-t border-gray-100 pt-4">
        <p className="mb-3 text-center text-xs text-gray-500">
          覚えていましたか？
        </p>
        <GradeButtons onGrade={onGrade} />
      </div>
    </div>
  )
}
