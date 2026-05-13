import { NextResponse } from 'next/server'

/**
 * GET /api/v1/review/today?limit=20&color=red
 * 今日復習すべきマークを返す。
 * 開発モード: クライアント側 markStore で計算するため、ここはダミー応答。
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const limit = parseInt(searchParams.get('limit') ?? '20', 10)
  const color = searchParams.get('color')

  return NextResponse.json({
    data: [],
    limit,
    color,
    message: 'demo mode: クライアント側 useReview フックでカードを取得してください',
  })
}
