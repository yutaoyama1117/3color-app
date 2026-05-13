import { NextResponse } from 'next/server'

/**
 * GET /api/v1/jobs/:id
 * ジョブ単体のステータス確認。
 * Supabase 未設定時はクライアント側の jobStore で管理するためこの API は使われない。
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  return NextResponse.json({
    id,
    status: 'queued',
    message: 'demo mode: クライアント側 jobStore でステータスを確認してください',
  })
}
