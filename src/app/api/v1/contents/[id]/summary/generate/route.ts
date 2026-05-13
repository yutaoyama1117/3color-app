import { NextResponse } from 'next/server'
import { handleAiSummary } from '@/lib/jobs/handlers/ai-summary'

/**
 * POST /api/v1/contents/:id/summary/generate
 * AI要約を生成する。リクエストボディにマークデータを渡す。
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: contentId } = await params

  try {
    const body = (await request.json()) as {
      title: string
      author?: string
      redMarks: { text: string; comment?: string }[]
      blueMarks: { text: string; comment?: string }[]
      greenMarks: { text: string; comment?: string }[]
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: 'ANTHROPIC_API_KEY が設定されていません。.env.local に追加してください。' },
        { status: 503 },
      )
    }

    const result = await handleAiSummary({ ...body, contentId })
    return NextResponse.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : '要約の生成に失敗しました'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
