import { NextResponse } from 'next/server'
import { estimateCost } from '@/lib/services/whisper-client'

/**
 * GET /api/v1/audio/estimate?duration_sec=3600
 * 音声ファイルの文字起こしコストを見積もる。
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const durationSec = parseInt(searchParams.get('duration_sec') ?? '0', 10)

  if (!durationSec || durationSec <= 0) {
    return NextResponse.json({ error: 'duration_sec が必要です' }, { status: 400 })
  }

  return NextResponse.json(estimateCost(durationSec))
}
