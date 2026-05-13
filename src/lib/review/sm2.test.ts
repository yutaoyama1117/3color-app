import { describe, it, expect } from 'vitest'
import { calculateReview, formatNextReview } from './sm2'

describe('SM-2 calculateReview', () => {
  const now = new Date('2026-05-12T00:00:00Z')

  it('初回正解(grade=5) → interval=1', () => {
    const r = calculateReview(5, { interval: 1, ease: 2.5, reviewCount: 0 }, now)
    expect(r.interval).toBe(1)
    expect(r.reviewCount).toBe(1)
    expect(r.ease).toBeCloseTo(2.6, 1)
  })

  it('2回目正解(grade=5) → interval=6', () => {
    const r = calculateReview(5, { interval: 1, ease: 2.5, reviewCount: 1 }, now)
    expect(r.interval).toBe(6)
    expect(r.reviewCount).toBe(2)
  })

  it('3回目以降正解 → interval = currentInterval * ease', () => {
    const r = calculateReview(4, { interval: 6, ease: 2.5, reviewCount: 2 }, now)
    expect(r.interval).toBe(15) // 6 * 2.5
  })

  it('不正解(grade=2) → interval=1, reviewCount=0 にリセット', () => {
    const r = calculateReview(2, { interval: 30, ease: 2.5, reviewCount: 5 }, now)
    expect(r.interval).toBe(1)
    expect(r.reviewCount).toBe(0)
    expect(r.ease).toBe(2.5) // ease は変更しない
  })

  it('grade=3 (ぎりぎり正解) で ease がほぼ維持される', () => {
    const r = calculateReview(3, { interval: 6, ease: 2.5, reviewCount: 2 }, now)
    expect(r.ease).toBeLessThan(2.5)
    expect(r.ease).toBeGreaterThan(2.0)
  })

  it('ease は 1.3 を下回らない', () => {
    let state = { interval: 1, ease: 1.4, reviewCount: 2 }
    for (let i = 0; i < 10; i++) {
      const r = calculateReview(3, state, now)
      state = { interval: r.interval, ease: r.ease, reviewCount: r.reviewCount }
    }
    expect(state.ease).toBeGreaterThanOrEqual(1.3)
  })

  it('nextReviewAt が interval 日後になる', () => {
    const r = calculateReview(5, { interval: 6, ease: 2.5, reviewCount: 2 }, now)
    const expectedDate = new Date(now)
    expectedDate.setDate(expectedDate.getDate() + r.interval)
    expect(r.nextReviewAt.toISOString().slice(0, 10)).toBe(expectedDate.toISOString().slice(0, 10))
  })
})

describe('formatNextReview', () => {
  it('1日 → 明日', () => expect(formatNextReview(1)).toBe('明日'))
  it('3日 → 3日後', () => expect(formatNextReview(3)).toBe('3日後'))
  it('14日 → 2週間後', () => expect(formatNextReview(14)).toBe('2週間後'))
  it('60日 → 2か月後', () => expect(formatNextReview(60)).toBe('2か月後'))
  it('730日 → 2年後', () => expect(formatNextReview(730)).toBe('2年後'))
})
