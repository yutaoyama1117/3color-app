import { NextResponse } from 'next/server'
import { validateQuickContent } from '@/validations/quick-content'

/**
 * POST /api/v1/contents/quick
 * iOS Share Extension 等から最小限の情報でコンテンツを登録する。
 *
 * 開発モード（Supabase 未接続）: 受け取ったデータを返却するのみ。
 * 本番モード: contents テーブルに INSERT し、URLがあれば url_fetch ジョブを enqueue。
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const validation = validateQuickContent(body)
    if (!validation.ok) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    const { source, type, url, title, text, initial_marks } = validation.data

    // 仮の content_id を生成
    const contentId = `content-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    const initialTitle = title ?? (url ? new URL(url).hostname : `共有コンテンツ`)

    // 本番: ここで contents.insert / jobs.insert を行う
    // 開発: そのまま返却
    return NextResponse.json({
      data: {
        id: contentId,
        title: initialTitle,
        status: url ? 'pending' : 'ready',
        marks_created: initial_marks?.length ?? 0,
        source,
        type,
        // 開発モード時のエコー
        _echo: { url, text },
      },
    })
  } catch {
    return NextResponse.json({ error: 'リクエストが不正です' }, { status: 400 })
  }
}
