import { NextResponse } from 'next/server'

/**
 * GET /api/v1/review/stats
 * 復習統計を返す。
 * 開発モード: ダミー応答（クライアント側 markStore で計算する想定）
 */
export async function GET() {
  return NextResponse.json({
    due_today: 0,
    reviewed_today: 0,
    total_reviewed: 0,
    streak_days: 0,
    next_review_date: null,
    distribution: {
      '1day': 0,
      '1week': 0,
      '1month': 0,
      '3months': 0,
      '6months+': 0,
    },
    message: 'demo mode',
  })
}
