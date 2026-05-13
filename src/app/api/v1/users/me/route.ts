import { NextResponse } from 'next/server'

/**
 * GET /api/v1/users/me — プロフィール取得
 * PATCH /api/v1/users/me — プロフィール更新
 * DELETE /api/v1/users/me — アカウント削除（30日猶予）
 * 開発モード: Supabase 未接続のためダミー応答
 */
export async function GET() {
  return NextResponse.json({
    data: {
      id: 'demo-user',
      email: 'demo@example.com',
      display_name: 'デモユーザー',
      plan: 'free',
      created_at: '2026-01-01T00:00:00Z',
    },
  })
}

export async function PATCH(request: Request) {
  try {
    const body = (await request.json()) as { display_name?: string }
    if (body.display_name !== undefined && typeof body.display_name !== 'string') {
      return NextResponse.json({ error: 'display_name は文字列' }, { status: 400 })
    }
    return NextResponse.json({ data: { display_name: body.display_name } })
  } catch {
    return NextResponse.json({ error: 'リクエストが不正です' }, { status: 400 })
  }
}

export async function DELETE() {
  // 開発モード: 受付のみ。30日後のバッチ削除をスケジュールするフラグを立てる想定
  const deletionScheduledAt = new Date()
  deletionScheduledAt.setDate(deletionScheduledAt.getDate() + 30)

  return NextResponse.json({
    data: {
      status: 'scheduled',
      deletion_scheduled_at: deletionScheduledAt.toISOString(),
      message: '30日以内にログインすればキャンセル可能です',
    },
  })
}
