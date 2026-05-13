'use client'

import { useState } from 'react'
import { useContentStore } from '@/stores/contentStore'
import { useReview } from '@/hooks/use-review'
import { ReviewCard } from '@/components/organisms/ReviewCard'
import { ReviewProgress } from '@/components/organisms/ReviewProgress'
import { ReviewComplete } from '@/components/organisms/ReviewComplete'
import { formatNextReview } from '@/lib/review/sm2'

export default function ReviewPage() {
  const { todayCards, currentMark, currentIndex, reviewedCount, isComplete, grade } = useReview()
  const { getContent } = useContentStore()
  const [lastResult, setLastResult] = useState<string | null>(null)

  if (todayCards.length === 0) {
    return (
      <div className="mx-auto max-w-xl px-6 py-20 text-center">
        <div className="mb-3 text-5xl">😌</div>
        <h2 className="mb-2 text-lg font-semibold text-gray-700">今日の復習はありません</h2>
        <p className="text-sm text-gray-500">マークを追加して復習を始めましょう</p>
        <a
          href="/app"
          className="mt-6 inline-block text-sm text-blue-600 hover:underline"
        >
          ← マイ本棚へ戻る
        </a>
      </div>
    )
  }

  if (isComplete) {
    return (
      <div className="mx-auto max-w-xl px-6 py-12">
        <ReviewComplete reviewedCount={reviewedCount} streakDays={1} />
      </div>
    )
  }

  if (!currentMark) return null
  const content = getContent(currentMark.contentId)

  const handleGrade = (g: 0 | 1 | 2 | 3 | 4 | 5) => {
    const result = grade(g)
    if (result) setLastResult(`次の復習: ${formatNextReview(result.interval)}`)
    setTimeout(() => setLastResult(null), 1500)
  }

  return (
    <div className="mx-auto max-w-xl px-6 py-8">
      <div className="mb-6">
        <ReviewProgress current={currentIndex} total={todayCards.length} />
      </div>

      <ReviewCard mark={currentMark} content={content} onGrade={handleGrade} />

      {lastResult && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 rounded-full bg-gray-900 px-4 py-2 text-xs text-white shadow-lg">
          {lastResult}
        </div>
      )}
    </div>
  )
}
