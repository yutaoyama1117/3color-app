import { NextResponse } from 'next/server'

/**
 * GET /api/v1/users/me/sessions — セッション一覧
 * DELETE /api/v1/users/me/sessions — 他セッション全て無効化
 */
export async function GET() {
  return NextResponse.json({
    data: [
      {
        id: 'current',
        device: 'このブラウザ',
        last_active_at: new Date().toISOString(),
        ip_address: '127.0.0.1',
        is_current: true,
      },
    ],
  })
}

export async function DELETE() {
  return NextResponse.json({ data: { revoked_count: 0 } })
}
