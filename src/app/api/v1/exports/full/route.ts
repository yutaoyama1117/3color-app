import { NextResponse } from 'next/server'

/**
 * POST /api/v1/exports/full
 * 全データエクスポートジョブを作成し、ダウンロード用 URL を返す。
 * 開発モード: クライアント側の DataExportSection で直接 JSON 生成するため、ここはダミー応答。
 */
export async function POST() {
  const exportId = `export-${Date.now()}`
  const expiresAt = new Date()
  expiresAt.setHours(expiresAt.getHours() + 24)

  return NextResponse.json({
    data: {
      export_id: exportId,
      status: 'queued',
      download_url: null,
      expires_at: expiresAt.toISOString(),
      message: 'demo mode: クライアント側で生成してください',
    },
  })
}

/** GET /api/v1/exports/full?id=xxx — エクスポートステータス確認 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id が必要' }, { status: 400 })

  return NextResponse.json({
    data: { export_id: id, status: 'done', download_url: null },
  })
}
