import { NextResponse } from 'next/server'

/**
 * POST /api/v1/contents/:id/ocr-confirm
 * OCR 認識結果をユーザーが確認・修正してから body_text に保存する。
 * 開発環境ではクライアント側 contentStore で処理するためダミーレスポンス。
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const body = (await request.json()) as {
    text: string
    page_number?: number
    append: boolean
  }

  if (!body.text) {
    return NextResponse.json({ error: 'text が必要です' }, { status: 400 })
  }

  // 本番: Supabase でコンテンツを更新する
  // 開発: クライアント側で contentStore.updateContentStatus を呼ぶ
  return NextResponse.json({
    id,
    status: 'ok',
    message: 'demo mode: クライアント側で contentStore を更新してください',
    text: body.text,
    append: body.append,
    page_number: body.page_number,
  })
}
