'use client'

import { useMemo, useState, useCallback } from 'react'
import { useMarkStore } from '@/stores/markStore'
import { calculateReview, type ReviewGrade } from '@/lib/review/sm2'
import type { MarkData } from '@/types/mark'

interface UseReviewResult {
  todayCards: MarkData[]
  currentIndex: number
  currentMark: MarkData | undefined
  reviewedCount: number
  isComplete: boolean
  grade: (g: ReviewGrade) => { interval: number } | null
}

/** 今日の復習カード一覧と評価フロー管理フック */
export function useReview(): UseReviewResult {
  const { marks, applyReview } = useMarkStore()
  const [reviewedIds, setReviewedIds] = useState<Set<string>>(new Set())

  const todayCards = useMemo(() => {
    const now = Date.now()
    return marks.filter((m) => {
      // 未復習（nextReviewAt が無い）or 期限到来
      if (!m.nextReviewAt) return true
      return m.nextReviewAt.getTime() <= now
    })
  }, [marks])

  const remaining = todayCards.filter((m) => !reviewedIds.has(m.id))
  const currentMark = remaining[0]
  const currentIndex = todayCards.length - remaining.length
  const isComplete = remaining.length === 0 && todayCards.length > 0

  const grade = useCallback(
    (g: ReviewGrade) => {
      if (!currentMark) return null
      const result = calculateReview(g, {
        interval: currentMark.reviewInterval ?? 1,
        ease: currentMark.reviewEase ?? 2.5,
        reviewCount: currentMark.reviewCount ?? 0,
      })
      applyReview(currentMark.id, {
        reviewInterval: result.interval,
        reviewEase: result.ease,
        reviewCount: result.reviewCount,
        nextReviewAt: result.nextReviewAt,
      })
      setReviewedIds((s) => new Set(s).add(currentMark.id))
      return { interval: result.interval }
    },
    [currentMark, applyReview],
  )

  return {
    todayCards,
    currentIndex,
    currentMark,
    reviewedCount: reviewedIds.size,
    isComplete,
    grade,
  }
}
