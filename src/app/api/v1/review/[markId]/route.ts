import { NextResponse } from 'next/server'
import { calculateReview, type ReviewGrade } from '@/lib/review/sm2'

/**
 * POST /api/v1/review/:mark_id
 * 復習結果を記録し、次回スケジュールを返す。
 * 開発モード: 受け取った grade で SM-2 を計算して返却するのみ。
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ markId: string }> },
) {
  const { markId } = await params
  try {
    const body = (await request.json()) as {
      grade: ReviewGrade
      currentInterval?: number
      currentEase?: number
      reviewCount?: number
    }
    if (typeof body.grade !== 'number' || body.grade < 0 || body.grade > 5) {
      return NextResponse.json({ error: 'grade は 0〜5' }, { status: 400 })
    }

    const result = calculateReview(body.grade, {
      interval: body.currentInterval ?? 1,
      ease: body.currentEase ?? 2.5,
      reviewCount: body.reviewCount ?? 0,
    })

    return NextResponse.json({
      markId,
      next_review_at: result.nextReviewAt.toISOString(),
      interval: result.interval,
      ease: result.ease,
      review_count: result.reviewCount,
    })
  } catch {
    return NextResponse.json({ error: 'リクエストが不正です' }, { status: 400 })
  }
}
