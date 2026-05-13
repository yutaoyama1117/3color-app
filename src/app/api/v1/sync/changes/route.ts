import { NextResponse } from 'next/server'

/**
 * GET /api/v1/sync/changes?since=ISO8601&types=contents,marks,tags&limit=100
 * 指定時刻以降の差分データを返す。
 * 開発モード（Supabase 未接続）: 空の差分を返す。
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const sinceParam = searchParams.get('since')
  const typesParam = searchParams.get('types') ?? 'contents,marks,tags'
  const limit = parseInt(searchParams.get('limit') ?? '100', 10)

  if (sinceParam) {
    const d = new Date(sinceParam)
    if (isNaN(d.getTime())) {
      return NextResponse.json({ error: 'since は ISO8601 形式の日時' }, { status: 400 })
    }
  }

  if (limit < 1 || limit > 1000) {
    return NextResponse.json({ error: 'limit は 1〜1000 の範囲' }, { status: 400 })
  }

  const types = typesParam.split(',').map((t) => t.trim())
  const empty = { created: [], updated: [], deleted: [] }

  // 本番: Supabase で since 以降の差分を取得
  // 開発: 空のレスポンス
  return NextResponse.json({
    data: {
      contents: types.includes('contents') ? empty : { created: [], updated: [], deleted: [] },
      marks: types.includes('marks') ? empty : { created: [], updated: [], deleted: [] },
      tags: types.includes('tags') ? empty : { created: [], updated: [], deleted: [] },
    },
    sync_cursor: new Date().toISOString(),
  })
}
