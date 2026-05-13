/**
 * SM-2 アルゴリズム（簡易版）。
 * SuperMemo 2 を Anki 風に調整したスペースドリピティション。
 */

export type ReviewGrade = 0 | 1 | 2 | 3 | 4 | 5
// 0: 完全に忘れた  1: 不正解（見たら思い出した）
// 2: 不正解（かなり曖昧）  3: 正解（かなり迷った）
// 4: 正解（少し迷った）  5: 正解（即答）

export interface ReviewState {
  interval: number  // 次回復習までの日数
  ease: number      // 難易度係数
  reviewCount: number
}

export interface ReviewResult {
  interval: number
  ease: number
  reviewCount: number
  nextReviewAt: Date
}

const MIN_EASE = 1.3

/**
 * SM-2 で次回復習スケジュールを計算する。
 * @param grade ユーザーの自己評価 (0-5)
 * @param state 現在の復習状態
 * @param now 計算基準日時（テスト用に注入可能）
 */
export function calculateReview(
  grade: ReviewGrade,
  state: ReviewState,
  now: Date = new Date(),
): ReviewResult {
  const { interval: currentInterval, ease: currentEase, reviewCount } = state

  let nextInterval: number
  let nextEase: number
  let nextReviewCount: number

  if (grade >= 3) {
    // 正解
    if (reviewCount === 0) {
      nextInterval = 1
    } else if (reviewCount === 1) {
      nextInterval = 6
    } else {
      nextInterval = Math.round(currentInterval * currentEase)
    }
    nextEase = currentEase + (0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02))
    if (nextEase < MIN_EASE) nextEase = MIN_EASE
    nextReviewCount = reviewCount + 1
  } else {
    // 不正解 → リセット
    nextInterval = 1
    nextEase = currentEase
    nextReviewCount = 0
  }

  const nextReviewAt = new Date(now)
  nextReviewAt.setDate(nextReviewAt.getDate() + nextInterval)

  return { interval: nextInterval, ease: nextEase, reviewCount: nextReviewCount, nextReviewAt }
}

/** 人間向け表示用のフォーマット */
export function formatNextReview(interval: number): string {
  if (interval === 1) return '明日'
  if (interval < 7) return `${interval}日後`
  if (interval < 30) return `${Math.round(interval / 7)}週間後`
  if (interval < 365) return `${Math.round(interval / 30)}か月後`
  return `${Math.round(interval / 365)}年後`
}
