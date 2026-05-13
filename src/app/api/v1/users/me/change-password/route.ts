import { NextResponse } from 'next/server'

/**
 * POST /api/v1/users/me/change-password
 * パスワード変更。
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      current_password?: string
      new_password?: string
    }
    if (!body.current_password || !body.new_password) {
      return NextResponse.json(
        { error: 'current_password と new_password が必要です' },
        { status: 400 },
      )
    }
    if (body.new_password.length < 8) {
      return NextResponse.json({ error: 'パスワードは8文字以上' }, { status: 400 })
    }
    return NextResponse.json({ data: { status: 'updated' } })
  } catch {
    return NextResponse.json({ error: 'リクエストが不正です' }, { status: 400 })
  }
}
