import { NextResponse } from 'next/server'

/**
 * POST /api/v1/users/me/cancel-deletion
 * 削除予定アカウントの復元。
 */
export async function POST() {
  return NextResponse.json({
    data: {
      status: 'cancelled',
      message: 'アカウント削除をキャンセルしました',
    },
  })
}
